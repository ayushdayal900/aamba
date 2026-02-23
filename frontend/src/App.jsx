import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Lend from './pages/Lend';
import Borrow from './pages/Borrow';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-fintech-dark">
          <Routes>
            <Route path="/" element={<div className="text-center mt-20 text-xl font-medium">Welcome to MicroFin. Please connect your wallet.</div>} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lend" element={<Lend />} />
            <Route path="/borrow" element={<Borrow />} />
            <Route path="*" element={<div className="text-center mt-20">404 Not Found</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
