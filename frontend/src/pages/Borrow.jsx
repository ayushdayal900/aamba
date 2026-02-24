import React from 'react';

const Borrow = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-white text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                Borrow Assets
            </h1>
            <div className="bg-fintech-card p-8 rounded-xl border border-fintech-border shadow-lg">
                <p className="text-slate-300 mb-6 text-lg">
                    Access liquidity instantly using your on-chain MicroFin reputation score. No centralized credit checks, no hidden fees.
                </p>

                <div className="bg-fintech-dark border border-fintech-border p-6 rounded-lg mt-6">
                    <h3 className="text-xl font-bold text-white mb-2">Initialize Credit Profile</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        Before applying for a decentralized loan, you must verify your identity and generate a non-transferable Identity NFT representing your trust score.
                    </p>

                    <button
                        onClick={() => window.location.href = '/kyc-verification'}
                        className="bg-fintech-accent hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        Get Verified & Mint NFT
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Borrow;
