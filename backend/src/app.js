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
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const notificationsRouter = require("./routes/notifications");
const blockchainService = require("./services/blockchainService");
const rateLimit = require("./middleware/rateLimit");

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
app.use(rateLimit({ windowMs: 60_000, max: 180 }));

// Serve uploaded files (Mock IPFS)
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/ipfs", express.static(uploadsDir));
app.get("/ipfs/:cid", (req, res) => {
  const ipfsService = require("./services/ipfsService");
  const url = ipfsService.getIPFSUrl(req.params.cid);
  if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1")) {
    return res.status(404).json({ success: false, error: "Local IPFS file not found" });
  }
  return res.redirect(url);
});

// ==================== ROUTES ====================
app.use("/api/campaigns", campaignsRouter);
app.use("/api/donations", donationsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/ipfs", ipfsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/notifications", notificationsRouter);

// Health check
app.get("/api/health", async (req, res) => {
  const status = await blockchainService.getStatus();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      blockchain: status,
      ipfs: process.env.PINATA_JWT ? "pinata" : "mock (local storage)",
      version: "1.0.0",
    });
});

// Platform stats endpoint
app.get("/api/stats", async (req, res) => {
  try {
    const stats =
      req.query.advanced === "true"
        ? await blockchainService.getAdvancedStats()
        : await blockchainService.getPlatformStats();
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
  console.log(`📁 IPFS:       ${process.env.PINATA_JWT ? "Pinata" : "Mock (local storage at ./uploads)"}`);
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
