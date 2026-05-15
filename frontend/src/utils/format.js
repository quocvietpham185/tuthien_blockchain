/**
 * Format Ethereum address for display
 * 0x1234...5678
 */
export function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format ETH amount with 4 decimal places
 */
export function formatEth(amount) {
  if (!amount) return "0";
  const num = parseFloat(amount);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  return num.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

/**
 * Format Unix timestamp to readable date
 */
export function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format timestamp to datetime
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get time remaining until deadline
 */
export function getTimeRemaining(deadline) {
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(deadline) - now;

  if (diff <= 0) return { text: "Đã hết hạn", expired: true };

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);

  if (days > 0) return { text: `${days} ngày ${hours} giờ`, expired: false };
  if (hours > 0) return { text: `${hours} giờ`, expired: false };
  return { text: "< 1 giờ", expired: false };
}

/**
 * Get campaign status
 */
export function getCampaignStatus(campaign) {
  const now = Math.floor(Date.now() / 1000);
  if (campaign.withdrawn) return { label: "Hoàn thành", color: "completed" };
  if (!campaign.active) return { label: "Đã dừng", color: "expired" };
  if (Number(campaign.deadline) < now) return { label: "Hết hạn", color: "expired" };
  return { label: "Đang hoạt động", color: "active" };
}

/**
 * Get category badge class
 */
export function getCategoryClass(category) {
  const map = {
    "Giáo dục": "education",
    "Y tế": "medical",
    "Thiên tai": "disaster",
    "Môi trường": "environment",
  };
  return map[category] || "default";
}

/**
 * Truncate text
 */
export function truncate(text, maxLength = 120) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format number with Vietnamese locale
 */
export function formatNumber(num) {
  return Number(num).toLocaleString("vi-VN");
}
