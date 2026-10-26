const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("Seeding Demo Data for DigitalReceipt...");

  const contractInfoPath = path.join(
    __dirname,
    "../frontend/src/contract/DigitalReceipt.json"
  );

  if (!fs.existsSync(contractInfoPath)) {
    throw new Error(
      "Contract deployment file not found! Please run `npx hardhat run scripts/deploy.js --network localhost` first."
    );
  }

  const contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, "utf8"));
  const contractAddress = contractInfo.address;
  console.log(`Connecting to contract at: ${contractAddress}`);

  const signers = await ethers.getSigners();
  if (signers.length < 2) {
    throw new Error("At least 2 accounts are required to seed merchant and buyer.");
  }

  // Account 0 as Merchant, Account 1 as Buyer (or Account 1 & 2)
  const merchant = signers[0];
  const buyer = signers[1];

  console.log(`Merchant Account: ${merchant.address}`);
  console.log(`Buyer Account:    ${buyer.address}`);

  const DigitalReceipt = await ethers.getContractAt(
    "DigitalReceipt",
    contractAddress,
    merchant
  );

  // 1. Register Merchant if not registered
  const isReg = await DigitalReceipt.isMerchant(merchant.address);
  if (!isReg) {
    console.log("Registering merchant...");
    const regTx = await DigitalReceipt.registerMerchant();
    await regTx.wait();
    console.log(">>> Merchant registered successfully!");
  } else {
    console.log(">>> Merchant is already registered.");
  }

  // 2. Sample receipts to issue
  const sampleReceipts = [
    {
      amount: ethers.parseEther("0.15"),
      itemDetails: "1x Apple MacBook Air M2 13-inch (Space Gray), Serial #C02G1234MD6R",
    },
    {
      amount: ethers.parseEther("0.05"),
      itemDetails: "1x Sony WH-1000XM5 Noise-Canceling Wireless Headphones (Black)",
    },
    {
      amount: ethers.parseEther("0.02"),
      itemDetails: "1x Keychron K2 Wireless Mechanical Keyboard (RGB Backlight, Brown Switch)",
    },
  ];

  console.log("\nIssuing 3 sample receipts...");
  for (let i = 0; i < sampleReceipts.length; i++) {
    const item = sampleReceipts[i];
    const tx = await DigitalReceipt.issueReceipt(
      buyer.address,
      item.amount,
      item.itemDetails
    );
    const receipt = await tx.wait();

    const expectedHash = ethers.keccak256(ethers.toUtf8Bytes(item.itemDetails));
    console.log(`--------------------------------------------------`);
    console.log(`Receipt #${i + 1} Issued:`);
    console.log(`- Amount:      ${ethers.formatEther(item.amount)} ETH`);
    console.log(`- Items:       ${item.itemDetails}`);
    console.log(`- Items Hash:  ${expectedHash}`);
    console.log(`- Buyer:       ${buyer.address}`);
  }

  console.log("==================================================");
  console.log(">>> Demo data seeded successfully!");
  console.log(`>>> Connect MetaMask with Account #1 (${buyer.address}) to view customer purchase history.`);
  console.log(`>>> Connect MetaMask with Account #0 (${merchant.address}) to manage merchant receipts.`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
});
