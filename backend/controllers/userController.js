const User = require('../models/User');

// @desc    Authenticate or register user via wallet
// @route   POST /api/users/auth
exports.authWalletUser = async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ message: 'Wallet address is required' });
        }

        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (!user) {
            // First time connecting
            user = await User.create({
                walletAddress: walletAddress.toLowerCase(),
            });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update user role (Lender/Borrower)
// @route   PUT /api/users/:id/role
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['Borrower', 'Lender'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role selection' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit KYC details and simulate Liveliness check/NFT minting
// @route   POST /api/users/:id/kyc
exports.submitKYC = async (req, res) => {
    try {
        const { documentType, documentNumber } = req.body;

        // In a real app, this triggers 3rd party APIs (Aadhaar/PAN) and Web3 Smart Contracts (NFT)
        // Here we simulate a successful verification pipeline:
        const kycDetails = {
            documentType,
            documentNumber,
            verifiedAt: new Date()
        };

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                kycStatus: 'Verified',
                kycDetails,
                nftIssued: true,     // Simulated Soulbound Token mint
                trustScore: 300,     // Initial baseline trust score
            },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({
            success: true,
            message: 'KYC Verified, Liveliness Passed, and Soulbound NFT Issued (Simulated)',
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
