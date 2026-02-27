import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BorrowerDashboard from './BorrowerDashboard';
import LenderDashboard from './LenderDashboard';
import { FiLoader, FiTrendingUp, FiUser, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import addresses from '../contracts/addresses.json';

// ---------- Protocol Insurance Pool Widget ----------
const InsurancePoolWidget = () => {
 const [balance, setBalance] = useState("0");
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchBalance = async () => {
 try {
 const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
 const bal = await provider.getBalance(addresses.treasury);
 setBalance(ethers.formatEther(bal));
 } catch (err) {
 console.error("Failed to fetch treasury balance:", err);
 } finally {
 setLoading(false);
 }
 };
 fetchBalance();
 }, []);

 return (
 <div className="w-full border-b border-border0/20 py-3 mt-16 px-4">
 <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 0/10 rounded-xl flex items-center justify-center text-brand-accent0 shrink-0">
 <FiShield size={20} />
 </div>
 <div>
 <h4 className="text-text-primary font-black italic tracking-wide text-xs md:text-sm uppercase">Protocol Insurance Pool</h4>
 <p className="text-brand-accent0/80 text-[10px] md:text-xs font-medium uppercase tracking-widest">Securing lenders with 1% dynamic fee</p>
 </div>
 </div>
 <div className="text-right flex items-center gap-3">
 {loading ? (
 <div className="h-6 w-20 animate-pulse rounded-md"></div>
 ) : (
 <div className="text-brand-accent font-black text-xl tracking-tighter 0/20 drop-">
 {Number(balance).toFixed(4)} <span className="text-xs text-brand-accent uppercase">ETH</span>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

// ---------- Role Selector ----------
const RoleSelector = ({ onSelect }) => {
 const [selecting, setSelecting] = useState(null);

 const handleSelect = async (role) => {
 setSelecting(role);
 await onSelect(role);
 setSelecting(null);
 };

 return (
 <div className="min-h-[60vh] flex flex-col items-center justify-center gap-10 py-16">
 <div className="text-center space-y-3 max-w-xl">
 <div className="w-16 h-16 0/10 rounded-3xl flex items-center justify-center text-brand-accent0 mx-auto mb-6">
 <FiUser size={32} />
 </div>
 <h1 className="text-3xl md:text-4xl font-black text-text-primary italic tracking-tighter">
 Select Your Protocol Role
 </h1>
 <p className="text-text-secondary0 font-medium text-sm md:text-base leading-relaxed">
 Choose how you want to participate in the PanCred microfinance protocol. This sets up your dashboard.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
 {/* Borrower */}
 <button
 onClick={() => handleSelect('Borrower')}
 disabled={!!selecting}
 className="premium-card !p-8 text-left border-2 border-border hover:border-border0/50 transition-all duration-300 group disabled:opacity-60"
 >
 <div className="w-14 h-14 0/10 rounded-2xl flex items-center justify-center text-brand-accent0 mb-6 group-hover:scale-110 transition-transform">
 <FiTrendingUp size={28} />
 </div>
 <h3 className="text-xl font-black text-text-primary italic tracking-tight mb-2">Borrower</h3>
 <p className="text-text-secondary0 text-sm font-medium leading-relaxed">
 Request capital from lenders using your on-chain identity and reputation score.
 </p>
 {selecting === 'Borrower' && (
 <div className="mt-4 flex items-center gap-2 text-brand-accent0">
 <FiLoader className="animate-spin" size={14} />
 <span className="text-[10px] font-black uppercase tracking-widest">Activating...</span>
 </div>
 )}
 </button>

 {/* Lender */}
 <button
 onClick={() => handleSelect('Lender')}
 disabled={!!selecting}
 className="premium-card !p-8 text-left border-2 border-border hover:border-border0/50 transition-all duration-300 group disabled:opacity-60"
 >
 <div className="w-14 h-14 0/10 rounded-2xl flex items-center justify-center text-brand-accent0 mb-6 group-hover:scale-110 transition-transform">
 <FiTrendingUp size={28} />
 </div>
 <h3 className="text-xl font-black text-text-primary italic tracking-tight mb-2">Lender</h3>
 <p className="text-text-secondary0 text-sm font-medium leading-relaxed">
 Deploy capital into verified peer-to-peer loans and earn protocol returns.
 </p>
 {selecting === 'Lender' && (
 <div className="mt-4 flex items-center gap-2 text-brand-accent0">
 <FiLoader className="animate-spin" size={14} />
 <span className="text-[10px] font-black uppercase tracking-widest">Activating...</span>
 </div>
 )}
 </button>
 </div>
 </div>
 );
};

// ---------- Main Dashboard ----------
const Dashboard = () => {
 const { userProfile, updateRole } = useAuth();

 const handleRoleSelect = async (role) => {
 try {
 await updateRole(role);
 toast.success(`Role set to ${role}. Welcome!`);
 } catch (err) {
 console.error('[Dashboard] Role update failed:', err);
 toast.error('Failed to set role. Please try again.');
 }
 };

 // Auth context still loading
 if (!userProfile) {
 return (
 <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-text-secondary0">
 <div className="w-10 h-10 border-4 border-border0 border-t-transparent rounded-full animate-spin" />
 <span className="text-[11px] font-black uppercase tracking-widest animate-pulse">Loading Profile...</span>
 </div>
 );
 }

 // Role properly set
 if (userProfile.role === 'Lender') {
 return (
 <>
 <InsurancePoolWidget />
 <LenderDashboard />
 </>
 );
 }
 if (userProfile.role === 'Borrower') {
 return (
 <>
 <InsurancePoolWidget />
 <BorrowerDashboard />
 </>
 );
 }

 // Role is 'Unassigned' or missing — show role picker
 return <RoleSelector onSelect={handleRoleSelect} />;
};

export default Dashboard;
