import { useCallback } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import ContractABI from "../contracts/CharityDonation.json";
import { HARDHAT_RPC_URL } from "../constants";
import { fixVietnameseText } from "../utils/format";

export function useContract(signer, provider) {
  const getContract = useCallback(
    (withSigner = false) => {
      const config = ContractABI;
      if (!config || !config.address) {
        throw new Error("Contract not deployed. Run: npm run deploy:local in blockchain/");
      }
      const signerOrProvider = withSigner
        ? signer
        : provider || new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
      if (!signerOrProvider) {
        throw new Error("Wallet not connected");
      }
      return new ethers.Contract(config.address, config.abi, signerOrProvider);
    },
    [signer, provider]
  );

  /**
   * Create a new campaign
   */
  const createCampaign = useCallback(
    async ({ title, description, category, ipfsHash, goal, durationDays }) => {
      const contract = getContract(true);
      const goalWei = ethers.parseEther(goal.toString());

      const toastId = toast.loading("Đang tạo chiến dịch trên blockchain...");
      try {
        const tx = await contract.createCampaign(
          title,
          description,
          category,
          ipfsHash,
          goalWei,
          durationDays
        );
        toast.loading("Đang chờ xác nhận transaction...", { id: toastId });
        const receipt = await tx.wait();
        toast.success("🎉 Chiến dịch đã được tạo!", { id: toastId });
        return { success: true, txHash: receipt.hash, receipt };
      } catch (error) {
        const msg = error.reason || error.message || "Transaction failed";
        toast.error("❌ Lỗi: " + msg, { id: toastId });
        return { success: false, error: msg };
      }
    },
    [getContract]
  );

  /**
   * Donate to a campaign
   */
  const donate = useCallback(
    async (campaignId, amountEth, message = "") => {
      const contract = getContract(true);
      const amountWei = ethers.parseEther(amountEth.toString());

      const toastId = toast.loading(`Đang quyên góp ${amountEth} ETH...`);
      try {
        const tx = await contract.donate(campaignId, message, { value: amountWei });
        toast.loading("Đang chờ xác nhận transaction...", { id: toastId });
        const receipt = await tx.wait();
        toast.success(`💰 Đã quyên góp ${amountEth} ETH thành công!`, { id: toastId });
        return { success: true, txHash: receipt.hash, receipt };
      } catch (error) {
        const msg = error.reason || error.message || "Transaction failed";
        toast.error("❌ Lỗi quyên góp: " + msg, { id: toastId });
        return { success: false, error: msg };
      }
    },
    [getContract]
  );

  /**
   * Withdraw funds from a campaign
   */
  const withdrawFunds = useCallback(
    async (campaignId) => {
      const contract = getContract(true);
      const toastId = toast.loading("Đang rút tiền...");
      try {
        const tx = await contract.withdrawFunds(campaignId);
        toast.loading("Đang chờ xác nhận...", { id: toastId });
        const receipt = await tx.wait();
        toast.success("🏦 Đã rút tiền thành công!", { id: toastId });
        return { success: true, txHash: receipt.hash, receipt };
      } catch (error) {
        const msg = error.reason || error.message || "Transaction failed";
        toast.error("❌ Lỗi rút tiền: " + msg, { id: toastId });
        return { success: false, error: msg };
      }
    },
    [getContract]
  );

  const refundDonation = useCallback(
    async (campaignId) => {
      const contract = getContract(true);
      const toastId = toast.loading("Dang yeu cau hoan tien...");
      try {
        const tx = await contract.refundDonation(campaignId);
        toast.loading("Dang cho xac nhan transaction...", { id: toastId });
        const receipt = await tx.wait();
        toast.success("Da hoan tien thanh cong", { id: toastId });
        return { success: true, txHash: receipt.hash, receipt };
      } catch (error) {
        const msg = error.reason || error.message || "Transaction failed";
        toast.error("Loi hoan tien: " + msg, { id: toastId });
        return { success: false, error: msg };
      }
    },
    [getContract]
  );

  const toggleCampaign = useCallback(
    async (campaignId) => {
      const contract = getContract(true);
      const toastId = toast.loading("Dang cap nhat trang thai chien dich...");
      try {
        const tx = await contract.toggleCampaign(campaignId);
        toast.loading("Dang cho xac nhan transaction...", { id: toastId });
        const receipt = await tx.wait();
        toast.success("Da cap nhat trang thai chien dich", { id: toastId });
        return { success: true, txHash: receipt.hash, receipt };
      } catch (error) {
        const msg = error.reason || error.message || "Transaction failed";
        toast.error("Loi cap nhat: " + msg, { id: toastId });
        return { success: false, error: msg };
      }
    },
    [getContract]
  );

  /**
   * Get all campaigns
   */
  const getCampaigns = useCallback(async () => {
    const contract = getContract(false);
    const campaigns = await contract.getCampaigns();
    return campaigns.map(formatCampaign);
  }, [getContract]);

  /**
   * Get a single campaign
   */
  const getCampaign = useCallback(
    async (campaignId) => {
      const contract = getContract(false);
      const campaign = await contract.getCampaign(campaignId);
      return formatCampaign(campaign);
    },
    [getContract]
  );

  /**
   * Get campaign donations
   */
  const getCampaignDonations = useCallback(
    async (campaignId) => {
      const contract = getContract(false);
      const donations = await contract.getCampaignDonations(campaignId);
      return donations.map(formatDonation);
    },
    [getContract]
  );

  /**
   * Get user donations
   */
  const getUserDonations = useCallback(
    async (userAddress) => {
      const contract = getContract(false);
      const donations = await contract.getUserDonations(userAddress);
      return donations.map(formatDonation);
    },
    [getContract]
  );

  /**
   * Get all transactions (global history)
   */
  const getAllTransactions = useCallback(async () => {
    const contract = getContract(false);
    const txs = await contract.getAllTransactions();
    return txs.map(formatTransaction);
  }, [getContract]);

  /**
   * Get platform stats
   */
  const getPlatformStats = useCallback(async () => {
    const contract = getContract(false);
    const [totalCampaigns, totalDonations, activeCampaigns] = await contract.getPlatformStats();
    return {
      totalCampaigns: totalCampaigns.toString(),
      totalDonations: ethers.formatEther(totalDonations),
      activeCampaigns: activeCampaigns.toString(),
    };
  }, [getContract]);

  const getPlatformOwner = useCallback(async () => {
    const contract = getContract(false);
    return contract.platformOwner();
  }, [getContract]);

  const getPlatformFee = useCallback(async () => {
    const contract = getContract(false);
    return (await contract.platformFee()).toString();
  }, [getContract]);

  const setPlatformFee = useCallback(
    async (feeBasisPoints) => {
      const contract = getContract(true);
      const toastId = toast.loading("Dang cap nhat platform fee...");
      try {
        const tx = await contract.setPlatformFee(feeBasisPoints);
        toast.loading("Dang cho xac nhan transaction...", { id: toastId });
        const receipt = await tx.wait();
        toast.success("Da cap nhat platform fee", { id: toastId });
        return { success: true, txHash: receipt.hash, receipt };
      } catch (error) {
        const msg = error.reason || error.message || "Transaction failed";
        toast.error("Loi cap nhat fee: " + msg, { id: toastId });
        return { success: false, error: msg };
      }
    },
    [getContract]
  );

  const getRefundableAmount = useCallback(
    async (campaignId, userAddress) => {
      if (!userAddress) return "0";
      const contract = getContract(false);
      const amount = await contract.getRefundableAmount(campaignId, userAddress);
      return ethers.formatEther(amount);
    },
    [getContract]
  );

  /**
   * Get contract address
   */
  const getContractAddress = () => {
    try {
      return ContractABI?.address || null;
    } catch {
      return null;
    }
  };

  return {
    createCampaign,
    donate,
    withdrawFunds,
    refundDonation,
    toggleCampaign,
    getCampaigns,
    getCampaign,
    getCampaignDonations,
    getUserDonations,
    getAllTransactions,
    getPlatformStats,
    getPlatformOwner,
    getPlatformFee,
    setPlatformFee,
    getRefundableAmount,
    getContractAddress,
  };
}

