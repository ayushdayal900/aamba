import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { FiPocket, FiAlertCircle, FiLoader, FiArrowLeft, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useConfig } from 'wagmi';
import { getPublicClient } from '@wagmi/core';

const IDENTITY_CONTRACT_ADDRESS = "0x77cF3b859BD62d7BB936b336358C0aaF4EFA017C";
const IDENTITY_ABI = ["function balanceOf(address owner) view returns (uint256)"];

const SignIn = () => {
    const navigate = useNavigate();
    const { walletLogin, userProfile } = useAuth();
    const { address, isConnected, chainId } = useAccount();
    const config = useConfig();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle authentication logic when wallet is connected
    useEffect(() => {
        const performSignIn = async () => {
            if (isConnected && address && !userProfile) {
                try {
                    setLoading(true);
                    setError('');

                    // 1. Backend Login
                    const loginResult = await walletLogin(address);
                    if (!loginResult.success) {
                        throw new Error("Backend authentication failed.");
                    }

                    // 2. Check Identity NFT (Using viem via wagmi's public client for efficiency)
                    const publicClient = getPublicClient(config);
                    const balance = await publicClient.readContract({
                        address: IDENTITY_CONTRACT_ADDRESS,
                        abi: IDENTITY_ABI,
                        functionName: 'balanceOf',
                        args: [address],
                    });

                    if (Number(balance) > 0) {
                        navigate('/dashboard');
                    } else {
                        navigate('/onboarding');
                    }
                } catch (err) {
                    console.error(err);
                    setError('Sign-in failed: ' + (err.message || 'Unknown error'));
                } finally {
                    setLoading(false);
                }
            }
        };

        performSignIn();
    }, [isConnected, address, userProfile, navigate, walletLogin, config]);

    return (
        <div className="min-h-screen bg-fintech-dark flex items-center justify-center px-6">
            <button
                onClick={() => navigate('/')}
                className="absolute top-10 left-10 text-slate-500 hover:text-white flex items-center gap-2 transition-colors font-semibold"
            >
                <FiArrowLeft /> Back to Home
            </button>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-fintech-card p-10 rounded-3xl border border-fintech-border shadow-2xl text-center relative overflow-hidden"
            >
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-fintech-accent/5 rounded-bl-full"></div>

                <div className="w-16 h-16 bg-fintech-accent/20 text-fintech-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FiShield size={32} />
                </div>

                <h2 className="text-3xl font-extrabold text-white mb-2">Welcome Back</h2>
                <p className="text-slate-400 mb-10">Sign in with your wallet to access the protocol.</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm mb-8 text-left">
                        <FiAlertCircle className="flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

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
                                                className="w-full bg-gradient-to-r from-blue-600 to-fintech-accent text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                                            >
                                                {loading ? <FiLoader className="animate-spin" /> : <><FiPocket size={20} /> Connect Wallet</>}
                                            </button>
                                        );
                                    }

                                    if (chain.unsupported) {
                                        return (
                                            <button
                                                onClick={openChainModal}
                                                type="button"
                                                className="w-full bg-red-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl"
                                            >
                                                Wrong Network
                                            </button>
                                        );
                                    }

                                    return (
                                        <div className="flex flex-col gap-4">
                                            <div className="p-4 bg-fintech-dark/50 rounded-2xl border border-fintech-border flex items-center justify-between">
                                                <div className="text-left">
                                                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Connected</p>
                                                    <p className="text-white font-bold">{account.displayName}</p>
                                                </div>
                                                {account.displayBalance && (
                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Balance</p>
                                                        <p className="text-fintech-accent font-bold">{account.displayBalance}</p>
                                                    </div>
                                                )}
                                            </div>
                                            {loading && (
                                                <div className="flex items-center justify-center gap-2 text-fintech-accent font-bold">
                                                    <FiLoader className="animate-spin" />
                                                    <span>Syncing Profile...</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    }}
                </ConnectButton.Custom>

                <p className="mt-8 text-slate-500 text-sm">
                    New to Aamba? <button onClick={() => navigate('/signup')} className="text-fintech-accent hover:underline font-bold">Create an account</button>
                </p>
            </motion.div>
        </div>
    );
};

export default SignIn;
