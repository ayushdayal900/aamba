import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ethers } from 'ethers';
import { useAccount, useConfig } from 'wagmi';
import { getConnectorClient } from '@wagmi/core';

import addresses from '../contracts/addresses.json';
import microfinanceAbi from '../contracts/Microfinance.json';
import { mintIdentity, checkIdentityOwnership, parseBlockchainError } from '../blockchainService';
import LoanTimeline from '../components/LoanTimeline';
import TransactionAccordion from '../components/TransactionAccordion';

// Helper to convert wagmi client to ethers signer
async function clientToSigner(config, chainId) {
    const client = await getConnectorClient(config, { chainId });
    if (!client) return null;
    const { account, chain, transport } = client;
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    };
    const provider = new ethers.BrowserProvider(transport, network);
    const signer = new ethers.JsonRpcSigner(provider, account.address);
    return signer;
}

const BorrowerDashboard = () => {
    const { userProfile, token } = useAuth();
    const { address: walletAddress, isConnected, chainId } = useAccount();
    const config = useConfig();
    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState('');
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [myLoans, setMyLoans] = useState([]);
    const [processingLoan, setProcessingLoan] = useState(null);
    const [txHash, setTxHash] = useState(null);
    const [isIdentityVerified, setIsIdentityVerified] = useState(true); // Default to true, will re-verify

    useEffect(() => {
        if (token || userProfile?.token) {
            fetchMyLoans();
            verifyIdentity();
        }
    }, [token, userProfile, walletAddress]);

    const verifyIdentity = async () => {
        if (walletAddress) {
            const hasNFT = await checkIdentityOwnership(walletAddress);
            setIsIdentityVerified(hasNFT);
        }
    };

    const fetchMyLoans = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/loans/my', {
                headers: { Authorization: `Bearer ${token || userProfile.token}` }
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
        // Strict on-chain identity check
        const hasIdentity = await checkIdentityOwnership(walletAddress);
        if (!hasIdentity) {
            alert("Protocol Access Denied: No Soulbound Identity detected. Redirecting to onboarding...");
            window.location.href = "/onboarding";
            return;
        }

        setMessage('Awaiting wallet approval to repay on-chain...');

        try {
            const signer = await clientToSigner(config, chainId);
            if (!signer) throw new Error("Failed to get signer");
            const contract = new ethers.Contract(addresses.microfinance, microfinanceAbi, signer);

            // Fetch actual repayment amount from the blockchain struct
            const loanDetails = await contract.getLoanDetails(smartContractId);
            const valueToSend = loanDetails.repaymentAmount;

            console.log(`Repaying Loan ID: ${smartContractId}, Amount: ${ethers.formatEther(valueToSend)}`);
            const tx = await contract.repayLoan(smartContractId, { value: valueToSend });
            setTxHash(tx.hash);

            setMessage('Transaction submitted! Waiting for confirmation...');
            await tx.wait();

            setMessage('Repayment Confirmed on Blockchain! Syncing with backend...');

            // Sync with backend
            await axios.put(`http://localhost:5000/api/loans/${loanId}/repay`, {
                txHash: tx.hash
            }, {
                headers: { Authorization: `Bearer ${token || userProfile.token}` }
            });

            setMessage('Loan fully Repaid! Your trust score will be updated shortly.');
            fetchMyLoans();
        } catch (error) {
            console.error(error);
            setMessage('Repayment failed: ' + parseBlockchainError(error));
        } finally {
            setProcessingLoan(null);
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!isConnected) return alert("Please connect your wallet first");

        // Real-time on-chain check
        const hasIdentity = await checkIdentityOwnership(walletAddress);
        if (!hasIdentity) {
            alert("No Soulbound Identity detected. Redirecting to onboarding...");
            window.location.href = "/onboarding";
            return;
        }

        setLoading(true);
        setMessage('Initiating on-chain loan request...');
        setTxHash(null);

        try {
            const signer = await clientToSigner(config, chainId);
            if (!signer) throw new Error("Failed to get signer");
            const contract = new ethers.Contract(addresses.microfinance, microfinanceAbi, signer);

            const principal = ethers.parseEther(amount.toString());
            const repayment = ethers.parseEther(((amount * (100 + 10)) / 100).toString()); // 10% interest
            const durationInSeconds = Number(duration) * 30 * 24 * 60 * 60;

            console.log(`Requesting Loan: ${amount} MATIC for ${duration} months`);
            const tx = await contract.requestLoan(principal, repayment, durationInSeconds);
            setTxHash(tx.hash);

            setMessage('Transaction submitted! Waiting for confirmation...');
            const receipt = await tx.wait();

            // Extract loanId from events if needed, but the backend listener will catch it.
            setMessage('Loan Request confirmed on-chain! Syncing details...');

            // Optionally notify backend about the purpose (as it is not stored on-chain)
            await axios.post('http://localhost:5000/api/loans', {
                borrowerId: userProfile._id,
                amountRequested: Number(amount),
                interestRate: 10,
                durationMonths: Number(duration),
                purpose,
                txHash: tx.hash // Provide txHash to help matching
            }, {
                headers: { Authorization: `Bearer ${token || userProfile.token}` }
            });

            setMessage('Success! Your loan request is live in the marketplace.');
            setAmount('');
            setDuration('');
            setPurpose('');
            fetchMyLoans();
        } catch (error) {
            console.error(error);
            setMessage(parseBlockchainError(error));
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

                    <div className="grid grid-cols-1 gap-6">
                        <h2 className="text-xl font-bold text-white flex items-center justify-between">
                            Active & Past Loans
                            <span className="bg-fintech-accent/10 text-fintech-accent text-xs px-2 py-1 rounded-full">{myLoans.length} total</span>
                        </h2>
                        {myLoans.length === 0 ? (
                            <div className="bg-fintech-card p-10 rounded-xl border border-fintech-border text-center text-slate-500 italic">
                                No loan activity yet. Your protocol history will appear here.
                            </div>
                        ) : (
                            myLoans.map(loan => (
                                <div key={loan._id} className="bg-fintech-card p-6 rounded-2xl border border-fintech-border hover:border-fintech-accent/50 transition-all duration-300">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-slate-500">ID: {loan.simulatedSmartContractId || 'PENDING'}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${loan.status === 'Funded' ? 'bg-blue-500/20 text-blue-400' :
                                                    loan.status === 'Repaid' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        'bg-slate-500/20 text-slate-400'
                                                    }`}>
                                                    {loan.status}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-white">{loan.amountRequested} <span className="text-slate-500 text-sm font-normal">MATIC</span></h3>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
                                            <div>
                                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">Interest</p>
                                                <p className="text-blue-400 font-bold">{loan.interestRate}%</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">Term</p>
                                                <p className="text-white font-medium">{loan.durationMonths} Months</p>
                                            </div>
                                            <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-fintech-border pt-2 md:pt-0 md:pl-4">
                                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">To Repay</p>
                                                <p className="text-emerald-400 font-bold">{(loan.amountRequested * (1 + loan.interestRate / 100)).toFixed(4)} MATIC</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6 px-4">
                                        <LoanTimeline status={loan.status} />
                                    </div>

                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-4 border-t border-fintech-border/50">
                                        <div className="flex-1">
                                            <p className="text-slate-500 text-[10px] uppercase font-bold mb-2">Transaction History</p>
                                            <TransactionAccordion txHash={loan.status === 'Pending' ? txHash : (loan.status === 'Funded' ? loan.fundingTxHash : loan.repaymentTxHash)} />
                                        </div>

                                        {loan.status === 'Funded' && (
                                            <button
                                                onClick={() => handleRepayLoan(loan._id, loan.simulatedSmartContractId, loan.amountRequested)}
                                                disabled={processingLoan === loan._id}
                                                className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                {processingLoan === loan._id ? (
                                                    <><FiLoader className="animate-spin" /> Processing...</>
                                                ) : 'Repay Protocol'}
                                            </button>
                                        )}
                                    </div>
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

