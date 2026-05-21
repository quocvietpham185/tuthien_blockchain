const { ethers } = require("ethers");

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function validateCampaignId(req, res, next) {
  if (!isPositiveInteger(req.params.id)) {
    return res.status(400).json({ success: false, error: "Invalid campaign id" });
  }
  next();
}

function validateAddressParam(paramName = "address") {
  return (req, res, next) => {
    if (!ethers.isAddress(req.params[paramName])) {
      return res.status(400).json({ success: false, error: "Invalid wallet address" });
    }
    next();
  };
}

function validatePagination(req, res, next) {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const offset = req.query.offset ? Number(req.query.offset) : undefined;

  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
    return res.status(400).json({ success: false, error: "limit must be 1-100" });
  }

  if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
    return res.status(400).json({ success: false, error: "offset must be 0 or greater" });
  }

  next();
}

module.exports = {
  validateAddressParam,
  validateCampaignId,
  validatePagination,
};
