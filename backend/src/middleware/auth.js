const crypto = require("crypto");

const sessions = new Map();

function createToken(address) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    address: address.toLowerCase(),
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });
  return token;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const session = token ? sessions.get(token) : null;

  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  req.walletAddress = session.address;
  next();
}

module.exports = {
  createToken,
  requireAuth,
};
