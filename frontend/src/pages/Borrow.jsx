import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { FiTrendingUp, FiShield, FiArrowRight, FiLoader, FiCheckCircle, FiPlus } from 'react-icons/fi';
import { checkIdentityOwnership } from '../blockchainService';

const Borrow = () => {
    const navigate = useNavigate();
    const { address: walletAddress, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [isVerified, setIsVerified] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkNFT = async () => {
            if (!walletAddress) {
                setChecking(false);
                return;
            }
            setChecking(true);
            try {
                // Always check blockchain directly — no localStorage
                const provider = walletClient
                    ? new ethers.BrowserProvider(walletClient.transport)
                    : null;
                const verified = await checkIdentityOwnership(walletAddress, provider);
                setIsVerified(verified);
            } catch (err) {
                console.error('[Borrow] NFT check failed:', err);
                setIsVerified(false);
            } finally {
                setChecking(false);
            }
        };

        checkNFT();
    }, [walletAddress, walletClient]);

    return (
        <div className="space-y-8 md:space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter flex items-center gap-3">
                        <FiTrendingUp className="text-blue-500" /> Borrow Capital
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 font-medium italic">Instant liquidity backed by protocol reputation.</p>
                </div>
            </header>

            {/* Checking spinner */}
            {checking && (
                <div className="premium-card !p-12 flex flex-col items-center justify-center gap-4 text-slate-500">
                    <FiLoader size={32} className="animate-spin text-blue-500" />
                    <p className="text-[11px] font-black uppercase tracking-widest">Verifying identity on-chain...</p>
                </div>
            )}

            {/* --- NOT VERIFIED: Show Initialize Credit Profile CTA --- */}
            {!checking && !isVerified && (
                <div className="premium-card !p-8 md:!p-12 border-l-4 border-l-blue-600/50">
                    <p className="text-base md:text-xl text-slate-400 mb-10 md:mb-12 font-medium leading-relaxed max-w-2xl">
                        Access liquidity instantly using your on-chain protocol reputation score. No centralized credit checks, no hidden fees.
                    </p>

                    <div className="bg-slate-950/50 border-2 border-dashed border-slate-900 !p-8 md:!p-10 rounded-[2.5rem] mt-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-10">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 shadow-lg">
                                <FiShield size={40} />
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className="text-xl md:text-2xl font-black text-white italic tracking-tight">Initialize Credit Profile</h3>
                                <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
                                    Before applying for a decentralized loan, you must verify your identity and generate a non-transferable Identity NFT representing your trust score.
                                </p>
                            </div>
                        </div>

                        <div className="mt-10 pt-10 border-t border-slate-900 flex justify-end">
                            <button
                                onClick={() => navigate('/onboarding')}
                                className="btn-primary w-full md:w-auto px-10 !py-4 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-500/10"
                            >
                                Get Verified &amp; Mint NFT <FiArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VERIFIED: Show Loan Creation UI --- */}
            {!checking && isVerified && (
                <div className="space-y-8">
                    {/* Identity verified badge */}
                    <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 px-5 py-3 rounded-2xl w-fit">
                        <FiCheckCircle className="text-emerald-500" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Identity Verified — Credit Profile Active</span>
                    </div>

                    <div className="premium-card !p-8 md:!p-12 border-l-4 border-l-emerald-500/40">
                        <p className="text-base md:text-xl text-slate-400 mb-10 md:mb-12 font-medium leading-relaxed max-w-2xl">
                            Your Soulbound Identity is confirmed. You can now create loan requests on the protocol marketplace.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn-primary w-full sm:w-auto px-10 !py-4 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-500/10"
                            >
                                <FiPlus size={16} /> Create Loan Request
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full sm:w-auto px-10 py-4 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Borrow;
