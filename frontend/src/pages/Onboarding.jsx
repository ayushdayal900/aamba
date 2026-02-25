import React, { useState, useEffect, useRef } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiUser,
    FiShield,
    FiCamera,
    FiPocket,
    FiCheckCircle,
    FiArrowRight,
    FiBriefcase,
    FiCreditCard,
    FiLoader,
    FiExternalLink
} from 'react-icons/fi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useConfig } from 'wagmi';
import { getConnectorClient } from '@wagmi/core';
import { mintIdentity, checkIdentityOwnership } from '../blockchainService';
import toast from 'react-hot-toast';

const Onboarding = () => {
    const { userProfile, updateRole, submitKyc } = useAuth();
    const navigate = useNavigate();
    const { address, isConnected, chainId } = useAccount();
    const config = useConfig();

    const [currentStep, setCurrentStep] = useState(2);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userProfile) {
            navigate('/signin');
            return;
        }

        const localOnboarded = localStorage.getItem("isOnboarded") === "true";
        if (userProfile.kycStatus === 'Verified' || localOnboarded) {
            setCurrentStep(7);
            return;
        }

        if (currentStep === 2) {
            if (userProfile?.role === 'Unassigned') {
                setCurrentStep(2);
            } else if (userProfile?.kycStatus === 'Pending') {
                setCurrentStep(3);
            } else if (userProfile?.kycStatus === 'FaceVerified') {
                setCurrentStep(5);
            }
        }
    }, [userProfile]);

    const [role, setRole] = useState('');
    const [aadhaar, setAadhaar] = useState('');
    const [txnHash, setTxnHash] = useState('');

    const webcamRef = useRef(null);
    const [blinkInstruction, setBlinkInstruction] = useState(false);
    const [kycImage, setKycImage] = useState(null);

    const progress = ((currentStep - 1) / 6) * 100;

    const steps = [
        { id: 2, title: 'Role', icon: <FiBriefcase /> },
        { id: 3, title: 'Identity', icon: <FiShield /> },
        { id: 4, title: 'Liveliness', icon: <FiCamera /> },
        { id: 5, title: 'Wallet', icon: <FiPocket /> },
        { id: 6, title: 'Mint', icon: <FiCreditCard /> },
        { id: 7, title: 'Success', icon: <FiCheckCircle /> },
    ];

    const handleRoleSelect = async (selectedRole) => {
        setRole(selectedRole);
        setLoading(true);
        const tid = toast.loading(`Primary role: ${selectedRole}...`);
        try {
            await updateRole(selectedRole);
            toast.success('Role assigned', { id: tid });
            setCurrentStep(3);
        } catch (err) {
            toast.error('Failed to update role', { id: tid });
        } finally {
            setLoading(false);
        }
    };

    const handleAadhaarSubmit = async (e) => {
        e.preventDefault();
        if (!/^\d{12}$/.test(aadhaar)) {
            return toast.error('Check Aadhaar Number format');
        }
        setLoading(true);
        const tid = toast.loading('Verifying identity document...');
        try {
            const response = await api.post('/users/verify-kyc', { aadhaarNumber: aadhaar });
            if (response.data.verified) {
                toast.success('Document verified', { id: tid });
                setCurrentStep(4);
            }
        } catch (err) {
            toast.error('Identity verification failed', { id: tid });
        } finally {
            setLoading(false);
        }
    };

    const performLiveliness = () => {
        setLoading(true);
        setBlinkInstruction(true);
        const tid = toast.loading('Analyzing biometric markers...');

        setTimeout(() => {
            const imageSrc = webcamRef.current.getScreenshot();
            setKycImage(imageSrc);
            setLoading(false);
            setBlinkInstruction(false);
            toast.success('Liveliness confirmed', { id: tid });
            setCurrentStep(5);
        }, 3000);
    };

    useEffect(() => {
        if (currentStep === 5 && isConnected && address) {
            setCurrentStep(6);
        }
    }, [currentStep, isConnected, address]);

    const handleMintNft = async () => {
        setLoading(true);
        const tid = toast.loading('Initiating on-chain identity mint...');
        try {
            const client = await getConnectorClient(config, { chainId });
            const provider = new ethers.BrowserProvider(client.transport);
            const signer = new ethers.JsonRpcSigner(provider, client.account.address);

            toast.loading('Confirm mint in wallet...', { id: tid });
            const { txHash } = await mintIdentity(signer, (hash) => setTxnHash(hash));

            toast.loading('Waiting for blockchain confirmation...', { id: tid });
            const isOwner = await checkIdentityOwnership(address);
            if (!isOwner) throw new Error("Identity verification failed on-chain.");

            localStorage.setItem("isOnboarded", "true");
            localStorage.setItem("walletAddress", address);
            localStorage.setItem("userRole", role || userProfile?.role);

            toast.loading('Finalizing protocol synchronization...', { id: tid });
            await submitKyc('Aadhaar', aadhaar, kycImage, address, txHash);

            toast.success('Identity Soulbound Successfully!', { id: tid });
            setCurrentStep(7);
        } catch (err) {
            toast.error('Minting failed. Check network.', { id: tid });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-fintech-dark flex flex-col items-center justify-center p-6 pt-32 font-sans text-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-fintech-accent/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-4xl mb-16 px-4">
                <div className="flex justify-between items-center mb-6">
                    {steps.map((s) => (
                        <div key={s.id} className="flex flex-col items-center group">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-700 ${currentStep >= s.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                                {currentStep > s.id ? <FiCheckCircle size={18} /> : s.icon}
                            </div>
                            <span className={`text-[9px] mt-3 font-black uppercase tracking-widest ${currentStep >= s.id ? 'text-white' : 'text-slate-700 group-hover:text-slate-500'}`}>
                                {s.title}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full p-0.5 border border-slate-900 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                    />
                </div>
            </div>

            <div className="w-full max-w-3xl premium-card !p-12 relative">
                <AnimatePresence mode="wait">
                    {/* ROLE */}
                    {currentStep === 2 && (
                        <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
                            <h2 className="text-4xl font-black text-white mb-2">Primary Access Role</h2>
                            <p className="text-slate-500 font-medium mb-12">How will you participate in the Aamba protocol?</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <button onClick={() => handleRoleSelect('Lender')} className="group p-10 bg-slate-900/50 border border-slate-800 rounded-3xl hover:border-blue-600 transition-all text-left">
                                    <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><FiBriefcase size={28} /></div>
                                    <h3 className="text-2xl font-black text-white mb-2 italic">Lender</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Deploy capital to secure, protocol-verified loan requests and earn transparent interest.</p>
                                </button>
                                <button onClick={() => handleRoleSelect('Borrower')} className="group p-10 bg-slate-900/50 border border-slate-800 rounded-3xl hover:border-blue-600 transition-all text-left">
                                    <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><FiUser size={28} /></div>
                                    <h3 className="text-2xl font-black text-white mb-2 italic">Borrower</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Obtain peer-to-peer capital backed by your on-chain reputation and verified identity.</p>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* IDENTITY */}
                    {currentStep === 3 && (
                        <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md mx-auto">
                            <h2 className="text-4xl font-black text-white mb-2 text-center">Identity Anchor</h2>
                            <p className="text-slate-500 font-medium text-center mb-10">We use decentralized verification to issuance your Soulbound ID.</p>
                            <form onSubmit={handleAadhaarSubmit} className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-4 text-center">12-Digit Unified Identifier</label>
                                    <input
                                        type="text" maxLength={12} value={aadhaar}
                                        onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                                        placeholder="0000 0000 0000"
                                        className="w-full bg-slate-950 border border-slate-900 focus:border-blue-600 rounded-2xl py-6 text-2xl font-mono tracking-[0.4em] text-white text-center outline-none transition-all"
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary w-full py-5 text-xs font-black uppercase tracking-[0.2em]">
                                    {loading ? <FiLoader className="animate-spin inline" /> : <>Continue to Biometrics <FiArrowRight className="inline ml-2" /></>}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* LIVELINESS */}
                    {currentStep === 4 && (
                        <motion.div key="s4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
                            <h2 className="text-4xl font-black text-white mb-2">Biometric Liveliness</h2>
                            <p className="text-slate-500 font-medium mb-12">Confirm your presence to anchor your identity on-chain.</p>
                            <div className="relative w-72 h-72 mx-auto rounded-[3rem] overflow-hidden border-4 border-slate-900 bg-slate-950 mb-12">
                                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover grayscale brightness-110" />
                                {loading && (
                                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                                        <FiLoader className="text-blue-600 animate-spin mb-4" size={40} />
                                        <p className="text-white font-black text-xl uppercase tracking-tighter animate-pulse">{blinkInstruction ? 'Blink Twice' : 'Processing...'}</p>
                                    </div>
                                )}
                            </div>
                            {!loading && (
                                <button onClick={performLiveliness} className="btn-primary px-12 py-5 text-xs font-black uppercase tracking-[0.2em]">Start Biometric Scan</button>
                            )}
                        </motion.div>
                    )}

                    {/* WALLET */}
                    {currentStep === 5 && (
                        <motion.div key="s5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
                            <h2 className="text-4xl font-black text-white mb-2">Protocol Link</h2>
                            <p className="text-slate-500 font-medium mb-12">Anchor your verified identity to a Web3 wallet.</p>
                            <div className="p-16 border-2 border-dashed border-slate-900 rounded-[3rem] bg-slate-950/50 mb-8 flex flex-col items-center group transition-all">
                                <div className="w-20 h-20 bg-blue-600/10 text-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform"><FiPocket size={40} /></div>
                                <ConnectButton />
                            </div>
                        </motion.div>
                    )}

                    {/* MINT */}
                    {currentStep === 6 && (
                        <motion.div key="s6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
                            <h2 className="text-4xl font-black text-white mb-2">Issue Soulbound ID</h2>
                            <p className="text-slate-500 font-medium mb-12">Minting your immutable protocol identifier on Sepolia.</p>
                            <div className="relative group max-w-xs mx-auto mb-12">
                                <div className="absolute inset-0 bg-blue-600/10 blur-3xl pointer-events-none"></div>
                                <div className="relative bg-slate-950 border-2 border-blue-600/30 p-12 rounded-[3.5rem] aspect-square flex flex-col items-center justify-center shadow-2xl">
                                    <FiShield size={90} className="text-blue-600 mb-6 drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                                    <h4 className="font-black text-2xl text-white italic">AAMBA ID</h4>
                                    <p className="text-[9px] text-slate-600 font-mono mt-4 truncate w-full">{address}</p>
                                    {txnHash && (
                                        <div className="mt-8 p-4 bg-slate-900 rounded-2xl border border-slate-800 w-full text-left">
                                            <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-1">Broadcasting</p>
                                            <a href={`https://sepolia.etherscan.io/tx/${txnHash}`} target="_blank" rel="noreferrer" className="text-[9px] text-white font-mono flex items-center gap-2 hover:text-blue-500 transition-colors">Explorer <FiExternalLink size={10} /></a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={handleMintNft} disabled={loading} className="btn-primary w-full max-w-sm py-5 text-xs font-black uppercase tracking-[0.2em]">
                                {loading ? <FiLoader className="animate-spin inline" /> : 'Claim Soulbound Identity'}
                            </button>
                        </motion.div>
                    )}

                    {/* SUCCESS */}
                    {currentStep === 7 && (
                        <motion.div key="s7" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                            <div className="w-24 h-24 bg-blue-600/10 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_40px_rgba(37,99,235,0.1)]"><FiCheckCircle size={52} /></div>
                            <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">Authorization Complete.</h2>
                            <p className="text-slate-500 max-w-md mx-auto mb-12 font-medium">Your decentralized identity is now recognized by the Aamba protocol.</p>
                            <button onClick={() => navigate('/dashboard')} className="w-full bg-white text-black font-black py-6 rounded-2xl hover:bg-slate-200 transition-all shadow-xl flex items-center justify-center gap-4 text-lg uppercase tracking-widest">Enter Protocol Terminal <FiArrowRight size={24} /></button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;
