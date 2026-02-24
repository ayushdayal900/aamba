# MicroFin Web3 Integration: Handoff Guide & Roadmap 🚀

This document serves as a comprehensive guide for the development team to understand the Web3 architecture and features implemented so far, and clearly outlines the next steps to bring the **MicroFin** protocol to completion.

---

## 1. What Has Been Built (The "Systumm" Update)

We successfully transformed the traditional Web2 Microfinance platform into a **Web3-hybrid architecture**, focusing on trustless escrows, decentralized KYC, and dynamic on-chain trust scoring. Look for the recent commits in the repository.

### A. Smart Contracts Workspace (`/contracts`)
A fully-tested Hardhat workspace was initialized at the root of the monorepo.

*   **`KycSoulbound.sol` (ERC-5192 / Non-transferable ERC-721)**
    *   **Purpose:** Issues Soulbound Tokens (SBTs) to verified borrower wallets.
    *   **Key Logic:** Only the backend admin wallet can mint (`issueKyc`). The standard `transferFrom` functions are overridden to permanently revert, making the NFT non-transferable and securely bound to the user's identity.
*   **`LoanEscrow.sol`**
    *   **Purpose:** Trustless management of loan collateral and repayment.
    *   **Key Logic:**
        *   `createLoan`: Lender deposits standard ERC20 tokens (e.g., USDC) into the escrow.
        *   `acceptLoan`: Borrower accepts, and funds are disbursed to them.
        *   `repayLoan`: Borrower returns Principal + Interest before the deadline.
        *   `withdrawFunds` / `claimDefault`: Lender retrieves their funds post-repayment or seizes the agreed collateral logic upon default.
*   **Tests:** Full comprehensive coverage using Hardhat and Chai is located in `contracts/test/`. All tests are verified and passing.

### B. Backend Blockchain Integration (`/backend`)
*   **`services/blockchainService.js`:** The core bridging layer built with `ethers.js`.
    *   **Capabilities:** Maps backend API interactions to on-chain calls utilizing Admin private keys. Can automatically trigger `mintKycNFT(address)` and proxy `createLoanOnChain` if required.
    *   **Event Listeners:** Actively listens to Escrow events (`LoanCreated`, `LoanRepaid`, `LoanDefaulted`) via WebSockets to keep the MongoDB database in sync with the blockchain state.

### C. Dynamic Trust Scoring System (`/backend`)
The original static trust score logic was overhauled into a dynamic ML-ready tracking system.
*   **New MongoDB Model (`TrustScoreHistory.js`):** Tracks every specific score adjustment, reason, and associated loan, providing a deep ledger for potential ML risk analysis models.
*   **Event-Driven Rule Engine:** Integrated directly into `blockchainService.js`. When contract events fire, the Backend automatically adjusts the borrower/lender `trustScore` (Capped 0-1000):
    *   On-time Repayment: **+25 points**
    *   Early Repayment: **+40 points**
    *   Late Repayment: **-20 points**
    *   Defaulted: **-80 points**
    *   Successful Funding (as Lender): **+10 points**
*   **New API Endpoint:** `GET /api/users/trust-score-history` (in `trustScoreController.js`) allows the frontend to fetch and display the user's score progression.

### D. Frontend Dashboard Upgrades (`/frontend`)
Integrated `wagmi` and `viem` to allow direct user wallet interactions without exposing private keys.

*   **`LenderDashboard.jsx`:** Users can now click *"Accept & Fund Protocol"*. The UI utilizes `useWriteContract` to trigger `createLoan` on the Escrow contract. It provides real-time loading states and transaction parsing.
*   **`BorrowerDashboard.jsx`:** Hooked up the repayment logic. A user can find an active loan and press *"Repay Loan"*, triggering the `repayLoan` contract function directly via their Web3 wallet.

---

## 2. Where To Pick Up: Next Steps & Roadmap

To finish the protocol, team members should tackle the following items in order of priority:

### Phase 1: Environment & Network Deployment
Currently, contracts utilize a `MockERC20.sol` for local testing. We must deploy to testnets.
1.  **Deploy Contracts:** Deploy `KycSoulbound` and `LoanEscrow` to **Base Sepolia** or **Polygon Amoy**. (Update `contracts/hardhat.config.js`).
2.  **Environment Sync:** Once deployed, update `.env` files in **all three workspaces** (`frontend`, `backend`, `contracts`):
    *   Set `ESCROW_CONTRACT_ADDRESS` and `KYC_NFT_CONTRACT_ADDRESS`.
    *   Configure live Alchemy/Infura RPC URLs.
    *   Add Admin Wallet Private Keys (for KYC Minting).

### Phase 2: Frontend Data Binding
The UI correctly dispatches Web3 transactions but currently relies on slightly mocked data schemas.
1.  **List Active Escrow Loans:** In `BorrowerDashboard.jsx`, fetch actual active loans from the backend database (or The Graph) instead of the hardcoded *"Repay Loan #1 (Demo)"* button.
2.  **Handle ERC20 Approvals:** Before a Lender can call `createLoan` on the Escrow contract, they must first call `approve()` on the USDC/Token contract, granting the Escrow contract an allowance. Implement a two-step transaction UI in `LenderDashboard` (Approve -> Deposit). (Similarly required for `BorrowerDashboard` before Repayment).

### Phase 3: Identity & KYC Gate
1.  **AI KYC Trigger:** Complete the backend logic in `userController.js` where, upon the successful verification of Pan/Aadhaar documents via ML/OCR, the server calls `blockchainService.mintKycNFT(walletAddress, metadataUri)`.
2.  **Frontend Gating:** Prevent borrowers from clicking *"Publish Loan Request to Market"* until their `kycStatus === 'Verified'` and an NFT is confirmed in their wallet.

### Phase 4: Risk Scoring & ML Expansion (Bonus)
1.  **Enhanced ML Score:** The `TrustScoreHistory` model stores a vast array of actions. Build a Python/FastAPI microservice to ingest these histories, apply logistic regression, and continually refine the "Base Trust Score" into a dynamic "Default Probability" API.

---
*Happy Buidling! 🛠️ If you face any RPC timeout issues, check your `wss://` vs `https://` configurations in `blockchainService.js` for event listening.*
