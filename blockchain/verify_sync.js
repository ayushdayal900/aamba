const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env" });
const addresses = require("../frontend/src/contracts/addresses.json");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    console.log("Checking Microfinance at:", addresses.microfinance);

    try {
        const code = await provider.getCode(addresses.microfinance);
        if (code === "0x" || code === "0x0") {
            console.log("❌ ERROR: No contract code found at this address on Sepolia!");
            return;
        }
        console.log("✅ Contract code found.");

        const abi = ["function identity() public view returns (address)"];
        const contract = new ethers.Contract(addresses.microfinance, abi, provider);

        const linkedIdentity = await contract.identity();
        console.log("🔗 Linked Identity in Contract:", linkedIdentity);
        console.log("📂 Identity in addresses.json:  ", addresses.identity);

        if (linkedIdentity.toLowerCase() !== addresses.identity.toLowerCase()) {
            console.log("🚨 MISMATCH DETECTED! The Microfinance contract is looking at a different Identity contract.");
        } else {
            console.log("✨ Match confirmed.");
        }
    } catch (err) {
        console.error("❌ Failed to query contract:", err.message);
    }
}

main();
