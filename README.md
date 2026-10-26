# Blockchain-Based Digital Receipt and Purchase History Management System

A decentralized, tamper-proof digital receipt issuing, lifetime purchase history tracking, and trustless verification system built on Ethereum smart contracts.

---

## 1. Project Overview

Traditional paper receipts and centralized e-receipts suffer from several fundamental flaws:
- **Paper Degradation & Loss:** Thermal receipts fade within months and are routinely misplaced by consumers, invalidating legitimate warranty or return claims.
- **Vulnerability to Forgery:** Centralized PDF or paper receipts are easily fabricated or altered using basic image editing tools.
- **Fragmented History:** Customers have receipts scattered across dozens of retailer accounts, spam folders, and physical wallets with no single source of truth.
- **Refund & Warranty Fraud:** Retailers lose billions annually to double-refund schemes and counterfeit receipts.

### The Solution: ReceiptChain
This project implements an end-to-end decentralized architecture where:
1. **Merchants** register on-chain and issue cryptographically signed, immutable digital receipts.
2. **Customers** maintain sovereign, lifetime ownership of their complete purchase history mapped directly to their Ethereum wallet.
3. **Verifiers** (warranty centers, return desks, tax auditors) can independently verify authenticity and detect refunds via on-chain `keccak256` hashing in under 1 second without contacting the merchant.

---

## 2. System Architecture

The application is structured into three decoupled layers:

```
+-------------------------------------------------------------------------------+
|                               1. USER LAYER                                   |
|   +-----------------------+   +-----------------------+   +---------------+   |
|   |   Merchant Portal     |   |   Customer History    |   |  Verifier UI  |   |
|   | (Issue, View, Refund) |   | (Browse, Search, Copy)|   | (Verify Hash) |   |
|   +-----------------------+   +-----------------------+   +---------------+   |
|                                       ^                                       |
|                                       | (MetaMask Wallet / RPC)               |
+-------------------------------------------------------------------------------+
                                        |
+-------------------------------------------------------------------------------+
|                          2. WEB APPLICATION LAYER                             |
|  - Framework: React 18 + Vite                                                 |
|  - Library: ethers.js v6 (Contract, Signer, Provider, Event Filter)          |
|  - State: Reactive Role Detection, Tx Life Cycle (Pending, Confirmed, Failed)|
|  - Styling: Modern, responsive design system with CSS custom properties       |
+-------------------------------------------------------------------------------+
                                        |
                                        | (JSON-RPC over HTTP/WebSocket)
                                        v
+-------------------------------------------------------------------------------+
|                            3. BLOCKCHAIN LAYER                                |
|  - Contract: DigitalReceipt.sol (Solidity ^0.8.19)                            |
|  - Local Node: Hardhat Localhost (Chain ID: 31337, RPC: 127.0.0.1:8545)       |
|  - Optional Node: Ganache (Chain ID: 1337 / 5777, RPC: 127.0.0.1:7545)       |
|  - On-Chain Integrity: keccak256 item hash, immutable chronological timestamps|
+-------------------------------------------------------------------------------+
```

### Layer Details:
1. **User Layer:**
   - **Merchant:** Registers identity, mints new receipts with custom buyer address and line items, tracks issued receipts from event logs, and executes state-preserving refunds.
   - **Customer:** Queries sovereign history via `getPurchaseHistory()`, filters by date or search keywords, and copies verification hashes.
   - **Verifier:** Inputs receipt ID and item text; client hashes string and invokes `verifyReceipt()` for instant cryptographic proof.

2. **Web Application Layer:**
   - Built with **React** and **Vite** for high performance.
   - Uses **ethers.js v6** for contract interaction, ABI decoding, event filtering, and BigInt balance parsing.
   - Dynamically checks `isMerchant(account)` and auto-refreshes when accounts change in MetaMask.

3. **Blockchain Layer:**
   - Single source of truth governed by **`DigitalReceipt.sol`**.
   - Emits structured indexable events: `MerchantRegistered`, `ReceiptIssued`, and `ReceiptRefunded`.
   - Never deletes data: refunded receipts preserve their full audit trail with `refunded = true`.

