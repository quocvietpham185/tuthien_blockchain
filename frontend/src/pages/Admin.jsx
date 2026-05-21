import React, { useEffect, useMemo, useState } from "react";
import { BACKEND_URL } from "../constants";
import { formatAddress, formatEth, formatDateTime, copyToClipboard } from "../utils/format";
import toast from "react-hot-toast";

export default function Admin({ contractHooks, account, authToken }) {
  const [owner, setOwner] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadData();
  }, [account, authToken]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [platformOwner, allCampaigns] = await Promise.all([
        contractHooks.getPlatformOwner(),
        contractHooks.getCampaigns(),
      ]);
      setOwner(platformOwner);
      setCampaigns([...allCampaigns].reverse());

      if (authToken) {
        const response = await fetch(`${BACKEND_URL}/api/admin/overview`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const json = await response.json();
        if (json.success) setOverview(json.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Khong tai duoc du lieu admin");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = useMemo(
    () => account && owner && account.toLowerCase() === owner.toLowerCase(),
    [account, owner]
  );

  const toggleCampaign = async (campaignId) => {
    setBusyId(campaignId);
    const result = await contractHooks.toggleCampaign(campaignId);
    setBusyId(null);
    if (result.success) await loadData();
  };

  if (!account) {
    return (
      <div className="page-content">
        <div className="container admin-page">
          <div className="card empty-state">
            <p className="empty-state-title">Ket noi vi de vao Admin</p>
            <p className="empty-state-desc">Admin duoc xac thuc bang chu ky vi va owner smart contract.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && !isAdmin) {
    return (
      <div className="page-content">
        <div className="container admin-page">
          <div className="card empty-state">
            <p className="empty-state-title">Khong co quyen admin</p>
            <p className="empty-state-desc">Platform owner hien tai: {formatAddress(owner)}</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = overview?.stats;

  return (
    <div className="page-content">
      <div className="container admin-page">
        <div className="dashboard-header">
          <div>
            <h1 className="section-title">Admin Dashboard</h1>
            <button
              className="address"
              onClick={() => {
                copyToClipboard(owner);
                toast.success("Da sao chep owner");
              }}
            >
              Owner: {formatAddress(owner)}
            </button>
          </div>
          <button className="btn btn-outline" onClick={loadData}>
            Lam moi
          </button>
        </div>

        {loading ? (
          <div className="loading-screen">
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <>
            <div className="grid-stats" style={{ marginBottom: 32 }}>
              <div className="stat-card">
                <div className="stat-value">{stats?.totalCampaigns || campaigns.length}</div>
                <div className="stat-label">Tong chien dich</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats?.uniqueDonors || "-"}</div>
                <div className="stat-label">Nguoi ung ho duy nhat</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats?.fundingRate || 0}%</div>
                <div className="stat-label">Ty le dat muc tieu</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats?.transactionCount || "-"}</div>
                <div className="stat-label">Giao dich on-chain</div>
              </div>
            </div>

            <div className="admin-layout">
              <div className="card">
                <h2 className="section-title" style={{ fontSize: 18, marginBottom: 16 }}>
                  Quan ly chien dich
                </h2>
                <div className="admin-table">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="admin-row">
                      <div>
                        <strong>#{campaign.id} {campaign.title}</strong>
                        <p>
                          {formatAddress(campaign.owner)} · {formatEth(campaign.raised)}/{formatEth(campaign.goal)} ETH
                        </p>
                      </div>
                      <div className="admin-row-actions">
                        <span className={`badge badge-${campaign.active ? "active" : "expired"}`}>
                          {campaign.active ? "Active" : "Paused"}
                        </span>
                        <button
                          className="btn btn-sm btn-secondary"
                          disabled={busyId === campaign.id || campaign.withdrawn}
                          onClick={() => toggleCampaign(campaign.id)}
                        >
                          {busyId === campaign.id ? "Dang xu ly..." : campaign.active ? "Tam dung" : "Mo lai"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="section-title" style={{ fontSize: 18, marginBottom: 16 }}>
                  Top chien dich
                </h2>
                <div className="admin-list">
                  {(stats?.topCampaigns || []).map((campaign) => (
                    <div key={campaign.id} className="admin-mini-row">
                      <span>#{campaign.id} {campaign.title}</span>
                      <strong>{formatEth(campaign.raised)} ETH</strong>
                    </div>
                  ))}
                </div>

                <h2 className="section-title" style={{ fontSize: 18, margin: "28px 0 16px" }}>
                  Giao dich gan day
                </h2>
                <div className="admin-list">
                  {(overview?.recentTransactions || []).map((tx, index) => (
                    <div key={index} className="admin-mini-row">
                      <span>{tx.txType} #{tx.campaignId}</span>
                      <small>{formatDateTime(tx.timestamp)}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
