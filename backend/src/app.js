require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const campaignsRouter = require("./routes/campaigns");
const donationsRouter = require("./routes/donations");
const transactionsRouter = require("./routes/transactions");
const ipfsRouter = require("./routes/ipfs");
const blockchainService = require("./services/blockchainService");

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Serve uploaded files (Mock IPFS)
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/ipfs", express.static(uploadsDir));

// ==================== ROUTES ====================
app.use("/api/campaigns", campaignsRouter);
app.use("/api/donations", donationsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/ipfs", ipfsRouter);

// Health check
app.get("/api/health", async (req, res) => {
  const status = await blockchainService.getStatus();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    blockchain: status,
    ipfs: "mock (local storage)",
    version: "1.0.0",
  });
});

// Platform stats endpoint
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await blockchainService.getPlatformStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// ==================== START ====================
app.listen(PORT, async () => {
  console.log("\n🚀 Charity Donation Backend Server");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🌐 Server:     http://localhost:${PORT}`);
  console.log(`📡 Blockchain: ${process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545"}`);
  console.log(`📁 IPFS:       Mock (local storage at ./uploads)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Initialize blockchain listener
  try {
    await blockchainService.initialize();
    console.log("✅ Blockchain service connected");
  } catch (error) {
    console.warn("⚠️  Blockchain service not ready:", error.message);
    console.warn("   Make sure Hardhat node is running: npm run node (in blockchain/)");
  }
});

module.exports = app;
