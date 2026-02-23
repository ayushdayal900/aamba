const express = require('express');
const router = express.Router();
const { authWalletUser, updateUserRole, submitKYC } = require('../controllers/userController');

// User Authentication & KYC Flow
router.post('/auth', authWalletUser);
router.put('/:id/role', updateUserRole);
router.post('/:id/kyc', submitKYC);

module.exports = router;
