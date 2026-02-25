import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShield, FiTrendingUp, FiLayers, FiCheckCircle } from 'react-icons/fi';

const LandingPage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <FiShield />,
            title: "Soulbound Identity",
            description: "Secure your financial footprint with a non-transferable NFT identity, verified by protocol authorities.",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            icon: <FiTrendingUp />,
            title: "Algorithmic Trust",
            description: "Build an on-chain credit history. Every transaction improves your trust score and lowers your cost of capital.",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            icon: <FiLayers />,
            title: "Peer-to-Peer Market",
            description: "Deploy capital directly to verified borrowers via immutable smart contracts. Transparent, fair, and efficient.",
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        }
    ];

    return (
        <div className="min-h-screen bg-fintech-dark font-sans text-slate-100 overflow-hidden">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-fintech-border/30 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-fintech-accent rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <FiShield className="text-white text-sm" />
                        </div>
                        <h1 className="text-xl font-black text-white tracking-tight">AAMBA</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/signin')} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Launch Protocol</button>
                        <button onClick={() => navigate('/signup')} className="btn-primary py-2 px-6 text-xs uppercase tracking-widest font-black">Get Started</button>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero */}
                <section className="relative pt-48 pb-32 px-6 max-w-7xl mx-auto text-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-10">
                            <FiCheckCircle className="text-emerald-500" /> Live on Ethereum Sepolia
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
                            Microfinance <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Reimagined.</span>
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                            Aamba leverages decentralized identity and peer-to-peer lending logic to build the world's first transparent, trust-based financial network. No intermediaries. Just code.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={() => navigate('/signup')}
                                className="btn-primary py-5 px-12 rounded-2xl text-sm uppercase tracking-[0.2em] font-black group"
                            >
                                Enter Protocol <FiArrowRight className="inline ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                            </button>
                            <button
                                onClick={() => navigate('/how-it-works')}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-black py-5 px-12 rounded-2xl transition-all border border-slate-800 text-sm uppercase tracking-[0.2em]"
                            >
                                How it Works
                            </button>
                        </div>
                    </motion.div>
                </section>

                {/* Features */}
                <section className="py-32 px-6 max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-white mb-4">The Pillars of Aamba</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Financial Stability, Decentralized.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="premium-card text-center group"
                            >
                                <div className={`w-16 h-16 mx-auto mb-8 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
                                    {f.icon}
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4">{f.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">{f.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Proof */}
                <section className="py-24 border-y border-fintech-border/30 bg-fintech-surface/30">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        {[
                            { val: "$0.00", label: "Protocol TVL" },
                            { val: "0", label: "SBT Identities" },
                            { val: "Ethereum", label: "Source Chain" },
                            { val: "100%", label: "On-Chain Audit" }
                        ].map((s, i) => (
                            <div key={i}>
                                <div className="text-4xl font-black text-white mb-2">{s.val}</div>
                                <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="py-16 px-6 max-w-7xl mx-auto text-center space-y-8">
                <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                        <FiShield className="text-white text-sm" />
                    </div>
                    <span className="text-xl font-black text-white tracking-tight">AAMBA</span>
                </div>
                <div className="flex justify-center space-x-10 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <a href="#" className="hover:text-blue-500 transition-colors">Whitepaper</a>
                    <a href="#" className="hover:text-blue-500 transition-colors">Protocol Status</a>
                    <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
                </div>
                <p className="text-slate-700 text-[10px] font-medium uppercase tracking-[0.2em]">© 2026 Aamba Finance. Build with conviction.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
