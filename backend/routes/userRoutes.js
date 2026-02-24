const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateUserRole, submitKYC } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const { getTrustScoreHistory } = require('../controllers/trustScoreController');

// Traditional Auth Flow
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Routes
router.put('/role', protect, updateUserRole);
router.post('/kyc', protect, submitKYC);

// Analytics & Trust Score
router.get('/trust-score-history', protect, getTrustScoreHistory);

module.exports = router;
