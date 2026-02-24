import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';

// ABI fragment for Escrow repayLoan
const escrowAbi = [
    {
        "inputs": [{ "internalType": "uint256", "name": "_loanId", "type": "uint256" }],
        "name": "repayLoan",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const BorrowerDashboard = () => {
    const { userProfile } = useAuth();
    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState('');
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // UI state for repayment logic (mocked up as we don't have the full borrower UI schema built yet)
    // Normally this would map to actual active loans retrieved from Backend/Graph
    const [activeLoanIdToRepay, setActiveLoanIdToRepay] = useState(null);

    const { data: hash, writeContract, error: writeError, isPending: isWritePending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isConfirmed && activeLoanIdToRepay) {
            setMessage('Smart Contract Executed! Syncing repayment with backend...');
            syncBackendRepayment(activeLoanIdToRepay);
        }
    }, [isConfirmed]);

    useEffect(() => {
        if (writeError) {
            setMessage('Transaction failed: ' + writeError.message);
            setActiveLoanIdToRepay(null);
        }
    }, [writeError]);

    const syncBackendRepayment = async (loanId) => {
        // Normally post to an endpoint handling the repayment logic in the backend
        setMessage('Loan successfully repaid. Trust Score increased!');
        setActiveLoanIdToRepay(null);
    };

    const handleRepayLoan = async (smartContractLoanId) => {
        setActiveLoanIdToRepay(smartContractLoanId);
        setMessage('Awaiting wallet approval to repay...');

        try {
            const ESCROW_ADDRESS = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

            writeContract({
                address: ESCROW_ADDRESS,
                abi: escrowAbi,
                functionName: 'repayLoan',
                args: [smartContractLoanId]
            });

        } catch (error) {
            console.error(error);
            setMessage('Failed to initiate repayment transaction.');
            setActiveLoanIdToRepay(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            // Note: Creating the loan order in the DB doesn't require wagmi interaction YET.
            // Wagmi contract interaction happens when the LENDER funds it (which triggers 'createLoan' on chain),
            // OR if the protocol logic requires the borrower to invoke 'acceptLoan' separately.
            const res = await axios.post('http://localhost:5000/api/loans', {
                borrowerId: userProfile._id,
                amountRequested: Number(amount),
                interestRate: 8.5, // Fixed rate for now, can be algorithmic later
                durationMonths: Number(duration),
                purpose
            });
            if (res.data.success) {
                setMessage('Loan Request successfully published to the market!');
                setAmount('');
                setDuration('');
                setPurpose('');
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error creating loan request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Borrower Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Profile Stats Sidebar */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-fintech-card p-6 rounded-xl border border-fintech-border shadow-lg">
                        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">My Trust Score</h3>
                        <div className="text-4xl font-bold text-emerald-400 mb-1">{userProfile?.trustScore || 0}</div>
                        <p className="text-sm text-slate-500">Tier: <span className="text-slate-300">Standard</span></p>
                    </div>

                    <div className="bg-fintech-card p-6 rounded-xl border border-fintech-border shadow-lg">
                        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">NFT Identity</h3>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-md shadow-inner flex items-center justify-center">
                                <span className="text-white text-xs font-bold">NFT</span>
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm">Soulbound Token</p>
                                <p className="text-slate-500 text-xs text-green-400">Verified ✅</p>
                            </div>
                        </div>
                    </div>

                    {/* Placeholder Active Loans Area */}
                    <div className="bg-fintech-card p-6 rounded-xl border border-fintech-border shadow-lg">
                        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">Active Contracts</h3>
                        <button
                            onClick={() => handleRepayLoan(1)}
                            disabled={activeLoanIdToRepay || isWritePending || isConfirming}
                            className={`w-full py-2 rounded text-sm transition-colors ${activeLoanIdToRepay || isWritePending || isConfirming ? 'bg-fintech-dark text-slate-500 border border-fintech-border cursor-not-allowed' : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/50'}`}
                        >
                            {activeLoanIdToRepay && isConfirming ? 'Confirming Tx...' : activeLoanIdToRepay && isWritePending ? 'Approve in Wallet...' : 'Repay Loan #1 (Demo)'}
                        </button>
                    </div>
                </div>

                {/* Main Loan Creation Area */}
                <div className="col-span-1 md:col-span-2">
                    <div className="bg-fintech-card p-8 rounded-xl border border-fintech-border shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-6">Create New Loan Request</h2>

                        {message && (
                            <div className={`p-4 rounded-lg mb-6 text-sm break-all ${message.includes('success') || message.includes('Exec') ? 'bg-fintech-success/20 text-fintech-success border border-fintech-success/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                                {message}
                                {hash && <div className="mt-1 text-xs">Tx Hash: {hash}</div>}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Loan Amount (USDC)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="e.g. 500"
                                        required
                                        min="1"
                                        className="w-full bg-fintech-dark border border-fintech-border text-white rounded-lg p-3 outline-none focus:border-fintech-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Duration (Months)</label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        placeholder="e.g. 12"
                                        required
                                        min="1"
                                        className="w-full bg-fintech-dark border border-fintech-border text-white rounded-lg p-3 outline-none focus:border-fintech-accent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Loan Purpose</label>
                                <textarea
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="Describe how you plan to use this capital..."
                                    required
                                    rows="3"
                                    className="w-full bg-fintech-dark border border-fintech-border text-white rounded-lg p-3 outline-none focus:border-fintech-accent resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || isWritePending || isConfirming}
                                className={`w-full font-medium py-3 rounded-lg transition-colors shadow-lg ${loading || isWritePending || isConfirming ? 'bg-fintech-dark text-slate-500 border border-fintech-border cursor-not-allowed' : 'bg-fintech-accent hover:bg-blue-600 text-white'}`}
                            >
                                {loading ? 'Publishing Request...' : 'Publish Loan Request to Market'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BorrowerDashboard;
