# Blockchain-Based Digital Receipt and Purchase History Management System

A decentralized application for issuing tamper-proof digital receipts on the Ethereum blockchain, tracking lifetime purchase history, and verifying authenticity without middlemen.


## File Structure

```
blockchain-digital-receipt/
├── contracts/
│   └── DigitalReceipt.sol        # Solidity smart contract (issue, verify, refund receipts)
├── test/
│   └── DigitalReceipt.test.js    # Hardhat test suite (19 passing unit tests)
├── scripts/
│   ├── deploy.js                 # Deploys contract and exports ABI to frontend
│   ├── seed.js                   # Seeds demo merchant, customer, and sample receipts
│   └── capture-screenshots.js    # Script used to generate UI screenshots
├── frontend/
│   ├── index.html                # HTML entry point
│   ├── vite.config.js            # Vite configuration
│   ├── package.json              # Frontend dependencies (React, Vite, ethers.js v6)
│   └── src/
│       ├── main.jsx              # React app root
│       ├── App.jsx               # Navigation, MetaMask wallet state, and tabs
│       ├── index.css             # App styling and responsive layout
│       ├── components/
│       │   └── Navbar.jsx        # Navigation bar with MetaMask connect button
│       ├── contract/
│       │   └── DigitalReceipt.json # Contract address and ABI
│       ├── pages/
│       │   ├── Home.jsx          # Project overview and role detector
│       │   ├── Merchant.jsx      # Merchant registration, receipt issuing, refund table
│       │   ├── Customer.jsx      # Purchase history, search, sort, verification copy
│       │   └── Verifier.jsx      # Receipt verification by ID and item details text
│       └── utils/
│           └── formatters.js     # Currency, address, and date formatters
├── screenshots/                  # Application screenshots
│   ├── 01_home_dashboard.png
│   ├── 02_merchant_portal.png
│   ├── 03_customer_purchase_history.png
│   └── 04_verifier_page.png
├── hardhat.config.js             # Hardhat network configuration
├── package.json                  # Root dependencies and scripts
├── start.bat                     # 1-click startup script for Windows
└── README.md                     # Project documentation
```

---

## How to Run

### Option 1: 1-Click Run (Windows)
Double-click `start.bat`. It will:
1. Start the local Ethereum node (`http://127.0.0.1:8545`)
2. Deploy the contract and seed demo data
3. Launch the frontend at `http://localhost:3000`

### Option 2: Manual Steps
```bash
# 1. Install dependencies
npm install
cd frontend && npm install && cd ..

# 2. Start local blockchain node (in terminal 1)
npx hardhat node

# 3. Deploy & seed demo data (in terminal 2)
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/seed.js --network localhost

# 4. Start frontend
cd frontend
npm run dev
```
Open **http://localhost:3000** in your browser and connect MetaMask.

---

## Tech Stack
- **Smart Contract:** Solidity ^0.8.19
- **Dev Framework:** Hardhat
- **Frontend:** React + Vite, ethers.js v6, MetaMask
- **Tests:** Hardhat + Chai (19/19 passing)