// ---- Formatters ----

function formatCampaign(c) {
  const goal = BigInt(c.goal);
  const raised = BigInt(c.raised);
  const progress = goal > 0n ? Math.min(100, Math.round((Number(raised) * 100) / Number(goal))) : 0;

  return {
    id: c.id.toString(),
    owner: c.owner,
    title: fixVietnameseText(c.title),
    description: fixVietnameseText(c.description),
    category: fixVietnameseText(c.category),
    ipfsHash: c.ipfsHash,
    goal: ethers.formatEther(c.goal),
    goalWei: c.goal.toString(),
    raised: ethers.formatEther(c.raised),
    raisedWei: c.raised.toString(),
    deadline: Number(c.deadline),
    donorCount: c.donorCount.toString(),
    active: c.active,
    withdrawn: c.withdrawn,
    createdAt: Number(c.createdAt),
    progress,
  };
}

function formatDonation(d) {
  return {
    donor: d.donor,
    campaignId: d.campaignId.toString(),
    amount: ethers.formatEther(d.amount),
    amountWei: d.amount.toString(),
    timestamp: Number(d.timestamp),
    message: fixVietnameseText(d.message),
  };
}

function formatTransaction(t) {
  return {
    txType: t.txType,
    campaignId: t.campaignId.toString(),
    actor: t.actor,
    amount: ethers.formatEther(t.amount),
    amountWei: t.amount.toString(),
    timestamp: Number(t.timestamp),
    campaignTitle: fixVietnameseText(t.campaignTitle),
  };
}
