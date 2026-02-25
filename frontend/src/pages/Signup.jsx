import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiArrowRight, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalLoading(true);
        const tid = toast.loading('Initializing protocol registration...');

        try {
            const result = await register(name, email, password);
            if (result.success) {
                toast.success('Identity Created! Opening gateway...', { id: tid });
                navigate('/onboarding');
            } else {
                toast.error(result.message, { id: tid });
            }
        } catch (err) {
            toast.error('Registration failed. Check network.', { id: tid });
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-fintech-dark flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-fintech-surface border border-fintech-border text-blue-500 rounded-3xl mb-8 shadow-xl">
                        <FiShield size={36} />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2">Initialize Identity</h1>
                    <p className="text-slate-500 font-medium">Step into the decentralized financial ecosystem.</p>
                </div>

                <div className="premium-card !p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3 px-1">Full Legal Name</label>
                            <div className="relative">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-fintech-dark border border-fintech-border rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-800 shadow-inner"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3 px-1">Email Anchor</label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-fintech-dark border border-fintech-border rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-800 shadow-inner"
                                    placeholder="you@protocol.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-3 px-1">Secure Keyphrase</label>
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-fintech-dark border border-fintech-border rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-800 shadow-inner"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={localLoading}
                            className="btn-primary w-full py-5 text-xs font-black uppercase tracking-[0.2em] group"
                        >
                            {localLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto text-blue-500"></div>
                            ) : (
                                <>
                                    Begin Onboarding <FiArrowRight className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-900 text-center">
                        <p className="text-slate-500 text-sm font-medium">
                            Already authorized? <Link to="/signin" className="text-blue-500 hover:text-blue-400 font-bold ml-1 transition-colors">Sign In</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-12 flex justify-center gap-10 opacity-40">
                    <div className="flex items-center gap-2">
                        <FiShield className="text-blue-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Web3 Ready</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
