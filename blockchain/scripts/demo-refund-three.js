const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const REFUND_CAMPAIGNS = [
  {
    title: "Refund Demo 1 - Thu Vien Vung Cao",
    description:
      "Chien dich demo refund: co tien quyen gop nhung khong dat muc tieu sau deadline. Dung de test nut Nhan Hoan Tien.",
    category: "Giáo dục",
    ipfsHash: "/campaigns/education.svg",
    goalEth: "5",
    donationEth: "0.25",
  },
  {
    title: "Refund Demo 2 - Ho Tro Vien Phi",
    description:
      "Chien dich demo refund cho y te. Campaign het han, so tien raised nho hon goal nen donor co the nhan hoan tien.",
    category: "Y tế",
    ipfsHash: "/campaigns/medical.svg",
    goalEth: "8",
    donationEth: "0.4",
  },
  {
    title: "Refund Demo 3 - Cuu Tro Sau Lu",
    description:
      "Chien dich demo refund cho thien tai. Donor da donate nhung campaign khong dat muc tieu truoc deadline.",
    category: "Thiên tai",
    ipfsHash: "/campaigns/disaster.svg",
    goalEth: "6",
    donationEth: "0.35",
  },
];

async function main() {
  const deploymentPath = path.join(__dirname, "../deployments/localhost.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("No localhost deployment found. Run npm run deploy:local first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deployment.contractAddress;
  const [owner, donor1, donor2, donor3] = await hre.ethers.getSigners();

  const CharityDonation = await hre.ethers.getContractFactory("CharityDonation");
  const contract = CharityDonation.attach(contractAddress);
  const donors = [donor1, donor2, donor3];
  const created = [];

  console.log("Creating three failed campaigns for refund demo...");
  console.log("Contract:", contractAddress);

  for (let index = 0; index < REFUND_CAMPAIGNS.length; index++) {
    const campaign = REFUND_CAMPAIGNS[index];
    const donor = donors[index];

    const createTx = await contract.connect(owner).createCampaign(
      campaign.title,
      campaign.description,
      campaign.category,
      campaign.ipfsHash,
      hre.ethers.parseEther(campaign.goalEth),
      1
    );
    await createTx.wait();

    const campaignId = (await contract.campaignCount()).toString();
    const donateTx = await contract.connect(donor).donate(
      campaignId,
      "Donation demo de test refund",
      { value: hre.ethers.parseEther(campaign.donationEth) }
    );
    await donateTx.wait();

    created.push({ campaignId, donor, campaign });
  }

  await hre.network.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
  await hre.network.provider.send("evm_mine");

  console.log("\nThree refund campaigns are ready:");
  for (const item of created) {
    const campaign = await contract.getCampaign(item.campaignId);
    const refundable = await contract.getRefundableAmount(item.campaignId, item.donor.address);
    console.log("--------------------------------------------------");
    console.log("Title:", item.campaign.title);
    console.log("Campaign ID:", item.campaignId);
    console.log("Goal:", hre.ethers.formatEther(campaign.goal), "ETH");
    console.log("Raised:", hre.ethers.formatEther(campaign.raised), "ETH");
    console.log("Donor:", item.donor.address);
    console.log("Refundable:", hre.ethers.formatEther(refundable), "ETH");
    console.log(`URL: http://localhost:5173/campaign/${item.campaignId}`);
  }

  console.log("--------------------------------------------------");
  console.log("Use the matching donor wallet to see and click the refund button.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Three refund demos setup failed:", error);
    process.exit(1);
  });
