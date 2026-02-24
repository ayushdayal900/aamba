import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';


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
            navigate('/');
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
            <div className="text-center max-w-2xl mb-8">
                <div className="inline-flex items-center space-x-2 bg-fintech-accent/10 text-fintech-accent px-4 py-2 rounded-full text-sm font-semibold tracking-wide mb-6 border border-fintech-accent/30">
                    <span className="w-2 h-2 rounded-full bg-fintech-accent animate-pulse"></span>
                    <span>Decentralized Microfinance Protocol</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                    Join Aamba Today
                </h1>
                <p className="text-lg text-slate-400">
                    Create an account to access uncollateralized loans or earn yield.
                </p>
            </div>

            <div className="w-full max-w-md bg-fintech-card p-8 rounded-2xl border border-fintech-border shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>

                <form onSubmit={handleSubmit} className="relative z-10 flex flex-col space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-300 block mb-2">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-fintech-dark/50 border border-fintech-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fintech-accent focus:border-transparent transition-all"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
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
                        className={`w-full bg-fintech-accent hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg mt-4 disabled:opacity-50`}
                    >
                        {localLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <div className="flex items-center my-4">
                        <div className="flex-grow border-t border-fintech-border"></div>
                        <span className="px-3 text-slate-500 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">Or Initialize via Web3</span>
                        <div className="flex-grow border-t border-fintech-border"></div>
                    </div>

                    <div className="flex justify-center flex-col items-center">
                        <p className="text-xs text-slate-500 mb-3 italic">Establish your identity across all dApps</p>
                        <ConnectButton label="Sign Up with WalletConnect" showBalance={false} />

                    </div>
                </form>


                <p className="mt-6 text-center text-slate-400 text-sm">
                    Already have an account? <Link to="/login" className="text-fintech-accent hover:text-blue-400 font-medium">Log In</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
