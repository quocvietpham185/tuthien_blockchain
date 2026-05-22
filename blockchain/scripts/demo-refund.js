const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const deploymentPath = path.join(__dirname, "../deployments/localhost.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("No localhost deployment found. Run npm run deploy:local first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deployment.contractAddress;
  const [owner, donor] = await hre.ethers.getSigners();

  const CharityDonation = await hre.ethers.getContractFactory("CharityDonation");
  const contract = CharityDonation.attach(contractAddress);

  console.log("Creating failed refund demo campaign...");
  console.log("Contract:", contractAddress);
  console.log("Owner:", owner.address);
  console.log("Donor:", donor.address);

  const createTx = await contract.createCampaign(
    "Demo Refund - Campaign Khong Dat Muc Tieu",
    "Campaign demo cho tinh nang refund. Donor da quyen gop nhung campaign het han ma khong dat goal, vi vay donor co the nhan hoan tien tren UI.",
    "Khac",
    "/campaigns/disaster.svg",
    hre.ethers.parseEther("5"),
    1
  );
  await createTx.wait();

  const campaignCount = await contract.campaignCount();
  const campaignId = campaignCount.toString();

  const donateTx = await contract.connect(donor).donate(
    campaignId,
    "Demo donation se duoc refund",
    { value: hre.ethers.parseEther("0.2") }
  );
  await donateTx.wait();

  await hre.network.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
  await hre.network.provider.send("evm_mine");

  const refundable = await contract.getRefundableAmount(campaignId, donor.address);
  const campaign = await contract.getCampaign(campaignId);

  console.log("\nRefund demo is ready.");
  console.log("Campaign ID:", campaignId);
  console.log("Raised:", hre.ethers.formatEther(campaign.raised), "ETH");
  console.log("Goal:", hre.ethers.formatEther(campaign.goal), "ETH");
  console.log("Refundable for donor:", hre.ethers.formatEther(refundable), "ETH");
  console.log("\nTo show it in UI:");
  console.log(`1. Import/use donor account: ${donor.address}`);
  console.log(`2. Open http://localhost:5173/campaign/${campaignId}`);
  console.log("3. Click 'Nhan Hoan Tien' and confirm MetaMask.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Demo refund setup failed:", error);
    process.exit(1);
  });
