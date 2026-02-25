import React, { useState } from 'react';
import { FiChevronDown, FiExternalLink, FiHash } from 'react-icons/fi';

const TransactionAccordion = ({ txHash }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!txHash) return null;

    return (
        <div className="mt-4 border border-fintech-border rounded-lg overflow-hidden bg-fintech-dark/30">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
                <div className="flex items-center gap-2">
                    <FiHash className="text-fintech-accent" />
                    <span>Blockchain Evidence</span>
                </div>
                <FiChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-24' : 'max-h-0'}`}>
                <div className="p-3 pt-0 border-t border-fintech-border/50">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate max-w-[200px]">{txHash}</span>
                        <a
                            href={`https://sepolia.etherscan.io/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-fintech-accent hover:underline"
                        >
                            View on Etherscan <FiExternalLink size={10} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionAccordion;
