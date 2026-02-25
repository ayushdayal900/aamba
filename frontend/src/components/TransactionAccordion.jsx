import React, { useState } from 'react';
import { FiChevronDown, FiExternalLink, FiHash } from 'react-icons/fi';

const TransactionAccordion = ({ txHash }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!txHash) return null;

    // Check if it's a full tx hash or a protocol ID
    const isHash = txHash.startsWith('0x');

    return (
        <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-white transition-colors"
            >
                <div className="flex items-center gap-2">
                    <FiHash className="text-blue-500" />
                    <span>Protocol Proof</span>
                </div>
                <FiChevronDown className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="p-4 pt-0">
                    <div className="p-3 bg-slate-900 rounded-lg flex items-center justify-between gap-4">
                        <span className="truncate font-mono text-[10px] text-slate-400">{txHash}</span>
                        {isHash && (
                            <a
                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 flex items-center gap-1 text-[10px] text-blue-500 font-bold hover:text-blue-400 transition-colors uppercase tracking-tighter"
                            >
                                Explorer <FiExternalLink size={10} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionAccordion;
