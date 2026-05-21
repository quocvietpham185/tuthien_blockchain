const express = require("express");
const blockchainService = require("../services/blockchainService");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

async function requireAdmin(req, res, next) {
  try {
    const owner = await blockchainService.getPlatformOwner();
    if (owner.toLowerCase() !== req.walletAddress) {
      return res.status(403).json({ success: false, error: "Platform owner access required" });
    }
    req.platformOwner = owner;
    next();
  } catch (error) {
    res.status(503).json({ success: false, error: error.message });
  }
}

router.use(requireAuth, requireAdmin);

router.get("/overview", async (req, res) => {
  try {
    const [campaigns, transactions, stats] = await Promise.all([
      blockchainService.getCampaigns(),
      blockchainService.getAllTransactions(),
      blockchainService.getAdvancedStats(),
    ]);

    res.json({
      success: true,
      data: {
        owner: req.platformOwner,
        stats,
        recentCampaigns: campaigns.slice(-10).reverse(),
        recentTransactions: transactions.slice(-10).reverse(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
