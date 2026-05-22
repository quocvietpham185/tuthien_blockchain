const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Sample campaigns for demo
const SAMPLE_CAMPAIGNS = [
  {
    title: "Xây Trường Học Cho Trẻ Em Vùng Cao",
    description:
      "Dự án xây dựng trường học cho 200 em học sinh tại xã Mù Căng Chải, Yên Bái. Các em hiện phải đi bộ hơn 5km mỗi ngày để đến trường tạm bợ. Chúng tôi cần xây dựng 4 phòng học kiên cố với đầy đủ bàn ghế, sách giáo khoa và thiết bị học tập.",
    category: "Giáo dục",
    ipfsHash: "/campaigns/education.svg",
    goal: hre.ethers.parseEther("2"),
    duration: 60,
  },
  {
    title: "Hỗ Trợ Bệnh Nhân Ung Thư Nghèo",
    description:
      "Quỹ hỗ trợ chi phí điều trị cho bệnh nhân ung thư có hoàn cảnh khó khăn tại Bệnh viện K Hà Nội. Mỗi tháng có hàng chục bệnh nhân không đủ tiền mua thuốc. Số tiền quyên góp sẽ được sử dụng minh bạch, có báo cáo hàng tháng.",
    category: "Y tế",
    ipfsHash: "/campaigns/medical.svg",
    goal: hre.ethers.parseEther("5"),
    duration: 90,
  },
  {
    title: "Cứu Trợ Lũ Lụt Miền Trung",
    description:
      "Hỗ trợ người dân các tỉnh Quảng Nam, Quảng Ngãi, Bình Định bị thiệt hại nặng nề do lũ lụt. Cung cấp lương thực, nước sạch, chăn màn và vật liệu sửa chữa nhà ở cho các gia đình bị ảnh hưởng.",
    category: "Thiên tai",
    ipfsHash: "/campaigns/disaster.svg",
    goal: hre.ethers.parseEther("3"),
    duration: 30,
  },
  {
    title: "Trồng 10,000 Cây Xanh Tại Hà Nội",
    description:
      "Dự án phủ xanh đô thị, trồng 10,000 cây xanh tại các khu vực thiếu cây của Hà Nội. Kết hợp với các trường học và cộng đồng địa phương để đảm bảo cây được chăm sóc lâu dài. Mỗi cây được gắn QR code để theo dõi trên blockchain.",
    category: "Môi trường",
    ipfsHash: "/campaigns/environment.svg",
    goal: hre.ethers.parseEther("2"),
    duration: 45,
  },
];

async function main() {
  console.log("🌱 Seeding demo data to CharityDonation contract...");

  // Read deployment info
  const deploymentPath = path.join(__dirname, "../deployments/localhost.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("❌ No deployment found. Run deploy.js first!");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contractAddress = deployment.contractAddress;
  console.log("Contract:", contractAddress);

  // Get signers (Hardhat provides 20 test accounts)
  const signers = await hre.ethers.getSigners();
  const [owner, user1, user2, user3, user4] = signers;

  // Load contract
  const CharityDonation = await hre.ethers.getContractFactory("CharityDonation");
  const contract = CharityDonation.attach(contractAddress);

  console.log("\n📋 Creating sample campaigns...");

  // Create campaigns from different accounts
  const campaignOwners = [owner, user1, user2, user3];
  const campaignIds = [];

  for (let i = 0; i < SAMPLE_CAMPAIGNS.length; i++) {
    const campaign = SAMPLE_CAMPAIGNS[i];
    const campaignOwner = campaignOwners[i % campaignOwners.length];

    const tx = await contract
      .connect(campaignOwner)
      .createCampaign(
        campaign.title,
        campaign.description,
        campaign.category,
        campaign.ipfsHash,
        campaign.goal,
        campaign.duration
      );
    await tx.wait();
    campaignIds.push(i + 1);
    console.log(`  ✅ Campaign ${i + 1}: "${campaign.title}"`);
  }

  console.log("\n💰 Adding donations...");

  // Donation data
  const donations = [
    { campaignId: 1, donor: user1, amount: "0.5", message: "Ủng hộ các em nhỏ vùng cao!" },
    { campaignId: 1, donor: user2, amount: "0.3", message: "Mong các em có môi trường học tốt" },
    { campaignId: 1, donor: user3, amount: "0.8", message: "Chung tay vì thế hệ tương lai" },
    { campaignId: 2, donor: owner, amount: "1.0", message: "Sức khỏe là vốn quý nhất" },
    { campaignId: 2, donor: user2, amount: "0.5", message: "Cầu cho các bệnh nhân mau bình phục" },
    { campaignId: 3, donor: user1, amount: "0.4", message: "Chia sẻ với đồng bào miền Trung" },
    { campaignId: 3, donor: user3, amount: "0.6", message: "Vượt qua thiên tai cùng nhau" },
    { campaignId: 3, donor: user4, amount: "0.2", message: "Một chút lòng thành" },
    { campaignId: 4, donor: user2, amount: "0.3", message: "Vì Hà Nội xanh hơn" },
    { campaignId: 4, donor: user4, amount: "0.15", message: "Bảo vệ môi trường cho con cháu" },
  ];

  for (const d of donations) {
    const tx = await contract
      .connect(d.donor)
      .donate(d.campaignId, d.message, {
        value: hre.ethers.parseEther(d.amount),
      });
    await tx.wait();
    console.log(
      `  ✅ Donated ${d.amount} ETH to Campaign ${d.campaignId} - "${d.message.substring(0, 30)}..."`
    );
  }

  // Get final stats
  const [totalCampaigns, totalDonations, activeCampaigns] =
    await contract.getPlatformStats();

  console.log("\n🎉 Seeding complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Total Campaigns:  ", totalCampaigns.toString());
  console.log("Total Donations:  ", hre.ethers.formatEther(totalDonations), "ETH");
  console.log("Active Campaigns: ", activeCampaigns.toString());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📱 Test accounts (import to MetaMask):");
  for (let i = 0; i < 5; i++) {
    console.log(`  Account ${i}: ${signers[i].address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
