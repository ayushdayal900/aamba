const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const LoanRequest = require('../models/LoanRequest');
const TrustScoreHistory = require('../models/TrustScoreHistory');

// Load addresses and ABIs
const addressesPath = path.join(__dirname, '../contracts/addresses.json');
const microfinanceAbiPath = path.join(__dirname, '../contracts/Microfinance.json');
const soulboundAbiPath = path.join(__dirname, '../contracts/SoulboundIdentity.json');
const trustScoreAbiPath = path.join(__dirname, '../contracts/TrustScoreRegistry.json');

let addresses = {};
let microfinanceAbi = [];
let soulboundAbi = [];
let trustScoreAbi = [];

if (fs.existsSync(addressesPath)) {
    addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
}
if (fs.existsSync(microfinanceAbiPath)) {
    microfinanceAbi = JSON.parse(fs.readFileSync(microfinanceAbiPath, 'utf8'));
}
if (fs.existsSync(soulboundAbiPath)) {
    soulboundAbi = JSON.parse(fs.readFileSync(soulboundAbiPath, 'utf8'));
}
if (fs.existsSync(trustScoreAbiPath)) {
    trustScoreAbi = JSON.parse(fs.readFileSync(trustScoreAbiPath, 'utf8'));
}

// Load env variables
const {
    RPC_URL
} = process.env;

let provider;
let identityContract;
let microfinanceContract;
let trustScoreContract;

/**
 * Helper function to manage robust Trust Score Updates (Local MongoDB only)
 */
async function updateTrustScore(userId, changeAmount, reason, loanId = null, metadata = {}) {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        let newScore = user.trustScore + changeAmount;
        // Cap score between 0 and 1000
        newScore = Math.max(0, Math.min(1000, newScore));

        // Save to User Model
        user.trustScore = newScore;
        await user.save();

        // Save to History Log for ML/Analytics
        await TrustScoreHistory.create({
            user: userId,
            changeAmount,
            newScore,
            reason,
            associatedLoan: loanId,
            metadata
        });

        console.log(`✅ Trust Score updated locally for User ${userId}: ${reason} -> New Score: ${newScore}`);
        return newScore;
    } catch (error) {
        console.error('Error updating trust score history:', error);
    }
}

/**
 * Connect to the blockchain provider and initialize contracts (READ-ONLY)
 */
function connectProvider() {
    if (!RPC_URL) {
        console.warn('⚠️ RPC_URL missing in .env. Blockchain service not initialized.');
        return;
    }

    try {
        // Backend now ONLY acts as a listener/reader. 
        // No private keys are stored or used for signing. 
        provider = new ethers.JsonRpcProvider(RPC_URL);

        if (addresses.identity) {
            identityContract = new ethers.Contract(addresses.identity, soulboundAbi, provider);
        }

        if (addresses.microfinance) {
            microfinanceContract = new ethers.Contract(addresses.microfinance, microfinanceAbi, provider);
        }

        if (addresses.trustScore) {
            trustScoreContract = new ethers.Contract(addresses.trustScore, trustScoreAbi, provider);
        }

        console.log('✅ Blockchain service connected in READ-ONLY mode');
    } catch (error) {
        console.error('❌ Failed to connect to blockchain provider:', error);
    }
}


/**
 * Listen to critical Microfinance contract events and sync to MongoDB.
 * Using manual polling with queryFilter for higher reliability on public RPCs.
 */
async function listenToContractEvents() {
    if (!microfinanceContract) {
        console.warn('⚠️ Microfinance Contract not initialized. Cannot listen to events.');
        return;
    }

    console.log('🎧 Starting robust event polling for Microfinance...');

    let lastPolledBlock = await provider.getBlockNumber();

    // Poll interval - check every 15 seconds
    setInterval(async () => {
        try {
            const currentBlock = await provider.getBlockNumber();
            if (currentBlock <= lastPolledBlock) return;

            console.log(`🔍 Polling blocks ${lastPolledBlock + 1} to ${currentBlock}...`);

            // 1. Check for LoanFunded events
            const fundedEvents = await microfinanceContract.queryFilter('LoanFunded', lastPolledBlock + 1, currentBlock);
            for (const event of fundedEvents) {
                const { loanId, lender, startTime } = event.args;
                console.log(`[Event] LoanFunded detected: Loan ${loanId} by ${lender}`);

                try {
                    const lenderUser = await User.findOne({ walletAddress: lender.toLowerCase() });
                    if (lenderUser) {
                        await updateTrustScore(lenderUser._id, 10, 'Funded a Loan', null, {
                            onChainLoanId: loanId.toString()
                        });
                    }

                    const loanReq = await LoanRequest.findOne({ simulatedSmartContractId: loanId.toString() });
                    if (loanReq) {
                        loanReq.status = 'Funded';
                        if (lenderUser) loanReq.lender = lenderUser._id;
                        await loanReq.save();
                    }
                } catch (err) {
                    console.error('Error processing LoanFunded event:', err);
                }
            }

            // 2. Check for LoanRepaid events
            const repaidEvents = await microfinanceContract.queryFilter('LoanRepaid', lastPolledBlock + 1, currentBlock);
            for (const event of repaidEvents) {
                const { loanId, borrower, amount } = event.args;
                console.log(`[Event] LoanRepaid detected: Loan ${loanId} by ${borrower}`);

                try {
                    const loanReq = await LoanRequest.findOne({ simulatedSmartContractId: loanId.toString() }).populate('borrower');
                    if (loanReq && loanReq.borrower) {
                        await updateTrustScore(loanReq.borrower._id, 25, 'Successful Repayment', loanReq._id, {
                            onChainLoanId: loanId.toString()
                        });

                        loanReq.status = 'Repaid';
                        await loanReq.save();
                    }
                } catch (err) {
                    console.error('Error processing LoanRepaid event:', err);
                }
            }

            lastPolledBlock = currentBlock;
        } catch (error) {
            console.warn('⚠️ Event polling warning:', error.message);
            // Don't update lastPolledBlock so we retry next time
        }
    }, 15000); // Poll every 15 seconds
}


module.exports = {
    connectProvider,
    listenToContractEvents,
    updateTrustScore
};

