const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("LoanEscrow Lifecycle", function () {
    let LoanEscrow, loanEscrow;
    let MockToken, mockToken;
    let lender, borrower, otherAccount;

    beforeEach(async function () {
        [lender, borrower, otherAccount] = await ethers.getSigners();

        // Deploy Mock ERC20 Token for testing
        const MockTokenFactory = await ethers.getContractFactory("MockERC20");
        mockToken = await MockTokenFactory.deploy("Mock Token", "MTK");
        await mockToken.waitForDeployment();

        // Deploy Escrow Contract
        LoanEscrow = await ethers.getContractFactory("LoanEscrow");
        loanEscrow = await LoanEscrow.deploy();
        await loanEscrow.waitForDeployment();

        // Mint tokens to lender and approve escrow
        await mockToken.mint(lender.address, ethers.parseUnits("1000", 18));
        await mockToken.connect(lender).approve(await loanEscrow.getAddress(), ethers.MaxUint256);

        // Mint tokens to borrower for repayment and approve escrow
        await mockToken.mint(borrower.address, ethers.parseUnits("1000", 18));
        await mockToken.connect(borrower).approve(await loanEscrow.getAddress(), ethers.MaxUint256);
    });

    describe("Loan Core Mechanics", function () {
        const principal = ethers.parseUnits("100", 18);
        const interest = ethers.parseUnits("10", 18);
        const duration = 7 * 24 * 60 * 60; // 7 days in seconds

        it("Should create a loan and borrower can accept and repay it", async function () {
            // 1. Create Loan
            await expect(loanEscrow.connect(lender).createLoan(
                borrower.address,
                await mockToken.getAddress(),
                principal,
                interest,
                duration
            )).to.emit(loanEscrow, "LoanCreated");

            const loanId = 1;

            // 2. Accept Loan
            await expect(loanEscrow.connect(borrower).acceptLoan(loanId))
                .to.emit(loanEscrow, "LoanFunded");

            let loan = await loanEscrow.loans(loanId);
            expect(loan.status).to.equal(1); // Active

            // 3. Repay Loan
            await expect(loanEscrow.connect(borrower).repayLoan(loanId))
                .to.emit(loanEscrow, "LoanRepaid");

            loan = await loanEscrow.loans(loanId);
            expect(loan.status).to.equal(2); // Repaid

            // 4. Lender Withdraws
            await expect(loanEscrow.connect(lender).withdrawFunds(loanId))
                .to.emit(loanEscrow, "FundsWithdrawn");
        });

        it("Should allow lender to claim default if deadline passed", async function () {
            await loanEscrow.connect(lender).createLoan(
                borrower.address,
                await mockToken.getAddress(),
                principal,
                interest,
                duration
            );

            const loanId = 1;
            await loanEscrow.connect(borrower).acceptLoan(loanId);

            // Fast forward time past duration using hardhat-network-helpers
            await time.increase(duration + 100);

            // Claim Default
            await expect(loanEscrow.connect(lender).claimDefault(loanId))
                .to.emit(loanEscrow, "LoanDefaulted");

            const loan = await loanEscrow.loans(loanId);
            expect(loan.status).to.equal(3); // Defaulted
        });
    });
});
