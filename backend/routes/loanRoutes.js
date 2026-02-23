const express = require('express');
const router = express.Router();
const { createLoanRequest, getPendingLoans, fundLoan } = require('../controllers/loanController');

// Loan Request & Funding Flow
router.post('/', createLoanRequest);
router.get('/', getPendingLoans);
router.put('/:id/fund', fundLoan);

module.exports = router;
