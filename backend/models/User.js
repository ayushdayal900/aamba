const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    role: {
        type: String,
        enum: ['Borrower', 'Lender', 'Unassigned'],
        default: 'Unassigned',
    },
    kycStatus: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending',
    },
    kycDetails: {
        documentType: { type: String, enum: ['Aadhaar', 'PAN'] },
        documentNumber: { type: String },
        verifiedAt: { type: Date }
    },
    nftIssued: {
        type: Boolean,
        default: false,
    },
    trustScore: {
        type: Number,
        default: 0, // 0-1000 scale, updated by simulated ML model/repayments
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
