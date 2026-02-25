import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPocket, FiLoader, FiArrowLeft, FiShield, FiActivity } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useConfig } from 'wagmi';
import { getPublicClient } from '@wagmi/core';
import toast from 'react-hot-toast';
import addresses from '../contracts/addresses.json';

const IDENTITY_CONTRACT_ADDRESS = addresses.identity;
const IDENTITY_ABI = ["function balanceOf(address owner) view returns (uint256)"];

const SignIn = () => {
    const navigate = useNavigate();
    const { walletLogin, userProfile } = useAuth();
    const { address, isConnected } = useAccount();
    const config = useConfig();

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const performSignIn = async () => {
            if (isConnected && address && !userProfile) {
                const tid = toast.loading('Synchronizing with protocol...');
                try {
                    setLoading(true);

                    // 1. Backend Login
                    const loginResult = await walletLogin(address);
                    if (!loginResult.success) {
                        throw new Error("Authorization rejected.");
                    }

                    // 2. Check Identity NFT
                    const publicClient = getPublicClient(config);
                    const balance = await publicClient.readContract({
                        address: IDENTITY_CONTRACT_ADDRESS,
                        abi: IDENTITY_ABI,
                        functionName: 'balanceOf',
                        args: [address],
                    });

                    if (Number(balance) > 0) {
                        toast.success('Identity Verified. Access Granted.', { id: tid });
                        navigate('/dashboard');
                    } else {
                        toast.error('Identity NFT not found. Redirecting to onboarding.', { id: tid, duration: 4000 });
                        navigate('/onboarding');
                    }
                } catch (err) {
                    toast.error(err.message || 'Verification failed.', { id: tid });
                } finally {
                    setLoading(false);
                }
            }
        };

        performSignIn();
    }, [isConnected, address, userProfile, navigate, walletLogin, config]);

    return (
        <div className="min-h-screen bg-fintech-dark flex items-center justify-center px-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fintech-accent/5 rounded-full blur-[120px]"></div>
            </div>

            <button
                onClick={() => navigate('/')}
                className="absolute top-10 left-10 text-slate-500 hover:text-white flex items-center gap-2 transition-colors text-xs font-black uppercase tracking-widest group"
            >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Exit to Terminal
            </button>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-fintech-surface border border-fintech-border text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <FiShield size={40} />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2">Authorize Access</h2>
                    <p className="text-slate-500 font-medium">Connect your wallet to anchor your session.</p>
                </div>

                <div className="premium-card !p-8">
                    <ConnectButton.Custom>
                        {({
                            account,
                            chain,
                            openConnectModal,
                            openChainModal,
                            mounted,
                        }) => {
                            const ready = mounted;
                            const connected = ready && account && chain;

                            return (
                                <div
                                    {...(!ready && {
                                        'aria-hidden': true,
                                        'style': {
                                            opacity: 0,
                                            pointerEvents: 'none',
                                            userSelect: 'none',
                                        },
                                    })}
                                >
                                    {(() => {
                                        if (!connected) {
                                            return (
                                                <button
                                                    onClick={openConnectModal}
                                                    type="button"
                                                    className="btn-primary w-full py-5 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                                                >
                                                    {loading ? <FiLoader className="animate-spin text-blue-500" /> : <><FiPocket size={18} /> Secure Connect</>}
                                                </button>
                                            );
                                        }

                                        if (chain.unsupported) {
                                            return (
                                                <button
                                                    onClick={openChainModal}
                                                    type="button"
                                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all text-xs uppercase tracking-widest"
                                                >
                                                    Unsupported Network
                                                </button>
                                            );
                                        }

                                        return (
                                            <div className="space-y-6">
                                                <div className="p-5 bg-fintech-dark rounded-xl border border-fintech-border flex items-center justify-between shadow-inner">
                                                    <div className="text-left">
                                                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">Authenticated</p>
                                                        <p className="text-white font-bold">{account.displayName}</p>
                                                    </div>
                                                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                                                        <FiActivity />
                                                    </div>
                                                </div>
                                                {loading && (
                                                    <div className="flex items-center justify-center gap-3 text-blue-500 py-2">
                                                        <FiLoader className="animate-spin" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Protocol...</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        }}
                    </ConnectButton.Custom>

                    <div className="mt-10 pt-8 border-t border-slate-900 text-center">
                        <p className="text-slate-500 text-sm font-medium">
                            First time here? <button onClick={() => navigate('/signup')} className="text-blue-500 hover:text-blue-400 font-bold ml-1 transition-colors">Create Identity</button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SignIn;
