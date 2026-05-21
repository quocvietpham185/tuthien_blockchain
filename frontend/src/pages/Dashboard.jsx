import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TransactionHistory from "../components/TransactionHistory/TransactionHistory";
import CampaignCard from "../components/CampaignCard/CampaignCard";
import DonationModal from "../components/DonationModal/DonationModal";
import { formatEth, formatAddress, copyToClipboard } from "../utils/format";
import { BACKEND_URL } from "../constants";
import toast from "react-hot-toast";

export default function Dashboard({ contractHooks, account, authToken }) {
  const navigate = useNavigate();
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [stats, setStats] = useState({ donated: 0, created: 0, total: 0 });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (account) loadDashboard();
  }, [account, authToken]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [allCampaigns, userDons] = await Promise.all([
        contractHooks.getCampaigns(),
        contractHooks.getUserDonations(account),
      ]);

      const owned = allCampaigns.filter((c) => c.owner.toLowerCase() === account.toLowerCase());
      setMyCampaigns(owned);
      
      const txFormat = userDons.map((d) => ({
        txType: "DONATE",
        campaignId: d.campaignId,
        actor: d.donor,
        amount: d.amount,
        timestamp: d.timestamp,
        campaignTitle: allCampaigns.find((c) => c.id === d.campaignId)?.title || "Campaign",
      }));
      setMyDonations(txFormat);

      const totalDonated = userDons.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      setStats({
        donated: totalDonated.toFixed(4),
        created: owned.length,
        total: userDons.length,
      });

      if (authToken) {
        const response = await fetch(`${BACKEND_URL}/api/notifications?unreadOnly=true`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const json = await response.json();
        if (json.success) setNotifications(json.data.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (campaignId, amount, message) => {
    const result = await contractHooks.donate(campaignId, amount, message);
    if (result.success) await loadDashboard();
    return result;
  };

  if (!account) {
    return (
      <div className="page-content">
        <div className="container" style={{ paddingTop: 60 }}>
          <div className="card" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🦊</div>
            <h2 style={{ color: "#f1f5f9", marginBottom: 8 }}>Kết Nối Ví</h2>
            <p style={{ color: "#64748b" }}>Kết nối MetaMask để xem dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="section-title">📊 Dashboard Cá Nhân</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <button
                className="address"
                style={{ fontSize: 14 }}
                onClick={() => { copyToClipboard(account); toast.success("Đã sao chép!"); }}
                title={account}
              >
                {formatAddress(account)}
              </button>
              <span style={{ color: "#64748b", fontSize: 13 }}>Hardhat Local Network</span>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/create")}
          >
            🚀 Tạo Chiến Dịch
          </button>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid-stats" style={{ marginBottom: 40 }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(139, 92, 246, 0.15)" }}>💰</div>
              <div className="stat-value">{stats.donated}</div>
              <div className="stat-label">ETH đã quyên góp</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(59, 130, 246, 0.15)" }}>🎯</div>
              <div className="stat-value">{stats.created}</div>
              <div className="stat-label">Chiến dịch đã tạo</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)" }}>💝</div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Lần quyên góp</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "rgba(251, 191, 36, 0.15)" }}>⛓️</div>
              <div className="stat-value" style={{ fontSize: 16 }}>31337</div>
              <div className="stat-label">Chain ID (Hardhat)</div>
            </div>
          </div>
        )}

        {/* My Campaigns */}
        {notifications.length > 0 && (
          <div className="card" style={{ marginBottom: 32 }}>
            <div className="section-header">
              <div>
                <h2 className="section-title">Thong bao moi</h2>
                <p className="section-subtitle">{notifications.length} su kien lien quan den vi cua ban</p>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={async () => {
                  await fetch(`${BACKEND_URL}/api/notifications/read-all`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${authToken}` },
                  });
                  setNotifications([]);
                }}
              >
                Danh dau da doc
              </button>
            </div>
            <div className="admin-list">
              {notifications.map((item) => (
                <div key={item.id} className="admin-mini-row">
                  <span>{item.type.replaceAll("_", " ")} #{item.payload?.campaignId || ""}</span>
                  <strong>{item.payload?.amount ? `${item.payload.amount} ETH` : item.payload?.title}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 48 }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">🎯 Chiến Dịch Của Tôi</h2>
              <p className="section-subtitle">{myCampaigns.length} chiến dịch đã tạo</p>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate("/create")}>
              + Tạo mới
            </button>
          </div>

          {loading ? (
            <div className="loading-screen" style={{ minHeight: 200 }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : myCampaigns.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">🚀</div>
              <p className="empty-state-title">Chưa có chiến dịch nào</p>
              <p className="empty-state-desc">Tạo chiến dịch từ thiện đầu tiên của bạn</p>
              <button className="btn btn-primary" onClick={() => navigate("/create")}>
                Tạo Chiến Dịch
              </button>
            </div>
          ) : (
            <div className="grid-campaigns">
              {myCampaigns.map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  onDonate={(campaign) => setSelectedCampaign(campaign)}
                />
              ))}
            </div>
          )}
        </div>

        {/* My Donation History */}
        <div className="card">
          <TransactionHistory
            transactions={myDonations}
            loading={loading}
            title="💰 Lịch Sử Quyên Góp Của Tôi"
          />
        </div>
      </div>

      {selectedCampaign && (
        <DonationModal
          campaign={selectedCampaign}
          account={account}
          onDonate={handleDonate}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}
