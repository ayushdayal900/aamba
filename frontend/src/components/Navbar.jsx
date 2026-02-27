import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FiMenu, FiX, FiUser, FiLogOut, FiLayout, FiArrowRight } from 'react-icons/fi';

const Navbar = () => {
    const { isAuthenticated, userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMenuOpen(false);
    };

    return (
        <nav className="bg-white/90 backdrop-blur-md border-b border-fintech-border sticky top-0 z-50">
            <div className="global-container h-20 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-fintech-accent flex items-center justify-center shadow-lg shadow-fintech-accent/20">
                        <span className="text-white font-semibold italic text-lg transition-transform hover:scale-110">A</span>
                    </div>
                    <Link to="/" className="text-2xl font-black text-fintech-heading tracking-widest uppercase">
                        PanCred
                    </Link>
                </div>

                {/* Desktop Menu */}
                <div className="hidden lg:flex items-center space-x-10">
                    <div className="flex space-x-10">
                        <Link to="/dashboard" className="text-fintech-muted hover:text-fintech-heading transition-colors text-sm font-semibold uppercase tracking-wide">Dashboard</Link>
                        {userProfile?.role === 'Lender' && (
                            <Link to="/lend" className="text-fintech-muted hover:text-fintech-heading transition-colors text-sm font-semibold uppercase tracking-wide">Lend</Link>
                        )}
                        {userProfile?.role === 'Borrower' && (
                            <Link to="/borrow" className="text-fintech-muted hover:text-fintech-heading transition-colors text-sm font-semibold uppercase tracking-wide">Borrow</Link>
                        )}
                    </div>

                    <div className="flex items-center space-x-6 pl-8 border-l border-fintech-border">
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-6">
                                <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
                                <Link
                                    to="/dashboard/profile"
                                    className="w-10 h-10 rounded-xl bg-fintech-dark flex items-center justify-center text-fintech-muted hover:text-fintech-heading hover:bg-fintech-dark transition-all shadow-inner"
                                    title="Profile"
                                >
                                    <FiUser size={18} />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all"
                                >
                                    <FiLogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link to="/signin" className="text-xs font-semibold uppercase tracking-wide text-fintech-muted hover:text-fintech-heading transition-colors px-4">
                                    Sign In
                                </Link>
                                <Link to="/signup" className="btn-primary !py-3">
                                    Initialize Identity <FiArrowRight />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="lg:hidden w-10 h-10 flex items-center justify-center text-fintech-muted hover:text-fintech-heading transition-colors"
                >
                    {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="lg:hidden bg-white border-b border-fintech-border py-8 px-6 space-y-8 animate-in slide-in-from-top duration-300">
                    <div className="flex flex-col space-y-6">
                        <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 text-fintech-heading hover:text-fintech-heading text-sm font-bold"><FiLayout /> Dashboard</Link>
                        {userProfile?.role === 'Lender' && (
                            <Link to="/lend" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 text-fintech-heading hover:text-fintech-heading text-sm font-bold"><FiLayout /> Lend</Link>
                        )}
                        {userProfile?.role === 'Borrower' && (
                            <Link to="/borrow" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 text-fintech-heading hover:text-fintech-heading text-sm font-bold"><FiLayout /> Borrow</Link>
                        )}
                    </div>

                    <div className="pt-8 border-t border-fintech-border flex flex-col gap-6">
                        {isAuthenticated ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-fintech-muted font-semibold uppercase tracking-wide">Protocol User</span>
                                    <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Link to="/dashboard/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-2 py-4 bg-fintech-dark rounded-xl text-sm font-bold text-fintech-heading"><FiUser /> Profile</Link>
                                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 py-4 bg-red-500/10 rounded-xl text-sm font-bold text-red-500"><FiLogOut /> Logout</button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <Link to="/signin" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center py-4 text-sm font-bold text-fintech-heading border border-fintech-border rounded-xl">Sign In</Link>
                                <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="btn-primary">Initialize Identity <FiArrowRight /></Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
