import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Lend from './pages/Lend';
import Borrow from './pages/Borrow';
import RoleSelection from './pages/RoleSelection';
import KYCVerification from './pages/KYCVerification';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { useAuth } from './context/AuthContext';

function App() {
  const { isConnected, userProfile, loading } = useAuth();

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-fintech-dark">
          {loading ? (
            <div className="flex justify-center mt-20 text-white font-medium">Loading User Profile...</div>
          ) : !isConnected ? (
            <Routes>
              <Route path="/register" element={<Signup />} />
              <Route path="*" element={<Login />} />
            </Routes>
          ) : userProfile?.role === 'Unassigned' ? (
            <Routes>
              <Route path="*" element={<RoleSelection />} />
            </Routes>
          ) : (userProfile?.kycStatus === 'Pending' || userProfile?.kycStatus === 'FaceVerified' || userProfile?.kycStatus === 'Rejected') ? (
            <Routes>
              <Route path="/kyc" element={<KYCVerification />} />
              <Route path="*" element={<Navigate to="/kyc" replace />} />
            </Routes>
          ) : (

            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/lend" element={<Lend />} />
              <Route path="/borrow" element={<Borrow />} />
              <Route path="/kyc" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<div className="text-center mt-20 text-white">404 Not Found</div>} />
            </Routes>
          )}

        </main>
      </div>
    </Router>
  );
}

export default App;
