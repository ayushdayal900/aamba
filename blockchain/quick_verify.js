const { ethers } = require("f:/PROJECTS/aamba/aamba/aamba/blockchain/node_modules/ethers");
const addresses = {
    "identity": "0xa1B7Ea9275e1c5DF56c45a5871850279B4b65282",
    "microfinance": "0x2F48C42c81cE88fc42BB9F15d66B84A3eB79e798",
    "trustScore": "0xD6CBD589DBCD3a557585eeAc8bf4c4b84799266e",
    "network": "sepolia",
    "chainId": 11155111
};

async function main() {
    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    console.log("--- START DIAGNOSTIC ---");
    try {
        const mf = new ethers.Contract(addresses.microfinance, ["function identity() view returns (address)", "function loanCounter() view returns (uint256)"], provider);
        const linkedIdentity = await mf.identity();
        const counter = await mf.loanCounter();
        console.log("SUCCESS");
        console.log("LINKED_IDENTITY=" + linkedIdentity);
        console.log("LOAN_COUNTER=" + counter);
    } catch (e) {
        console.log("FAILURE=" + e.message);
    }
    console.log("--- END DIAGNOSTIC ---");
}
main();
