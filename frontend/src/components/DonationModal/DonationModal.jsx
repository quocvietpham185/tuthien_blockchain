import React, { useState } from "react";
import { formatEth, formatAddress } from "../../utils/format";
import { getIPFSUrl } from "../../utils/ipfs";
import "./DonationModal.css";

export default function DonationModal({ campaign, account, onDonate, onClose }) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const PRESET_AMOUNTS = ["0.01", "0.05", "0.1", "0.5", "1"];

  const handleDonate = async () => {
    setError("");
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError("Vui lòng nhập số ETH hợp lệ");
      return;
    }
    if (val < 0.001) {
      setError("Số tiền tối thiểu là 0.001 ETH");
      return;
    }

    setIsLoading(true);
    const result = await onDonate(campaign.id, amount, message);
    setIsLoading(false);
    if (result?.success) {
      onClose();
    }
  };

  const remaining = parseFloat(campaign.goal) - parseFloat(campaign.raised);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal donation-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">💰 Quyên Góp</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Campaign Info */}
        <div className="donation-campaign-info">
          <div className="donation-campaign-image">
            {getIPFSUrl(campaign.ipfsHash) ? (
              <img src={getIPFSUrl(campaign.ipfsHash)} alt={campaign.title} />
            ) : (
              <div className="donation-image-placeholder">🎯</div>
            )}
          </div>
          <div>
            <h3 className="donation-campaign-title">{campaign.title}</h3>
            <div className="donation-campaign-stats">
              <span>Đã quyên: <strong>{formatEth(campaign.raised)} ETH</strong></span>
              <span>Còn cần: <strong>{formatEth(remaining.toFixed(4))} ETH</strong></span>
            </div>
            <div className="progress-bar" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${campaign.progress}%` }} />
            </div>
          </div>
        </div>

        <div className="modal-divider" />

        {/* Amount */}
        <div className="form-group">
          <label className="form-label">Số tiền quyên góp (ETH)</label>
          <div className="preset-amounts">
            {PRESET_AMOUNTS.map((p) => (
              <button
                key={p}
                className={`preset-btn ${amount === p ? "active" : ""}`}
                onClick={() => setAmount(p)}
              >
                {p} ETH
              </button>
            ))}
          </div>
          <div className="amount-input-wrapper">
            <span className="amount-icon">⬡</span>
            <input
              type="number"
              className="form-input amount-input"
              placeholder="0.0"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              min="0.001"
              step="0.001"
            />
            <span className="amount-unit">ETH</span>
          </div>
          {error && <p className="form-error">⚠️ {error}</p>}
        </div>

        {/* Message */}
        <div className="form-group">
          <label className="form-label">Lời nhắn (tùy chọn)</label>
          <textarea
            className="form-textarea"
            placeholder="Để lại lời nhắn cho chiến dịch..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            maxLength={200}
          />
          <span className="form-hint">{message.length}/200 ký tự</span>
        </div>

        {/* Info Box */}
        <div className="alert alert-info donation-info">
          <span>ℹ️</span>
          <div>
            <strong>Giao dịch on-chain</strong>
            <br />
            Khoản quyên góp sẽ được ghi vĩnh viễn trên blockchain. Từ địa chỉ:{" "}
            <span className="address">{formatAddress(account)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="donation-actions">
          <button className="btn btn-outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleDonate}
            disabled={isLoading || !amount}
            style={{ flex: 1 }}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Đang xử lý...
              </>
            ) : (
              <>💰 Xác Nhận Quyên Góp {amount ? `${amount} ETH` : ""}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
