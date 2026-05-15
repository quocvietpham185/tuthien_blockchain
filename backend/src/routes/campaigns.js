const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");
const ipfsService = require("../services/ipfsService");

/**
 * GET /api/campaigns
 * Get all campaigns from blockchain
 */
router.get("/", async (req, res) => {
  try {
    const campaigns = await blockchainService.getCampaigns();

    // Enrich with IPFS URLs
    const enriched = campaigns.map((c) => ({
      ...c,
      imageUrl: ipfsService.getIPFSUrl(c.ipfsHash),
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/campaigns/:id
 * Get a single campaign by ID
 */
router.get("/:id", async (req, res) => {
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
router.get("/:id/donations", async (req, res) => {
  try {
    const donations = await blockchainService.getCampaignDonations(parseInt(req.params.id));
    res.json({ success: true, count: donations.length, data: donations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
