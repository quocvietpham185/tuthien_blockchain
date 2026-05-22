export function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEth(amount) {
  if (!amount) return "0";
  const num = parseFloat(amount);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  return num.toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

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

export function getTimeRemaining(deadline, currentTimestamp = Math.floor(Date.now() / 1000)) {
  const now = Number(currentTimestamp);
  const diff = Number(deadline) - now;

  if (diff <= 0) return { text: "Đã hết hạn", expired: true };

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);

  if (days > 0) return { text: `${days} ngày ${hours} giờ`, expired: false };
  if (hours > 0) return { text: `${hours} giờ`, expired: false };
  return { text: "< 1 giờ", expired: false };
}

export function getCampaignStatus(campaign) {
  const now = Number(campaign.chainNow || Math.floor(Date.now() / 1000));
  const goalReached = BigInt(campaign.raisedWei || 0) >= BigInt(campaign.goalWei || 0);
  const expired = typeof campaign.expired === "boolean" ? campaign.expired : Number(campaign.deadline) < now;

  if (campaign.withdrawn) {
    return {
      key: "completed",
      label: "Hoàn thành",
      color: "completed",
      canDonate: false,
      canWithdraw: false,
      canRefund: false,
    };
  }

  if (goalReached) {
    return {
      key: "goalReached",
      label: "Đạt mục tiêu",
      color: "completed",
      canDonate: false,
      canWithdraw: true,
      canRefund: false,
    };
  }

  if (expired) {
    return {
      key: "failed",
      label: "Không đạt mục tiêu",
      color: "expired",
      canDonate: false,
      canWithdraw: false,
      canRefund: true,
    };
  }

  if (!campaign.active) {
    return {
      key: "paused",
      label: "Đã tạm dừng",
      color: "expired",
      canDonate: false,
      canWithdraw: false,
      canRefund: false,
    };
  }

  return {
    key: "active",
    label: "Đang hoạt động",
    color: "active",
    canDonate: true,
    canWithdraw: false,
    canRefund: false,
  };
}

export function getCategoryClass(category) {
  const map = {
    "Giáo dục": "education",
    "Y tế": "medical",
    "Thiên tai": "disaster",
    "Môi trường": "environment",
  };
  return map[category] || "default";
}

export function truncate(text, maxLength = 120) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function formatNumber(num) {
  return Number(num).toLocaleString("vi-VN");
}

export function fixVietnameseText(text) {
  if (typeof text !== "string") return text;

  const replacements = [
    ["GiÃ¡o dá»¥c", "Giáo dục"],
    ["Y táº¿", "Y tế"],
    ["ThiÃªn tai", "Thiên tai"],
    ["MÃ´i trÆ°á»ng", "Môi trường"],
    ["Tráº» em", "Trẻ em"],
    ["NgÆ°á»i cao tuá»•i", "Người cao tuổi"],
    ["KhÃ¡c", "Khác"],
    ["QuyÃªn GÃ³p", "Quyên Góp"],
    ["Táº¡o Chiáº¿n Dá»‹ch", "Tạo Chiến Dịch"],
    ["RÃºt Tiá»n", "Rút Tiền"],
    ["HoÃ n Tiá»n", "Hoàn Tiền"],
    ["Chiáº¿n dá»‹ch", "Chiến dịch"],
    ["quyÃªn gÃ³p", "quyên góp"],
    ["Ä‘Ã£", "đã"],
    ["Ä‘ang", "đang"],
    ["Ä‘áº¡t", "đạt"],
    ["má»¥c tiÃªu", "mục tiêu"],
    ["tá»« thiá»‡n", "từ thiện"],
    ["minh báº¡ch", "minh bạch"],
    ["trÃªn", "trên"],
    ["khÃ´ng", "không"],
    ["thá»ƒ", "thể"],
    ["xÃ³a", "xóa"],
    ["HoÃ n toÃ n", "Hoàn toàn"],
    ["phi táº­p trung", "phi tập trung"],
  ];

  return replacements.reduce(
    (value, [broken, fixed]) => value.replaceAll(broken, fixed),
    text
  );
}
