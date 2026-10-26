import React, { useState, useEffect, useCallback, useMemo } from "react";
import { shortenAddress, formatEth, formatDate, truncateHash } from "../utils/formatters";

export default function Customer({ account, contract, setActiveTab }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc"); // 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'valid' | 'refunded'
  const [copiedId, setCopiedId] = useState(null);

  // Fetch purchase history from contract.getPurchaseHistory()
  const fetchPurchaseHistory = useCallback(async () => {
    if (!contract || !account) return;
    setLoading(true);
    setError(null);

    try {
      const rawReceipts = await contract.getPurchaseHistory();
      const parsedReceipts = rawReceipts.map((r) => ({
        id: r.id.toString(),
        merchant: r.merchant,
        buyer: r.buyer,
        amount: r.amount,
        issuedAt: Number(r.issuedAt),
        itemsHash: r.itemsHash,
        itemDetails: r.itemDetails,
        refunded: r.refunded,
      }));

      setReceipts(parsedReceipts);
    } catch (err) {
      console.error("Failed to fetch purchase history:", err);
      setError("Unable to retrieve purchase history from the smart contract. " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    if (account && contract) {
      fetchPurchaseHistory();
    }
  }, [account, contract, fetchPurchaseHistory]);

  // Copy verification details handler
  const handleCopyVerification = (receipt) => {
    const textToCopy = `Receipt ID: ${receipt.id}\nItems Hash: ${receipt.itemsHash}\nItems Details: ${receipt.itemDetails}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(receipt.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Filtered and Sorted receipts
  const filteredReceipts = useMemo(() => {
    let result = [...receipts];

    // Status filter
    if (statusFilter === "valid") {
      result = result.filter((r) => !r.refunded);
    } else if (statusFilter === "refunded") {
      result = result.filter((r) => r.refunded);
    }

    // Search query filter (search by ID, item details, or merchant)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.id.includes(q) ||
          r.itemDetails.toLowerCase().includes(q) ||
          r.merchant.toLowerCase().includes(q) ||
          r.itemsHash.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "date_desc") return b.issuedAt - a.issuedAt;
      if (sortBy === "date_asc") return a.issuedAt - b.issuedAt;
      if (sortBy === "amount_desc") return Number(b.amount - a.amount);
      if (sortBy === "amount_asc") return Number(a.amount - b.amount);
      return 0;
    });

    return result;
  }, [receipts, statusFilter, searchQuery, sortBy]);

  if (!account) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🦊</div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "0.5rem" }}>
          MetaMask Wallet Disconnected
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Please connect your MetaMask wallet to view your on-chain digital receipts and purchase history.
        </p>
      </div>
    );
  }

  return (
    <div className="customer-page">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="card-title">My Purchase History</h1>
            <p className="card-subtitle" style={{ marginBottom: 0 }}>
              Immutable digital receipts owned by your connected wallet: <code className="mono">{shortenAddress(account)}</code>
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchPurchaseHistory}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "🔄 Refresh History"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <strong>Error: </strong> {error}
        </div>
      )}

      {/* Search and Sort Toolbar */}
      <div className="card">
        <div className="grid-3" style={{ alignItems: "center" }}>
          <div>
            <label className="form-label">Search Receipts</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by ID, item name, or merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Sort by</label>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">📅 Date: Newest First</option>
              <option value="date_asc">📅 Date: Oldest First</option>
              <option value="amount_desc">💰 Amount: Highest First</option>
              <option value="amount_asc">💰 Amount: Lowest First</option>
            </select>
          </div>

          <div>
            <label className="form-label">Status Filter</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Receipts ({receipts.length})</option>
              <option value="valid">Valid Only ({receipts.filter((r) => !r.refunded).length})</option>
              <option value="refunded">Refunded Only ({receipts.filter((r) => r.refunded).length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Receipts List */}
      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <span className="spinner" style={{ width: "2rem", height: "2rem", borderColor: "var(--primary) transparent transparent transparent" }}></span>
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
            Loading your purchase history from Ethereum...
          </p>
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛍️</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            No Receipts Found
          </h3>
          <p style={{ color: "var(--text-muted)", maxWidth: "500px", margin: "0 auto 1.5rem auto" }}>
            {receipts.length === 0
              ? "You do not have any purchases recorded on this smart contract yet. When a registered merchant issues a receipt to your address, it will automatically appear here."
              : "No receipts matched your current filter criteria."}
          </p>
          {receipts.length === 0 && (
            <button className="btn btn-secondary" onClick={() => setActiveTab("merchant")}>
              Go to Merchant Portal to issue test receipts
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className="card"
              style={{
                marginBottom: 0,
                borderLeft: receipt.refunded
                  ? "5px solid var(--danger)"
                  : "5px solid var(--success)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
                      Receipt #{receipt.id}
                    </span>
                    {receipt.refunded ? (
                      <span className="badge badge-refunded">Refunded</span>
                    ) : (
                      <span className="badge badge-valid">Valid</span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Issued on: <strong>{formatDate(receipt.issuedAt)}</strong>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f172a" }}>
                    {formatEth(receipt.amount)}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Merchant: <code className="mono">{shortenAddress(receipt.merchant)}</code>
                  </div>
                </div>
              </div>

              {/* Items Description Card */}
              <div
                style={{
                  background: "#f8fafc",
                  padding: "0.85rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  marginTop: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "700", color: "var(--secondary)", marginBottom: "0.25rem" }}>
                  Item Description
                </div>
                <div style={{ fontSize: "0.95rem", color: "#1e293b", whiteSpace: "pre-wrap" }}>
                  {receipt.itemDetails}
                </div>
              </div>

              {/* Verification Details & Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span>Items Hash (keccak256): </span>
                  <code className="mono" style={{ color: "#334155" }}>
                    {receipt.itemsHash}
                  </code>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopyVerification(receipt)}
                >
                  {copiedId === receipt.id ? "✓ Copied Details!" : "📋 Copy Verification Details"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
