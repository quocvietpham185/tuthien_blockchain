import axios from "axios";

const BACKEND_URL = "http://localhost:5000";

export const DEFAULT_CAMPAIGN_IMAGES = {
  "Giáo dục": "/campaigns/education.svg",
  "Y tế": "/campaigns/medical.svg",
  "Thiên tai": "/campaigns/disaster.svg",
  "Môi trường": "/campaigns/environment.svg",
  "GiÃ¡o dá»¥c": "/campaigns/education.svg",
  "Y táº¿": "/campaigns/medical.svg",
  "ThiÃªn tai": "/campaigns/disaster.svg",
  "MÃ´i trÆ°á»ng": "/campaigns/environment.svg",
};

const SAMPLE_IPFS_IMAGES = {
  QmEducation123456789abcdef: "/campaigns/education.svg",
  QmMedical987654321fedcba: "/campaigns/medical.svg",
  QmDisaster555666777888: "/campaigns/disaster.svg",
  QmEnvironment111222333: "/campaigns/environment.svg",
};

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
  if (cid.startsWith("/")) return cid;
  if (SAMPLE_IPFS_IMAGES[cid]) return SAMPLE_IPFS_IMAGES[cid];
  return `${BACKEND_URL}/ipfs/${cid}`;
}

export function getDefaultCampaignImage(category) {
  return DEFAULT_CAMPAIGN_IMAGES[category] || "/campaigns/education.svg";
}

export function getCampaignImageUrl(campaign) {
  if (!campaign) return null;
  return getIPFSUrl(campaign.ipfsHash) || getDefaultCampaignImage(campaign.category);
}

/**
 * List all IPFS files
 */
export async function listIPFSFiles() {
  const response = await axios.get(`${BACKEND_URL}/api/ipfs/files`);
  return response.data.data;
}
