// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DigitalReceipt
 * @author Final Year Project - Blockchain-Based Digital Receipt and Purchase History Management System
 * @notice Implements tamper-proof digital receipts on the Ethereum blockchain.
 *         Merchants can register and issue receipts.
 *         Customers can view their complete verifiable purchase history.
 *         Verifiers (auditors, return desks, warranty centers) can verify the authenticity
 *         and active/refunded status of any issued receipt.
 */
contract DigitalReceipt {

    // --- Data Structures ---

    /**
     * @notice Receipt struct representing an immutable digital receipt record.
     * @param id Unique sequential receipt identifier
     * @param merchant Ethereum address of the merchant who issued the receipt
     * @param buyer Ethereum address of the customer/buyer
     * @param amount Transaction amount in Wei (or basic unit)
     * @param issuedAt Block timestamp indicating when the receipt was created
     * @param itemsHash Cryptographic hash (keccak256) of item details for tamper verification
     * @param itemDetails Human-readable string containing line items, quantities, or SKU data
     * @param refunded Boolean flag indicating if the receipt has been refunded
     */
    struct Receipt {
        uint256 id;
        address merchant;
        address buyer;
        uint256 amount;
        uint256 issuedAt;
        bytes32 itemsHash;
        string itemDetails;
        bool refunded;
    }

    // --- State Variables ---

    /// @notice Auto-incrementing receipt ID counter starting from 1
    uint256 internal nextReceiptId = 1;

    /// @notice Registry mapping merchant addresses to their registration status
    mapping(address => bool) internal registeredMerchants;

    /// @notice Mapping storing receipts by their unique receipt ID
    mapping(uint256 => Receipt) internal receipts;

    /// @notice Mapping storing the list of receipt IDs belonging to each buyer address
    mapping(address => uint256[]) internal buyerToReceipts;

    // --- Events ---

    /// @notice Emitted when a new merchant registers in the system
    event MerchantRegistered(address indexed merchant);

    /// @notice Emitted when a new digital receipt is successfully issued
    event ReceiptIssued(
        uint256 indexed id,
        address indexed merchant,
        address indexed buyer,
        uint256 amount
    );

    /// @notice Emitted when an issuing merchant flags a receipt as refunded
    event ReceiptRefunded(uint256 indexed id);

    // --- Merchant Functions ---

    /**
     * @notice Registers the caller as an authorized merchant.
     * @dev Anyone can register once; prevents duplicate registration.
     */
    function registerMerchant() external {
        require(!registeredMerchants[msg.sender], "Already registered");
        registeredMerchants[msg.sender] = true;
        emit MerchantRegistered(msg.sender);
    }

    /**
     * @notice Issues a tamper-proof digital receipt for a customer purchase.
     * @dev Only registered merchants can call this. Computes keccak256 hash of itemDetails.
     * @param buyer The Ethereum address of the customer
     * @param amount The total purchase amount (> 0)
     * @param itemDetails JSON or formatted text describing the purchased items
     * @return id The newly assigned unique receipt ID
     */
    function issueReceipt(
        address buyer,
        uint256 amount,
        string memory itemDetails
    ) external returns (uint256) {
        require(registeredMerchants[msg.sender], "Not a merchant");
        require(buyer != address(0), "Invalid buyer address");
        require(amount > 0, "Amount must be greater than zero");

        uint256 receiptId = nextReceiptId++;
        bytes32 itemsHash = keccak256(bytes(itemDetails));

        receipts[receiptId] = Receipt({
            id: receiptId,
            merchant: msg.sender,
            buyer: buyer,
            amount: amount,
            issuedAt: block.timestamp,
            itemsHash: itemsHash,
            itemDetails: itemDetails,
            refunded: false
        });

        buyerToReceipts[buyer].push(receiptId);

        emit ReceiptIssued(receiptId, msg.sender, buyer, amount);

        return receiptId;
    }

    /**
     * @notice Marks an existing receipt as refunded.
     * @dev Only the issuing merchant can refund their own receipt.
     *      Preserves the receipt on chain, updating only the refunded flag.
     * @param receiptId Unique identifier of the receipt to be refunded
     */
    function markRefunded(uint256 receiptId) external {
        Receipt storage receipt = receipts[receiptId];
        require(receipt.id != 0, "Receipt not found");
        require(receipt.merchant == msg.sender, "Not the issuing merchant");
        require(!receipt.refunded, "Receipt already refunded");

        receipt.refunded = true;

        emit ReceiptRefunded(receiptId);
    }

    // --- Customer Functions ---

    /**
     * @notice Fetches the entire purchase history for the caller (msg.sender).
     * @return An array of Receipt structs associated with the caller's address
     */
    function getPurchaseHistory() external view returns (Receipt[] memory) {
        uint256[] storage receiptIds = buyerToReceipts[msg.sender];
        uint256 count = receiptIds.length;

        Receipt[] memory userReceipts = new Receipt[](count);
        for (uint256 i = 0; i < count; i++) {
            userReceipts[i] = receipts[receiptIds[i]];
        }

        return userReceipts;
    }

    // --- Verifier & Public Helper Functions ---

    /**
     * @notice Verifies whether a given receipt is genuine, untampered, and not refunded.
     * @param receiptId ID of the receipt to verify
     * @param itemsHash keccak256 hash of the item details presented for verification
     * @return bool True if receipt exists, itemsHash matches on-chain hash, and it is not refunded
     */
    function verifyReceipt(
        uint256 receiptId,
        bytes32 itemsHash
    ) external view returns (bool) {
        Receipt storage receipt = receipts[receiptId];
        if (receipt.id == 0) {
            return false;
        }
        if (receipt.refunded) {
            return false;
        }
        return (receipt.itemsHash == itemsHash);
    }

    /**
     * @notice Helper to check if a specific address is a registered merchant.
     * @param account Address to check
     * @return bool True if registered, false otherwise
     */
    function isMerchant(address account) external view returns (bool) {
        return registeredMerchants[account];
    }

    /**
     * @notice Retrieves the full details of a specific receipt.
     * @dev Reverts with "Receipt not found" if receipt ID is invalid or does not exist.
     * @param id The ID of the receipt
     * @return Receipt struct matching the given ID
     */
    function getReceipt(uint256 id) external view returns (Receipt memory) {
        Receipt storage receipt = receipts[id];
        require(receipt.id != 0, "Receipt not found");
        return receipt;
    }
}
