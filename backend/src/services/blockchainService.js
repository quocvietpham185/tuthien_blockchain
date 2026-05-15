const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

let provider = null;
let contract = null;
let contractConfig = null;

/**
 * Load contract config (ABI + address)
 */
function loadContractConfig() {
  const configPath = path.join(__dirname, "../contracts/CharityDonation.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(
      "Contract not deployed yet. Run: cd blockchain && npm run deploy:local"
    );
  }
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

/**
 * Initialize blockchain connection and event listeners
 */
async function initialize() {
  const rpcUrl = process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545";

  provider = new ethers.JsonRpcProvider(rpcUrl);

  // Verify connection
  const network = await provider.getNetwork();
  console.log(`  Connected to chain ID: ${network.chainId}`);

  // Load contract
  contractConfig = loadContractConfig();
  const contractAddress = contractConfig.address || process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("Contract address not found. Deploy contract first.");
  }

  contract = new ethers.Contract(contractAddress, contractConfig.abi, provider);

  // Start event listeners
  setupEventListeners();

  return { network, contractAddress };
}

/**
 * Setup blockchain event listeners
 */
function setupEventListeners() {
  if (!contract) return;

  contract.on("CampaignCreated", (id, owner, title, category, goal, deadline, ipfsHash, timestamp, event) => {
    console.log(`📢 [EVENT] CampaignCreated: #${id} "${title}" by ${owner.slice(0, 8)}...`);
  });

  contract.on("DonationReceived", (campaignId, donor, amount, message, timestamp, totalRaised, event) => {
    console.log(
      `💰 [EVENT] DonationReceived: ${ethers.formatEther(amount)} ETH to Campaign #${campaignId} from ${donor.slice(0, 8)}...`
    );
  });

  contract.on("FundsWithdrawn", (campaignId, owner, amount, timestamp, event) => {
    console.log(
      `🏦 [EVENT] FundsWithdrawn: ${ethers.formatEther(amount)} ETH from Campaign #${campaignId}`
    );
  });
}

/**
 * Get blockchain + contract status
 */
async function getStatus() {
  if (!provider) {
    return { connected: false, error: "Not initialized" };
  }
  try {
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const contractAddress = contractConfig?.address || "Not deployed";
    return {
      connected: true,
      chainId: network.chainId.toString(),
      blockNumber,
      contractAddress,
      rpcUrl: process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545",
    };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

/**
 * Get all campaigns from blockchain
 */
async function getCampaigns() {
  if (!contract) throw new Error("Contract not initialized");

  const campaigns = await contract.getCampaigns();
  return campaigns.map(formatCampaign);
}

/**
 * Get a single campaign
 */
async function getCampaign(campaignId) {
  if (!contract) throw new Error("Contract not initialized");
  const campaign = await contract.getCampaign(campaignId);
  return formatCampaign(campaign);
}

/**
 * Get donations for a campaign
 */
async function getCampaignDonations(campaignId) {
  if (!contract) throw new Error("Contract not initialized");
  const donations = await contract.getCampaignDonations(campaignId);
  return donations.map(formatDonation);
}

/**
 * Get donations made by a user
 */
async function getUserDonations(userAddress) {
  if (!contract) throw new Error("Contract not initialized");
  const donations = await contract.getUserDonations(userAddress);
  return donations.map(formatDonation);
}

/**
 * Get all platform transactions (history)
 */
async function getAllTransactions() {
  if (!contract) throw new Error("Contract not initialized");
  const txs = await contract.getAllTransactions();
  return txs.map(formatTransaction);
}

/**
 * Get platform statistics
 */
async function getPlatformStats() {
  if (!contract) throw new Error("Contract not initialized");

  const [totalCampaigns, totalDonations, activeCampaigns] =
    await contract.getPlatformStats();

  const blockNumber = await provider.getBlockNumber();
  const network = await provider.getNetwork();

  return {
    totalCampaigns: totalCampaigns.toString(),
    totalDonations: ethers.formatEther(totalDonations),
    totalDonationsWei: totalDonations.toString(),
    activeCampaigns: activeCampaigns.toString(),
    blockNumber,
    chainId: network.chainId.toString(),
    contractAddress: contractConfig?.address,
  };
}

/**
 * Get recent events from blockchain logs
 */
async function getRecentEvents(fromBlock = 0) {
  if (!contract) throw new Error("Contract not initialized");

  const currentBlock = await provider.getBlockNumber();
  const startBlock = Math.max(0, fromBlock || currentBlock - 1000);

  const [createdEvents, donationEvents, withdrawEvents] = await Promise.all([
    contract.queryFilter(contract.filters.CampaignCreated(), startBlock),
    contract.queryFilter(contract.filters.DonationReceived(), startBlock),
    contract.queryFilter(contract.filters.FundsWithdrawn(), startBlock),
  ]);

  const allEvents = [
    ...createdEvents.map((e) => ({
      type: "CampaignCreated",
      txHash: e.transactionHash,
      blockNumber: e.blockNumber,
      campaignId: e.args[0].toString(),
      actor: e.args[1],
      title: e.args[2],
      goal: ethers.formatEther(e.args[4]),
      timestamp: e.args[7].toString(),
    })),
    ...donationEvents.map((e) => ({
      type: "DonationReceived",
      txHash: e.transactionHash,
      blockNumber: e.blockNumber,
      campaignId: e.args[0].toString(),
      actor: e.args[1],
      amount: ethers.formatEther(e.args[2]),
      message: e.args[3],
      timestamp: e.args[4].toString(),
    })),
    ...withdrawEvents.map((e) => ({
      type: "FundsWithdrawn",
      txHash: e.transactionHash,
      blockNumber: e.blockNumber,
      campaignId: e.args[0].toString(),
      actor: e.args[1],
      amount: ethers.formatEther(e.args[2]),
      timestamp: e.args[3].toString(),
    })),
  ];

  // Sort by block number desc
  return allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
}

// ==================== FORMATTERS ====================

function formatCampaign(c) {
  return {
    id: c.id.toString(),
    owner: c.owner,
    title: c.title,
    description: c.description,
    category: c.category,
    ipfsHash: c.ipfsHash,
    goal: ethers.formatEther(c.goal),
    goalWei: c.goal.toString(),
    raised: ethers.formatEther(c.raised),
    raisedWei: c.raised.toString(),
    deadline: c.deadline.toString(),
    donorCount: c.donorCount.toString(),
    active: c.active,
    withdrawn: c.withdrawn,
    createdAt: c.createdAt.toString(),
    progress:
      c.goal > 0n
        ? Math.min(100, Math.round((Number(c.raised) * 100) / Number(c.goal)))
        : 0,
  };
}

function formatDonation(d) {
  return {
    donor: d.donor,
    campaignId: d.campaignId.toString(),
    amount: ethers.formatEther(d.amount),
    amountWei: d.amount.toString(),
    timestamp: d.timestamp.toString(),
    message: d.message,
  };
}

function formatTransaction(t) {
  return {
    txType: t.txType,
    campaignId: t.campaignId.toString(),
    actor: t.actor,
    amount: ethers.formatEther(t.amount),
    amountWei: t.amount.toString(),
    timestamp: t.timestamp.toString(),
    campaignTitle: t.campaignTitle,
  };
}

module.exports = {
  initialize,
  getStatus,
  getCampaigns,
  getCampaign,
  getCampaignDonations,
  getUserDonations,
  getAllTransactions,
  getPlatformStats,
  getRecentEvents,
};
