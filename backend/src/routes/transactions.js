const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");

/**
 * GET /api/transactions
 * Get all platform transactions (global history from smart contract)
 */
router.get("/", async (req, res) => {
  try {
    const transactions = await blockchainService.getAllTransactions();
    // Sort newest first
    const sorted = [...transactions].reverse();
    res.json({ success: true, count: sorted.length, data: sorted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/transactions/events
 * Get raw blockchain events (DonationReceived, CampaignCreated, etc.)
 */
router.get("/events", async (req, res) => {
  try {
    const fromBlock = req.query.fromBlock ? parseInt(req.query.fromBlock) : 0;
    const events = await blockchainService.getRecentEvents(fromBlock);
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
