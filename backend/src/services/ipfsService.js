/**
 * Mock IPFS Service
 * Simulates IPFS by storing files locally and returning CID-like hashes
 * In production, replace with Pinata or Infura IPFS API
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Generate a fake IPFS CID (Content Identifier) from file content
 * Format: Qm + 44 hex chars (mimics real IPFS CIDv0)
 */
function generateCID(content) {
  const hash = crypto
    .createHash("sha256")
    .update(typeof content === "string" ? content : JSON.stringify(content))
    .digest("hex");
  return "Qm" + hash.substring(0, 44);
}

/**
 * Upload a file to mock IPFS (local storage)
 * @param {Buffer} fileBuffer - File data
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type
 * @returns {object} { cid, url, size }
 */
async function uploadFile(fileBuffer, originalName, mimeType) {
  const ext = path.extname(originalName) || ".bin";
  const cid = generateCID(fileBuffer);
  const fileName = `${cid}${ext}`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  fs.writeFileSync(filePath, fileBuffer);

  const baseUrl = process.env.IPFS_BASE_URL || "http://localhost:5000/ipfs";
  const url = `${baseUrl}/${fileName}`;

  console.log(`📁 [IPFS] Uploaded: ${fileName} (${fileBuffer.length} bytes)`);
  console.log(`   CID: ${cid}`);
  console.log(`   URL: ${url}`);

  return {
    cid,
    fileName,
    url,
    size: fileBuffer.length,
    mimeType,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Upload JSON metadata to mock IPFS
 * @param {object} metadata - JSON object to store
 * @returns {object} { cid, url }
 */
async function uploadJSON(metadata) {
  const content = JSON.stringify(metadata, null, 2);
  const cid = generateCID(content);
  const fileName = `${cid}.json`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  fs.writeFileSync(filePath, content, "utf8");

  const baseUrl = process.env.IPFS_BASE_URL || "http://localhost:5000/ipfs";
  const url = `${baseUrl}/${fileName}`;

  console.log(`📋 [IPFS] Uploaded metadata: ${fileName}`);

  return {
    cid,
    fileName,
    url,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Retrieve a file from mock IPFS by CID
 */
async function getFile(cid) {
  const files = fs.readdirSync(UPLOADS_DIR);
  const file = files.find((f) => f.startsWith(cid));

  if (!file) {
    throw new Error(`File not found for CID: ${cid}`);
  }

  const filePath = path.join(UPLOADS_DIR, file);
  const content = fs.readFileSync(filePath);
  const stats = fs.statSync(filePath);

  return {
    cid,
    fileName: file,
    content,
    size: stats.size,
    path: filePath,
  };
}

/**
 * List all files in mock IPFS
 */
async function listFiles() {
  const files = fs.readdirSync(UPLOADS_DIR);
  const baseUrl = process.env.IPFS_BASE_URL || "http://localhost:5000/ipfs";

  return files.map((fileName) => {
    const filePath = path.join(UPLOADS_DIR, fileName);
    const stats = fs.statSync(filePath);
    const cid = fileName.replace(/\.[^/.]+$/, ""); // Remove extension

    return {
      cid: cid.startsWith("Qm") ? cid : fileName,
      fileName,
      url: `${baseUrl}/${fileName}`,
      size: stats.size,
      createdAt: stats.birthtime.toISOString(),
    };
  });
}

/**
 * Get IPFS gateway URL for a CID
 */
function getIPFSUrl(cid) {
  if (!cid) return null;
  const baseUrl = process.env.IPFS_BASE_URL || "http://localhost:5000/ipfs";

  // Check if file exists with any extension
  const files = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : [];
  const file = files.find((f) => f.startsWith(cid));

  if (file) {
    return `${baseUrl}/${file}`;
  }

  // Return generic URL pattern
  return `${baseUrl}/${cid}`;
}

module.exports = {
  uploadFile,
  uploadJSON,
  getFile,
  listFiles,
  getIPFSUrl,
  generateCID,
};
