import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalLoading(true);
        const result = await login(email, password);
        setLocalLoading(false);
        if (result.success) {
            navigate('/');
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
            <div className="text-center max-w-3xl mb-8">
                <div className="inline-flex items-center space-x-2 bg-fintech-accent/10 text-fintech-accent px-4 py-2 rounded-full text-sm font-semibold tracking-wide mb-6 border border-fintech-accent/30">
                    <span className="w-2 h-2 rounded-full bg-fintech-accent animate-pulse"></span>
                    <span>Decentralized Microfinance Protocol</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                    Borderless Capital,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                        Identity First.
                    </span>
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                    A trustless lending market connecting verified borrowers with global yield-seekers. Join the future of credit using your secure identity.
                </p>
            </div>

            <div className="w-full max-w-md bg-fintech-card p-8 rounded-2xl border border-fintech-border shadow-2xl relative overflow-hidden group">
                <form onSubmit={handleSubmit} className="relative z-10 flex flex-col space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-300 block mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-fintech-dark/50 border border-fintech-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fintech-accent focus:border-transparent transition-all"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-300 block mb-2">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-fintech-dark/50 border border-fintech-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fintech-accent focus:border-transparent transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={localLoading}
                        className={`w-full bg-fintech-accent hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] mt-4 disabled:opacity-50`}
                    >
                        {localLoading ? 'Authenticating...' : 'Log In'}
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-400 text-sm">
                    Don't have an account? <Link to="/register" className="text-fintech-accent hover:text-blue-400 font-medium">Sign Up Create Wallet</Link>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full mt-12">
                <div className="bg-fintech-card p-6 rounded-2xl border border-fintech-border shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                        <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        For Borrowers
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Access capital instantly. We use simulated KYC and your decentralized history to issue a Soulbound Trust NFT, skipping the banks.
                    </p>
                </div>

                <div className="bg-fintech-card p-6 rounded-2xl border border-fintech-border shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                        <svg className="w-5 h-5 text-emerald-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        For Lenders
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Earn secure yield. Deploy funds into AI-vetted, overcollateralized smart contracts with auto-repayment engines active 24/7.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
