import React, { useEffect, useMemo, useState } from "react";
import CampaignCard from "../components/CampaignCard/CampaignCard";
import DonationModal from "../components/DonationModal/DonationModal";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../constants";
import { formatAddress, formatDate, formatEth, getCampaignStatus } from "../utils/format";

export default function Home({ contractHooks, account }) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({
    minGoal: "",
    maxGoal: "",
    deadline: "all",
    sort: "newest",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campaignList, platformStats, txList] = await Promise.all([
        contractHooks.getCampaigns(),
        contractHooks.getPlatformStats(),
        contractHooks.getAllTransactions(),
      ]);
      setCampaigns([...campaignList].reverse());
      setStats(platformStats);
      setTransactions(txList);
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (campaignId, amount, message) => {
    if (!account) return { success: false };
    const result = await contractHooks.donate(campaignId, amount, message);
    if (result.success) await loadData();
    return result;
  };

  const now = Math.floor(Date.now() / 1000);
  const community = useMemo(() => {
    const donorTotals = new Map();
    const categoryTotals = new Map();

    transactions
      .filter((tx) => tx.txType === "DONATE")
      .forEach((tx) => {
        donorTotals.set(tx.actor, (donorTotals.get(tx.actor) || 0) + Number(tx.amount || 0));
      });

    campaigns.forEach((campaign) => {
      categoryTotals.set(
        campaign.category,
        (categoryTotals.get(campaign.category) || 0) + Number(campaign.raised || 0)
      );
    });

    return {
      topCampaigns: [...campaigns]
        .sort((a, b) => Number(b.raised) - Number(a.raised))
        .slice(0, 5),
      topDonors: [...donorTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([address, amount]) => ({ address, amount })),
      categoryStats: [...categoryTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount })),
      urgentCampaigns: campaigns
        .filter((campaign) => {
          const status = getCampaignStatus(campaign);
          return status.key === "active" && Number(campaign.deadline) <= now + 7 * 86400;
        })
        .sort((a, b) => Number(a.deadline) - Number(b.deadline))
        .slice(0, 3),
    };
  }, [campaigns, transactions, now]);

  const filtered = campaigns
    .filter((campaign) => {
      if (filter === "active" && (!campaign.active || Number(campaign.deadline) < now)) return false;
      if (filter === "completed" && campaign.active && Number(campaign.deadline) >= now) return false;
      if (categoryFilter !== "all" && campaign.category !== categoryFilter) return false;
      if (search && !`${campaign.title} ${campaign.description}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (advancedFilters.minGoal && Number(campaign.goal) < Number(advancedFilters.minGoal)) return false;
      if (advancedFilters.maxGoal && Number(campaign.goal) > Number(advancedFilters.maxGoal)) return false;
      if (advancedFilters.deadline === "7d" && Number(campaign.deadline) > now + 7 * 86400) return false;
      if (advancedFilters.deadline === "30d" && Number(campaign.deadline) > now + 30 * 86400) return false;
      if (advancedFilters.deadline === "expired" && Number(campaign.deadline) >= now) return false;
      return true;
    })
    .sort((a, b) => {
      if (advancedFilters.sort === "raised") return Number(b.raised) - Number(a.raised);
      if (advancedFilters.sort === "goal") return Number(b.goal) - Number(a.goal);
      if (advancedFilters.sort === "deadline") return Number(a.deadline) - Number(b.deadline);
      return Number(b.createdAt) - Number(a.createdAt);
    });

  return (
    <div className="page-content">
      <section className="home-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">Powered by Blockchain</div>
            <h1 className="hero-title">
              Quyên Góp Minh Bạch
              <br />
              <span className="hero-title-accent">Trên Blockchain</span>
            </h1>
            <p className="hero-desc">
              Mọi giao dịch được ghi vĩnh viễn trên Ethereum Blockchain. Không thể giả mạo,
              không thể xóa. Hoàn toàn minh bạch và phi tập trung.
            </p>

            {stats && (
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-value">{stats.totalCampaigns}</span>
                  <span className="hero-stat-label">Chiến dịch</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-value">{parseFloat(stats.totalDonations).toFixed(2)} ETH</span>
                  <span className="hero-stat-label">Đã quyên góp</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-value">{stats.activeCampaigns}</span>
                  <span className="hero-stat-label">Đang hoạt động</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="community-insights">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Thống Kê Cộng Đồng</h2>
              <p className="section-subtitle">Leaderboard được tổng hợp trực tiếp từ dữ liệu on-chain</p>
            </div>
          </div>

          <div className="insights-grid">
            <div className="insight-panel">
              <h3>Top chiến dịch</h3>
              <div className="insight-list">
                {community.topCampaigns.length === 0 ? (
                  <p className="muted-line">Chưa có dữ liệu</p>
                ) : (
                  community.topCampaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      className="insight-row"
                      onClick={() => navigate(`/campaign/${campaign.id}`)}
                    >
                      <span>#{campaign.id} {campaign.title}</span>
                      <strong>{formatEth(campaign.raised)} ETH</strong>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="insight-panel">
              <h3>Top donor</h3>
              <div className="insight-list">
                {community.topDonors.length === 0 ? (
                  <p className="muted-line">Chưa có giao dịch quyên góp</p>
                ) : (
                  community.topDonors.map((donor) => (
                    <div key={donor.address} className="insight-row">
                      <span className="address">{formatAddress(donor.address)}</span>
                      <strong>{formatEth(donor.amount)} ETH</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="insight-panel">
              <h3>Theo danh mục</h3>
              <div className="insight-list">
                {community.categoryStats.length === 0 ? (
                  <p className="muted-line">Chưa có danh mục nào</p>
                ) : (
                  community.categoryStats.map((item) => (
                    <div key={item.category} className="insight-row">
                      <span>{item.category}</span>
                      <strong>{formatEth(item.amount)} ETH</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {community.urgentCampaigns.length > 0 && (
            <div className="status-strip">
              <strong>Cần chú ý:</strong>
              <span>
                {community.urgentCampaigns
                  .map((campaign) => `#${campaign.id} hết hạn ${formatDate(campaign.deadline)}`)
                  .join(" · ")}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="home-campaigns">
        <div className="container">
          <div className="campaigns-header">
            <div>
              <h2 className="section-title">Các Chiến Dịch Từ Thiện</h2>
              <p className="section-subtitle">
                {loading ? "Đang tải..." : `${filtered.length} chiến dịch`}
              </p>
            </div>
          </div>

          <div className="filter-bar">
            <div className="search-wrapper">
              <span className="search-icon">Tìm</span>
              <input
                type="text"
                className="form-input search-input"
                placeholder="Tìm chiến dịch..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="filter-tabs">
              {[
                { key: "all", label: "Tất cả" },
                { key: "active", label: "Đang chạy" },
                { key: "completed", label: "Hoàn thành" },
              ].map((item) => (
                <button
                  key={item.key}
                  className={`tag ${filter === item.key ? "active" : ""}`}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="filter-tabs">
              <button
                className={`tag ${categoryFilter === "all" ? "active" : ""}`}
                onClick={() => setCategoryFilter("all")}
              >
                Tất cả loại
              </button>
              {CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  className={`tag ${categoryFilter === category.value ? "active" : ""}`}
                  onClick={() => setCategoryFilter(category.value)}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="advanced-filters">
              <input
                type="number"
                className="form-input"
                placeholder="Min ETH"
                min="0"
                step="0.01"
                value={advancedFilters.minGoal}
                onChange={(event) => setAdvancedFilters((value) => ({ ...value, minGoal: event.target.value }))}
              />
              <input
                type="number"
                className="form-input"
                placeholder="Max ETH"
                min="0"
                step="0.01"
                value={advancedFilters.maxGoal}
                onChange={(event) => setAdvancedFilters((value) => ({ ...value, maxGoal: event.target.value }))}
              />
              <select
                className="form-select"
                value={advancedFilters.deadline}
                onChange={(event) => setAdvancedFilters((value) => ({ ...value, deadline: event.target.value }))}
              >
                <option value="all">Mọi thời hạn</option>
                <option value="7d">Còn dưới 7 ngày</option>
                <option value="30d">Còn dưới 30 ngày</option>
                <option value="expired">Đã hết hạn</option>
              </select>
              <select
                className="form-select"
                value={advancedFilters.sort}
                onChange={(event) => setAdvancedFilters((value) => ({ ...value, sort: event.target.value }))}
              >
                <option value="newest">Mới nhất</option>
                <option value="raised">Nhiều quyên góp nhất</option>
                <option value="goal">Mục tiêu cao nhất</option>
                <option value="deadline">Sắp hết hạn</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-screen">
              <div className="spinner spinner-lg" />
              <span>Đang tải dữ liệu từ blockchain...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">?</div>
              <p className="empty-state-title">Không tìm thấy chiến dịch</p>
              <p className="empty-state-desc">Thử thay đổi bộ lọc hoặc tạo chiến dịch mới</p>
            </div>
          ) : (
            <div className="grid-campaigns">
              {filtered.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onDonate={(item) => setSelectedCampaign(item)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

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
