const { ethers } = require("ethers");

const addresses = require("../deployedAddresses.json");

// Minimal ABI - try both old (identity) and new (identityContract) getter names
const ABI_OLD = ["function identity() public view returns (address)"];
const ABI_NEW = ["function identityContract() public view returns (address)", "function getIdentityAddress() public view returns (address)"];

async function main() {
    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");

    console.log("\n=================================================");
    console.log("  AAMBA On-Chain Sync Diagnostic");
    console.log("=================================================");
    console.log("Config Identity  :", addresses.identity);
    console.log("Config Microfinance:", addresses.microfinance);
    console.log("Config TrustScore  :", addresses.trustScore);
    console.log("-------------------------------------------------");

    // Check contract code exists
    const code = await provider.getCode(addresses.microfinance);
    if (code === "0x" || code === "0x0") {
        console.error("\n❌ CRITICAL: No contract code at Microfinance address:", addresses.microfinance);
        console.error("   The contract is NOT deployed here on Sepolia.");
        process.exit(1);
    }
    console.log("✅ Contract bytecode found at Microfinance address.");

    // Try reading the linked identity address
    let linkedIdentity = null;

    // Try new getter first (getIdentityAddress)
    try {
        const contract = new ethers.Contract(addresses.microfinance, ABI_NEW, provider);
        linkedIdentity = await contract.getIdentityAddress();
        console.log("\n📡 Linked Identity (via getIdentityAddress()):", linkedIdentity);
    } catch (e1) {
        // Try identityContract()
        try {
            const contract = new ethers.Contract(addresses.microfinance, ABI_NEW, provider);
            linkedIdentity = await contract.identityContract();
            console.log("\n📡 Linked Identity (via identityContract()):", linkedIdentity);
        } catch (e2) {
            // Fall back to old getter identity()
            try {
                const contract = new ethers.Contract(addresses.microfinance, ABI_OLD, provider);
                linkedIdentity = await contract.identity();
                console.log("\n📡 Linked Identity (via identity()):", linkedIdentity);
            } catch (e3) {
                console.error("\n❌ Cannot read identity address from on-chain contract.");
                console.error("   This means the DEPLOYED contract is the OLD version (before our fix).");
                console.error("   ➜ ACTION NEEDED: Redeploy Microfinance with correct identity address.");
                process.exit(1);
            }
        }
    }

    console.log("📂 Config Identity Address           :", addresses.identity);
    console.log("-------------------------------------------------");

    if (linkedIdentity.toLowerCase() === addresses.identity.toLowerCase()) {
        console.log("✨ MATCH: Microfinance is correctly wired to Identity contract.");
        console.log("   No redeployment needed — the issue is elsewhere.");
    } else {
        console.log("\n🚨 MISMATCH DETECTED!");
        console.log("   On-chain Microfinance points to:", linkedIdentity);
        console.log("   But our Identity contract is   :", addresses.identity);
        console.log("\n   ➜ ACTION NEEDED: Redeploy Microfinance pointing to", addresses.identity);
    }
    console.log("=================================================\n");
}

main().catch(console.error);
