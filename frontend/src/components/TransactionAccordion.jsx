import React, { useState } from 'react';
import { FiChevronDown, FiExternalLink, FiHash } from 'react-icons/fi';

const TransactionAccordion = ({ txHash }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!txHash) return null;

    // Check if it's a full tx hash or a protocol ID
    const isHash = txHash.startsWith('0x');

    return (
        <div className="border border-fintech-border rounded-2xl overflow-hidden bg-fintech-dark/30 transition-all duration-300 hover:border-fintech-border">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 px-5 text-[9px] uppercase font-black tracking-[0.2em] text-fintech-muted hover:text-fintech-accent transition-all active:bg-fintech-dark/50"
            >
                <div className="flex items-center gap-2.5">
                    <FiHash className={isOpen ? 'text-fintech-accent' : 'text-fintech-muted'} />
                    <span>Protocol Proof</span>
                </div>
                <FiChevronDown className={`transition-transform duration-500 text-fintech-muted ${isOpen ? 'rotate-180 text-fintech-accent' : ''}`} />
            </button>

            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="p-5 pt-0">
                    <div className="p-4 bg-fintech-dark/60 rounded-xl border border-fintech-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                        <span className="truncate font-mono text-[10px] text-fintech-muted w-full sm:w-auto tracking-tighter sm:tracking-normal">{txHash}</span>
                        {isHash && (
                            <a
                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 flex items-center gap-1.5 text-[9px] text-fintech-accent font-black hover:text-fintech-accent transition-colors uppercase tracking-[0.1em] border-b border-fintech-accent/20 pb-0.5"
                            >
                                Explorer <FiExternalLink size={11} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionAccordion;
