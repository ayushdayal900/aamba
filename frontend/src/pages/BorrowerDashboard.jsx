import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ethers } from 'ethers';
import { useAccount, useConfig } from 'wagmi';
import { getConnectorClient } from '@wagmi/core';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLoader, FiCheckCircle, FiInfo, FiActivity, FiShield } from 'react-icons/fi';

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
    const navigate = useNavigate();

    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState('');
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);
    const [myLoans, setMyLoans] = useState([]);
    const [processingLoan, setProcessingLoan] = useState(null);

    useEffect(() => {
        if (token || userProfile?.token || walletAddress) {
            fetchMyLoans();
        }
    }, [token, userProfile, walletAddress]);

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
        if (!isConnected) return toast.error("Please connect your wallet");

        const tid = toast.loading('Initiating repayment on-chain...');
        setProcessingLoan(loanId);

        try {
            const hasIdentity = await checkIdentityOwnership(walletAddress);
            if (!hasIdentity) {
                toast.error("Protocol Access Denied: No Identity NFT", { id: tid });
                navigate("/onboarding");
                return;
            }

            const signer = await clientToSigner(config, chainId);
            if (!signer) throw new Error("Failed to get signer");
            const contract = new ethers.Contract(addresses.microfinance, microfinanceAbi, signer);

            const loanDetails = await contract.getLoanDetails(smartContractId);
            const valueToSend = loanDetails.repaymentAmount;

            toast.loading('Confirm repayment in wallet...', { id: tid });
            const tx = await contract.repayLoan(smartContractId, { value: valueToSend });

            toast.loading('Repayment pending on-chain...', { id: tid });
            await tx.wait();

            toast.loading('Finalizing with protocol...', { id: tid });
            await axios.put(`http://localhost:5000/api/loans/${loanId}/repay`, {
                txHash: tx.hash
            }, {
                headers: { Authorization: `Bearer ${token || userProfile.token}` }
            });

            toast.success('Loan fully repaid! Reputation increased.', { id: tid });
            fetchMyLoans();
        } catch (error) {
            toast.error(parseBlockchainError(error), { id: tid });
        } finally {
            setProcessingLoan(null);
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!isConnected) return toast.error("Please connect your wallet");

        const tid = toast.loading('Initializing proposal...');
        setLoading(true);

        try {
            const hasIdentity = await checkIdentityOwnership(walletAddress);
            if (!hasIdentity) {
                toast.error("No identity NFT detected", { id: tid });
                navigate("/onboarding");
                return;
            }

            const signer = await clientToSigner(config, chainId);
            if (!signer) throw new Error("Failed to get signer");
            const contract = new ethers.Contract(addresses.microfinance, microfinanceAbi, signer);

            const principal = ethers.parseEther(amount.toString());
            const repayment = ethers.parseEther(((amount * (100 + 10)) / 100).toString());
            const durationInSeconds = Number(duration) * 30 * 24 * 60 * 60;

            toast.loading('Confirm transaction in wallet...', { id: tid });
            const tx = await contract.requestLoan(principal, repayment, durationInSeconds);

            toast.loading('Broadcasting to network...', { id: tid });
            await tx.wait();

            toast.loading('Syncing proposal state...', { id: tid });
            await axios.post('http://localhost:5000/api/loans', {
                borrowerId: userProfile._id,
                amountRequested: Number(amount),
                interestRate: 10,
                durationMonths: Number(duration),
                purpose,
                txHash: tx.hash
            }, {
                headers: { Authorization: `Bearer ${token || userProfile.token}` }
            });

            toast.success('Proposal live in marketplace!', { id: tid });
            setAmount('');
            setDuration('');
            setPurpose('');
            fetchMyLoans();
        } catch (error) {
            toast.error(parseBlockchainError(error), { id: tid });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white">Borrower Dashboard</h1>
                    <p className="text-slate-500 font-medium">Manage your active loans and protocol reputation.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <div className="premium-card">
                        <div className="flex items-center gap-3 text-slate-400 mb-4">
                            <FiActivity className="text-blue-500" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Trust Metrics</span>
                        </div>
                        <div className="text-5xl font-black text-white mb-2">{userProfile?.trustScore || 0}</div>
                        <p className="text-xs text-slate-500 font-medium">Synced with on-chain registry</p>
                    </div>

                    <div className="premium-card">
                        <div className="flex items-center gap-3 text-emerald-400 mb-6 font-bold uppercase tracking-widest text-[10px]">
                            <FiShield /> Identity Status
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                <FiCheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-white font-bold">Verified SBT</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Level 1 Identity</p>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card">
                        <h3 className="text-lg font-bold text-white mb-6">Request Capital</h3>
                        <form onSubmit={handleSubmitRequest} className="space-y-5">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">Amount (MATIC)</label>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0.01" step="0.01" placeholder="0.00" className="w-full bg-fintech-dark border border-fintech-border text-white rounded-xl p-3 focus:border-blue-500 focus:outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">Term (Months)</label>
                                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required min="1" placeholder="12" className="w-full bg-fintech-dark border border-fintech-border text-white rounded-xl p-3 focus:border-blue-500 focus:outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">Proposal Purpose</label>
                                <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Describe your plan..." required className="w-full bg-fintech-dark border border-fintech-border text-white rounded-xl p-3 h-24 focus:border-blue-500 focus:outline-none transition-all resize-none"></textarea>
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-xs uppercase tracking-[0.2em] font-black">
                                {loading ? <FiLoader className="animate-spin inline mr-2" /> : 'Submit Proposal'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h2 className="text-xl font-black text-white">Active Obligations</h2>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest">{myLoans.length} Proposals</span>
                    </div>

                    {myLoans.length === 0 ? (
                        <div className="premium-card py-20 text-center space-y-4">
                            <FiInfo className="mx-auto text-slate-700" size={48} />
                            <p className="text-slate-500 font-medium italic">No active protocol history detected.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {myLoans.map(loan => (
                                <div key={loan._id} className="premium-card border-l-4 border-l-blue-500 group">
                                    <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Proposal #{loan.simulatedSmartContractId || 'PENDING'}</span>
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${loan.status === 'Funded' ? 'bg-blue-500/10 text-blue-500' :
                                                        loan.status === 'Repaid' ? 'bg-emerald-500/10 text-emerald-500' :
                                                            'bg-slate-800 text-slate-500'
                                                    }`}>
                                                    {loan.status}
                                                </span>
                                            </div>
                                            <h3 className="text-3xl font-black text-white">{loan.amountRequested} <span className="text-slate-500 text-sm font-normal">MATIC</span></h3>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Interest</p>
                                                <p className="text-white font-black">{loan.interestRate}%</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Term</p>
                                                <p className="text-white font-black">{loan.durationMonths}m</p>
                                            </div>
                                            <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-fintech-border pt-4 md:pt-0 md:pl-10">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Repay</p>
                                                <p className="text-blue-500 font-black text-lg">{(loan.amountRequested * (1 + loan.interestRate / 100)).toFixed(4)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-8 opacity-90 grayscale-0 group-hover:grayscale-0 transition-all">
                                        <LoanTimeline status={loan.status} />
                                    </div>

                                    <div className="flex flex-col md:flex-row items-end justify-between gap-6 pt-6 border-t border-fintech-border/50">
                                        <div className="w-full">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Blockchain Evidence</p>
                                            <TransactionAccordion txHash={loan.status === 'Funded' ? loan.fundingTxHash : loan.repaymentTxHash} />
                                        </div>

                                        {loan.status === 'Funded' && (
                                            <button
                                                onClick={() => handleRepayLoan(loan._id, loan.simulatedSmartContractId, loan.amountRequested)}
                                                disabled={processingLoan === loan._id}
                                                className="btn-primary w-full md:w-auto px-10 py-3 whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2"
                                            >
                                                {processingLoan === loan._id ? <FiLoader className="animate-spin" /> : 'Settle On-Chain'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BorrowerDashboard;
