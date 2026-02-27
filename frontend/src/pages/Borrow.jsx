import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { api } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    FiTrendingUp, FiShield, FiArrowRight, FiLoader,
    FiCheckCircle, FiAlertCircle, FiSend, FiInfo, FiLock, FiUnlock, FiAward
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { checkIdentityOwnership, parseBlockchainError } from '../blockchainService';
import addresses from '../contracts/addresses.json';
import _factoryJson from '../contracts/LoanAgreementFactory.json';
import _usdtJson from '../contracts/MockUSDT.json';

const factoryAbi = Array.isArray(_factoryJson) ? _factoryJson : _factoryJson.abi;
const usdtAbi = Array.isArray(_usdtJson) ? _usdtJson : _usdtJson.abi;

// ─── Trust Score Banner ──────────────────────────────────────────────────────
const TrustScoreBanner = ({ trustScore, completedLoans }) => {
    const ETH_THRESHOLD = 700;
    const progress = Math.min(100, Math.max(0, ((trustScore - 300) / (ETH_THRESHOLD - 300)) * 100));
    const isEligible = completedLoans >= 1 && trustScore >= ETH_THRESHOLD;

    const getTier = (score) => {
        if (score >= 850) return { label: 'Prime', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
        if (score >= 700) return { label: 'Trusted', color: 'text-fintech-accent', bg: 'bg-fintech-accent/10 border-fintech-accent/20' };
        if (score >= 500) return { label: 'Building Credit', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
        return { label: 'New Borrower', color: 'text-fintech-muted', bg: 'bg-fintech-dark/50 border-fintech-border/30' };
    };

    const tier = getTier(trustScore);

    return (
        <div className="premium-card !p-8 md:!p-8 border-l-4 border-l-blue-500/50 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-fintech-accent/10 rounded-2xl flex items-center justify-center text-fintech-accent shrink-0">
                        <FiAward size={24} />
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-black text-fintech-muted tracking-widest mb-1">Trust Score</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-fintech-heading tracking-tight">{trustScore}</span>
                            <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${tier.bg} ${tier.color}`}>
                                {tier.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 max-w-xs">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-fintech-muted">ETH Unlock Progress</p>
                        <p className="text-[9px] font-black text-fintech-muted">{trustScore} / {ETH_THRESHOLD}</p>
                    </div>
                    <div className="h-2 bg-fintech-dark rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${progress}%`,
                                background: isEligible
                                    ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                    : 'linear-gradient(90deg, #3b82f6, #6366f1)'
                            }}
                        />
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className="text-[8px] text-fintech-muted font-bold">300</span>
                        <span className={`text-[8px] font-bold ${isEligible ? 'text-emerald-500' : 'text-fintech-accent'}`}>
                            {isEligible ? '🔓 ETH Unlocked' : `${ETH_THRESHOLD} — Unlock ETH`}
                        </span>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-[9px] uppercase font-black text-fintech-muted tracking-widest mb-1">Completed Loans</p>
                    <p className="text-2xl font-bold text-fintech-heading">{completedLoans}</p>
                </div>
            </div>
        </div>
    );
};

