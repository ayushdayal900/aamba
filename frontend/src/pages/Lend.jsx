import React from 'react';

const Lend = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                Lending Pools
            </h1>
            <div className="bg-fintech-card p-8 rounded-xl border border-fintech-border shadow-lg">
                <p className="text-slate-300 mb-6 text-lg">
                    Deposit your digital assets into secure, smart-contract verified lending pools to earn yield while empowering borrowers around the globe.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Placeholder Pool */}
                    <div className="bg-fintech-dark border border-fintech-border p-6 rounded-lg pointer-events-none opacity-80">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">USDC Stable Pool</h3>
                            <span className="bg-fintech-success/20 text-fintech-success px-3 py-1 rounded-full text-sm font-semibold">8.5% APY</span>
                        </div>
                        <p className="text-slate-400 text-sm mb-4">Low risk, stable yield pool backed by overcollateralized loans.</p>
                        <button className="w-full bg-fintech-border text-slate-400 py-3 rounded-md font-medium cursor-not-allowed">
                            Log In to Deposit
                        </button>
                    </div>

                    {/* Placeholder Pool 2 */}
                    <div className="bg-fintech-dark border border-fintech-border p-6 rounded-lg pointer-events-none opacity-80">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">ETH Growth Pool</h3>
                            <span className="bg-fintech-accent/20 text-fintech-accent px-3 py-1 rounded-full text-sm font-semibold">12.0% APY</span>
                        </div>
                        <p className="text-slate-400 text-sm mb-4">Medium risk, higher yield pool. Earn natively on your Ethereum.</p>
                        <button className="w-full bg-fintech-border text-slate-400 py-3 rounded-md font-medium cursor-not-allowed">
                            Log In to Deposit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Lend;
