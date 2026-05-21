import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DonationModal from "../components/DonationModal/DonationModal";
import TransactionHistory from "../components/TransactionHistory/TransactionHistory";
import {
  formatEth, formatDate, formatDateTime, formatAddress,
  getTimeRemaining, getCampaignStatus, getCategoryClass,
  copyToClipboard
} from "../utils/format";
import { getCampaignImageUrl, getDefaultCampaignImage } from "../utils/ipfs";
import toast from "react-hot-toast";

export default function CampaignDetail({ contractHooks, account }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => { loadCampaign(); }, [id]);

  const loadCampaign = async () => {
    setLoading(true);
    try {
      const [c, d] = await Promise.all([
        contractHooks.getCampaign(id),
        contractHooks.getCampaignDonations(id),
      ]);
      setCampaign(c);
      // Convert donations to transaction format for TransactionHistory
      const txFormat = d.map((don) => ({
        txType: "DONATE",
        campaignId: id,
        actor: don.donor,
        amount: don.amount,
        timestamp: don.timestamp,
        campaignTitle: c.title,
        message: don.message,
      }));
      setDonations(txFormat);
    } catch (err) {
      toast.error("Không tìm thấy chiến dịch: " + err.message);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (campaignId, amount, message) => {
    const result = await contractHooks.donate(campaignId, amount, message);
    if (result.success) await loadCampaign();
    return result;
  };

  const handleWithdraw = async () => {
    if (!window.confirm("Bạn có chắc muốn rút toàn bộ tiền đã quyên góp?")) return;
    setWithdrawing(true);
    const result = await contractHooks.withdrawFunds(id);
    setWithdrawing(false);
    if (result.success) await loadCampaign();
  };

  if (loading) return (
    <div className="page-content">
      <div className="loading-screen" style={{ minHeight: "80vh" }}>
        <div className="spinner spinner-lg" />
        <span>Đang tải dữ liệu từ blockchain...</span>
      </div>
    </div>
  );

  if (!campaign) return null;

  const status = getCampaignStatus(campaign);
  const timeLeft = getTimeRemaining(campaign.deadline);
  const isOwner = account?.toLowerCase() === campaign.owner.toLowerCase();
  const imageUrl = getCampaignImageUrl(campaign);

  // Format donations for display with messages
  const donationsWithMessages = donations.map((d) => ({
    ...d,
    extraInfo: d.message,
  }));

  return (
    <div className="page-content">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* Back button */}
        <button className="btn btn-outline" style={{ marginBottom: 24 }} onClick={() => navigate("/")}>
          ← Quay lại
        </button>

        <div className="detail-layout">
          {/* Left: Main Info */}
          <div className="detail-main">
            {/* Image */}
            <div className="detail-image">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={campaign.title}
                  onError={(event) => {
                    event.currentTarget.src = getDefaultCampaignImage(campaign.category);
                  }}
                />
              ) : (
                <div className="detail-image-placeholder">
                  {{ "Giáo dục": "🎓", "Y tế": "❤️", "Thiên tai": "🌊", "Môi trường": "🌿" }[campaign.category] || "🎯"}
                </div>
              )}
              <div className="detail-image-overlay">
                <span className={`badge badge-${getCategoryClass(campaign.category)}`}>
                  {campaign.category}
                </span>
                <span className={`badge badge-${status.color}`}>{status.label}</span>
              </div>
            </div>

            {/* Title + Description */}
            <div className="card" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              <h1 className="detail-title">{campaign.title}</h1>
              <div className="detail-meta">
                <span>📅 Tạo ngày: {formatDate(campaign.createdAt)}</span>
                <span>⏰ Hết hạn: {formatDate(campaign.deadline)}</span>
                <button
                  className="address"
                  onClick={() => { copyToClipboard(campaign.owner); toast.success("Đã sao chép địa chỉ!"); }}
                  title={campaign.owner}
                >
                  👤 {formatAddress(campaign.owner)}
                </button>
              </div>

              {/* Tabs */}
              <div className="detail-tabs">
                {["info", "donations", "blockchain"].map((tab) => (
                  <button
                    key={tab}
                    className={`detail-tab ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {{ info: "📄 Thông tin", donations: `💰 Quyên góp (${donations.length})`, blockchain: "⛓️ Blockchain" }[tab]}
                  </button>
                ))}
              </div>

              {activeTab === "info" && (
                <div className="detail-description">
                  <p>{campaign.description}</p>
                </div>
              )}

              {activeTab === "donations" && (
                <div style={{ marginTop: 16 }}>
                  {donations.length === 0 ? (
                    <div className="empty-state" style={{ padding: "40px 0" }}>
                      <div className="empty-state-icon">💝</div>
                      <p className="empty-state-title">Chưa có ai quyên góp</p>
                      <p className="empty-state-desc">Hãy là người đầu tiên!</p>
                    </div>
                  ) : (
                    <div className="donations-list">
                      {donations.map((d, i) => (
                        <div key={i} className="donation-entry">
                          <div className="donation-entry-left">
                            <div className="donation-avatar">💝</div>
                            <div>
                              <button
                                className="address"
                                onClick={() => { copyToClipboard(d.actor); toast.success("Đã sao chép!"); }}
                              >
                                {formatAddress(d.actor)}
                              </button>
                              {d.message && <p className="donation-message">"{d.message}"</p>}
                              <p className="donation-time">{formatDateTime(d.timestamp)}</p>
                            </div>
                          </div>
                          <div className="donation-amount">+{formatEth(d.amount)} ETH</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "blockchain" && (
                <div className="blockchain-info">
                  <div className="blockchain-row">
                    <span className="blockchain-label">Contract Address</span>
                    <button className="address" onClick={() => { copyToClipboard(contractHooks.getContractAddress()); toast.success("Đã sao chép!"); }}>
                      {formatAddress(contractHooks.getContractAddress())}
                    </button>
                  </div>
                  <div className="blockchain-row">
                    <span className="blockchain-label">Campaign ID</span>
                    <span className="blockchain-value">#{campaign.id}</span>
                  </div>
                  <div className="blockchain-row">
                    <span className="blockchain-label">Owner</span>
                    <button className="address" onClick={() => { copyToClipboard(campaign.owner); toast.success("Đã sao chép!"); }}>
                      {campaign.owner}
                    </button>
                  </div>
                  <div className="blockchain-row">
                    <span className="blockchain-label">IPFS Hash</span>
                    <span className="blockchain-value mono">{campaign.ipfsHash || "N/A"}</span>
                  </div>
                  <div className="blockchain-row">
                    <span className="blockchain-label">Network</span>
                    <span className="blockchain-value">Hardhat Local (Chain ID: 31337)</span>
                  </div>
                  <div className="blockchain-row">
                    <span className="blockchain-label">Goal (Wei)</span>
                    <span className="blockchain-value mono">{campaign.goalWei}</span>
                  </div>
                  <div className="blockchain-row">
                    <span className="blockchain-label">Raised (Wei)</span>
                    <span className="blockchain-value mono">{campaign.raisedWei}</span>
                  </div>
                  <div className="blockchain-row">
                    <span className="blockchain-label">Status</span>
                    <span className={`badge badge-${status.color}`}>{status.label}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="detail-sidebar">
            <div className="card">
              {/* Progress */}
              <div className="sidebar-progress">
                <div className="sidebar-raised">
                  <span className="raised-big">{formatEth(campaign.raised)}</span>
                  <span className="raised-unit">ETH</span>
                </div>
                <p className="sidebar-goal">mục tiêu {formatEth(campaign.goal)} ETH</p>
                <div className="progress-bar" style={{ height: 12, marginTop: 12 }}>
                  <div className="progress-fill" style={{ width: `${campaign.progress}%` }} />
                </div>
                <div className="sidebar-progress-info">
                  <span className="sidebar-pct">{campaign.progress}%</span>
                  <span className="sidebar-donors">👥 {campaign.donorCount} người ủng hộ</span>
                </div>
              </div>

              <hr className="divider" />

              {/* Time & Status */}
              <div className="sidebar-stats">
                <div className="sidebar-stat">
                  <span className="sidebar-stat-label">⏰ Thời gian còn lại</span>
                  <span className={`sidebar-stat-value ${timeLeft.expired ? "text-danger" : ""}`}>
                    {timeLeft.text}
                  </span>
                </div>
                <div className="sidebar-stat">
                  <span className="sidebar-stat-label">📅 Hạn chót</span>
                  <span className="sidebar-stat-value">{formatDate(campaign.deadline)}</span>
                </div>
                <div className="sidebar-stat">
                  <span className="sidebar-stat-label">📊 Trạng thái</span>
                  <span className={`badge badge-${status.color}`}>{status.label}</span>
                </div>
              </div>

              <hr className="divider" />

              {/* Donate Button */}
              {campaign.active && !timeLeft.expired && (
                <>
                  {account ? (
                    <button
                      className="btn btn-primary btn-full btn-lg"
                      onClick={() => setShowDonateModal(true)}
                    >
                      💰 Quyên Góp Ngay
                    </button>
                  ) : (
                    <div className="alert alert-warning">
                      <span>⚠️</span>
                      <span>Kết nối ví MetaMask để quyên góp</span>
                    </div>
                  )}
                </>
              )}

              {/* Withdraw (owner only) */}
              {isOwner && parseFloat(campaign.raised) > 0 && !campaign.withdrawn && (
                <>
                  <hr className="divider" />
                  <div className="alert alert-info" style={{ marginBottom: 12 }}>
                    <span>💡</span>
                    <span>Bạn là chủ chiến dịch. Có thể rút {formatEth(campaign.raised)} ETH.</span>
                  </div>
                  <button
                    className="btn btn-success btn-full"
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                  >
                    {withdrawing ? <><span className="spinner" /> Đang rút...</> : "🏦 Rút Tiền"}
                  </button>
                </>
              )}

              {campaign.withdrawn && (
                <div className="alert alert-success">
                  <span>✅</span>
                  <span>Tiền đã được rút thành công</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDonateModal && (
        <DonationModal
          campaign={campaign}
          account={account}
          onDonate={handleDonate}
          onClose={() => setShowDonateModal(false)}
        />
      )}
    </div>
  );
}
