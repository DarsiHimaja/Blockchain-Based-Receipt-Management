import React from "react";
import { shortenAddress } from "../utils/formatters";

export default function Navbar({
  activeTab,
  setActiveTab,
  account,
  chainId,
  isConnecting,
  connectWallet,
  isMerchant,
}) {
  const getNetworkBadge = () => {
    if (!account) return null;
    const cid = Number(chainId);
    if (cid === 31337) {
      return (
        <span className="badge-network">
          <span className="status-dot"></span> Hardhat (31337)
        </span>
      );
    } else if (cid === 1337 || cid === 5777) {
      return (
        <span className="badge-network">
          <span className="status-dot"></span> Ganache ({cid})
        </span>
      );
    } else if (cid === 1) {
      return (
        <span className="badge-network">
          <span className="status-dot"></span> Ethereum Mainnet
        </span>
      );
    } else if (cid === 11155111) {
      return (
        <span className="badge-network">
          <span className="status-dot"></span> Sepolia Testnet
        </span>
      );
    } else {
      return (
        <span className="badge-network">
          <span className="status-dot wrong"></span> Network ({chainId || "?"})
        </span>
      );
    }
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <div
          className="brand"
          style={{ cursor: "pointer" }}
          onClick={() => setActiveTab("home")}
        >
          <span className="brand-icon">🧾</span>
          <span>ReceiptChain</span>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${activeTab === "home" ? "active" : ""}`}
            onClick={() => setActiveTab("home")}
          >
            Dashboard
          </button>
          <button
            className={`nav-btn ${activeTab === "merchant" ? "active" : ""}`}
            onClick={() => setActiveTab("merchant")}
          >
            Merchant {isMerchant ? "✓" : ""}
          </button>
          <button
            className={`nav-btn ${activeTab === "customer" ? "active" : ""}`}
            onClick={() => setActiveTab("customer")}
          >
            Purchase History
          </button>
          <button
            className={`nav-btn ${activeTab === "verifier" ? "active" : ""}`}
            onClick={() => setActiveTab("verifier")}
          >
            Receipt Verifier
          </button>
        </nav>

        <div className="nav-right">
          {getNetworkBadge()}
          {account ? (
            <button
              className="wallet-btn connected"
              title={`Connected account: ${account}`}
            >
              🦊 {shortenAddress(account)}
            </button>
          ) : (
            <button
              className="wallet-btn"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <span className="spinner"></span> Connecting...
                </>
              ) : (
                <>🦊 Connect MetaMask</>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
