const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateUserRole, submitKYC } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Traditional Auth Flow
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Routes
router.put('/role', protect, updateUserRole);
router.post('/kyc', protect, submitKYC);

module.exports = router;
