# 🔗 CharityChain - Nền Tảng Quyên Góp Từ Thiện Blockchain

> Đồ án môn Blockchain - Xây dựng DApp quyên góp từ thiện minh bạch trên Ethereum

## 📋 Yêu Cầu Hệ Thống

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MetaMask** extension trên trình duyệt

---

## 🚀 Hướng Dẫn Chạy (3 Terminal)

### Terminal 1 - Khởi động Blockchain (Hardhat)

```bash
cd blockchain
npm install
npx hardhat node
```

> Để terminal này chạy liên tục. Ghi lại các private key hiển thị.

### Terminal 2 - Deploy Contract & Seed Data

```bash
cd blockchain
npm run deploy:local
npm run seed:local
```

> Sau khi deploy xong, ABI sẽ tự động copy vào frontend/ và backend/

### Terminal 3 - Backend Server

```bash
cd backend
npm install
npm run dev
```

> Server chạy tại: http://localhost:5000

### Terminal 4 - Frontend

```bash
cd frontend
npm install
npm run dev
```

> Frontend chạy tại: http://localhost:5173

---

## 🦊 Cài Đặt MetaMask

1. Cài MetaMask extension: https://metamask.io/download/
2. Mở MetaMask → **Add Network** → Nhập thủ công:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
3. **Import Account** bằng private key từ Hardhat:
   - Account 0: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Account 1: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - Account 2: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

---

## 🏗️ Kiến Trúc

```
blockchain/          ← Hardhat + Solidity Smart Contract
├── contracts/CharityDonation.sol
├── scripts/deploy.js
└── scripts/seed.js

backend/             ← Node.js + Express API
├── src/app.js
├── src/services/blockchainService.js   ← ethers.js
├── src/services/ipfsService.js         ← Mock IPFS
└── uploads/         ← IPFS files stored here

frontend/            ← React + Vite DApp
├── src/hooks/useWallet.js    ← MetaMask
├── src/hooks/useContract.js  ← Web3/ethers.js
├── src/pages/
│   ├── Home.jsx
│   ├── CampaignDetail.jsx
│   ├── CreateCampaign.jsx
│   ├── Dashboard.jsx
│   └── Transactions.jsx      ← History Transaction
└── src/contracts/CharityDonation.json  ← Auto-generated ABI
```

---

## ✅ Đáp Ứng Yêu Cầu Thầy

| Yêu Cầu | Giải Pháp |
|---|---|
| Chuẩn Blockchain | Ethereum EVM, Solidity 0.8.20 |
| Mạng Blockchain | Hardhat Local Network (Chain ID: 31337) |
| Smart Contract with Data & Config | `CharityDonation.sol` - Campaign, Donation structs |
| Wallet | MetaMask via `useWallet.js` hook |
| IPFS | Mock IPFS - upload file → lưu local → trả CID hash |
| Web3 | ethers.js v6 trong `useContract.js` |
| History Transaction | `getAllTransactions()` on-chain + Transactions page |
| Thanh công cụ | Navbar: Connect Wallet, Network Status, Navigation, Dropdown |

---

## 🎯 Tính Năng

- ✅ Tạo chiến dịch từ thiện với hình ảnh (IPFS)
- ✅ Quyên góp ETH với MetaMask
- ✅ Theo dõi tiến độ real-time
- ✅ Xem lịch sử tất cả giao dịch on-chain
- ✅ Rút tiền (chỉ owner chiến dịch)
- ✅ Dashboard cá nhân
- ✅ Filter & Search chiến dịch
- ✅ Hiển thị thông tin blockchain (contract address, chain ID, IPFS hash)

---

## 📡 API Endpoints (Backend)

```
GET  /api/health              - Status
GET  /api/stats               - Platform statistics
GET  /api/campaigns           - All campaigns
GET  /api/campaigns/:id       - Single campaign
GET  /api/campaigns/:id/donations - Campaign donations
GET  /api/donations/user/:address - User donations
GET  /api/transactions        - All transactions
GET  /api/transactions/events - Raw blockchain events
POST /api/ipfs/upload         - Upload image to IPFS
POST /api/ipfs/upload-json    - Upload metadata to IPFS
GET  /api/ipfs/files          - List IPFS files
```
