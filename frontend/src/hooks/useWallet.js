import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { HARDHAT_CHAIN_ID, HARDHAT_NETWORK } from "../constants";

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState("0");
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
  };

  // Switch to Hardhat network
  const switchToHardhat = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_NETWORK.chainId }],
      });
    } catch (error) {
      if (error.code === 4902) {
        // Network not added, add it
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [HARDHAT_NETWORK],
          });
        } catch (addError) {
          toast.error("Không thể thêm mạng Hardhat vào MetaMask");
        }
      }
    }
  };

  // Update balance
  const updateBalance = useCallback(async (addr, prov) => {
    if (!addr || !prov) return;
    try {
      const bal = await prov.getBalance(addr);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
    } catch {
      setBalance("0");
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      toast.error("Vui lòng cài đặt MetaMask để sử dụng ứng dụng!");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setIsConnecting(true);
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        toast.error("Không có tài khoản nào được chọn");
        return;
      }

      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();
      const currentChainId = Number(network.chainId);

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId(currentChainId);

      const correct = currentChainId === HARDHAT_CHAIN_ID;
      setIsCorrectNetwork(correct);

      await updateBalance(accounts[0], web3Provider);

      if (!correct) {
        toast("⚠️ Vui lòng chuyển sang mạng Hardhat Local (Chain ID: 31337)", {
          icon: "⚠️",
          duration: 5000,
        });
        await switchToHardhat();
      } else {
        toast.success(`Kết nối thành công! ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
      }
    } catch (error) {
      if (error.code === 4001) {
        toast.error("Bạn đã từ chối kết nối ví");
      } else {
        toast.error("Lỗi kết nối ví: " + error.message);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [updateBalance]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setBalance("0");
    setChainId(null);
    setIsCorrectNetwork(false);
    toast.success("Đã ngắt kết nối ví");
  }, []);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (!isMetaMaskInstalled()) return;
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const web3Signer = await web3Provider.getSigner();
          const network = await web3Provider.getNetwork();
          const currentChainId = Number(network.chainId);

          setProvider(web3Provider);
          setSigner(web3Signer);
          setAccount(accounts[0]);
          setChainId(currentChainId);
          setIsCorrectNetwork(currentChainId === HARDHAT_CHAIN_ID);
          await updateBalance(accounts[0], web3Provider);
        }
      } catch {
        // Silent fail
      }
    };
    autoConnect();
  }, [updateBalance]);

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
        toast("Ví đã ngắt kết nối", { icon: "ℹ️" });
      } else {
        setAccount(accounts[0]);
        if (provider) await updateBalance(accounts[0], provider);
        toast.success(`Chuyển tài khoản: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
      }
    };

    const handleChainChanged = (newChainId) => {
      const cid = parseInt(newChainId, 16);
      setChainId(cid);
      setIsCorrectNetwork(cid === HARDHAT_CHAIN_ID);
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [provider, disconnectWallet, updateBalance]);

  // Refresh balance periodically
  useEffect(() => {
    if (!account || !provider) return;
    const interval = setInterval(() => updateBalance(account, provider), 15000);
    return () => clearInterval(interval);
  }, [account, provider, updateBalance]);

  return {
    account,
    provider,
    signer,
    balance,
    chainId,
    isConnecting,
    isCorrectNetwork,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connectWallet,
    disconnectWallet,
    switchToHardhat,
    updateBalance: () => updateBalance(account, provider),
  };
}
