import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { formatAddress } from "../../utils/format";
import { HARDHAT_CHAIN_ID } from "../../constants";
import "./Navbar.css";

export default function Navbar({ account, balance, chainId, isConnecting, connectWallet, disconnectWallet, switchToHardhat }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isCorrectNetwork = chainId === HARDHAT_CHAIN_ID;

  const navLinks = [
    { path: "/", label: "Trang Chủ", icon: "🏠" },
    { path: "/create", label: "Tạo Chiến Dịch", icon: "🚀" },
    { path: "/transactions", label: "Lịch Sử", icon: "📋" },
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/admin", label: "Admin", icon: "⚙" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">⛓️</div>
          <div className="brand-text">
            <span className="brand-name">CharityChain</span>
            <span className="brand-tagline">Blockchain Từ Thiện</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? "active" : ""}`}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side - Toolbar */}
        <div className="navbar-actions">
          {/* Network Status */}
          {account && (
            <div
              className={`network-badge ${isCorrectNetwork ? "network-ok" : "network-wrong"}`}
              onClick={!isCorrectNetwork ? switchToHardhat : undefined}
              title={isCorrectNetwork ? "Hardhat Local Network" : "Nhấn để chuyển sang Hardhat"}
            >
              <span className="network-dot" />
              <span className="network-label">
                {isCorrectNetwork ? "Hardhat Local" : `Chain ${chainId}`}
              </span>
            </div>
          )}

          {/* Wallet */}
          {account ? (
            <div className="wallet-dropdown-wrapper">
              <button
                className="wallet-btn connected"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span className="wallet-avatar">👤</span>
                <div className="wallet-info">
                  <span className="wallet-address">{formatAddress(account)}</span>
                  <span className="wallet-balance">{balance} ETH</span>
                </div>
                <span className="dropdown-arrow">{dropdownOpen ? "▲" : "▼"}</span>
              </button>

              {dropdownOpen && (
                <div className="wallet-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-address" title={account}>
                      {formatAddress(account)}
                    </div>
                    <div className="dropdown-balance">
                      <span className="balance-value">{balance}</span>
                      <span className="balance-unit">ETH</span>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item"
                    onClick={() => { navigate("/dashboard"); setDropdownOpen(false); }}
                  >
                    📊 Dashboard của tôi
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => { navigate("/transactions"); setDropdownOpen(false); }}
                  >
                    📋 Lịch sử giao dịch
                  </button>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item disconnect"
                    onClick={() => { disconnectWallet(); setDropdownOpen(false); }}
                  >
                    🔌 Ngắt kết nối
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="connect-btn"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Đang kết nối...
                </>
              ) : (
                <>
                  <span>🦊</span>
                  Kết Nối Ví
                </>
              )}
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`mobile-nav-link ${isActive(link.path) ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="dropdown-overlay"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </nav>
  );
}
