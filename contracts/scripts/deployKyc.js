const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying KycSoulbound with account:", deployer.address);

    // Pass deployer address as initialOwner to Ownable constructor
    const KycSoulbound = await hre.ethers.getContractFactory("KycSoulbound");
    const kycSoulbound = await KycSoulbound.deploy(deployer.address);

    await kycSoulbound.waitForDeployment();

    console.log("KycSoulbound deployed to:", await kycSoulbound.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
