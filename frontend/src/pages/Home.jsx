import React from "react";
import { shortenAddress } from "../utils/formatters";

export default function Home({
  account,
  chainId,
  isMerchant,
  contractAddress,
  setActiveTab,
  connectWallet,
}) {
  const getRoleName = () => {
    if (!account) return "Not Connected";
    return isMerchant ? "Registered Merchant" : "Customer / Buyer";
  };

  const getNetworkName = () => {
    if (!chainId) return "Not Connected";
    const cid = Number(chainId);
    if (cid === 31337) return "Hardhat Localhost (Chain ID: 31337)";
    if (cid === 1337 || cid === 5777) return `Ganache Local (${cid})`;
    return `Chain ID: ${cid}`;
  };

  return (
    <div className="home-page">
      {/* 3-line Project Explanation as explicitly required */}
      <div className="card" style={{ borderLeft: "5px solid var(--primary)" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "800", marginBottom: "1rem" }}>
          Blockchain-Based Digital Receipt & Purchase History Management System
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <p style={{ fontSize: "1.05rem", color: "#1e293b", lineHeight: "1.6" }}>
            <strong>1. Tamper-Proof Issuance:</strong> Merchants issue cryptographically signed, immutable digital receipts stored transparently on an Ethereum smart contract.
          </p>
          <p style={{ fontSize: "1.05rem", color: "#1e293b", lineHeight: "1.6" }}>
            <strong>2. Unified Customer History:</strong> Customers maintain lifetime, centralized ownership of all their purchase records in one place through their Ethereum wallet.
          </p>
          <p style={{ fontSize: "1.05rem", color: "#1e293b", lineHeight: "1.6" }}>
            <strong>3. Trustless Instant Verification:</strong> Service centers, return desks, and auditors verify authenticity and check active/refunded status without middlemen.
          </p>
        </div>
      </div>

      {/* Role and Network Status Panel */}
      <div className="card">
        <h2 className="card-title">Connected Session Details</h2>
        <p className="card-subtitle">
          Real-time role detection, wallet state, and blockchain network connectivity.
        </p>

        <div className="grid-3">
          <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-muted)" }}>
              Detected Role
            </span>
            <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className={`badge ${isMerchant ? "badge-valid" : "badge-role"}`} style={{ fontSize: "0.95rem" }}>
                {isMerchant ? "🏪 " : "👤 "} {getRoleName()}
              </span>
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-muted)" }}>
              Connected Network
            </span>
            <div style={{ marginTop: "0.5rem", fontWeight: "700", fontSize: "0.95rem", color: "#0f172a" }}>
              🌐 {getNetworkName()}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "700", color: "var(--text-muted)" }}>
              Smart Contract
            </span>
            <div style={{ marginTop: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--primary)" }}>
              📄 {contractAddress ? shortenAddress(contractAddress) : "Deploying..."}
            </div>
          </div>
        </div>

        {!account && (
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <button className="btn btn-primary" onClick={connectWallet}>
              🦊 Connect MetaMask to Get Started
            </button>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "1rem" }}>
        System Portals
      </h2>
      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏪</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.4rem" }}>
            Merchant Portal
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Register merchant identity, mint cryptographic receipts for buyers, and manage refunds.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: "100%" }}
            onClick={() => setActiveTab("merchant")}
          >
            Open Merchant Portal →
          </button>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🛍️</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.4rem" }}>
            Purchase History
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            View all your digital receipts, filter by date, copy cryptographic proof strings.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: "100%" }}
            onClick={() => setActiveTab("customer")}
          >
            View My Receipts →
          </button>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.4rem" }}>
            Receipt Verifier
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Trustless verification: checks item detail hash, existence, and refund flag on-chain.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: "100%" }}
            onClick={() => setActiveTab("verifier")}
          >
            Launch Verifier →
          </button>
        </div>
      </div>

      {/* How it works Architecture section */}
      <div className="card">
        <h2 className="card-title">How Blockchain Digital Receipts Work</h2>
        <p className="card-subtitle">
          Eliminating paper waste, receipt forgery, and warranty fraud with Ethereum smart contracts.
        </p>

        <div className="grid-4">
          <div className="step-card">
            <div className="step-number">01</div>
            <h4 style={{ fontWeight: "700", fontSize: "0.95rem", marginBottom: "0.25rem" }}>
              Merchant Register
            </h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              The merchant registers their Ethereum address once on the smart contract.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <h4 style={{ fontWeight: "700", fontSize: "0.95rem", marginBottom: "0.25rem" }}>
              Issue & Hash
            </h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Item details are hashed with keccak256; timestamp & amount are logged on-chain.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <h4 style={{ fontWeight: "700", fontSize: "0.95rem", marginBottom: "0.25rem" }}>
              Buyer Ownership
            </h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Receipt is mapped to the customer address and visible across all devices.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">04</div>
            <h4 style={{ fontWeight: "700", fontSize: "0.95rem", marginBottom: "0.25rem" }}>
              Verify & Refund
            </h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Service centers verify receipts instantly; merchants can flag refunds without deletion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
