const User = require('../models/User');

const MIN_SCORE = 300;
const MAX_SCORE = 900;

/**
 * @desc Clamp a score between MIN_SCORE and MAX_SCORE
 */
const clampScore = (score) => {
    return Math.max(MIN_SCORE, Math.min(MAX_SCORE, score));
};

/**
 * @desc Increase a user's trust score
 * @param {ObjectId|String} userId 
 * @param {Number} points 
 * @param {String} action 
 */
exports.increaseScore = async (userId, points, action) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // Prevent duplicate first-loan bonuses
        if (action === 'FIRST_INSTALLMENT_PAID') {
            if (user.hasReceivedFirstInstallmentBonus) return user.trustScore;
            user.hasReceivedFirstInstallmentBonus = true;
        }

        if (action === 'FIRST_FULL_REPAYMENT') {
            if (user.hasReceivedFirstFullRepaymentBonus) return user.trustScore;
            user.hasReceivedFirstFullRepaymentBonus = true;
        }

        const oldScore = user.trustScore || MIN_SCORE;
        const newScore = clampScore(oldScore + points);

        if (newScore !== oldScore) {
            user.trustScore = newScore;
            user.trustHistory.push({
                action,
                points,
                newScore,
                timestamp: new Date()
            });
            await user.save();
        }

        return newScore;
    } catch (error) {
        console.error(`[TrustScoreService] Error increasing score: ${error.message}`);
        throw error;
    }
};

/**
 * @desc Decrease a user's trust score
 * @param {ObjectId|String} userId 
 * @param {Number} points 
 * @param {String} action 
 */
exports.decreaseScore = async (userId, points, action) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const oldScore = user.trustScore || MIN_SCORE;
        const newScore = clampScore(oldScore - points);

        if (newScore !== oldScore) {
            user.trustScore = newScore;
            user.trustHistory.push({
                action,
                points: -points, // Store as negative for explicit UI rendering if needed
                newScore,
                timestamp: new Date()
            });
            await user.save();
        }

        return newScore;
    } catch (error) {
        console.error(`[TrustScoreService] Error decreasing score: ${error.message}`);
        throw error;
    }
};