// ─── Loan Request Form ──────────────────────────────────────────────────────
const LoanRequestForm = ({ walletAddress, walletClient, userProfile, trustScore, completedLoans }) => {
    const [principal, setPrincipal] = useState('');
    const [totalRepayment, setTotalRepayment] = useState('');
    const [duration, setDuration] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // ETH eligibility check
    const canUseEth = completedLoans >= 1 && trustScore >= 700;

    const [loanMode, setLoanMode] = useState(1); // Always default ERC20; only allow ETH if eligible
    const [tokenSymbol, setTokenSymbol] = useState('...');
    const [tokenDecimals, setTokenDecimals] = useState(18);

    useEffect(() => {
        const fetchTokenData = async () => {
            if (loanMode === 1 && walletClient && addresses.mockUSDT) {
                try {
                    const provider = new ethers.BrowserProvider(walletClient.transport);
                    const token = new ethers.Contract(addresses.mockUSDT, usdtAbi, provider);
                    setTokenSymbol(await token.symbol());
                    setTokenDecimals(Number(await token.decimals()));
                } catch (e) {
                    console.error("Token fetch failed", e);
                    setTokenSymbol("tUSDT");
                    setTokenDecimals(6);
                }
            }
        };
        fetchTokenData();
    }, [loanMode, walletClient]);

    const impliedAPR = (() => {
        if (!principal || !totalRepayment || !duration) return null;
        const interest = Number(totalRepayment) - Number(principal);
        if (interest < 0) return null;
        const apr = ((interest / Number(principal)) / Number(duration)) * 12 * 100;
        return apr.toFixed(1);
    })();

    const monthlyPayment = (() => {
        if (!totalRepayment || !duration) return null;
        return (Number(totalRepayment) / Number(duration)).toFixed(6);
    })();

    const hasFactory = !!addresses.loanFactory;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hasFactory) {
            toast.error('Factory contract not yet deployed. Run deployFactory.js first.');
            return;
        }

        const principalEth = Number(principal);
        const repaymentEth = Number(totalRepayment);
        const durationMonths = Number(duration);

        if (repaymentEth < principalEth) {
            toast.error('Total repayment must be ≥ principal');
            return;
        }
        if (durationMonths < 1 || durationMonths > 36) {
            toast.error('Duration must be 1–36 months');
            return;
        }

        // Extra guard — backend will enforce but we give friendly feedback first
        if (loanMode === 0 && !canUseEth) {
            toast.error('ETH loans require Trust Score ≥ 700 and 1 completed loan.');
            return;
        }

        const tid = toast.loading('Preparing loan ad...');
        setSubmitting(true);
        try {
            const provider = new ethers.BrowserProvider(walletClient.transport);
            const signer = await provider.getSigner();
            const factory = new ethers.Contract(addresses.loanFactory, factoryAbi, signer);

            const principalWei = loanMode === 0 ? ethers.parseEther(principal.toString()) : ethers.parseUnits(principal.toString(), tokenDecimals);
            const repaymentWei = loanMode === 0 ? ethers.parseEther(totalRepayment.toString()) : ethers.parseUnits(totalRepayment.toString(), tokenDecimals);

            toast.loading('Confirm in wallet...', { id: tid });
            const tx = await factory.createLoanRequestWithMode(principalWei, repaymentWei, durationMonths, loanMode);

            toast.loading('Broadcasting to Sepolia...', { id: tid });
            const receipt = await tx.wait();

            toast.loading('Syncing ad with protocol...', { id: tid });

            // Sync with backend API to display on dashboard immediately
            await api.post('/loans', {
                borrowerId: userProfile._id,
                amountRequested: Number(principal),
                interestRate: impliedAPR ? Number(impliedAPR) : 10,
                durationMonths: durationMonths,
                purpose: loanMode === 0 ? "ETH Request" : "ERC20 Request",
                txHash: receipt.hash,
                loanMode: loanMode
            });

            toast.success('Loan ad posted on-chain! Lenders can now fund it.', { id: tid });
            setSubmitted(true);
            setPrincipal(''); setTotalRepayment(''); setDuration('');
        } catch (err) {
            console.error('[Borrow] createLoanRequest failed:', err);
            toast.error(parseBlockchainError(err), { id: tid });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="premium-card !p-8 md:!p-10 border-l-4 border-l-blue-500/50">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-fintech-accent/10 rounded-xl flex items-center justify-center text-fintech-accent">
                    <FiSend size={18} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-fintech-heading italic tracking-tight">Post Loan Request</h3>
                    <p className="text-[10px] text-fintech-muted font-semibold uppercase tracking-wide">Published on-chain · Visible to all lenders</p>
                </div>
            </div>

            {!hasFactory && (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6">
                    <FiAlertCircle className="text-amber-500 shrink-0" />
                    <p className="text-[11px] text-amber-400 font-bold">
                        Factory not deployed yet. Run: <code className="font-mono bg-fintech-dark px-1 rounded">npx hardhat run scripts/deployFactory.js --network sepolia</code>
                    </p>
                </div>
            )}

            {submitted && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6">
                    <FiCheckCircle className="text-emerald-500" />
                    <p className="text-[11px] text-emerald-400 font-bold">
                        Ad posted successfully! Check the Lender marketplace to see it live.
                    </p>
                </div>
            )}

            {/* ── Loan Mode Selector ─────────────────────────────────────── */}
            <div className="flex bg-fintech-dark rounded-xl p-1 mb-4 border border-fintech-border">
                {/* ERC20 always available */}
                <button
                    type="button"
                    onClick={() => setLoanMode(1)}
                    className={`flex-1 py-3 text-[10px] font-semibold uppercase tracking-wide rounded-lg transition-all ${loanMode === 1 ? 'bg-emerald-600 text-fintech-heading shadow-lg' : 'text-fintech-muted hover:text-fintech-heading hover:bg-fintech-dark'}`}
                >
                    ERC20 {tokenSymbol !== '...' ? `(${tokenSymbol})` : ''}
                </button>
                {/* ETH — locked unless eligible */}
                <button
                    type="button"
                    onClick={() => {
                        if (!canUseEth) return; // silently ignore — tooltip message below
                        setLoanMode(0);
                    }}
                    disabled={!canUseEth}
                    className={`flex-1 py-3 text-[10px] font-semibold uppercase tracking-wide rounded-lg transition-all flex items-center justify-center gap-1.5
                        ${loanMode === 0 ? 'bg-fintech-accent text-fintech-heading shadow-lg' : !canUseEth ? 'text-fintech-muted cursor-not-allowed' : 'text-fintech-muted hover:text-fintech-heading hover:bg-fintech-dark'}`}
                >
                    {canUseEth ? <FiUnlock size={11} /> : <FiLock size={11} />} ETH
                </button>
            </div>

            {/* ── ETH Lock Explanation ───────────────────────────────────── */}
            {!canUseEth && (
                <div className="flex items-start gap-3 bg-fintech-dark/50 border border-fintech-border/30 rounded-xl px-4 py-3 mb-6">
                    <FiLock className="text-fintech-muted shrink-0 mt-0.5" size={13} />
                    <div>
                        {completedLoans === 0 ? (
                            <p className="text-[11px] text-fintech-muted font-bold leading-relaxed">
                                First loan must use <span className="text-emerald-400">ERC20</span> (Autopay mandatory).
                                Complete your first loan to unlock ETH mode.
                            </p>
                        ) : (
                            <p className="text-[11px] text-fintech-muted font-bold leading-relaxed">
                                Unlock ETH loans at <span className="text-fintech-accent">Trust Score 700</span>.
                                Your current score: <span className="text-fintech-heading font-semibold">{trustScore}</span>
                                {' '}(<span className="text-fintech-accent">{700 - trustScore} more needed</span>).
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ── Active Mode Info ───────────────────────────────────────── */}
            {loanMode === 0 ? (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6">
                    <FiAlertCircle className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-400 font-bold leading-relaxed">
                        Automatic repayment not available for ETH loans. You must trigger payments manually each month.
                    </p>
                </div>
            ) : (
                <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6">
                    <FiCheckCircle className="text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-emerald-400 font-bold leading-relaxed">
                        Automatic repayment enabled via ERC20 approval. Our smart service will process your installments directly.
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[9px] uppercase font-black text-fintech-muted tracking-[0.2em] mb-3 px-1">
                            Principal ({loanMode === 0 ? 'ETH' : tokenSymbol}) — Amount you need
                        </label>
                        <input
                            type="number"
                            value={principal}
                            onChange={e => setPrincipal(e.target.value)}
                            required min="0.000001" step="any"
                            placeholder="0.500"
                            className={`w-full bg-white border border-fintech-border text-fintech-heading rounded-xl p-4 focus:outline-none transition-all font-mono text-lg shadow-inner ${loanMode === 0 ? 'focus:border-fintech-accent' : 'focus:border-emerald-500'}`}
                        />
                    </div>

                    <div>
                        <label className="block text-[9px] uppercase font-black text-fintech-muted tracking-[0.2em] mb-3 px-1">
                            Total Repayment ({loanMode === 0 ? 'ETH' : tokenSymbol}) — You pay back
                        </label>
                        <input
                            type="number"
                            value={totalRepayment}
                            onChange={e => setTotalRepayment(e.target.value)}
                            required min="0.000001" step="any"
                            placeholder="0.600"
                            className={`w-full bg-white border border-fintech-border text-fintech-heading rounded-xl p-4 focus:outline-none transition-all font-mono text-lg shadow-inner ${loanMode === 0 ? 'focus:border-fintech-accent' : 'focus:border-emerald-500'}`}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[9px] uppercase font-black text-fintech-muted tracking-[0.2em] mb-3 px-1">
                        Duration (Months) — 1 to 36
                    </label>
                    <input
                        type="number"
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                        required min="1" max="36" step="1"
                        placeholder="2"
                        className="w-full bg-white border border-fintech-border text-fintech-heading rounded-xl p-4 focus:border-fintech-accent focus:outline-none transition-all font-black text-lg shadow-inner"
                    />
                </div>

                {/* Live Preview */}
                {monthlyPayment && impliedAPR && (
                    <div className="bg-fintech-dark/60 border border-fintech-border rounded-2xl p-6 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-[9px] text-fintech-muted font-semibold uppercase tracking-wide mb-1">Monthly</p>
                            <p className="text-fintech-heading font-semibold italic text-lg">{monthlyPayment} <span className="text-fintech-muted text-xs not-italic">{loanMode === 0 ? 'ETH' : tokenSymbol}</span></p>
                        </div>
                        <div>
                            <p className="text-[9px] text-fintech-muted font-semibold uppercase tracking-wide mb-1">Implied APR</p>
                            <p className="text-fintech-accent font-bold text-lg">{impliedAPR}%</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-fintech-muted font-semibold uppercase tracking-wide mb-1">Insurance</p>
                            <p className="text-amber-400 font-bold text-lg">0.01 <span className="text-fintech-muted text-xs not-italic">{loanMode === 0 ? 'ETH' : tokenSymbol}</span></p>
                        </div>
                    </div>
                )}

                <div className="bg-fintech-dark/40 border border-fintech-border rounded-xl px-4 py-3 flex items-start gap-3">
                    <FiInfo className="text-fintech-muted shrink-0 mt-0.5" size={13} />
                    <p className="text-[10px] text-fintech-muted font-medium leading-relaxed">
                        Once a lender funds your request, a smart contract is deployed and principal is transferred to your wallet instantly.
                        A total of <strong className="text-fintech-muted">0.01 {loanMode === 0 ? 'ETH' : tokenSymbol} insurance fee</strong> is distributed to the protocol treasury across your installments.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={submitting || !hasFactory}
                    className="btn-primary w-full !py-5 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/10"
                >
                    {submitting
                        ? <><FiLoader className="animate-spin inline mr-2" />Broadcasting Ad...</>
                        : <><FiSend size={14} className="inline mr-2" />Post Loan Request On-Chain</>
                    }
                </button>
            </form>
        </div>
    );
};

// ─── Main Borrow Page ────────────────────────────────────────────────────────
const Borrow = () => {
    const navigate = useNavigate();
    const { address: walletAddress } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { userProfile, token } = useAuth();

    const [isVerified, setIsVerified] = useState(false);
    const [checking, setChecking] = useState(true);

    // Trust score state
    const [trustData, setTrustData] = useState({ trustScore: 300, completedLoans: 0 });
    const [trustLoading, setTrustLoading] = useState(true);

    // Fetch trust data from backend
    useEffect(() => {
        const fetchTrustData = async () => {
            if (!userProfile) { setTrustLoading(false); return; }
            setTrustLoading(true);
            try {
                const res = await api.get('/users/me');
                if (res.data.success) {
                    setTrustData({
                        trustScore: res.data.data.trustScore ?? 300,
                        completedLoans: res.data.data.completedLoans ?? 0,
                    });
                }
            } catch (err) {
                console.error('[Borrow] Failed to fetch trust data:', err.message);
                // Fall back to cached value in userProfile
                setTrustData({
                    trustScore: userProfile.trustScore ?? 300,
                    completedLoans: userProfile.completedLoans ?? 0,
                });
            } finally {
                setTrustLoading(false);
            }
        };
        fetchTrustData();
    }, [userProfile, token]);

    useEffect(() => {
        const checkNFT = async () => {
            if (!walletAddress) { setChecking(false); return; }
            setChecking(true);
            try {
                const provider = walletClient ? new ethers.BrowserProvider(walletClient.transport) : null;
                const verified = await checkIdentityOwnership(walletAddress, provider);
                setIsVerified(verified);
            } catch (err) {
                console.error('[Borrow] NFT check failed:', err);
                setIsVerified(false);
            } finally {
                setChecking(false);
            }
        };
        checkNFT();
    }, [walletAddress, walletClient]);

    return (
        <div className="space-y-8 md:space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-fintech-heading tracking-tight flex items-center gap-3">
                        <FiTrendingUp className="text-fintech-accent" /> Borrow Capital
                    </h1>
                    <p className="text-sm md:text-base text-fintech-muted font-medium italic">Post a loan request — lenders fund directly to your wallet.</p>
                </div>
            </header>

            {/* Checking */}
            {checking && (
                <div className="premium-card !p-12 flex flex-col items-center justify-center gap-4 text-fintech-muted">
                    <FiLoader size={32} className="animate-spin text-fintech-accent" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide">Verifying identity on-chain...</p>
                </div>
            )}

            {/* Not verified */}
            {!checking && !isVerified && (
                <div className="premium-card !p-8 md:!p-12 border-l-4 border-l-blue-600/50">
                    <p className="text-base md:text-xl text-fintech-muted mb-10 font-medium leading-relaxed max-w-2xl">
                        Access liquidity instantly using your on-chain protocol reputation score. No centralized credit checks, no hidden fees.
                    </p>

                    <div className="bg-fintech-dark/50 border-2 border-dashed border-fintech-border p-8 md:p-10 rounded-[2.5rem] mt-8">
                        <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-10">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-fintech-accent/10 rounded-3xl flex items-center justify-center text-fintech-accent shadow-lg">
                                <FiShield size={40} />
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className="text-xl md:text-2xl font-black text-fintech-heading italic tracking-tight">Initialize Credit Profile</h3>
                                <p className="text-fintech-muted text-sm md:text-base leading-relaxed font-medium">
                                    Before posting a decentralized loan request, you must verify your identity and mint a non-transferable Soulbound Identity NFT.
                                </p>
                            </div>
                        </div>
                        <div className="mt-10 pt-10 border-t border-fintech-border flex justify-end">
                            <button
                                onClick={() => navigate('/onboarding')}
                                className="btn-primary w-full md:w-auto px-10 !py-4 text-sm font-semibold uppercase tracking-wide flex items-center justify-center gap-3"
                            >
                                Get Verified &amp; Mint NFT <FiArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Verified — show trust banner + form */}
            {!checking && isVerified && (
                <div className="space-y-8">
                    <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 px-5 py-3 rounded-2xl w-fit">
                        <FiCheckCircle className="text-emerald-500" size={16} />
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500">Identity Verified — Credit Profile Active</span>
                    </div>

                    {/* Trust Score Banner */}
                    {!trustLoading && (
                        <TrustScoreBanner
                            trustScore={trustData.trustScore}
                            completedLoans={trustData.completedLoans}
                        />
                    )}

                    <LoanRequestForm
                        walletAddress={walletAddress}
                        walletClient={walletClient}
                        userProfile={userProfile}
                        trustScore={trustData.trustScore}
                        completedLoans={trustData.completedLoans}
                    />
                </div>
            )}
        </div>
    );
};

export default Borrow;
