import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { shortenAddress, formatEth, formatDate, truncateHash } from "../utils/formatters";

export default function Merchant({
  account,
  contract,
  isMerchant,
  setIsMerchant,
  onRefreshRole,
}) {
  // Registration state
  const [registering, setRegistering] = useState(false);
  const [regTxStatus, setRegTxStatus] = useState(null); // { type: 'pending'|'success'|'error', msg: string, hash?: string }

  // Issue receipt form state
  const [buyerAddress, setBuyerAddress] = useState("");
  const [amountEth, setAmountEth] = useState("");
  const [itemDetails, setItemDetails] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [issueTxStatus, setIssueTxStatus] = useState(null);

  // Issued receipts list state
  const [merchantReceipts, setMerchantReceipts] = useState([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  // Refund transaction state
  const [refundingId, setRefundingId] = useState(null);
  const [refundTxStatus, setRefundTxStatus] = useState(null);

  // Fetch receipts issued by this merchant from ReceiptIssued event logs
  const loadIssuedReceipts = useCallback(async () => {
    if (!contract || !account) return;
    setLoadingReceipts(true);
    try {
      // Query ReceiptIssued events where merchant is this account
      // Event: ReceiptIssued(uint256 indexed id, address indexed merchant, address indexed buyer, uint256 amount)
      const filter = contract.filters.ReceiptIssued(null, account, null, null);
      const events = await contract.queryFilter(filter, 0, "latest");

      const receiptsList = [];
      // Collect unique receipt IDs
      const seenIds = new Set();
      for (const ev of events) {
        const id = ev.args[0];
        if (!seenIds.has(id.toString())) {
          seenIds.add(id.toString());
          // Fetch current state from contract
          try {
            const receipt = await contract.getReceipt(id);
            receiptsList.push({
              id: receipt.id.toString(),
              merchant: receipt.merchant,
              buyer: receipt.buyer,
              amount: receipt.amount,
              issuedAt: receipt.issuedAt,
              itemsHash: receipt.itemsHash,
              itemDetails: receipt.itemDetails,
              refunded: receipt.refunded,
            });
          } catch (err) {
            console.warn(`Could not fetch details for receipt #${id}:`, err);
          }
        }
      }

      // Sort newest first
      receiptsList.sort((a, b) => Number(b.id) - Number(a.id));
      setMerchantReceipts(receiptsList);
    } catch (err) {
      console.error("Error loading issued receipts:", err);
    } finally {
      setLoadingReceipts(false);
    }
  }, [contract, account]);

  useEffect(() => {
    if (account && contract) {
      loadIssuedReceipts();
    }
  }, [account, contract, isMerchant, loadIssuedReceipts]);

  // Handle Merchant Registration
  const handleRegister = async () => {
    if (!contract) return;
    setRegistering(true);
    setRegTxStatus({ type: "pending", msg: "Registration transaction submitted. Waiting for confirmation..." });

    try {
      const tx = await contract.registerMerchant();
      setRegTxStatus({
        type: "pending",
        msg: `Transaction broadcasted! Waiting for block inclusion... (Tx: ${shortenAddress(tx.hash)})`,
        hash: tx.hash,
      });

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setRegTxStatus({
          type: "success",
          msg: "Congratulations! You are now registered as an authorized merchant.",
          hash: tx.hash,
        });
        setIsMerchant(true);
        if (onRefreshRole) onRefreshRole();
      } else {
        setRegTxStatus({ type: "error", msg: "Transaction reverted on chain." });
      }
    } catch (err) {
      console.error("Registration error:", err);
      const msg = err.reason || err.data?.message || err.message || "Registration failed";
      setRegTxStatus({ type: "error", msg });
    } finally {
      setRegistering(false);
    }
  };

  // Handle Issue Receipt
  const handleIssueReceipt = async (e) => {
    e.preventDefault();
    if (!contract) return;

    if (!ethers.isAddress(buyerAddress.trim())) {
      setIssueTxStatus({ type: "error", msg: "Please enter a valid Ethereum address for the buyer." });
      return;
    }

    if (!amountEth || isNaN(amountEth) || parseFloat(amountEth) <= 0) {
      setIssueTxStatus({ type: "error", msg: "Amount must be a valid positive number in ETH." });
      return;
    }

    if (!itemDetails.trim()) {
      setIssueTxStatus({ type: "error", msg: "Item details description cannot be empty." });
      return;
    }

    setIssuing(true);
    setIssueTxStatus({ type: "pending", msg: "Signing and submitting receipt issuance to blockchain..." });

    try {
      const amountWei = ethers.parseEther(amountEth.trim());
      const tx = await contract.issueReceipt(buyerAddress.trim(), amountWei, itemDetails.trim());

      setIssueTxStatus({
        type: "pending",
        msg: `Transaction pending on-chain... (Hash: ${shortenAddress(tx.hash)})`,
        hash: tx.hash,
      });

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setIssueTxStatus({
          type: "success",
          msg: "Digital receipt minted and stored on blockchain successfully!",
          hash: tx.hash,
        });
        // Clear form
        setBuyerAddress("");
        setAmountEth("");
        setItemDetails("");
        // Reload list
        loadIssuedReceipts();
      } else {
        setIssueTxStatus({ type: "error", msg: "Issuance failed (transaction reverted)." });
      }
    } catch (err) {
      console.error("Issue receipt error:", err);
      const msg = err.reason || err.data?.message || err.message || "Failed to issue receipt";
      setIssueTxStatus({ type: "error", msg });
    } finally {
      setIssuing(false);
    }
  };

  // Handle Mark Refunded
  const handleMarkRefunded = async (receiptId) => {
    if (!contract) return;
    const confirmRefund = window.confirm(
      `Are you sure you want to mark Receipt #${receiptId} as REFUNDED on the blockchain? This action is permanent and cannot be undone.`
    );
    if (!confirmRefund) return;

    setRefundingId(receiptId);
    setRefundTxStatus({
      type: "pending",
      msg: `Submitting refund for Receipt #${receiptId}...`,
    });

    try {
      const tx = await contract.markRefunded(receiptId);
      setRefundTxStatus({
        type: "pending",
        msg: `Refund transaction pending... (Hash: ${shortenAddress(tx.hash)})`,
        hash: tx.hash,
      });

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setRefundTxStatus({
          type: "success",
          msg: `Receipt #${receiptId} successfully marked as REFUNDED on-chain.`,
          hash: tx.hash,
        });
        loadIssuedReceipts();
      } else {
        setRefundTxStatus({
          type: "error",
          msg: "Transaction reverted while processing refund.",
        });
      }
    } catch (err) {
      console.error("Refund error:", err);
      const msg = err.reason || err.data?.message || err.message || "Failed to mark refunded";
      setRefundTxStatus({ type: "error", msg });
    } finally {
      setRefundingId(null);
    }
  };

  if (!account) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🦊</div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "0.5rem" }}>
          MetaMask Wallet Disconnected
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Please connect your MetaMask wallet using the button in the navigation bar to access the Merchant Portal.
        </p>
      </div>
    );
  }

  return (
    <div className="merchant-page">
      {/* Merchant Registration Section */}
      {!isMerchant ? (
        <div className="card" style={{ borderLeft: "5px solid var(--warning)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 className="card-title">Register as Merchant</h2>
              <p className="card-subtitle" style={{ marginBottom: "0.5rem" }}>
                Your connected account (<code>{shortenAddress(account)}</code>) is not yet registered as a merchant.
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Registration is a one-time blockchain transaction that authorizes you to issue tamper-proof receipts to customers.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleRegister}
              disabled={registering}
            >
              {registering ? (
                <>
                  <span className="spinner"></span> Registering on-chain...
                </>
              ) : (
                <>✍️ Register as Merchant</>
              )}
            </button>
          </div>

          {regTxStatus && (
            <div
              className={`alert alert-${regTxStatus.type === "success" ? "success" : regTxStatus.type === "pending" ? "info" : "danger"}`}
              style={{ marginTop: "1rem", marginBottom: 0 }}
            >
              <div>
                <strong>{regTxStatus.type.toUpperCase()}: </strong>
                {regTxStatus.msg}
                {regTxStatus.hash && (
                  <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", marginTop: "0.25rem" }}>
                    Tx Hash: {regTxStatus.hash}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ borderLeft: "5px solid var(--success)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <span className="badge badge-valid" style={{ marginBottom: "0.4rem" }}>
                ✓ Registered Merchant
              </span>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "700", marginTop: "0.2rem" }}>
                Merchant Management Portal
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Connected Account: <code className="mono">{account}</code>
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={loadIssuedReceipts}
              disabled={loadingReceipts}
            >
              {loadingReceipts ? "Refreshing..." : "🔄 Refresh Data"}
            </button>
          </div>
        </div>
      )}

      {/* Issue Receipt Form (Available only if merchant) */}
      {isMerchant && (
        <div className="card">
          <h2 className="card-title">Issue Digital Receipt</h2>
          <p className="card-subtitle">
            Generate an immutable, cryptographically verifiable receipt for a customer purchase.
          </p>

          <form onSubmit={handleIssueReceipt}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Buyer Ethereum Address *</label>
                <input
                  type="text"
                  className="form-input mono"
                  placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  required
                />
                <div className="form-hint">
                  The recipient customer address who will own and see this receipt.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Total Amount (in ETH) *</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.000001"
                  className="form-input"
                  placeholder="0.25"
                  value={amountEth}
                  onChange={(e) => setAmountEth(e.target.value)}
                  required
                />
                <div className="form-hint">
                  Purchase cost in ETH (will be recorded on-chain in Wei).
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Item Details & Line Items *</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="1x Apple MacBook Air M2 13-inch, Serial #C02G1234MD6R&#10;1x USB-C Multiport Adapter"
                value={itemDetails}
                onChange={(e) => setItemDetails(e.target.value)}
                required
              ></textarea>
              <div className="form-hint">
                The exact text will be stored on-chain and hashed with keccak256 for tamper-proof verification.
              </div>
            </div>

            {/* Form transaction status feedback */}
            {issueTxStatus && (
              <div
                className={`alert alert-${issueTxStatus.type === "success" ? "success" : issueTxStatus.type === "pending" ? "info" : "danger"}`}
              >
                <div>
                  <strong>{issueTxStatus.type.toUpperCase()}: </strong>
                  {issueTxStatus.msg}
                  {issueTxStatus.hash && (
                    <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", marginTop: "0.25rem" }}>
                      Tx Hash: {issueTxStatus.hash}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={issuing}
              style={{ width: "100%", padding: "0.75rem" }}
            >
              {issuing ? (
                <>
                  <span className="spinner"></span> Minting Receipt on Blockchain...
                </>
              ) : (
                <>🧾 Issue and Mint Digital Receipt</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Global refund status notification if any */}
      {refundTxStatus && (
        <div
          className={`alert alert-${refundTxStatus.type === "success" ? "success" : refundTxStatus.type === "pending" ? "info" : "danger"}`}
        >
          <div>
            <strong>REFUND {refundTxStatus.type.toUpperCase()}: </strong>
            {refundTxStatus.msg}
            {refundTxStatus.hash && (
              <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", marginTop: "0.25rem" }}>
                Tx Hash: {refundTxStatus.hash}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issued Receipts Table */}
      {isMerchant && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h2 className="card-title" style={{ marginBottom: "0.2rem" }}>
                Receipts Issued by You
              </h2>
              <p className="card-subtitle" style={{ marginBottom: 0 }}>
                Discovered via <code>ReceiptIssued</code> event logs emitted by your merchant address.
              </p>
            </div>
            <span className="badge badge-network">
              Total Issued: {merchantReceipts.length}
            </span>
          </div>

          {loadingReceipts ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
              <span className="spinner" style={{ borderColor: "var(--primary) transparent transparent transparent" }}></span>
              <p style={{ marginTop: "0.5rem" }}>Reading ReceiptIssued event logs from blockchain...</p>
            </div>
          ) : merchantReceipts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem", background: "#f8fafc", borderRadius: "8px", border: "1px dashed var(--border)" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                No receipts issued yet. Use the form above to issue your first blockchain receipt!
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Buyer Address</th>
                    <th>Amount</th>
                    <th>Issued Date</th>
                    <th>Item Details</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {merchantReceipts.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: "700" }}>#{r.id}</td>
                      <td>
                        <span className="mono" title={r.buyer}>
                          {shortenAddress(r.buyer)}
                        </span>
                      </td>
                      <td style={{ fontWeight: "600", color: "#0f172a" }}>
                        {formatEth(r.amount)}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {formatDate(r.issuedAt)}
                      </td>
                      <td style={{ maxWidth: "250px", whiteSpace: "normal" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: "500" }}>{r.itemDetails}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          Hash: {truncateHash(r.itemsHash)}
                        </div>
                      </td>
                      <td>
                        {r.refunded ? (
                          <span className="badge badge-refunded">Refunded</span>
                        ) : (
                          <span className="badge badge-valid">Valid</span>
                        )}
                      </td>
                      <td>
                        {r.refunded ? (
                          <button className="btn btn-secondary btn-sm" disabled>
                            Refunded
                          </button>
                        ) : (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleMarkRefunded(r.id)}
                            disabled={refundingId === r.id}
                          >
                            {refundingId === r.id ? (
                              <>
                                <span className="spinner"></span> Processing...
                              </>
                            ) : (
                              "Mark Refunded"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
