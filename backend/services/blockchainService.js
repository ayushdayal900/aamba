const { ethers } = require('ethers');
const User = require('../models/User');
const LoanRequest = require('../models/LoanRequest');
const TrustScoreHistory = require('../models/TrustScoreHistory');

// Load env variables
const {
    RPC_URL,
    PRIVATE_KEY,
    KYC_NFT_CONTRACT_ADDRESS,
    ESCROW_CONTRACT_ADDRESS
} = process.env;

// Minimal ABI for KYC NFT (minting)
const kycAbi = [
    "function issueKyc(address to, string memory uri) external",
    "event KycVerified(address indexed user, uint256 indexed tokenId, string tokenUri)"
];

// Minimal ABI for Escrow (listening to events and creating loans on chain)
const escrowAbi = [
    "function createLoan(address _borrower, address _token, uint256 _principal, uint256 _interest, uint256 _duration) external returns (uint256)",
    "event LoanCreated(uint256 indexed loanId, address indexed lender, address indexed borrower, uint256 principal, uint256 interest)",
    "event LoanFunded(uint256 indexed loanId, address indexed borrower)",
    "event LoanRepaid(uint256 indexed loanId, address indexed borrower)",
    "event LoanDefaulted(uint256 indexed loanId, address indexed lender)"
];

let provider;
let wallet;
let kycContract;
let escrowContract;

/**
 * Helper function to manage robust Trust Score Updates
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

        console.log(`✅ Trust Score updated for User ${userId}: ${reason} -> New Score: ${newScore}`);
        return newScore;
    } catch (error) {
        console.error('Error updating trust score history:', error);
    }
}

/**
 * Connect to the blockchain provider and initialize contracts
 */
function connectProvider() {
    if (!RPC_URL || !PRIVATE_KEY) {
        console.warn('⚠️ Blockchain credentials missing in .env. Blockchain service not initialized.');
        return;
    }

    try {
        provider = new ethers.JsonRpcProvider(RPC_URL);
        wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        if (KYC_NFT_CONTRACT_ADDRESS) {
            kycContract = new ethers.Contract(KYC_NFT_CONTRACT_ADDRESS, kycAbi, wallet);
        }

        if (ESCROW_CONTRACT_ADDRESS) {
            escrowContract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, escrowAbi, wallet);
        }

        console.log('✅ Blockchain provider connected successfully');
    } catch (error) {
        console.error('❌ Failed to connect to blockchain provider:', error);
    }
}

/**
 * Mint a Soulbound KYC NFT to a verified user
 * @param {string} userWalletAddress 
 * @param {string} metadataUri 
 */
async function mintKycNFT(userWalletAddress, metadataUri) {
    if (!kycContract) throw new Error('KYC Contract not initialized');

    try {
        console.log(`Minting KYC NFT for ${userWalletAddress}...`);
        const tx = await kycContract.issueKyc(userWalletAddress, metadataUri);
        const receipt = await tx.wait();
        console.log(`✅ KYC NFT minted! Tx Hash: ${receipt.hash}`);
        return receipt;
    } catch (error) {
        console.error('❌ Error minting KYC NFT:', error);
        throw error;
    }
}

/**
 * Create a new loan on-chain (Lender perspective or Admin proxy)
 * @param {string} borrowerAddress 
 * @param {string} tokenAddress (ERC20 address)
 * @param {string} principal (amount in wei)
 * @param {string} interest (amount in wei)
 * @param {number} duration (in seconds)
 */
async function createLoanOnChain(borrowerAddress, tokenAddress, principal, interest, duration) {
    if (!escrowContract) throw new Error('Escrow Contract not initialized');

    try {
        console.log(`Creating loan on-chain for ${borrowerAddress}...`);
        const tx = await escrowContract.createLoan(borrowerAddress, tokenAddress, principal, interest, duration);
        const receipt = await tx.wait();
        console.log(`✅ Loan created! Tx Hash: ${receipt.hash}`);
        return receipt;
    } catch (error) {
        console.error('❌ Error creating loan on-chain:', error);
        throw error;
    }
}

/**
 * Listen to critical Escrow contract events and sync to MongoDB.
 * - On LoanRepaid: Increase Borrower's Trust Score
 * - On LoanDefaulted: Decrease Borrower's Trust Score
 */
function listenToContractEvents() {
    if (!escrowContract) {
        console.warn('⚠️ Escrow Contract not initialized. Cannot listen to events.');
        return;
    }

    console.log('🎧 Listening to Escrow Contract Events for Trust Scoring...');

    // 0. Listen for Successful Funding (by Lender)
    escrowContract.on('LoanCreated', async (loanId, lenderAddress, borrowerAddress, principal, interest, event) => {
        try {
            const lenderUser = await User.findOne({ walletAddress: lenderAddress.toLowerCase() });
            if (lenderUser) {
                // +10 payload for Successful Funding
                await updateTrustScore(lenderUser._id, 10, 'Successful Funding', null, {
                    onChainLoanId: loanId.toString(),
                    action: 'funded_loan'
                });
            }
        } catch (error) {
            console.error('Error handling LoanCreated trust score:', error);
        }
    });

    // 1. Listen for Repayment (borrower)
    escrowContract.on('LoanRepaid', async (loanId, borrowerAddress, event) => {
        console.log(`[Event] LoanRepaid: Loan ${loanId} by ${borrowerAddress}`);
        try {
            const loanReq = await LoanRequest.findOne({ simulatedSmartContractId: loanId.toString() }).populate('borrower');
            if (loanReq && loanReq.borrower) {
                const isEarly = false; // Add logic based on loanReq.createdAt vs block.timestamp for early payback detection
                const isLate = false;  // Placeholder for real logic assessing deadline

                let points = 25; // On-time
                let reason = 'On-time Repayment';

                if (isEarly) {
                    points = 40;
                    reason = 'Early Repayment';
                } else if (isLate) {
                    points = -20;
                    reason = 'Late Repayment';
                }

                await updateTrustScore(loanReq.borrower._id, points, reason, loanReq._id, {
                    onChainLoanId: loanId.toString()
                });

                loanReq.status = 'Repaid';
                await loanReq.save();
            }
        } catch (error) {
            console.error('Error updating trust score on repayment:', error);
        }
    });

    // 2. Listen for loan defaults
    escrowContract.on('LoanDefaulted', async (loanId, lenderAddress, event) => {
        console.log(`[Event] LoanDefaulted: Loan ${loanId}`);
        try {
            const loanReq = await LoanRequest.findOne({ simulatedSmartContractId: loanId.toString() }).populate('borrower');
            if (loanReq && loanReq.borrower) {
                // -80 payload for Default
                await updateTrustScore(loanReq.borrower._id, -80, 'Defaulted', loanReq._id, {
                    onChainLoanId: loanId.toString()
                });

                loanReq.status = 'Defaulted';
                await loanReq.save();
            }
        } catch (error) {
            console.error('Error updating trust score on default:', error);
        }
    });
}

module.exports = {
    connectProvider,
    mintKycNFT,
    createLoanOnChain,
    listenToContractEvents,
    updateTrustScore
};
