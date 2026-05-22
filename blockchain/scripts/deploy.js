const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying CharityDonation contract...");
  console.log("Network:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Deploy contract
  const CharityDonation = await hre.ethers.getContractFactory("CharityDonation");
  const charity = await CharityDonation.deploy();
  await charity.waitForDeployment();

  const contractAddress = await charity.getAddress();
  console.log("\n✅ CharityDonation deployed to:", contractAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  // Save to blockchain/deployments/
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("📄 Deployment info saved to deployments/", hre.network.name + ".json");

  // Copy ABI to frontend and backend
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/CharityDonation.sol/CharityDonation.json"
  );

  const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
  const backendDir = path.join(__dirname, "../../backend/src/contracts");

  [frontendDir, backendDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Wait for artifact to exist
  let artifact;
  let attempts = 0;
  while (attempts < 10) {
    if (fs.existsSync(artifactPath)) {
      artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
    attempts++;
  }

  if (artifact) {
    // Save ABI + address for frontend
    const frontendConfig = {
      address: contractAddress,
      abi: artifact.abi,
      network: deploymentInfo,
    };
    fs.writeFileSync(
      path.join(frontendDir, "CharityDonation.json"),
      JSON.stringify(frontendConfig, null, 2)
    );

    // Save ABI + address for backend
    fs.writeFileSync(
      path.join(backendDir, "CharityDonation.json"),
      JSON.stringify(frontendConfig, null, 2)
    );

    console.log("📋 ABI copied to frontend/src/contracts/");
    console.log("📋 ABI copied to backend/src/contracts/");
  }

  // Update backend .env with contract address
  const backendEnvPath = path.join(__dirname, "../../backend/.env");
  if (fs.existsSync(backendEnvPath)) {
    let envContent = fs.readFileSync(backendEnvPath, "utf8");
    envContent = envContent.replace(
      /CONTRACT_ADDRESS=.*/,
      `CONTRACT_ADDRESS=${contractAddress}`
    );
    fs.writeFileSync(backendEnvPath, envContent);
    console.log("⚙️  Updated backend .env with contract address");
  }

  console.log("\n🎉 Deployment complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract Address:", contractAddress);
  console.log("Network:        ", hre.network.name);
  console.log("Chain ID:       ", deploymentInfo.chainId);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deploy failed:", error);
    process.exit(1);
  });
