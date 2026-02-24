const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const LoanEscrow = await hre.ethers.getContractFactory("LoanEscrow");
    const loanEscrow = await LoanEscrow.deploy();

    await loanEscrow.waitForDeployment();

    console.log("LoanEscrow deployed to:", await loanEscrow.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
