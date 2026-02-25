import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiArrowRight, FiShield } from 'react-icons/fi';

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
        const result = await register(name, email, password);
        setLocalLoading(false);
        if (result.success) {
            navigate('/onboarding');
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="min-h-screen bg-fintech-dark flex flex-col items-center justify-center px-6 py-12">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fintech-accent/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-fintech-accent/20 text-fintech-accent rounded-2xl mb-6">
                        <FiShield size={32} />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-2">Create Identity</h1>
                    <p className="text-slate-400">Join the Aamba protocol and start building your on-chain credit history.</p>
                </div>

                <div className="bg-fintech-card p-8 rounded-3xl border border-fintech-border shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div>
                            <label className="text-sm font-semibold text-slate-300 block mb-2 px-1">Full Name</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <FiUser />
                                </span>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-fintech-dark/50 border border-fintech-border rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-fintech-accent/50 focus:border-fintech-accent transition-all placeholder:text-slate-600"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-300 block mb-2 px-1">Email Address</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <FiMail />
                                </span>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-fintech-dark/50 border border-fintech-border rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-fintech-accent/50 focus:border-fintech-accent transition-all placeholder:text-slate-600"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-300 block mb-2 px-1">Password</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <FiLock />
                                </span>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-fintech-dark/50 border border-fintech-border rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-fintech-accent/50 focus:border-fintech-accent transition-all placeholder:text-slate-600"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={localLoading}
                            className={`w-full bg-fintech-accent hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50`}
                        >
                            {localLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Create Account <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-400 text-sm">
                        Already have an account? <Link to="/signin" className="text-fintech-accent hover:text-blue-400 font-bold">Sign In</Link>
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-fintech-accent"></div>
                        <span className="text-xs font-bold uppercase tracking-wider">Secure Auth</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 justify-end">
                        <div className="w-1.5 h-1.5 rounded-full bg-fintech-success"></div>
                        <span className="text-xs font-bold uppercase tracking-wider">Web3 Ready</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
