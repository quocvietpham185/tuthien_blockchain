import React, { useState, useEffect } from "react";
import TransactionHistory from "../components/TransactionHistory/TransactionHistory";
import { formatAddress, copyToClipboard } from "../utils/format";
import toast from "react-hot-toast";

export default function Transactions({ contractHooks }) {
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transactions");
  const [contractAddress, setContractAddress] = useState("");

  useEffect(() => {
    loadData();
    setContractAddress(contractHooks.getContractAddress() || "");
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const txs = await contractHooks.getAllTransactions();
      setTransactions([...txs].reverse()); // newest first
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Summary by type
  const summary = transactions.reduce(
    (acc, tx) => {
      if (tx.txType === "DONATE") acc.donations++;
      if (tx.txType === "CREATE") acc.creates++;
      if (tx.txType === "WITHDRAW") acc.withdrawals++;
      if (tx.txType === "DONATE") acc.totalEth += parseFloat(tx.amount) || 0;
      return acc;
    },
    { donations: 0, creates: 0, withdrawals: 0, totalEth: 0 }
  );

  return (
    <div className="page-content">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1 className="section-title" style={{ fontSize: 32, marginBottom: 8 }}>
            📋 Lịch Sử Giao Dịch Blockchain
          </h1>
          <p className="section-subtitle" style={{ fontSize: 15 }}>
            Tất cả giao dịch được ghi vĩnh viễn trên smart contract
          </p>
        </div>

        {/* Contract Info Banner */}
        {contractAddress && (
          <div className="contract-banner">
            <div className="contract-banner-left">
              <span className="contract-chain-dot" />
              <div>
                <div className="contract-banner-label">Smart Contract Address</div>
                <div className="contract-banner-address" title={contractAddress}>
                  {contractAddress}
                </div>
              </div>
            </div>
            <div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { copyToClipboard(contractAddress); toast.success("Đã sao chép address!"); }}
              >
                📋 Sao chép
              </button>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {!loading && (
          <div className="grid-stats" style={{ marginBottom: 32 }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(139, 92, 246, 0.15)" }}>📋</div>
              <div className="stat-value">{transactions.length}</div>
              <div className="stat-label">Tổng giao dịch</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)" }}>💰</div>
              <div className="stat-value">{summary.donations}</div>
              <div className="stat-label">Lần quyên góp</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(59, 130, 246, 0.15)" }}>🚀</div>
              <div className="stat-value">{summary.creates}</div>
              <div className="stat-label">Chiến dịch tạo</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(251, 191, 36, 0.15)" }}>⬡</div>
              <div className="stat-value">{summary.totalEth.toFixed(3)}</div>
              <div className="stat-label">ETH đã lưu thông</div>
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className="card">
          {/* Tabs */}
          <div className="detail-tabs" style={{ marginBottom: 20 }}>
            <button
              className={`detail-tab ${activeTab === "transactions" ? "active" : ""}`}
              onClick={() => setActiveTab("transactions")}
            >
              📋 On-Chain Records ({transactions.length})
            </button>
          </div>

          <TransactionHistory
            transactions={transactions}
            loading={loading}
            title=""
          />

          {!loading && (
            <div style={{ marginTop: 20 }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={loadData}
              >
                🔄 Làm mới
              </button>
            </div>
          )}
        </div>

        {/* Blockchain Info */}
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ color: "#f1f5f9", marginBottom: 20, fontWeight: 700 }}>⛓️ Thông Tin Blockchain</h3>
          <div className="blockchain-info">
            <div className="blockchain-row">
              <span className="blockchain-label">Chuẩn Blockchain</span>
              <span className="blockchain-value">Ethereum (EVM Compatible)</span>
            </div>
            <div className="blockchain-row">
              <span className="blockchain-label">Mạng</span>
              <span className="blockchain-value">Hardhat Local Network</span>
            </div>
            <div className="blockchain-row">
              <span className="blockchain-label">Chain ID</span>
              <span className="blockchain-value mono">31337 (0x7a69)</span>
            </div>
            <div className="blockchain-row">
              <span className="blockchain-label">RPC URL</span>
              <span className="blockchain-value mono">http://127.0.0.1:8545</span>
            </div>
            <div className="blockchain-row">
              <span className="blockchain-label">Smart Contract</span>
              <button className="address" onClick={() => { copyToClipboard(contractAddress); toast.success("Đã sao chép!"); }}>
                {formatAddress(contractAddress)}
              </button>
            </div>
            <div className="blockchain-row">
              <span className="blockchain-label">Web3 Library</span>
              <span className="blockchain-value">ethers.js v6</span>
            </div>
            <div className="blockchain-row">
              <span className="blockchain-label">Wallet</span>
              <span className="blockchain-value">MetaMask</span>
            </div>
            <div className="blockchain-row">
              <span className="blockchain-label">IPFS</span>
              <span className="blockchain-value">Mock IPFS (Local Storage + CID Hash)</span>
            </div>
            <div className="blockchain-row">
              <span className="blockchain-label">Smart Contract Language</span>
              <span className="blockchain-value">Solidity ^0.8.20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