---

## 3. Project Directory Structure

```
blockchain-digital-receipt/
├── contracts/
│   └── DigitalReceipt.sol        # Solidity smart contract
├── test/
│   └── DigitalReceipt.test.js    # Hardhat Chai test suite (19 passing tests)
├── scripts/
│   ├── deploy.js                 # Deploys contract & exports ABI to frontend
│   ├── seed.js                   # Seeds demo merchant, customer & 3 receipts
│   └── capture-screenshots.js    # Puppeteer script for generating report media
├── frontend/
│   ├── index.html                # App entry HTML
│   ├── vite.config.js            # Vite configuration
│   ├── package.json              # Frontend dependencies (React, Vite, ethers v6)
│   └── src/
│       ├── main.jsx              # React DOM root
│       ├── App.jsx               # Navigation, wallet state & tab router
│       ├── index.css             # Responsive styling & themes
│       ├── contract/
│       │   └── DigitalReceipt.json # Contract address & ABI from deploy.js
│       ├── components/
│       │   └── Navbar.jsx        # Navigation bar & MetaMask button
│       ├── pages/
│       │   ├── Home.jsx          # Dashboard, 3-line overview & role monitor
│       │   ├── Merchant.jsx      # Merchant registration, issue form & refund table
│       │   ├── Customer.jsx      # Purchase history, search, sort & copy proof
│       │   └── Verifier.jsx      # Trustless verification UI with big status banner
│       └── utils/
│           └── formatters.js     # Currency, address & date format helpers
├── screenshots/                  # Captured UI report screenshots
│   ├── 01_home_dashboard.png
│   ├── 02_merchant_portal.png
│   ├── 03_customer_purchase_history.png
│   └── 04_verifier_page.png
├── hardhat.config.js             # Hardhat network config (localhost & ganache)
├── package.json                  # Root dependencies & convenience npm scripts
└── README.md                     # Complete project documentation
```

---

