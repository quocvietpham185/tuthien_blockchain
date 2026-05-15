import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./pages/Home";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import { useWallet } from "./hooks/useWallet";
import { useContract } from "./hooks/useContract";
import "./styles/pages.css";

export default function App() {
  const wallet = useWallet();
  const contractHooks = useContract(wallet.signer, wallet.provider);

  return (
    <>
      <Navbar
        account={wallet.account}
        balance={wallet.balance}
        chainId={wallet.chainId}
        isConnecting={wallet.isConnecting}
        connectWallet={wallet.connectWallet}
        disconnectWallet={wallet.disconnectWallet}
        switchToHardhat={wallet.switchToHardhat}
      />

      <Routes>
        <Route
          path="/"
          element={<Home contractHooks={contractHooks} account={wallet.account} />}
        />
        <Route
          path="/campaign/:id"
          element={<CampaignDetail contractHooks={contractHooks} account={wallet.account} />}
        />
        <Route
          path="/create"
          element={<CreateCampaign contractHooks={contractHooks} account={wallet.account} />}
        />
        <Route
          path="/dashboard"
          element={<Dashboard contractHooks={contractHooks} account={wallet.account} />}
        />
        <Route
          path="/transactions"
          element={<Transactions contractHooks={contractHooks} account={wallet.account} />}
        />
      </Routes>
    </>
  );
}
