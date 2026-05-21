const express = require("express");
const { ethers } = require("ethers");
const crypto = require("crypto");
const { createToken, requireAuth } = require("../middleware/auth");

const router = express.Router();
const nonces = new Map();

function buildMessage(address, nonce) {
  return [
    "Sign in to CharityChain",
    `Wallet: ${address}`,
    `Nonce: ${nonce}`,
    "This signature does not trigger a blockchain transaction.",
  ].join("\n");
}

router.post("/nonce", (req, res) => {
  const { address } = req.body || {};
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ success: false, error: "Invalid wallet address" });
  }

  const normalized = ethers.getAddress(address);
  const nonce = crypto.randomBytes(16).toString("hex");
  nonces.set(normalized.toLowerCase(), { nonce, expiresAt: Date.now() + 10 * 60 * 1000 });

  res.json({
    success: true,
    data: {
      address: normalized,
      nonce,
      message: buildMessage(normalized, nonce),
    },
  });
});

router.post("/verify", (req, res) => {
  try {
    const { address, signature } = req.body || {};
    if (!ethers.isAddress(address) || !signature) {
      return res.status(400).json({ success: false, error: "Address and signature are required" });
    }

    const normalized = ethers.getAddress(address);
    const entry = nonces.get(normalized.toLowerCase());
    if (!entry || entry.expiresAt <= Date.now()) {
      return res.status(400).json({ success: false, error: "Nonce expired. Request a new nonce." });
    }

    const recovered = ethers.verifyMessage(buildMessage(normalized, entry.nonce), signature);
    if (recovered.toLowerCase() !== normalized.toLowerCase()) {
      return res.status(401).json({ success: false, error: "Invalid signature" });
    }

    nonces.delete(normalized.toLowerCase());
    const token = createToken(normalized);

    res.json({ success: true, data: { token, address: normalized } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, data: { address: req.walletAddress } });
});

module.exports = router;
