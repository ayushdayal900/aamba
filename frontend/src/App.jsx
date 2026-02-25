import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Lend from './pages/Lend';
import Borrow from './pages/Borrow';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import Signup from './pages/Signup';
import { useAuth } from './context/AuthContext';
import { useAccount } from 'wagmi';
import { checkIdentityOwnership } from './blockchainService';
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ children, isFullyOnboarded, loading, isAuthenticated, isIdentityVerified }) => {
  const isOnboarded = localStorage.getItem("isOnboarded") === "true";

  console.log("[Route Guard] Checking access...", {
    isAuthenticated,
    isFullyOnboarded,
    isIdentityVerified,
    localOnboarded: isOnboarded,
    loading
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-fintech-dark flex justify-center items-center text-white font-medium">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-fintech-accent border-t-transparent rounded-full animate-spin"></div>
          <span className="animate-pulse tracking-widest uppercase text-xs font-bold text-slate-500">Verifying Protocol Access...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("[Route Guard] Not authenticated, redirecting to signin");
    return <Navigate to="/signin" replace />;
  }

  // Strict check: Must be verified on-chain to move past onboarding
  if (!isIdentityVerified && !isOnboarded) {
    console.log("[Route Guard] Identity NOT verified on-chain, redirecting to onboarding");
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated, userProfile, loading: authLoading } = useAuth();
  const { address, isConnected } = useAccount();
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [appLoading, setAppLoading] = useState(true);

  // Helper to determine if user is fully onboarded
  const localOnboarded = localStorage.getItem("isOnboarded") === "true";

  useEffect(() => {
    const verifyIdentity = async () => {
      if (isConnected && address) {
        console.log("[App] Verifying Identity on-chain for:", address);
        const hasNFT = await checkIdentityOwnership(address);
        setIsIdentityVerified(hasNFT);
        if (hasNFT) {
          localStorage.setItem("isOnboarded", "true");
        }
      }
      setAppLoading(false);
    };

    if (!authLoading) {
      verifyIdentity();
    }
  }, [isConnected, address, authLoading]);

  const combinedLoading = authLoading || appLoading;
  const isFullyOnboarded = isAuthenticated && (userProfile?.kycStatus === 'Verified' || localOnboarded || isIdentityVerified);

  console.log("[App Init] State:", {
    isAuthenticated,
    userProfileRole: userProfile?.role,
    isIdentityVerified,
    localOnboarded,
    isFullyOnboarded,
    combinedLoading
  });

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-fintech-dark">
        {/* Only show Navbar if not on landing or auth pages for a cleaner look */}
        <Routes>
          <Route path="/" element={null} />
          <Route path="/signin" element={null} />
          <Route path="/signup" element={null} />
          <Route path="/onboarding" element={null} />
          <Route path="*" element={<Navbar />} />
        </Routes>

        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<Signup />} />

            {/* Steps & Onboarding */}
            <Route
              path="/onboarding"
              element={
                isAuthenticated ? (
                  (isFullyOnboarded || localOnboarded) ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Onboarding />
                  )
                ) : (
                  <Navigate to="/signin" replace />
                )
              }
            />

            {/* Protected Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  isFullyOnboarded={isFullyOnboarded}
                  isIdentityVerified={isIdentityVerified}
                  loading={combinedLoading}
                >
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  isFullyOnboarded={isFullyOnboarded}
                  isIdentityVerified={isIdentityVerified}
                  loading={combinedLoading}
                >
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lend"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  isFullyOnboarded={isFullyOnboarded}
                  isIdentityVerified={isIdentityVerified}
                  loading={combinedLoading}
                >
                  <Lend />
                </ProtectedRoute>
              }
            />
            <Route
              path="/borrow"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  isFullyOnboarded={isFullyOnboarded}
                  isIdentityVerified={isIdentityVerified}
                  loading={combinedLoading}
                >
                  <Borrow />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
