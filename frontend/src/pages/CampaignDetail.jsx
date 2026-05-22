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
  const [campaignTransactions, setCampaignTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundableAmount, setRefundableAmount] = useState("0");
  const [platformFee, setPlatformFee] = useState("0");
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => { loadCampaign(); }, [id, account]);

  const loadCampaign = async () => {
    setLoading(true);
    try {
      const [c, d, allTx] = await Promise.all([
        contractHooks.getCampaign(id),
        contractHooks.getCampaignDonations(id),
        contractHooks.getAllTransactions(),
      ]);
      setCampaign(c);
      setPlatformFee(await contractHooks.getPlatformFee());
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
      setCampaignTransactions(allTx.filter((tx) => tx.campaignId === id));
      if (account) {
        const amount = await contractHooks.getRefundableAmount(id, account);
        setRefundableAmount(amount);
      } else {
        setRefundableAmount("0");
      }
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

  const handleRefund = async () => {
    if (!window.confirm("Bạn có chắc muốn nhận hoàn tiền từ chiến dịch thất bại này?")) return;
    setRefunding(true);
    const result = await contractHooks.refundDonation(id);
    setRefunding(false);
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
  const timeLeft = getTimeRemaining(campaign.deadline, campaign.chainNow);
  const isOwner = account?.toLowerCase() === campaign.owner.toLowerCase();
  const imageUrl = getCampaignImageUrl(campaign);
  const goalReached = BigInt(campaign.raisedWei) >= BigInt(campaign.goalWei);
  const hasRefund = parseFloat(refundableAmount) > 0;
  const feeRate = Number(platformFee) / 10000;
  const platformFeeAmount = parseFloat(campaign.raised || 0) * feeRate;
  const ownerReceives = Math.max(0, parseFloat(campaign.raised || 0) - platformFeeAmount);
  const totalRefunded = campaignTransactions
    .filter((tx) => tx.txType === "REFUND")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const totalWithdrawn = campaignTransactions
    .filter((tx) => tx.txType === "WITHDRAW")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const donateTxCount = campaignTransactions.filter((tx) => tx.txType === "DONATE").length;
  const currentWalletDonationAmount = account
    ? donations
        .filter((tx) => tx.actor?.toLowerCase() === account.toLowerCase())
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
    : 0;
  const canRefundCurrentWallet =
    Boolean(account) &&
    status.canRefund &&
    !goalReached &&
    !campaign.withdrawn &&
    hasRefund &&
    currentWalletDonationAmount > 0;
  const blockchainExpired = campaign.expired || status.key === "failed";
  const actionNote = {
    goalReached: "Chiến dịch đã đạt mục tiêu. Chủ chiến dịch có thể rút tiền.",
    failed: "Chiến dịch đã hết hạn và không đạt mục tiêu. Donor có thể hoàn tiền.",
    paused: "Chiến dịch đang tạm dừng nên chưa nhận quyên góp mới.",
    completed: "Chiến dịch đã hoàn thành và tiền đã được giải ngân.",
  }[status.key];

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

              <div className={`alert ${status.key === "failed" || status.key === "paused" ? "alert-warning" : status.key === "completed" || status.key === "goalReached" ? "alert-success" : "alert-info"}`} style={{ marginBottom: 18 }}>
                <span>i</span>
                <span>
                  {actionNote || `Chiến dịch đang nhận quyên góp. Còn ${timeLeft.text} để đạt mục tiêu ${formatEth(campaign.goal)} ETH.`}
                </span>
              </div>

              {/* Tabs */}
              <div className="detail-tabs">
                {["info", "donations", "transparency", "blockchain"].map((tab) => (
                  <button
                    key={tab}
                    className={`detail-tab ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {{ info: "📄 Thông tin", donations: `💰 Quyên góp (${donations.length})`, transparency: "Minh bạch", blockchain: "⛓️ Blockchain" }[tab]}
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

              {activeTab === "transparency" && (
                <div className="transparency-panel">
                  <div className="transparency-grid">
                    <div className="transparency-metric">
                      <span>Đã nhận</span>
                      <strong>{formatEth(campaign.raised)} ETH</strong>
                    </div>
                    <div className="transparency-metric">
                      <span>Mục tiêu</span>
                      <strong>{formatEth(campaign.goal)} ETH</strong>
                    </div>
                    <div className="transparency-metric">
                      <span>Phí nền tảng dự kiến</span>
                      <strong>{formatEth(platformFeeAmount)} ETH</strong>
                    </div>
                    <div className="transparency-metric">
                      <span>Chủ chiến dịch nhận</span>
                      <strong>{formatEth(ownerReceives)} ETH</strong>
                    </div>
                    <div className="transparency-metric">
                      <span>Đã hoàn tiền</span>
                      <strong>{formatEth(totalRefunded)} ETH</strong>
                    </div>
                    <div className="transparency-metric">
                      <span>Đã rút</span>
                      <strong>{formatEth(totalWithdrawn)} ETH</strong>
                    </div>
                  </div>

                  <div className="audit-list">
                    <div className="audit-row">
                      <span>Giao dịch quyên góp</span>
                      <strong>{donateTxCount}</strong>
                    </div>
                    <div className="audit-row">
                      <span>Trạng thái giải ngân</span>
                      <strong>{campaign.withdrawn ? "Đã rút tiền" : "Chưa rút tiền"}</strong>
                    </div>
                    <div className="audit-row">
                      <span>Ví hiện tại đã ủng hộ</span>
                      <strong>{formatEth(currentWalletDonationAmount)} ETH</strong>
                    </div>
                    <div className="audit-row">
                      <span>Hoàn tiền của ví hiện tại</span>
                      <strong>{formatEth(refundableAmount)} ETH</strong>
                    </div>
                    <div className="audit-row">
                      <span>Contract</span>
                      <button className="address" onClick={() => { copyToClipboard(contractHooks.getContractAddress()); toast.success("Đã sao chép!"); }}>
                        {formatAddress(contractHooks.getContractAddress())}
                      </button>
                    </div>
                  </div>

                  <TransactionHistory
                    transactions={campaignTransactions}
                    loading={false}
                    title="Dòng kiểm toán on-chain"
                  />
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
                  <div className="blockchain-row">
                    <span className="blockchain-label">Platform Fee</span>
                    <span className="blockchain-value">{platformFee} bps ({(Number(platformFee) / 100).toFixed(2)}%)</span>
                  </div>
                  {account && (
                    <div className="blockchain-row">
                      <span className="blockchain-label">Refundable</span>
                      <span className="blockchain-value">{formatEth(refundableAmount)} ETH</span>
                    </div>
                  )}
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
                  <span className="sidebar-stat-label">⛓️ Thời gian blockchain</span>
                  <span className="sidebar-stat-value">{formatDateTime(campaign.chainNow)}</span>
                </div>
                <div className="sidebar-stat">
                  <span className="sidebar-stat-label">📊 Trạng thái</span>
                  <span className={`badge badge-${status.color}`}>{status.label}</span>
                </div>
              </div>

              <hr className="divider" />

              {/* Donate Button */}
              {status.canDonate && (
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

              {!status.canDonate && actionNote && (
                <div className={`alert ${status.key === "failed" ? "alert-warning" : "alert-info"}`}>
                  <span>i</span>
                  <span>{actionNote}</span>
                </div>
              )}

              {/* Withdraw (owner only) */}
              {isOwner && parseFloat(campaign.raised) > 0 && status.canWithdraw && (
                <>
                  <hr className="divider" />
                  <div className="alert alert-info" style={{ marginBottom: 12 }}>
                    <span>💡</span>
                    <span>
                      Bạn là chủ chiến dịch. Dự kiến nhận {formatEth(ownerReceives)} ETH
                      {Number(platformFee) > 0 ? ` sau phí nền tảng ${formatEth(platformFeeAmount)} ETH.` : "."}
                    </span>
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

              {isOwner && parseFloat(campaign.raised) > 0 && !campaign.withdrawn && !goalReached && !blockchainExpired && (
                <>
                  <hr className="divider" />
                  <div className="alert alert-warning">
                    <span>!</span>
                    <span>Chiến dịch chưa đạt mục tiêu nên chủ chiến dịch chưa thể rút tiền.</span>
                  </div>
                </>
              )}

              {canRefundCurrentWallet && (
                <>
                  <hr className="divider" />
                  <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                    <span>↩</span>
                    <span>Chiến dịch không đạt mục tiêu. Ví này đã ủng hộ {formatEth(currentWalletDonationAmount)} ETH và có thể nhận lại {formatEth(refundableAmount)} ETH.</span>
                  </div>
                  <button
                    className="btn btn-secondary btn-full"
                    onClick={handleRefund}
                    disabled={refunding}
                  >
                    {refunding ? <><span className="spinner" /> Đang hoàn tiền...</> : "Nhận Hoàn Tiền"}
                  </button>
                </>
              )}

              {account && status.canRefund && !canRefundCurrentWallet && !campaign.withdrawn && (
                <>
                  <hr className="divider" />
                  <div className="alert alert-info">
                    <span>i</span>
                    <span>Ví hiện tại đã ủng hộ {formatEth(currentWalletDonationAmount)} ETH trong chiến dịch này và không có khoản hoàn tiền khả dụng.</span>
                  </div>
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
