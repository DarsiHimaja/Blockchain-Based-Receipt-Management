import React, { useState } from "react";
import { ethers } from "ethers";
import { shortenAddress, formatEth, formatDate, truncateHash } from "../utils/formatters";

export default function Verifier({ contract }) {
  const [receiptId, setReceiptId] = useState("");
  const [itemDetailsText, setItemDetailsText] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Verification results
  const [hasVerified, setHasVerified] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [computedHash, setComputedHash] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  const [verificationError, setVerificationError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!contract) {
      setVerificationError("Smart contract not connected. Please ensure MetaMask is connected.");
      return;
    }

    const trimmedId = receiptId.trim();
    if (!trimmedId || isNaN(trimmedId) || Number(trimmedId) <= 0) {
      setVerificationError("Please enter a valid numeric Receipt ID.");
      return;
    }

    setVerifying(true);
    setVerificationError(null);
    setHasVerified(false);
    setReceiptData(null);

    try {
      // 1. Hash the item details text with keccak256
      const hash = ethers.keccak256(ethers.toUtf8Bytes(itemDetailsText));
      setComputedHash(hash);

      // 2. Call verifyReceipt(receiptId, itemsHash) on the smart contract
      const valid = await contract.verifyReceipt(trimmedId, hash);
      setIsValid(valid);

      // 3. Fetch receipt details for comprehensive verification report
      try {
        const r = await contract.getReceipt(trimmedId);
        setReceiptData({
          id: r.id.toString(),
          merchant: r.merchant,
          buyer: r.buyer,
          amount: r.amount,
          issuedAt: Number(r.issuedAt),
          itemsHash: r.itemsHash,
          itemDetails: r.itemDetails,
          refunded: r.refunded,
        });
      } catch (getErr) {
        // Receipt might not exist
        setReceiptData(null);
      }

      setHasVerified(true);
    } catch (err) {
      console.error("Verification failed:", err);
      setVerificationError(err.reason || err.message || "Failed to query smart contract.");
    } finally {
      setVerifying(false);
    }
  };

  const loadSampleData = () => {
    setReceiptId("1");
    setItemDetailsText("1x Apple MacBook Air M2 13-inch (Space Gray), Serial #C02G1234MD6R");
  };

  return (
    <div className="verifier-page">
      <div className="card">
        <h1 className="card-title">Trustless Receipt Verifier</h1>
        <p className="card-subtitle">
          Auditors, warranty centers, and return desks can independently verify whether a digital receipt is authentic, untampered, and not refunded.
        </p>

        <form onSubmit={handleVerify}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Receipt ID *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                placeholder="e.g. 1"
                value={receiptId}
                onChange={(e) => setReceiptId(e.target.value)}
                required
              />
              <div className="form-hint">
                Sequential integer assigned when the receipt was issued.
              </div>
            </div>

            <div className="form-group" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={loadSampleData}
                style={{ alignSelf: "flex-start", marginBottom: "0.5rem" }}
              >
                💡 Fill Demo Sample Data (Receipt #1)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Item Details Text to Verify *</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Paste the exact item description or line items shown on the customer's receipt..."
              value={itemDetailsText}
              onChange={(e) => setItemDetailsText(e.target.value)}
              required
            ></textarea>
            <div className="form-hint">
              The verification engine computes <code>keccak256(itemDetails)</code> and matches it with the immutable on-chain hash.
            </div>
          </div>

          {verificationError && (
            <div className="alert alert-danger">
              <strong>Error: </strong> {verificationError}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={verifying}
            style={{ width: "100%", padding: "0.85rem" }}
          >
            {verifying ? (
              <>
                <span className="spinner"></span> Querying Ethereum Blockchain...
              </>
            ) : (
              <>🔍 Verify Receipt Authenticity</>
            )}
          </button>
        </form>
      </div>

      {/* Verification Result Section */}
      {hasVerified && (
        <div>
          {isValid ? (
            /* BIG GREEN VALID RECEIPT BANNER */
            <div className="verify-result verify-valid">
              <div className="verify-icon">✅</div>
              <div className="verify-title">VALID RECEIPT</div>
              <p style={{ fontSize: "1.05rem", fontWeight: "600", maxWidth: "650px", margin: "0 auto" }}>
                Authentic, Tamper-Proof & Active on Ethereum Blockchain
              </p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", opacity: 0.9 }}>
                The cryptographic hash of the item details perfectly matches the smart contract record and no refund has been logged.
              </p>
            </div>
          ) : (
            /* BIG RED INVALID / REFUNDED BANNER */
            <div className="verify-result verify-invalid">
              <div className="verify-icon">❌</div>
              <div className="verify-title">INVALID / REFUNDED</div>
              <p style={{ fontSize: "1.05rem", fontWeight: "600", maxWidth: "650px", margin: "0 auto" }}>
                Receipt Verification Failed
              </p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", opacity: 0.9 }}>
                This receipt is either non-existent, has been marked refunded by the merchant, or the item description was altered/tampered.
              </p>
            </div>
          )}

          {/* Detailed Verification Breakdown */}
          <div className="card" style={{ marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem" }}>
              Cryptographic Verification Breakdown
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Receipt ID Queried:</span>
                <span className="mono" style={{ fontWeight: "700" }}>#{receiptId}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Computed keccak256 Hash:</span>
                <span className="mono" style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>
                  {computedHash}
                </span>
              </div>

              {receiptData ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>On-Chain Stored Hash:</span>
                    <span className="mono" style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>
                      {receiptData.itemsHash}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Hash Integrity Check:</span>
                    <span style={{ fontWeight: "700", color: computedHash === receiptData.itemsHash ? "var(--success)" : "var(--danger)" }}>
                      {computedHash === receiptData.itemsHash ? "✓ MATCH (Untampered)" : "✗ MISMATCH (Details Altered)"}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Refund Status:</span>
                    <span style={{ fontWeight: "700", color: receiptData.refunded ? "var(--danger)" : "var(--success)" }}>
                      {receiptData.refunded ? "✗ REFUNDED (Void for return/warranty)" : "✓ ACTIVE (Not refunded)"}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Issuing Merchant:</span>
                    <span className="mono">{shortenAddress(receiptData.merchant)} ({receiptData.merchant})</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Buyer Address:</span>
                    <span className="mono">{shortenAddress(receiptData.buyer)} ({receiptData.buyer})</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Total Purchase Amount:</span>
                    <span style={{ fontWeight: "700" }}>{formatEth(receiptData.amount)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Block Timestamp:</span>
                    <span>{formatDate(receiptData.issuedAt)}</span>
                  </div>
                </>
              ) : (
                <div style={{ padding: "0.75rem 0", color: "var(--danger)", fontWeight: "600" }}>
                  Receipt #{receiptId} was not found on the smart contract.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
