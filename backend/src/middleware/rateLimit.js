const buckets = new Map();

function rateLimit({ windowMs = 60_000, max = 120 } = {}) {
  return (req, res, next) => {
    const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      res.set("Retry-After", Math.ceil((current.resetAt - now) / 1000).toString());
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please try again later.",
      });
    }

    next();
  };
}

module.exports = rateLimit;