## 4. Quick Start & Setup Steps

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on v22.16.0)
- [npm](https://www.npmjs.com/) v9+
- [MetaMask Browser Extension](https://metamask.io/)

### Step 1: Install Dependencies

From the project root:
```bash
npm install
```

Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

---

## 5. Running the Blockchain Node & Deployment

### Step 2: Start the Local Hardhat Node
In Terminal 1 (keep this running):
```bash
npx hardhat node
```
This launches a local Ethereum node at `http://127.0.0.1:8545` with Chain ID `31337` and generates 20 pre-funded test accounts with 10,000 ETH each.

### Step 3: Deploy the Smart Contract
In Terminal 2:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
*Note: This script deploys `DigitalReceipt` and automatically saves the contract address and compiled ABI to `frontend/src/contract/DigitalReceipt.json`.*

### Step 4: Seed Demo Data
In Terminal 2:
```bash
npx hardhat run scripts/seed.js --network localhost
```
This registers Account #0 as a merchant and issues 3 sample receipts for Account #1:
1. `0.15 ETH` - Apple MacBook Air M2 13-inch
2. `0.05 ETH` - Sony WH-1000XM5 Wireless Headphones
3. `0.02 ETH` - Keychron K2 Mechanical Keyboard

### Step 5: Start the Frontend Application
In Terminal 2 (or Terminal 3):
```bash
cd frontend
npm run dev
```
Open your browser and navigate to: **`http://localhost:3000`**

---

## 6. Configuring MetaMask for Localhost

To interact with the dApp in your browser, configure MetaMask to connect to the local node and import the test accounts:

### 1. Add Hardhat Local Network to MetaMask
- Open MetaMask -> Click the network selector dropdown (top left).
- Click **"Add Network"** -> **"Add a network manually"**.
- Enter the following details:
  - **Network Name:** `Hardhat Localhost`
  - **New RPC URL:** `http://127.0.0.1:8545`
  - **Chain ID:** `31337`
  - **Currency Symbol:** `ETH`
- Click **Save** and switch to this network.

*(If using Ganache instead, use RPC URL `http://127.0.0.1:7545` and Chain ID `1337` or `5777`).*

### 2. Import Test Accounts into MetaMask
Click your account circle icon in MetaMask -> **"Add account or hardware wallet"** -> **"Import account"** -> Paste private key:

- **Merchant Account (Account #0):**
  - **Address:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  - **Private Key:** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

- **Customer / Buyer Account (Account #1):**
  - **Address:** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
  - **Private Key:** `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

---

## 7. Complete Demo Walkthrough

Follow this step-by-step sequence to demonstrate the entire project lifecycle:

### Step 1: Dashboard & Role Detection
1. Connect MetaMask with **Account #0** (`0xf39Fd6...`).
2. Notice the Dashboard dynamically displays **Role: Registered Merchant** and **Network: Hardhat (31337)**.
3. Switch MetaMask to **Account #1** (`0x709979...`).
4. Notice the Dashboard immediately updates to **Role: Customer / Buyer**.

### Step 2: Merchant Portal & Issuing a Receipt
1. Switch back to **Account #0** in MetaMask.
2. Click the **"Merchant"** tab in the navigation bar.
3. You will see the table of existing receipts seeded earlier.
4. Fill out the "Issue Digital Receipt" form:
   - **Buyer Address:** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - **Total Amount:** `0.75`
   - **Item Details:** `1x UltraWide Gaming Monitor 34-inch (Model: UW-900)`
5. Click **"Issue and Mint Digital Receipt"** and confirm the transaction in MetaMask.
6. The transaction status switches to pending, confirms on-chain, and Receipt #4 immediately appears in the issued receipts table.

### Step 3: Customer Purchase History
1. Switch MetaMask to **Account #1** (`0x709979...`).
2. Click the **"Purchase History"** tab.
3. All receipts issued to your wallet are listed with amounts, formatted timestamps, and item details.
4. Use the search bar to filter by keyword (e.g. `"MacBook"` or `"Monitor"`).
5. On Receipt #1, click the **"📋 Copy Verification Details"** button. The receipt ID and items hash are copied to your clipboard.

### Step 4: Verification (Genuine Receipt)
1. Click the **"Receipt Verifier"** tab.
2. Enter:
   - **Receipt ID:** `1`
   - **Item Details:** `1x Apple MacBook Air M2 13-inch (Space Gray), Serial #C02G1234MD6R`
   *(Or simply click the "💡 Fill Demo Sample Data" button).*
3. Click **"🔍 Verify Receipt Authenticity"**.
4. The system computes `keccak256` in real-time, queries the contract, and presents a prominent green **"VALID RECEIPT"** banner with a detailed audit breakdown (Hash match, not refunded, merchant address, amount).

### Step 5: Verification (Tamper Detection)
1. In the Item Details box, alter even a single character (e.g. change serial number or add an extra space).
2. Click **"Verify Receipt Authenticity"**.
3. The system computes a different hash that does not match the on-chain record and presents a red **"INVALID / REFUNDED"** banner, demonstrating tamper resistance.

### Step 6: Processing a Refund
1. Switch MetaMask back to Merchant **Account #0**.
2. Go to the **Merchant** tab.
3. Find Receipt #1 in the table and click **"Mark Refunded"**.
4. Confirm the MetaMask popup.
5. Once confirmed, the status pill changes from **Valid** to **Refunded**.

### Step 7: Verifying a Refunded Receipt
1. Switch to the **Receipt Verifier** tab.
2. Enter Receipt ID `1` with the exact original text.
3. Click **"Verify Receipt Authenticity"**.
4. Even though the text is genuine, the verification returns **false** and displays **"INVALID / REFUNDED"** because the receipt was marked refunded on the smart contract.

---

## 8. Smart Contract Function Reference

[`contracts/DigitalReceipt.sol`](contracts/DigitalReceipt.sol):

| Function | Modifiers | Description |
|---|---|---|
| `registerMerchant()` | `external` | Registers the caller as an authorized merchant. Reverts with `"Already registered"` if called again. |
| `issueReceipt(address buyer, uint256 amount, string itemDetails)` | `external` | Verifies merchant status, hashes `itemDetails` using `keccak256`, increments receipt ID, records timestamp, and emits `ReceiptIssued`. |
| `markRefunded(uint256 receiptId)` | `external` | Only the issuing merchant can call this. Sets `receipt.refunded = true` without deleting history and emits `ReceiptRefunded`. |
| `getPurchaseHistory()` | `external view` | Returns an array of `Receipt` structs owned by `msg.sender`. |
| `verifyReceipt(uint256 receiptId, bytes32 itemsHash)` | `external view` | Returns `true` only if receipt exists, `itemsHash` matches the stored hash, and `refunded == false`. |
| `isMerchant(address account)` | `external view` | Returns `true` if account is a registered merchant, `false` otherwise. |
| `getReceipt(uint256 id)` | `external view` | Returns full `Receipt` struct by ID; reverts with `"Receipt not found"` if non-existent. |

---

## 9. Automated Test Suite

Run the full test suite with:
```bash
npx hardhat test
```

### Test Coverage Summary:
- **Merchant Registration:**
  - Standard registration and `MerchantRegistered` event emission.
  - Rejection of duplicate registration attempts.
- **Receipt Issuance:**
  - Issuance by registered merchant and `ReceiptIssued` event emission.
  - Non-merchant rejection (`"Not a merchant"`).
  - Validation of zero address for buyer (`"Invalid buyer address"`).
  - Validation of zero amount (`"Amount must be greater than zero"`).
- **Purchase History:**
  - Empty history for new accounts.
  - Correct isolation and retrieval of multiple receipts across multiple buyers.
- **Verification (`verifyReceipt`):**
  - Success with genuine data.
  - Failure with tampered items text (altered hash).
  - Failure with non-existent receipt IDs.
  - Failure for refunded receipts.
- **Refund Management (`markRefunded`):**
  - Issuing merchant can mark refunded (`ReceiptRefunded` event).
  - Non-issuing accounts and unauthorized merchants rejected (`"Not the issuing merchant"`).
  - Non-existent receipt rejection (`"Receipt not found"`).
  - Double refund prevention (`"Receipt already refunded"`).
- **View Helpers:**
  - `isMerchant` accuracy.
  - `getReceipt` accuracy and error handling for missing IDs.

Result: **19/19 tests passing (100% pass rate)**.

---

## 10. Report Screenshots

| Page | Description |
|---|---|
| **1. Home / Dashboard** | Project summary, real-time role detection, network status, quick links. |
| **2. Merchant Portal** | Registration status, receipt issuance form, and issued receipts refund table. |
| **3. Purchase History** | Buyer's lifetime receipts, search filter, date sort, and copy verification buttons. |
| **4. Receipt Verifier** | Trustless verification form, live keccak256 hash comparison, and status banner. |

Screenshots are saved locally in `screenshots/`.

---

## 11. Academic Evaluation & Defense Q&A

**Q: Why store the `itemsHash` on-chain instead of only plain text?**  
*A: Storing the `keccak256(bytes(itemDetails))` creates an unalterable 32-byte cryptographic fingerprint. Even if off-chain databases store the detailed item list, any modification to a single character changes the hash completely, making forgery impossible.*

**Q: Why not delete the receipt record when refunded?**  
*A: Immutability is the core value of blockchain auditing. Deleting records destroys the audit trail. By toggling `refunded = true`, the system preserves proof that the purchase occurred while preventing reuse for fraudulent warranty claims or multiple refunds.*

**Q: How does this scale with high Ethereum gas fees?**  
*A: While developed on an EVM-compatible testnet, this contract is optimized for deployment on Layer-2 rollups (Arbitrum, Optimism, Base, Polygon) where transaction costs are fractions of a cent, making per-receipt minting commercially viable.*
