import React, { useState, useEffect } from "react";
import CampaignCard from "../components/CampaignCard/CampaignCard";
import DonationModal from "../components/DonationModal/DonationModal";
import { CATEGORIES } from "../constants";

export default function Home({ contractHooks, account }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
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
      const [cList, pStats] = await Promise.all([
        contractHooks.getCampaigns(),
        contractHooks.getPlatformStats(),
      ]);
      setCampaigns(cList.reverse()); // newest first
      setStats(pStats);
    } catch (err) {
      console.error("Load error:", err);
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

  // Filter campaigns
  const now = Math.floor(Date.now() / 1000);
  const filtered = campaigns.filter((c) => {
    if (filter === "active" && (!c.active || Number(c.deadline) < now)) return false;
    if (filter === "completed" && (c.active && Number(c.deadline) >= now)) return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (search && !`${c.title} ${c.description}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (advancedFilters.minGoal && Number(c.goal) < Number(advancedFilters.minGoal)) return false;
    if (advancedFilters.maxGoal && Number(c.goal) > Number(advancedFilters.maxGoal)) return false;
    if (advancedFilters.deadline === "7d" && Number(c.deadline) > now + 7 * 86400) return false;
    if (advancedFilters.deadline === "30d" && Number(c.deadline) > now + 30 * 86400) return false;
    if (advancedFilters.deadline === "expired" && Number(c.deadline) >= now) return false;
    return true;
  }).sort((a, b) => {
    if (advancedFilters.sort === "raised") return Number(b.raised) - Number(a.raised);
    if (advancedFilters.sort === "goal") return Number(b.goal) - Number(a.goal);
    if (advancedFilters.sort === "deadline") return Number(a.deadline) - Number(b.deadline);
    return Number(b.createdAt) - Number(a.createdAt);
  });

  return (
    <div className="page-content">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">⛓️ Powered by Blockchain</div>
            <h1 className="hero-title">
              Quyên Góp Minh Bạch
              <br />
              <span className="hero-title-accent">Trên Blockchain</span>
            </h1>
            <p className="hero-desc">
              Mọi giao dịch được ghi vĩnh viễn trên Ethereum Blockchain. Không thể giả mạo,
              không thể xóa. Hoàn toàn minh bạch và phi tập trung.
            </p>

            {/* Platform Stats */}
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

          {/* Floating blockchain visual */}
          <div className="hero-visual">
            <div className="blockchain-visual">
              {["⛓️", "🔒", "💎", "🌐"].map((icon, i) => (
                <div
                  key={i}
                  className="block-node"
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Campaigns Section */}
      <section className="home-campaigns">
        <div className="container">
          {/* Filters */}
          <div className="campaigns-header">
            <div>
              <h2 className="section-title">🎯 Các Chiến Dịch Từ Thiện</h2>
              <p className="section-subtitle">
                {loading ? "Đang tải..." : `${filtered.length} chiến dịch`}
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="filter-bar">
            {/* Search */}
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="form-input search-input"
                placeholder="Tìm chiến dịch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="filter-tabs">
              {[
                { key: "all", label: "Tất cả" },
                { key: "active", label: "🟢 Đang chạy" },
                { key: "completed", label: "✅ Hoàn thành" },
              ].map((f) => (
                <button
                  key={f.key}
                  className={`tag ${filter === f.key ? "active" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="filter-tabs">
              <button
                className={`tag ${categoryFilter === "all" ? "active" : ""}`}
                onClick={() => setCategoryFilter("all")}
              >
                Tất cả loại
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  className={`tag ${categoryFilter === c.value ? "active" : ""}`}
                  onClick={() => setCategoryFilter(c.value)}
                >
                  {c.label}
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
                onChange={(e) => setAdvancedFilters((f) => ({ ...f, minGoal: e.target.value }))}
              />
              <input
                type="number"
                className="form-input"
                placeholder="Max ETH"
                min="0"
                step="0.01"
                value={advancedFilters.maxGoal}
                onChange={(e) => setAdvancedFilters((f) => ({ ...f, maxGoal: e.target.value }))}
              />
              <select
                className="form-select"
                value={advancedFilters.deadline}
                onChange={(e) => setAdvancedFilters((f) => ({ ...f, deadline: e.target.value }))}
              >
                <option value="all">Moi thoi han</option>
                <option value="7d">Con duoi 7 ngay</option>
                <option value="30d">Con duoi 30 ngay</option>
                <option value="expired">Da het han</option>
              </select>
              <select
                className="form-select"
                value={advancedFilters.sort}
                onChange={(e) => setAdvancedFilters((f) => ({ ...f, sort: e.target.value }))}
              >
                <option value="newest">Moi nhat</option>
                <option value="raised">Nhieu quyen gop nhat</option>
                <option value="goal">Muc tieu cao nhat</option>
                <option value="deadline">Sap het han</option>
              </select>
            </div>
          </div>

          {/* Campaign Grid */}
          {loading ? (
            <div className="loading-screen">
              <div className="spinner spinner-lg" />
              <span>Đang tải dữ liệu từ blockchain...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p className="empty-state-title">Không tìm thấy chiến dịch</p>
              <p className="empty-state-desc">Thử thay đổi bộ lọc hoặc tạo chiến dịch mới</p>
            </div>
          ) : (
            <div className="grid-campaigns">
              {filtered.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onDonate={(c) => setSelectedCampaign(c)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Donation Modal */}
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
