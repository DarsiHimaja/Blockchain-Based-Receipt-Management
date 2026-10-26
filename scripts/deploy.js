const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("Deploying DigitalReceipt contract...");
  console.log(`Network: ${network.name} (Chain ID: ${network.config.chainId || "unknown"})`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);

  // Deploy contract
  const DigitalReceiptFactory = await ethers.getContractFactory("DigitalReceipt");
  const digitalReceipt = await DigitalReceiptFactory.deploy();
  await digitalReceipt.waitForDeployment();

  const contractAddress = await digitalReceipt.getAddress();
  console.log(`>>> DigitalReceipt deployed successfully at: ${contractAddress}`);

  // Fetch full contract artifact for ABI
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/DigitalReceipt.sol/DigitalReceipt.json"
  );
  const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Target frontend JSON path
  const frontendDir = path.join(__dirname, "../frontend/src/contract");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  const exportData = {
    address: contractAddress,
    network: network.name,
    chainId: network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    abi: contractArtifact.abi,
  };

  const outputPath = path.join(frontendDir, "DigitalReceipt.json");
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), "utf8");

  console.log(`>>> Contract address & ABI saved to: ${outputPath}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
