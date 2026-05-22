// Blockchain configuration
export const HARDHAT_CHAIN_ID = 31337;
export const HARDHAT_RPC_URL = "http://127.0.0.1:8545";
export const BACKEND_URL = "http://localhost:5000";

// Campaign categories
export const CATEGORIES = [
  { value: "Giáo dục", label: "Giáo dục", color: "education" },
  { value: "Y tế", label: "Y tế", color: "medical" },
  { value: "Thiên tai", label: "Thiên tai", color: "disaster" },
  { value: "Môi trường", label: "Môi trường", color: "environment" },
  { value: "Trẻ em", label: "Trẻ em", color: "default" },
  { value: "Người cao tuổi", label: "Người cao tuổi", color: "default" },
  { value: "Khác", label: "Khác", color: "default" },
];

// Hardhat test accounts private keys (for MetaMask import)
export const TEST_PRIVATE_KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
];

// Hardhat network config for MetaMask
export const HARDHAT_NETWORK = {
  chainId: "0x7a69",
  chainName: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["http://127.0.0.1:8545"],
  blockExplorerUrls: null,
};

// Transaction type labels
export const TX_TYPE_LABELS = {
  CREATE: { label: "Tạo Chiến Dịch", color: "#2563eb", icon: "+" },
  DONATE: { label: "Quyên Góp", color: "#10b981", icon: "$" },
  WITHDRAW: { label: "Rút Tiền", color: "#3b82f6", icon: "W" },
  REFUND: { label: "Hoàn Tiền", color: "#f59e0b", icon: "R" },
};
