import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    FiUser,
    FiShield,
    FiAward,
    FiActivity,
    FiExternalLink,
    FiCopy,
    FiStar
} from 'react-icons/fi';
import { useAccount } from 'wagmi';
import { checkIdentityOwnership } from '../blockchainService';
import addresses from '../contracts/addresses.json';
import trustScoreAbi from '../contracts/TrustScoreRegistry.json';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const IDENTITY_CONTRACT_ADDRESS = addresses.identity;

const Profile = () => {
    const { userProfile } = useAuth();
    const { address } = useAccount();

    const [hasNft, setHasNft] = useState(false);
    const [nftLoading, setNftLoading] = useState(true);
    const [onChainTrustScore, setOnChainTrustScore] = useState(0);

    const role = userProfile?.role || 'User';
    const walletAddr = address || userProfile?.walletAddress;

    useEffect(() => {
        const fetchChainData = async () => {
            if (walletAddr) {
                try {
                    const owned = await checkIdentityOwnership(walletAddr);
                    setHasNft(owned);

                    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
                    const trustContract = new ethers.Contract(addresses.trustScore, trustScoreAbi, provider);
                    const score = await trustContract.getTrustScore(walletAddr);
                    setOnChainTrustScore(Number(score));
                } catch (err) {
                    console.error("Chain Data fetch error:", err);
                } finally {
                    setNftLoading(false);
                }
            } else {
                setNftLoading(false);
            }
        };
        fetchChainData();

        const interval = setInterval(fetchChainData, 10000);
        return () => clearInterval(interval);
    }, [walletAddr]);

    const copyAddress = (addr) => {
        navigator.clipboard.writeText(addr);
        toast.success("Address copied to clipboard");
    };

    return (
        <div className="space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white">Protocol Profile</h1>
                    <p className="text-slate-500 font-medium">Your decentralized identity and reputation across the Aamba network.</p>
                </div>
                <div className="bg-fintech-surface border border-fintech-border px-6 py-4 rounded-2xl flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">On-Chain Reputation</p>
                        <p className="text-2xl font-black text-white">{onChainTrustScore}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/10">
                        <FiAward size={24} />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <section className="premium-card relative overflow-hidden">
                        <div className="flex items-center gap-3 text-slate-400 mb-8">
                            <FiUser className="text-blue-500" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Identity Details</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div>
                                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Legal Identifier</label>
                                <p className="text-xl font-bold text-white mb-1">{userProfile?.name || 'Protocol User'}</p>
                                <p className="text-xs text-slate-500 font-medium">{userProfile?.email}</p>
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Wallet Anchor</label>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm text-slate-300 truncate max-w-[180px]">{walletAddr}</p>
                                    <button onClick={() => copyAddress(walletAddr)} className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-white transition-colors">
                                        <FiCopy size={14} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Protocol Access</label>
                                <div className="flex items-center gap-3">
                                    <FiActivity className="text-emerald-500" />
                                    <p className="text-lg font-black text-white uppercase tracking-tighter">{role}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="premium-card">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3">
                                <FiStar className="text-blue-500" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Trust Progression</span>
                            </div>
                            <span className="bg-slate-800 text-slate-400 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                                Tier: {onChainTrustScore >= 300 ? 'Gold Elite' : onChainTrustScore >= 100 ? 'Silver Verified' : 'Bronze Pilot'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-tighter text-slate-500">
                                <span>Network Strength</span>
                                <span>{onChainTrustScore} / 1000 pts</span>
                            </div>
                            <div className="h-4 w-full bg-fintech-dark rounded-full p-1 border border-fintech-border relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(onChainTrustScore / 1000) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium italic">Your score is updated on-chain automatically following successful repayments and protocol participation.</p>
                        </div>
                    </section>
                </div>

                <aside className="space-y-10">
                    <div className="premium-card text-center py-10">
                        <div className={`w-28 h-28 mx-auto mb-8 rounded-[2rem] flex items-center justify-center border-2 transition-all duration-1000 ${hasNft ? 'bg-blue-500/10 border-blue-500/50 text-blue-500 shadow-[0_0_40px_rgba(37,99,235,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-700'}`}>
                            <FiShield size={56} />
                        </div>
                        <h4 className="text-2xl font-black text-white mb-2 italic">Soulbound ID</h4>
                        <p className="text-xs text-slate-500 font-medium mb-8">Non-transferable Protocol Identity Token</p>

                        {nftLoading ? (
                            <FiActivity className="animate-spin mx-auto text-blue-500" />
                        ) : (
                            <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] ${hasNft ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                {hasNft ? <><FiShield /> Verified</> : 'Not Detected'}
                            </div>
                        )}

                        {hasNft && (
                            <div className="mt-8">
                                <a
                                    href={`https://sepolia.etherscan.io/address/${IDENTITY_CONTRACT_ADDRESS}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-blue-500 font-black uppercase tracking-widest hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                                >
                                    Etherscan <FiExternalLink />
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="premium-card space-y-6">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protocol Registry</p>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Identity Gateway</p>
                                <p className="text-[10px] font-mono text-slate-400 bg-fintech-dark p-2 rounded-lg truncate">{addresses.identity}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Reputation Engine</p>
                                <p className="text-[10px] font-mono text-slate-400 bg-fintech-dark p-2 rounded-lg truncate">{addresses.trustScore}</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Profile;
