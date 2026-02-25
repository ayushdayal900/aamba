import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ethers } from 'ethers';
import { useAccount, useConfig } from 'wagmi';
import { getConnectorClient } from '@wagmi/core';

import addresses from '../contracts/addresses.json';
import microfinanceAbi from '../contracts/Microfinance.json';
import trustScoreAbi from '../contracts/TrustScoreRegistry.json';
import { parseBlockchainError, checkIdentityOwnership } from '../blockchainService';
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

const LenderDashboard = () => {
    const { userProfile, token } = useAuth();
    const { address: walletAddress, isConnected, chainId } = useAccount();
    const config = useConfig();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState('');
    const [txHash, setTxHash] = useState(null);

    useEffect(() => {
        fetchLoans();
        verifyIdentity();
    }, [walletAddress]);

    const verifyIdentity = async () => {
        if (walletAddress) {
            const hasNFT = await checkIdentityOwnership(walletAddress);
            if (!hasNFT && localStorage.getItem("isOnboarded") === "true") {
                // If local storage says onboarded but chain says no, reset and redirect
                localStorage.removeItem("isOnboarded");
                window.location.href = "/onboarding";
            }
        }
    };

    const fetchLoans = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/loans');
            if (res.data.success) {
                const loanData = res.data.data;

                // Enhance loans with direct on-chain trust scores
                const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
                const trustRegistry = new ethers.Contract(addresses.trustScore, trustScoreAbi, provider);

                const enhancedLoans = await Promise.all(loanData.map(async (loan) => {
                    try {
                        if (loan.borrower?.walletAddress) {
                            const onChainScore = await trustRegistry.getTrustScore(loan.borrower.walletAddress);
                            return {
                                ...loan,
                                onChainTrustScore: Number(onChainScore)
                            };
                        }
                    } catch (e) {
                        console.warn("Failed to fetch on-chain score for", loan.borrower?.walletAddress);
                    }
                    return { ...loan, onChainTrustScore: loan.borrower?.trustScore || 0 };
                }));

                setLoans(enhancedLoans);
            }
        } catch (error) {
            console.error("Error fetching loans:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFundLoan = async (loanId, smartContractId, borrowerWallet, amount, interestRate, durationMonths) => {
        if (!isConnected) return alert("Please connect your wallet first");

        // Strict on-chain identity check
        const hasIdentity = await checkIdentityOwnership(walletAddress);
        if (!hasIdentity) {
            alert("Protocol Access Denied: No Soulbound Identity detected. Redirecting to onboarding...");
            window.location.href = "/onboarding";
            return;
        }

        setActionLoading(loanId);
        setTxHash(null);
        setMessage('Awaiting wallet approval to fund on-chain...');

        try {
            const signer = await clientToSigner(config, chainId);
            if (!signer) throw new Error("Failed to get signer");
            const contract = new ethers.Contract(addresses.microfinance, microfinanceAbi, signer);
            const principal = ethers.parseEther(amount.toString());

            console.log(`Funding Loan. SC_ID: ${smartContractId}, borrower: ${borrowerWallet}`);

            let tx;
            if (smartContractId) {
                // If the loan request exists on-chain, fund it directly
                console.log(`[Blockchain] Calling fundLoan(${smartContractId})`);
                tx = await contract.fundLoan(smartContractId, { value: principal });
            } else {
                // Fallback: Create and fund in one step if not already on-chain
                console.log(`[Blockchain] Calling createLoan for borrower ${borrowerWallet}`);
                const repaymentAmount = ethers.parseEther(((amount * (100 + interestRate)) / 100).toString());
                const durationInSeconds = durationMonths * 30 * 24 * 60 * 60;
                tx = await contract.createLoan(borrowerWallet, repaymentAmount, durationInSeconds, { value: principal });
            }

            setTxHash(tx.hash);

            setMessage('Transaction submitted! Waiting for block confirmation...');
            await tx.wait();

            setMessage('Loan Funded on Blockchain! Syncing records...');

            // Sync with backend
            await axios.put(`http://localhost:5000/api/loans/${loanId}/fund`, {
                lenderId: userProfile._id
            }, {
                headers: { Authorization: `Bearer ${token || userProfile.token}` }
            });

            setMessage('Transaction Successful! Loan is now active.');
            fetchLoans();
        } catch (error) {
            console.error(error);
            setMessage('Funding failed: ' + parseBlockchainError(error));
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loans.map((loan) => (
                        <div key={loan._id} className="bg-fintech-card p-6 rounded-2xl border border-fintech-border shadow-2xl flex flex-col justify-between hover:border-emerald-500/50 transition-all duration-500 group relative overflow-hidden">
                            {/* Glow Effect */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 blur-[80px] group-hover:bg-emerald-500/10 transition-colors duration-500"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Opportunity</p>
                                        <h3 className="text-3xl font-extrabold text-white tracking-tight">
                                            {loan.amountRequested} <span className="text-slate-500 text-sm font-normal">MATIC</span>
                                        </h3>
                                    </div>
                                    <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-md">
                                        <span className="text-emerald-400 font-bold text-xs">{loan.interestRate}% APY</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center justify-between p-3 bg-fintech-dark/50 rounded-xl border border-fintech-border/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.040L3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622l-1.382-.224z" /></svg>
                                            </div>
                                            <span className="text-slate-300 text-sm">Borrower Trust Score</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-emerald-400 font-black text-lg">{loan.onChainTrustScore}</span>
                                            <div className="flex gap-1">
                                                {loan.onChainTrustScore >= 300 && <span className="bg-blue-500/20 text-blue-400 text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-tighter border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]">Highly Trusted</span>}
                                                {loan.onChainTrustScore >= 100 && loan.onChainTrustScore < 300 && <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-tighter border border-emerald-500/30">Trusted</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-fintech-dark/30 rounded-xl border border-fintech-border/20">
                                            <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Projected Return</p>
                                            <p className="text-white font-bold text-sm">
                                                +{(loan.amountRequested * (loan.interestRate / 100)).toFixed(4)} <span className="text-[10px] text-slate-500">MATIC</span>
                                            </p>
                                        </div>
                                        <div className="p-3 bg-fintech-dark/30 rounded-xl border border-fintech-border/20">
                                            <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Duration</p>
                                            <p className="text-white font-bold text-sm">{loan.durationMonths} Months</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-fintech-dark/20 p-4 rounded-xl border border-dashed border-fintech-border/50 mb-6">
                                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-2">Purpose</p>
                                    <p className="text-slate-300 text-xs italic line-clamp-2 leading-relaxed">
                                        "{loan.purpose}"
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <TransactionAccordion txHash={loan.simulatedSmartContractId ? `On-chain ID: ${loan.simulatedSmartContractId}` : null} />

                                <button
                                    onClick={() => handleFundLoan(loan._id, loan.simulatedSmartContractId, loan.borrower?.walletAddress, loan.amountRequested, loan.interestRate, loan.durationMonths)}
                                    disabled={actionLoading === loan._id}
                                    className={`w-full font-black py-4 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 ${actionLoading === loan._id
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/10'
                                        }`}
                                >
                                    {actionLoading === loan._id ? (
                                        <><FiLoader className="animate-spin" /> Executing Transaction...</>
                                    ) : (
                                        'Invest Now via Protocol'
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LenderDashboard;

