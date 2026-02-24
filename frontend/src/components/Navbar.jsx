import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navbar = () => {


    const { isConnected, userProfile, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-fintech-dark border-b border-fintech-border px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-fintech-accent flex items-center justify-center">
                    <span className="text-white font-bold italic">M</span>
                </div>
                <Link to="/" className="text-xl font-bold text-white tracking-wide">
                    MicroFin
                </Link>
            </div>

            <div className="flex space-x-6 items-center">
                <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Dashboard</Link>
                <Link to="/lend" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Lend</Link>
                <Link to="/borrow" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">Borrow</Link>

                <div className="pl-4 border-l border-fintech-border flex space-x-4 items-center">
                    {isConnected ? (
                        <div className="flex items-center space-x-4">
                            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
                            <div className="h-6 w-[1px] bg-fintech-border mx-2"></div>
                            <span className="text-sm text-slate-300">
                                {userProfile?.name} <span className="text-xs bg-slate-800 px-2 py-1 rounded ml-2">{userProfile?.role || 'User'}</span>
                            </span>

                            <button
                                onClick={handleLogout}
                                className="text-sm text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-4 py-2 rounded-lg"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                Log In
                            </Link>
                            <Link to="/register" className="text-sm font-medium bg-fintech-accent hover:bg-blue-600 text-white px-5 py-2 rounded-lg transition-colors shadow-lg">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
