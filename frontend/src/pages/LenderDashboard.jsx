import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';

import addresses from '../contracts/addresses.json';
import microfinanceAbi from '../contracts/Microfinance.json';

const LenderDashboard = () => {
    const { userProfile, token } = useAuth();
    const { address: walletAddress, isConnected } = useAccount();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState('');
    const [txHash, setTxHash] = useState(null);

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/loans');
            if (res.data.success) {
                setLoans(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching loans:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFundLoan = async (loanId, borrowerWallet, amount, interestRate, durationMonths) => {
        if (!isConnected) return alert("Please connect your wallet first");

        setActionLoading(loanId);
        setTxHash(null);
        setMessage('Awaiting wallet approval to fund on-chain...');

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(addresses.microfinance, microfinanceAbi, signer);

            // Protocol parameters
            const principal = ethers.parseEther(amount.toString());
            const repaymentAmount = ethers.parseEther(((amount * (100 + interestRate)) / 100).toString());
            const durationInSeconds = durationMonths * 30 * 24 * 60 * 60;

            console.log(`Funding Loan for borrower: ${borrowerWallet}`);
            const tx = await contract.createLoan(borrowerWallet, repaymentAmount, durationInSeconds, { value: principal });
            setTxHash(tx.hash);

            setMessage('Transaction submitted! Waiting for block confirmation...');
            await tx.wait();

            setMessage('Loan Funded on Blockchain! Syncing records...');

            // Sync with backend
            await axios.put(`http://localhost:5000/api/loans/${loanId}/fund`, {
                lenderId: userProfile._id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('Transaction Successful! Loan is now active.');
            fetchLoans();
        } catch (error) {
            console.error(error);
            setMessage('Funding failed: ' + (error.reason || error.message));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Lender Dashboard</h1>
            <p className="text-slate-400 mb-8">Deploy your capital to secure, overcollateralized Web3 loan requests.</p>

            {message && (
                <div className={`p-4 rounded-lg mb-8 text-sm max-w-3xl ${message.includes('failed') || message.includes('Error') ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'} border border-opacity-20 shadow-lg`}>
                    {message}
                    {txHash && <div className="mt-2 font-mono text-[10px] opacity-70 break-all">Tx: {txHash}</div>}
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Live Market Opportunities</h2>
                <button onClick={fetchLoans} className="text-fintech-accent text-sm hover:underline flex items-center gap-2">
                    <span className="animate-spin-slow">🔄</span> Refresh Market
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400">Scanning protocol for requests...</div>
            ) : loans.length === 0 ? (
                <div className="bg-fintech-dark border border-fintech-border rounded-xl p-10 text-center text-slate-400">
                    No pending loan requests in the market right now. Check back later!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loans.map((loan) => (
                        <div key={loan._id} className="bg-fintech-card p-6 rounded-xl border border-fintech-border shadow-lg flex flex-col justify-between hover:border-fintech-accent transition-all duration-300 group">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Request Amount</p>
                                        <h3 className="text-2xl font-bold text-emerald-400">{loan.amountRequested} MATIC</h3>
                                    </div>
                                    <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                        <span className="text-emerald-400 font-semibold text-xs">{loan.interestRate}% APY</span>
                                    </div>
                                </div>

                                <p className="text-white text-sm font-medium mb-1">Purpose:</p>
                                <p className="text-slate-400 text-sm mb-4 line-clamp-2 italic">"{loan.purpose}"</p>

                                <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-fintech-border border-dashed">
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase tracking-tighter">Term</p>
                                        <p className="text-white text-sm font-medium">{loan.durationMonths} Months</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase tracking-tighter">Trust Score</p>
                                        <p className="text-emerald-400 text-sm font-bold flex items-center gap-1">
                                            {loan.borrower?.trustScore || 0}
                                            <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleFundLoan(loan._id, loan.borrower?.walletAddress, loan.amountRequested, loan.interestRate, loan.durationMonths)}
                                disabled={actionLoading === loan._id}
                                className={`w-full font-bold py-3 rounded-lg transition-all border ${actionLoading === loan._id ? 'bg-fintech-dark text-slate-500 border-fintech-border cursor-not-allowed' : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border-emerald-500/30'}`}
                            >
                                {actionLoading === loan._id ? 'Processing...' : 'Accept & Fund Protocol'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LenderDashboard;

