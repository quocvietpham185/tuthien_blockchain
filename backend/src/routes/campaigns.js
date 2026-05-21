const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");
const ipfsService = require("../services/ipfsService");
const { validateCampaignId, validatePagination } = require("../middleware/validation");

/**
 * GET /api/campaigns
 * Get all campaigns from blockchain
 */
router.get("/", validatePagination, async (req, res) => {
  try {
    const campaigns = await blockchainService.getCampaigns();

    // Enrich with IPFS URLs
    const enriched = campaigns.map((c) => ({
      ...c,
      imageUrl: ipfsService.getIPFSUrl(c.ipfsHash),
    }));

    const q = (req.query.search || "").toString().trim().toLowerCase();
    const category = (req.query.category || "").toString();
    const status = (req.query.status || "").toString();
    const minGoal = req.query.minGoal ? Number(req.query.minGoal) : null;
    const maxGoal = req.query.maxGoal ? Number(req.query.maxGoal) : null;
    const now = Math.floor(Date.now() / 1000);

    let filtered = enriched.filter((campaign) => {
      if (q && !`${campaign.title} ${campaign.description}`.toLowerCase().includes(q)) return false;
      if (category && category !== "all" && campaign.category !== category) return false;
      if (minGoal !== null && Number(campaign.goal) < minGoal) return false;
      if (maxGoal !== null && Number(campaign.goal) > maxGoal) return false;
      if (status === "active" && (!campaign.active || Number(campaign.deadline) < now)) return false;
      if (status === "expired" && Number(campaign.deadline) >= now) return false;
      if (status === "withdrawn" && !campaign.withdrawn) return false;
      if (status === "completed" && Number(campaign.raised) < Number(campaign.goal) && !campaign.withdrawn) return false;
      return true;
    });

    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    res.json({ success: true, count: paged.length, total: filtered.length, data: paged });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/campaigns/:id
 * Get a single campaign by ID
 */
router.get("/:id", validateCampaignId, async (req, res) => {
  try {
    const campaign = await blockchainService.getCampaign(parseInt(req.params.id));
    const imageUrl = ipfsService.getIPFSUrl(campaign.ipfsHash);

    res.json({ success: true, data: { ...campaign, imageUrl } });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/campaigns/:id/donations
 * Get all donations for a campaign
 */
router.get("/:id/donations", validateCampaignId, async (req, res) => {
  try {
    const donations = await blockchainService.getCampaignDonations(parseInt(req.params.id));
    res.json({ success: true, count: donations.length, data: donations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
