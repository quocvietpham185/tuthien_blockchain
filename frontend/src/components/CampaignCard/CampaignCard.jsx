import React from "react";
import { useNavigate } from "react-router-dom";
import {
  formatEth,
  formatDate,
  getTimeRemaining,
  getCampaignStatus,
  getCategoryClass,
  truncate,
  formatAddress,
} from "../../utils/format";
import { getIPFSUrl } from "../../utils/ipfs";
import "./CampaignCard.css";

export default function CampaignCard({ campaign, onDonate }) {
  const navigate = useNavigate();
  const status = getCampaignStatus(campaign);
  const timeLeft = getTimeRemaining(campaign.deadline);
  const categoryClass = getCategoryClass(campaign.category);
  const imageUrl = getIPFSUrl(campaign.ipfsHash);

  // Category emoji mapping
  const categoryEmoji = {
    "Giáo dục": "🎓",
    "Y tế": "❤️",
    "Thiên tai": "🌊",
    "Môi trường": "🌿",
    "Trẻ em": "👶",
    "Người cao tuổi": "👴",
    Khác: "✨",
  };

  const handleDonate = (e) => {
    e.stopPropagation();
    onDonate && onDonate(campaign);
  };

  return (
    <div className="campaign-card" onClick={() => navigate(`/campaign/${campaign.id}`)}>
      {/* Image */}
      <div className="campaign-image">
        {imageUrl ? (
          <img src={imageUrl} alt={campaign.title} loading="lazy" />
        ) : (
          <div className="campaign-image-placeholder">
            <span>{categoryEmoji[campaign.category] || "🎯"}</span>
          </div>
        )}
        <div className="campaign-overlay">
          <span className={`badge badge-${categoryClass}`}>
            {categoryEmoji[campaign.category] || "✨"} {campaign.category}
          </span>
          <span className={`badge badge-${status.color}`}>{status.label}</span>
        </div>
      </div>

      {/* Content */}
      <div className="campaign-content">
        <h3 className="campaign-title">{campaign.title}</h3>
        <p className="campaign-desc">{truncate(campaign.description)}</p>

        {/* Progress */}
        <div className="campaign-progress">
          <div className="progress-info">
            <span className="raised-amount">
              ⬡ {formatEth(campaign.raised)} ETH
            </span>
            <span className="goal-amount">/ {formatEth(campaign.goal)} ETH</span>
          </div>
          <div className={`progress-bar ${campaign.progress >= 100 ? "progress-100" : ""}`}>
            <div
              className="progress-fill"
              style={{ width: `${Math.min(campaign.progress, 100)}%` }}
            />
          </div>
          <div className="progress-pct">{campaign.progress}%</div>
        </div>

        {/* Stats */}
        <div className="campaign-stats">
          <div className="stat-item">
            <span className="stat-ico">👥</span>
            <span className="stat-val">{campaign.donorCount}</span>
            <span className="stat-lbl">người ủng hộ</span>
          </div>
          <div className="stat-item">
            <span className="stat-ico">⏰</span>
            <span className={`stat-val ${timeLeft.expired ? "text-red" : ""}`}>
              {timeLeft.text}
            </span>
          </div>
        </div>

        {/* Owner */}
        <div className="campaign-owner">
          <span className="owner-label">Người tạo:</span>
          <span className="address">{formatAddress(campaign.owner)}</span>
        </div>

        {/* Actions */}
        <div className="campaign-actions">
          <button
            className="btn btn-primary btn-full"
            onClick={handleDonate}
            disabled={!campaign.active || timeLeft.expired}
          >
            {campaign.active && !timeLeft.expired ? "💰 Quyên Góp" : "🔒 Đã đóng"}
          </button>
        </div>
      </div>
    </div>
  );
}
