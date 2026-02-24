const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const user = await User.findOne({ email: 'final_test_user_7@example.com' });
        console.log("User before:", user.kycStatus);

        const kycDetails = {
            documentType: 'Aadhaar Card',
            documentNumber: '1234',
            verifiedAt: new Date()
        };

        const updated = await User.findByIdAndUpdate(
            user._id,
            {
                kycStatus: 'Verified',
                kycDetails,
                nftIssued: true,
                trustScore: 300,
                walletAddress: '0x123'
            },
            { new: true }
        );
        console.log("Returned updated user:", updated.kycStatus);

        const checkAgain = await User.findById(user._id);
        console.log("User in DB after:", checkAgain.kycStatus);

    } catch (err) {
        console.error("Database connection failed:", err);
    } finally {
        mongoose.connection.close();
    }
}

checkUser();
