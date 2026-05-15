import axios from "axios";

const BACKEND_URL = "http://localhost:5000";

/**
 * Upload image to mock IPFS via backend
 * @param {File} file - Image file
 * @returns {object} { cid, url }
 */
export async function uploadImageToIPFS(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await axios.post(`${BACKEND_URL}/api/ipfs/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log(`IPFS Upload: ${pct}%`);
    },
  });

  return response.data.data;
}

/**
 * Upload JSON metadata to IPFS
 * @param {object} metadata
 * @returns {object} { cid, url }
 */
export async function uploadMetadataToIPFS(metadata) {
  const response = await axios.post(`${BACKEND_URL}/api/ipfs/upload-json`, metadata);
  return response.data.data;
}

/**
 * Get IPFS file URL from CID
 */
export function getIPFSUrl(cid) {
  if (!cid) return null;
  if (cid.startsWith("http")) return cid;
  return `${BACKEND_URL}/ipfs/${cid}`;
}

/**
 * List all IPFS files
 */
export async function listIPFSFiles() {
  const response = await axios.get(`${BACKEND_URL}/api/ipfs/files`);
  return response.data.data;
}
