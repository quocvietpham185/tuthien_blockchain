import React from "react";
import { formatEth, formatDateTime, formatAddress, copyToClipboard } from "../../utils/format";
import { TX_TYPE_LABELS } from "../../constants";
import toast from "react-hot-toast";
import "./TransactionHistory.css";

export default function TransactionHistory({ transactions, loading, title = "Lịch Sử Giao Dịch" }) {
  if (loading) {
    return (
      <div className="tx-history">
        <h3 className="tx-title">{title}</h3>
        <div className="loading-screen">
          <div className="spinner spinner-lg" />
          <span>Đang tải dữ liệu từ blockchain...</span>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="tx-history">
        <h3 className="tx-title">{title}</h3>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-title">Chưa có giao dịch</p>
          <p className="empty-state-desc">Các giao dịch on-chain sẽ xuất hiện ở đây</p>
        </div>
      </div>
    );
  }

  const handleCopyAddress = async (addr) => {
    const ok = await copyToClipboard(addr);
    if (ok) toast.success("Đã sao chép địa chỉ!");
  };

  return (
    <div className="tx-history">
      <div className="tx-header">
        <h3 className="tx-title">{title}</h3>
        <span className="tx-count">{transactions.length} giao dịch</span>
      </div>

      <div className="tx-list">
        {transactions.map((tx, idx) => {
          const typeInfo = TX_TYPE_LABELS[tx.txType] || TX_TYPE_LABELS.DONATE;
          const amountPrefix = tx.txType === "DONATE" ? "+" : tx.txType === "REFUND" ? "-" : "";
          return (
            <div key={idx} className="tx-item">
              {/* Type Icon */}
              <div className="tx-type-icon" style={{ background: `${typeInfo.color}20`, border: `1px solid ${typeInfo.color}40` }}>
                <span>{typeInfo.icon}</span>
              </div>

              {/* Info */}
              <div className="tx-info">
                <div className="tx-top-row">
                  <span className="tx-type-label" style={{ color: typeInfo.color }}>
                    {typeInfo.label}
                  </span>
                  <span className="tx-campaign">
                    #{tx.campaignId} — {tx.campaignTitle?.substring(0, 30) || "Unknown"}
                  </span>
                </div>
                <div className="tx-actor">
                  <span className="tx-actor-label">
                    {tx.txType === "DONATE" ? "Từ:" : "Bởi:"}
                  </span>
                  <button
                    className="address"
                    onClick={() => handleCopyAddress(tx.actor)}
                    title="Nhấn để sao chép"
                  >
                    {formatAddress(tx.actor)}
                  </button>
                </div>
                <div className="tx-time">{formatDateTime(tx.timestamp)}</div>
              </div>

              {/* Amount */}
              <div className="tx-amount-col">
                {parseFloat(tx.amount) > 0 && (
                  <div className="tx-amount" style={{ color: typeInfo.color }}>
                    {amountPrefix}{formatEth(tx.amount)} ETH
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
