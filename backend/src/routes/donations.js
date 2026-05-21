const express = require("express");
const router = express.Router();
const blockchainService = require("../services/blockchainService");
const { validateAddressParam } = require("../middleware/validation");

/**
 * GET /api/donations/user/:address
 * Get all donations made by a user
 */
router.get("/user/:address", validateAddressParam("address"), async (req, res) => {
  try {
    const donations = await blockchainService.getUserDonations(req.params.address);
    res.json({ success: true, count: donations.length, data: donations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
