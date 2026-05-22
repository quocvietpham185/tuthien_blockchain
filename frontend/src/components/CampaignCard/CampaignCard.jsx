import React from "react";
import { useNavigate } from "react-router-dom";
import {
  formatEth,
  getTimeRemaining,
  getCampaignStatus,
  getCategoryClass,
  truncate,
  formatAddress,
} from "../../utils/format";
import { getCampaignImageUrl, getDefaultCampaignImage } from "../../utils/ipfs";
import "./CampaignCard.css";

export default function CampaignCard({ campaign, onDonate }) {
  const navigate = useNavigate();
  const status = getCampaignStatus(campaign);
  const timeLeft = getTimeRemaining(campaign.deadline);
  const categoryClass = getCategoryClass(campaign.category);
  const imageUrl = getCampaignImageUrl(campaign);

  const handleDonate = (event) => {
    event.stopPropagation();
    onDonate && onDonate(campaign);
  };

  return (
    <div className="campaign-card" onClick={() => navigate(`/campaign/${campaign.id}`)}>
      <div className="campaign-image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={campaign.title}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = getDefaultCampaignImage(campaign.category);
            }}
          />
        ) : (
          <div className="campaign-image-placeholder">
            <span>{campaign.category?.slice(0, 1) || "C"}</span>
          </div>
        )}
        <div className="campaign-overlay">
          <span className={`badge badge-${categoryClass}`}>{campaign.category}</span>
          <span className={`badge badge-${status.color}`}>{status.label}</span>
        </div>
      </div>

      <div className="campaign-content">
        <h3 className="campaign-title">{campaign.title}</h3>
        <p className="campaign-desc">{truncate(campaign.description)}</p>

        <div className="campaign-progress">
          <div className="progress-info">
            <span className="raised-amount">{formatEth(campaign.raised)} ETH</span>
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

        <div className="campaign-stats">
          <div className="stat-item">
            <span className="stat-val">{campaign.donorCount}</span>
            <span className="stat-lbl">người ủng hộ</span>
          </div>
          <div className="stat-item">
            <span className={`stat-val ${timeLeft.expired ? "text-red" : ""}`}>
              {timeLeft.text}
            </span>
          </div>
        </div>

        <div className="campaign-owner">
          <span className="owner-label">Người tạo:</span>
          <span className="address">{formatAddress(campaign.owner)}</span>
        </div>

        <div className="campaign-actions">
          <button
            className="btn btn-primary btn-full"
            onClick={handleDonate}
            disabled={!status.canDonate}
          >
            {status.canDonate ? "Quyên Góp" : status.label}
          </button>
        </div>
      </div>
    </div>
  );
}
