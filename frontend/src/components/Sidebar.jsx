import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome,
    FiTrendingUp,
    FiDownload,
    FiUser,
    FiLogOut,
    FiHelpCircle,
    FiShield
} from 'react-icons/fi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Sidebar = () => {
    const { logout, userProfile } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside className="w-64 bg-fintech-surface border-r border-fintech-border h-screen sticky top-0 flex flex-col pt-8 pb-6 px-4">
            <div className="flex items-center gap-3 px-4 mb-10">
                <div className="w-10 h-10 bg-fintech-accent rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <FiShield className="text-white text-xl" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-white leading-none">AAMBA</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Microfinance</p>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-4 mb-4">Protocol Menu</p>

                <NavLink to="/dashboard" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <FiHome /> Dashboard
                </NavLink>

                <NavLink to="/lend" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <FiTrendingUp /> Lend Capital
                </NavLink>

                <NavLink to="/borrow" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <FiDownload /> Borrow Assets
                </NavLink>

                <NavLink to="/dashboard/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <FiUser /> Protocol Profile
                </NavLink>

                <div className="pt-8">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-4 mb-4">Support</p>
                    <NavLink to="/how-it-works" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <FiHelpCircle /> How it Works
                    </NavLink>
                </div>
            </nav>

            <div className="mt-auto space-y-6">
                <div className="px-2">
                    <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all duration-200"
                >
                    <FiLogOut /> Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
