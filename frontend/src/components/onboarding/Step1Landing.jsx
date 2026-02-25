import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBriefcase, FiArrowRight, FiLoader } from 'react-icons/fi';

const Step1Landing = ({ isConnected, authData, setAuthData, handleAuth, loading, error, setCurrentStep }) => {
    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-10"
        >
            <div className="w-20 h-20 bg-fintech-accent/20 text-fintech-accent rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3">
                <FiBriefcase size={40} />
            </div>
            <h2 className="text-5xl font-black text-white mb-6 tracking-tighter leading-tight">
                Empowering Financial <br /> <span className="text-fintech-accent">Inclusion</span> for All.
            </h2>
            <p className="text-slate-400 mb-10 text-xl max-w-lg mx-auto leading-relaxed">
                Join Aamba, the decentralized microfinance protocol that bridges the gap between capital and opportunity.
            </p>

            {!isConnected ? (
                <div className="space-y-4 max-w-sm mx-auto">
                    <button
                        onClick={() => setAuthData({ ...authData, isLogin: false, showForm: true })}
                        className="w-full bg-gradient-to-r from-blue-600 to-fintech-accent hover:from-blue-500 hover:to-blue-400 text-white font-bold py-5 px-8 rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-3 text-lg group"
                    >
                        Sign Up Now <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={() => setAuthData({ ...authData, isLogin: true, showForm: true })}
                        className="w-full bg-fintech-dark/60 border border-fintech-border hover:border-slate-500 text-white font-semibold py-4 px-8 rounded-2xl transition-all"
                    >
                        Already have an account? Log In
                    </button>

                    {authData.showForm && (
                        <motion.form
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            onSubmit={handleAuth}
                            className="text-left space-y-4 mt-8 pt-8 border-t border-fintech-border/30"
                        >
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
                                    {error}
                                </div>
                            )}
                            {!authData.isLogin && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1 px-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-fintech-dark/80 border border-fintech-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-fintech-accent transition-all"
                                        placeholder="John Doe"
                                        value={authData.name}
                                        onChange={e => setAuthData({ ...authData, name: e.target.value })}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1 px-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-fintech-dark/80 border border-fintech-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-fintech-accent transition-all"
                                    placeholder="you@example.com"
                                    value={authData.email}
                                    onChange={e => setAuthData({ ...authData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1 px-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-fintech-dark/80 border border-fintech-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-fintech-accent transition-all"
                                    placeholder="••••••••"
                                    value={authData.password}
                                    onChange={e => setAuthData({ ...authData, password: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-fintech-accent text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                            >
                                {loading ? <FiLoader className="animate-spin" /> : (authData.isLogin ? 'Log In' : 'Create Account')}
                            </button>
                        </motion.form>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => setCurrentStep(2)}
                    className="bg-fintech-accent hover:bg-blue-600 text-white font-bold py-4 px-12 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 mx-auto text-lg"
                >
                    Continue to Role Selection <FiArrowRight />
                </button>
            )}
        </motion.div>
    );
};

export default Step1Landing;
