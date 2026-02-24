// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LoanEscrow is ReentrancyGuard {
    enum LoanStatus { Pending, Active, Repaid, Defaulted }

    struct Loan {
        address lender;
        address borrower;
        IERC20 token;
        uint256 principal;
        uint256 interest;
        uint256 repaymentDeadline; // timestamp
        uint256 duration; // in seconds
        LoanStatus status;
    }

    uint256 public loanCount;
    mapping(uint256 => Loan) public loans;

    event LoanCreated(uint256 indexed loanId, address indexed lender, address indexed borrower, uint256 principal, uint256 interest);
    event LoanFunded(uint256 indexed loanId, address indexed borrower);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower);
    event LoanDefaulted(uint256 indexed loanId, address indexed lender);
    event FundsWithdrawn(uint256 indexed loanId, address indexed lender, uint256 amount);

    /**
     * @dev 1. Lender creates loan and deposits funds
     */
    function createLoan(
        address _borrower,
        IERC20 _token,
        uint256 _principal,
        uint256 _interest,
        uint256 _duration
    ) external nonReentrant returns (uint256) {
        require(_principal > 0, "Principal must be > 0");
        require(_borrower != address(0), "Invalid borrower");
        require(address(_token) != address(0), "Invalid token");

        loanCount++;
        uint256 loanId = loanCount;

        loans[loanId] = Loan({
            lender: msg.sender,
            borrower: _borrower,
            token: _token,
            principal: _principal,
            interest: _interest,
            repaymentDeadline: 0,
            duration: _duration,
            status: LoanStatus.Pending
        });

        // Transfer principal from lender to escrow
        require(_token.transferFrom(msg.sender, address(this), _principal), "Transfer failed");

        emit LoanCreated(loanId, msg.sender, _borrower, _principal, _interest);
        return loanId;
    }

    /**
     * @dev 2. Borrower accepts the pending loan and receives the principal
     */
    function acceptLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Pending, "Loan not pending");
        require(msg.sender == loan.borrower, "Not the designated borrower");

        loan.status = LoanStatus.Active;
        loan.repaymentDeadline = block.timestamp + loan.duration;

        // Transfer funds to borrower
        require(loan.token.transfer(loan.borrower, loan.principal), "Transfer failed");

        emit LoanFunded(_loanId, msg.sender);
    }

    /**
     * @dev 3. Borrower repays the full loan amount + interest
     */
    function repayLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");
        require(block.timestamp <= loan.repaymentDeadline, "Deadline passed, you are in default");
        
        uint256 totalRepayment = loan.principal + loan.interest;

        // Transfer funds from borrower back to escrow
        // Note: Borrower must have approved the contract to spend totalRepayment
        require(loan.token.transferFrom(msg.sender, address(this), totalRepayment), "Transfer failed");

        loan.status = LoanStatus.Repaid;
        emit LoanRepaid(_loanId, msg.sender);
    }

    /**
     * @dev 4. Lender withdraws their funds after a successful repayment
     */
    function withdrawFunds(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Repaid, "Loan not repaid");
        require(msg.sender == loan.lender, "Only lender can withdraw");

        uint256 amount = loan.principal + loan.interest;
        // Prevent double withdrawal by emptying the loan records logic
        loan.principal = 0;
        loan.interest = 0;

        require(loan.token.transfer(loan.lender, amount), "Transfer failed");
        
        emit FundsWithdrawn(_loanId, msg.sender, amount);
    }

    /**
     * @dev 5. Lender claims default if the deadline has passed without repayment
     */
    function claimDefault(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");
        require(block.timestamp > loan.repaymentDeadline, "Deadline not passed");
        require(msg.sender == loan.lender, "Only lender can claim default");

        loan.status = LoanStatus.Defaulted;

        emit LoanDefaulted(_loanId, msg.sender);
        
        // Custom logic for grabbing collateral or slashing the KYC NFT
        // can be implemented here via an external oracle or linked contract
    }
}
