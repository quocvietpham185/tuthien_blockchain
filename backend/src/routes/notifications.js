const express = require("express");
const { requireAuth } = require("../middleware/auth");
const notificationService = require("../services/notificationService");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const unreadOnly = req.query.unreadOnly === "true";
  const notifications = notificationService.listNotifications({
    address: req.walletAddress,
    unreadOnly,
  });
  res.json({ success: true, count: notifications.length, data: notifications });
});

router.post("/read-all", requireAuth, (req, res) => {
  const count = notificationService.markAllRead(req.walletAddress);
  res.json({ success: true, data: { markedRead: count } });
});

module.exports = router;
