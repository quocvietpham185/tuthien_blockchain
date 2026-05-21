const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");
const { validatePagination } = require("../middleware/validation");

/**
 * GET /api/transactions
 * Get all platform transactions (global history from smart contract)
 */
router.get("/", validatePagination, async (req, res) => {
  try {
    const transactions = await blockchainService.getAllTransactions();
    // Sort newest first
    let sorted = [...transactions].reverse();
    if (req.query.type) {
      sorted = sorted.filter((tx) => tx.txType === req.query.type);
    }
    if (req.query.actor) {
      sorted = sorted.filter((tx) => tx.actor.toLowerCase() === req.query.actor.toLowerCase());
    }
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : sorted.length;
    const paged = sorted.slice(offset, offset + limit);
    res.json({ success: true, count: paged.length, total: sorted.length, data: paged });
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
