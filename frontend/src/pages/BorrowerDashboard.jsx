import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';

import addresses from '../contracts/addresses.json';
import microfinanceAbi from '../contracts/Microfinance.json';

const BorrowerDashboard = () => {
    const { userProfile, token } = useAuth();
    const { address: walletAddress, isConnected } = useAccount();
    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState('');
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [myLoans, setMyLoans] = useState([]);
    const [processingLoan, setProcessingLoan] = useState(null);
    const [txHash, setTxHash] = useState(null);

    useEffect(() => {
        if (token) {
            fetchMyLoans();
        }
    }, [token]);

    const fetchMyLoans = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/loans/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setMyLoans(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching my loans:", error);
        }
    };

    const handleRepayLoan = async (loanId, smartContractId, amount) => {
        if (!isConnected) return alert("Please connect your wallet first");

        setProcessingLoan(loanId);
        setTxHash(null);
        setMessage('Awaiting wallet approval to repay on-chain...');

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(addresses.microfinance, microfinanceAbi, signer);

            // Fetch repayment amount (Principal + Interest)
            // For demo, we use a fixed 10% premium or 0.01 MATIC placeholder if not set
            const valueToSend = ethers.parseEther("0.01");

            console.log(`Repaying Loan ID: ${smartContractId}`);
            const tx = await contract.repayLoan(smartContractId, { value: valueToSend });
            setTxHash(tx.hash);

            setMessage('Transaction submitted! Waiting for confirmation...');
            await tx.wait();

            setMessage('Repayment Confirmed on Blockchain! Syncing with backend...');

            // Sync with backend
            await axios.put(`http://localhost:5000/api/loans/${loanId}/repay`, {
                txHash: tx.hash
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('Loan fully Repaid! Your trust score will be updated shortly.');
            fetchMyLoans();
        } catch (error) {
            console.error(error);
            setMessage('Repayment failed: ' + (error.reason || error.message));
        } finally {
            setProcessingLoan(null);
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const res = await axios.post('http://localhost:5000/api/loans', {
                borrowerId: userProfile._id,
                amountRequested: Number(amount),
                interestRate: 10,
                durationMonths: Number(duration),
                purpose
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setMessage('Loan Request successfully published! Waiting for a lender to fund.');
                setAmount('');
                setDuration('');
                setPurpose('');
                fetchMyLoans();
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
                <div className="col-span-1 space-y-6">
                    <div className="bg-fintech-card p-6 rounded-xl border border-fintech-border shadow-lg">
                        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">My Trust Score</h3>
                        <div className="text-4xl font-bold text-emerald-400 mb-1">{userProfile?.trustScore || 0}</div>
                        <p className="text-sm text-slate-500 italic">Syncing with on-chain records...</p>
                    </div>

                    <div className="bg-fintech-card p-6 rounded-xl border border-fintech-border shadow-lg">
                        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">NFT Identity</h3>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-md shadow-inner flex items-center justify-center">
                                <span className="text-white text-xs font-bold">SBT</span>
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm">Aamba Identity</p>
                                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Verified</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-8">
                    <div className="bg-fintech-card p-8 rounded-xl border border-fintech-border shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-6">Create New Loan Request</h2>
                        {message && (
                            <div className={`p-4 rounded-lg mb-6 text-sm ${message.includes('failed') || message.includes('Error') ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'} border border-opacity-20`}>
                                {message}
                                {txHash && <div className="mt-2 font-mono text-xs opacity-70 break-all">Hash: {txHash}</div>}
                            </div>
                        )}
                        <form onSubmit={handleSubmitRequest} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Amount (MATIC)</label>
                                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0.01" step="0.01" className="w-full bg-fintech-dark border border-fintech-border text-white rounded-lg p-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Duration (Months)</label>
                                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required min="1" className="w-full bg-fintech-dark border border-fintech-border text-white rounded-lg p-3" />
                                </div>
                            </div>
                            <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Loan purpose..." required className="w-full bg-fintech-dark border border-fintech-border text-white rounded-lg p-3"></textarea>
                            <button type="submit" disabled={loading} className="w-full bg-fintech-accent font-bold py-3 rounded-lg text-white hover:bg-blue-600 transition-colors uppercase tracking-widest text-sm">
                                {loading ? 'Processing...' : 'Request Loan via Protocol'}
                            </button>
                        </form>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white">Your Loan History</h2>
                        {myLoans.length === 0 ? (
                            <p className="text-slate-500 italic">No loan activity yet.</p>
                        ) : (
                            myLoans.map(loan => (
                                <div key={loan._id} className="bg-fintech-card p-6 rounded-xl border border-fintech-border flex justify-between items-center group">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xl font-bold text-white">{loan.amountRequested} MATIC</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${loan.status === 'Funded' ? 'bg-blue-500/20 text-blue-400' : loan.status === 'Repaid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                                {loan.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-xs">Contract ID: <span className="font-mono text-slate-300">{loan.simulatedSmartContractId || 'Awaiting Lender'}</span></p>
                                    </div>
                                    {loan.status === 'Funded' && (
                                        <button
                                            onClick={() => handleRepayLoan(loan._id, loan.simulatedSmartContractId, loan.amountRequested)}
                                            disabled={processingLoan === loan._id}
                                            className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 px-6 py-2 rounded-lg text-sm font-bold transition-all"
                                        >
                                            {processingLoan === loan._id ? 'Processing...' : 'Repay Loan'}
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BorrowerDashboard;

