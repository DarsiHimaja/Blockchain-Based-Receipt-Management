const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DigitalReceipt Smart Contract Tests", function () {
  let DigitalReceipt;
  let digitalReceipt;
  let owner, merchant, customer, otherCustomer, verifier, unauthorizedMerchant;

  beforeEach(async function () {
    [owner, merchant, customer, otherCustomer, verifier, unauthorizedMerchant] =
      await ethers.getSigners();

    DigitalReceipt = await ethers.getContractFactory("DigitalReceipt");
    digitalReceipt = await DigitalReceipt.deploy();
    await digitalReceipt.waitForDeployment();
  });

  describe("1. Merchant Registration", function () {
    it("should allow any account to register as a merchant and emit MerchantRegistered event", async function () {
      expect(await digitalReceipt.isMerchant(merchant.address)).to.be.false;

      await expect(digitalReceipt.connect(merchant).registerMerchant())
        .to.emit(digitalReceipt, "MerchantRegistered")
        .withArgs(merchant.address);

      expect(await digitalReceipt.isMerchant(merchant.address)).to.be.true;
    });

    it("should revert if an account tries to register again (duplicate revert)", async function () {
      await digitalReceipt.connect(merchant).registerMerchant();

      await expect(
        digitalReceipt.connect(merchant).registerMerchant()
      ).to.be.revertedWith("Already registered");
    });
  });

  describe("2. Receipt Issuance", function () {
    beforeEach(async function () {
      await digitalReceipt.connect(merchant).registerMerchant();
    });

    it("should allow a registered merchant to issue a receipt and emit ReceiptIssued event", async function () {
      const amount = ethers.parseEther("0.25");
      const itemDetails = "1x Laptop Pro 16-inch, 1x Wireless Mouse";
      const expectedHash = ethers.keccak256(ethers.toUtf8Bytes(itemDetails));

      await expect(
        digitalReceipt
          .connect(merchant)
          .issueReceipt(customer.address, amount, itemDetails)
      )
        .to.emit(digitalReceipt, "ReceiptIssued")
        .withArgs(1, merchant.address, customer.address, amount);

      const receipt = await digitalReceipt.getReceipt(1);
      expect(receipt.id).to.equal(1);
      expect(receipt.merchant).to.equal(merchant.address);
      expect(receipt.buyer).to.equal(customer.address);
      expect(receipt.amount).to.equal(amount);
      expect(receipt.itemsHash).to.equal(expectedHash);
      expect(receipt.itemDetails).to.equal(itemDetails);
      expect(receipt.refunded).to.be.false;
      expect(receipt.issuedAt).to.be.gt(0);
    });

    it("should revert if a non-merchant attempts to issue a receipt", async function () {
      const amount = ethers.parseEther("0.1");
      const itemDetails = "1x Mechanical Keyboard";

      await expect(
        digitalReceipt
          .connect(unauthorizedMerchant)
          .issueReceipt(customer.address, amount, itemDetails)
      ).to.be.revertedWith("Not a merchant");
    });

    it("should revert if buyer is zero address", async function () {
      const amount = ethers.parseEther("0.1");
      const itemDetails = "1x USB Hub";

      await expect(
        digitalReceipt
          .connect(merchant)
          .issueReceipt(ethers.ZeroAddress, amount, itemDetails)
      ).to.be.revertedWith("Invalid buyer address");
    });

    it("should revert if purchase amount is zero", async function () {
      const itemDetails = "1x Free promotional sample";

      await expect(
        digitalReceipt
          .connect(merchant)
          .issueReceipt(customer.address, 0, itemDetails)
      ).to.be.revertedWith("Amount must be greater than zero");
    });
  });

  describe("3. Purchase History", function () {
    beforeEach(async function () {
      await digitalReceipt.connect(merchant).registerMerchant();
    });

    it("should return empty purchase history for an account with no receipts", async function () {
      const history = await digitalReceipt.connect(customer).getPurchaseHistory();
      expect(history.length).to.equal(0);
    });

    it("should return all receipts for a buyer with multiple purchases", async function () {
      // Issue 3 receipts for customer
      await digitalReceipt
        .connect(merchant)
        .issueReceipt(customer.address, ethers.parseEther("0.1"), "Order #1: Desk Lamp");
      await digitalReceipt
        .connect(merchant)
        .issueReceipt(customer.address, ethers.parseEther("0.5"), "Order #2: Monitor 4K");
      await digitalReceipt
        .connect(merchant)
        .issueReceipt(customer.address, ethers.parseEther("0.05"), "Order #3: HDMI Cable");

      // Issue 1 receipt for another customer
      await digitalReceipt
        .connect(merchant)
        .issueReceipt(
          otherCustomer.address,
          ethers.parseEther("1.0"),
          "Order #4: Smartphone"
        );

      // Customer checks history
      const history = await digitalReceipt.connect(customer).getPurchaseHistory();
      expect(history.length).to.equal(3);
      expect(history[0].id).to.equal(1);
      expect(history[0].itemDetails).to.equal("Order #1: Desk Lamp");
      expect(history[1].id).to.equal(2);
      expect(history[1].itemDetails).to.equal("Order #2: Monitor 4K");
      expect(history[2].id).to.equal(3);
      expect(history[2].itemDetails).to.equal("Order #3: HDMI Cable");

      // otherCustomer checks history
      const otherHistory = await digitalReceipt
        .connect(otherCustomer)
        .getPurchaseHistory();
      expect(otherHistory.length).to.equal(1);
      expect(otherHistory[0].id).to.equal(4);
      expect(otherHistory[0].itemDetails).to.equal("Order #4: Smartphone");
    });
  });

  describe("4. Receipt Verification (verifyReceipt)", function () {
    let receiptId;
    const itemDetails = "1x High-End GPU RTX 4090, Serial #SN9827364";
    let correctHash;

    beforeEach(async function () {
      await digitalReceipt.connect(merchant).registerMerchant();
      correctHash = ethers.keccak256(ethers.toUtf8Bytes(itemDetails));

      const tx = await digitalReceipt
        .connect(merchant)
        .issueReceipt(customer.address, ethers.parseEther("1.5"), itemDetails);
      const receipt = await tx.wait();
      receiptId = 1;
    });

    it("should return true when receipt exists, hash matches, and not refunded", async function () {
      const isValid = await digitalReceipt
        .connect(verifier)
        .verifyReceipt(receiptId, correctHash);
      expect(isValid).to.be.true;
    });

    it("should return false when wrong hash is provided (tampered details)", async function () {
      const tamperedDetails = "1x High-End GPU RTX 4090, Serial #SN_FAKE_SERIAL";
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes(tamperedDetails));

      const isValid = await digitalReceipt
        .connect(verifier)
        .verifyReceipt(receiptId, wrongHash);
      expect(isValid).to.be.false;
    });

    it("should return false when receipt does not exist", async function () {
      const isValid = await digitalReceipt
        .connect(verifier)
        .verifyReceipt(999, correctHash);
      expect(isValid).to.be.false;
    });

    it("should return false when receipt has been refunded", async function () {
      // Merchant refunds receipt
      await digitalReceipt.connect(merchant).markRefunded(receiptId);

      // Verifier checks verification
      const isValid = await digitalReceipt
        .connect(verifier)
        .verifyReceipt(receiptId, correctHash);
      expect(isValid).to.be.false;
    });
  });

  describe("5. Mark Refunded (markRefunded)", function () {
    let receiptId;
    const itemDetails = "1x Smart Watch Series 7";

    beforeEach(async function () {
      await digitalReceipt.connect(merchant).registerMerchant();
      await digitalReceipt
        .connect(merchant)
        .issueReceipt(customer.address, ethers.parseEther("0.3"), itemDetails);
      receiptId = 1;
    });

    it("should allow the issuing merchant to mark the receipt as refunded and emit ReceiptRefunded", async function () {
      await expect(digitalReceipt.connect(merchant).markRefunded(receiptId))
        .to.emit(digitalReceipt, "ReceiptRefunded")
        .withArgs(receiptId);

      const receipt = await digitalReceipt.getReceipt(receiptId);
      expect(receipt.refunded).to.be.true;
    });

    it("should revert if another account attempts to mark refunded", async function () {
      await expect(
        digitalReceipt.connect(customer).markRefunded(receiptId)
      ).to.be.revertedWith("Not the issuing merchant");

      await expect(
        digitalReceipt.connect(unauthorizedMerchant).markRefunded(receiptId)
      ).to.be.revertedWith("Not the issuing merchant");
    });

    it("should revert if the receipt does not exist", async function () {
      await expect(
        digitalReceipt.connect(merchant).markRefunded(999)
      ).to.be.revertedWith("Receipt not found");
    });

    it("should revert if attempting to refund an already refunded receipt (double refund revert)", async function () {
      await digitalReceipt.connect(merchant).markRefunded(receiptId);

      await expect(
        digitalReceipt.connect(merchant).markRefunded(receiptId)
      ).to.be.revertedWith("Receipt already refunded");
    });
  });

  describe("6. View Helpers: isMerchant and getReceipt", function () {
    it("isMerchant should return true for registered merchant, false otherwise", async function () {
      expect(await digitalReceipt.isMerchant(merchant.address)).to.be.false;
      await digitalReceipt.connect(merchant).registerMerchant();
      expect(await digitalReceipt.isMerchant(merchant.address)).to.be.true;
      expect(await digitalReceipt.isMerchant(customer.address)).to.be.false;
    });

    it("getReceipt should revert with 'Receipt not found' for non-existent id", async function () {
      await expect(digitalReceipt.getReceipt(0)).to.be.revertedWith(
        "Receipt not found"
      );
      await expect(digitalReceipt.getReceipt(100)).to.be.revertedWith(
        "Receipt not found"
      );
    });

    it("getReceipt should return accurate receipt details", async function () {
      await digitalReceipt.connect(merchant).registerMerchant();
      const amount = ethers.parseEther("0.75");
      const items = "1x Tablet 11-inch";
      await digitalReceipt.connect(merchant).issueReceipt(customer.address, amount, items);

      const r = await digitalReceipt.getReceipt(1);
      expect(r.id).to.equal(1);
      expect(r.merchant).to.equal(merchant.address);
      expect(r.buyer).to.equal(customer.address);
      expect(r.amount).to.equal(amount);
      expect(r.itemDetails).to.equal(items);
      expect(r.refunded).to.be.false;
    });
  });
});
