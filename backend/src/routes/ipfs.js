const express = require("express");
const router = express.Router();
const multer = require("multer");
const ipfsService = require("../services/ipfsService");

// Multer memory storage (we handle file saving manually)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

/**
 * POST /api/ipfs/upload
 * Upload an image to mock IPFS
 */
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const result = await ipfsService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      data: {
        cid: result.cid,
        url: result.url,
        fileName: result.fileName,
        size: result.size,
        message: "File uploaded to IPFS (mock)",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ipfs/upload-json
 * Upload JSON metadata to mock IPFS
 */
router.post("/upload-json", async (req, res) => {
  try {
    const metadata = req.body;
    if (!metadata || Object.keys(metadata).length === 0) {
      return res.status(400).json({ success: false, error: "No metadata provided" });
    }

    const result = await ipfsService.uploadJSON(metadata);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ipfs/files
 * List all files in mock IPFS
 */
router.get("/files", async (req, res) => {
  try {
    const files = await ipfsService.listFiles();
    res.json({ success: true, count: files.length, data: files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ipfs/:cid
 * Get file info by CID
 */
router.get("/:cid", async (req, res) => {
  try {
    const url = ipfsService.getIPFSUrl(req.params.cid);
    res.json({ success: true, data: { cid: req.params.cid, url } });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

module.exports = router;
