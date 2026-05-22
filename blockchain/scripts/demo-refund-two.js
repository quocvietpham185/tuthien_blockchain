const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const DEMOS = [
  {
    title: "Demo Refund 1 - Lop Hoc Vung Cao",
    description:
      "Campaign demo hoan tien: donor da ung ho nhung chien dich het han va khong dat muc tieu. Dung campaign nay de show nut Nhan Hoan Tien tren UI.",
    category: "Giáo dục",
    ipfsHash: "/campaigns/education.svg",
    goalEth: "4",
    donationEth: "0.3",
  },
  {
    title: "Demo Refund 2 - Cuu Tro Sau Bao",
    description:
      "Campaign demo hoan tien thu hai cho buoi bao ve. Campaign co tien donate nhung khong dat goal sau deadline, donor co the refund truc tiep tu smart contract.",
    category: "Thiên tai",
    ipfsHash: "/campaigns/disaster.svg",
    goalEth: "6",
    donationEth: "0.5",
  },
];

async function main() {
  const deploymentPath = path.join(__dirname, "../deployments/localhost.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("No localhost deployment found. Run npm run deploy:local first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deployment.contractAddress;
  const [owner, donor1, donor2] = await hre.ethers.getSigners();

  const CharityDonation = await hre.ethers.getContractFactory("CharityDonation");
  const contract = CharityDonation.attach(contractAddress);
  const donors = [donor1, donor2];
  const created = [];

  console.log("Creating two refund demo campaigns...");
  console.log("Contract:", contractAddress);

  for (let index = 0; index < DEMOS.length; index++) {
    const demo = DEMOS[index];
    const donor = donors[index];

    const createTx = await contract.connect(owner).createCampaign(
      demo.title,
      demo.description,
      demo.category,
      demo.ipfsHash,
      hre.ethers.parseEther(demo.goalEth),
      1
    );
    await createTx.wait();

    const campaignId = (await contract.campaignCount()).toString();
    const donateTx = await contract.connect(donor).donate(
      campaignId,
      "Demo donation se duoc hoan tien",
      { value: hre.ethers.parseEther(demo.donationEth) }
    );
    await donateTx.wait();

    created.push({ campaignId, donor, demo });
  }

  await hre.network.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
  await hre.network.provider.send("evm_mine");

  console.log("\nRefund demo campaigns are ready:");
  for (const item of created) {
    const refundable = await contract.getRefundableAmount(item.campaignId, item.donor.address);
    console.log("--------------------------------------------------");
    console.log("Campaign:", item.demo.title);
    console.log("Campaign ID:", item.campaignId);
    console.log("Donor:", item.donor.address);
    console.log("Refundable:", hre.ethers.formatEther(refundable), "ETH");
    console.log(`URL: http://localhost:5173/campaign/${item.campaignId}`);
  }

  console.log("--------------------------------------------------");
  console.log("Use the matching donor wallet for each campaign to show the refund button.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Two refund demos setup failed:", error);
    process.exit(1);
  });
