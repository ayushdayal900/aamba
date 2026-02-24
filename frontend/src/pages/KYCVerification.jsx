import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Webcam from "react-webcam";

const KYCVerification = () => {
    const { userProfile, submitKyc } = useAuth();
    const navigate = useNavigate();
    const webcamRef = useRef(null);

    const [docType, setDocType] = useState('Aadhaar');
    const [docNumber, setDocNumber] = useState('');
    const [step, setStep] = useState(1);
    const [scanProgress, setScanProgress] = useState(0);
    const [capturedImage, setCapturedImage] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

    // Redirect to dashboard if they are already verified
    useEffect(() => {
        if (userProfile?.kycStatus === 'Verified') {
            navigate('/dashboard');
        }
    }, [userProfile, navigate]);

    const handleDocumentSubmit = (e) => {
        e.preventDefault();
        setStep(2); // Move to Liveliness Check
        setCameraActive(true);
        setCameraReady(false);
    };

    const capture = useCallback(() => {
        if (!webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            alert('Unable to capture image. Please make sure the camera has loaded.');
            return;
        }
        setCapturedImage(imageSrc);
        setCameraActive(false);
        startLivelinessScan(imageSrc);
    }, [webcamRef]);

    const startLivelinessScan = (imageStr) => {
        setStep(3); // Simulating scan progress UI while getting ready to call backend
        let progress = 0;
        const interval = setInterval(() => {
            progress += 25;
            setScanProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                finalizeKyc(imageStr);
            }
        }, 500);
    };

    const finalizeKyc = async (imageStr) => {
        setStep(4); // Processing with backend HF model
        const success = await submitKyc(docType, docNumber, imageStr);
        if (success) {
            setStep(5); // Success
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 3000);
        } else {
            alert('KYC Liveliness Verification Failed. Ensure your face is clearly visible.');
            setStep(2); // Go back to camera
            setCameraActive(true);
            setScanProgress(0);
            setCapturedImage(null);
        }
    };

    const videoConstraints = {
        width: 400,
        height: 400,
        facingMode: "user"
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Complete Identity Verification</h2>
                <p className="text-slate-400">Unlock your decentralized wallet and Soulbound NFT.</p>
            </div>

            <div className="bg-fintech-card border border-fintech-border p-8 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <span className="bg-blue-500/20 text-blue-400 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                            Document Details
                        </h3>
                        <form onSubmit={handleDocumentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Document Type</label>
                                <select
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    className="w-full bg-fintech-dark/50 border border-fintech-border text-white rounded-xl p-3 outline-none focus:border-fintech-accent focus:ring-1 focus:ring-fintech-accent"
                                >
                                    <option value="Aadhaar">Aadhaar Card</option>
                                    <option value="PAN">PAN Card</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Document Number</label>
                                <input
                                    type="text"
                                    value={docNumber}
                                    onChange={(e) => setDocNumber(e.target.value)}
                                    placeholder="Enter your ID"
                                    required
                                    className="w-full bg-fintech-dark/50 border border-fintech-border text-white rounded-xl p-3 outline-none focus:border-fintech-accent focus:ring-1 focus:ring-fintech-accent tracking-widest"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 bg-fintech-accent hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                            >
                                Continue to Liveliness Check
                            </button>
                        </form>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in flex flex-col items-center text-center">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                            <span className="bg-blue-500/20 text-blue-400 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                            Face Liveliness Check
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">Please position your face within the frame and ensure good lighting.</p>

                        <div className="w-64 h-64 rounded-full border-4 border-slate-600 bg-fintech-dark/50 flex items-center justify-center mb-6 relative overflow-hidden">
                            {cameraActive ? (
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={videoConstraints}
                                    onUserMedia={() => setCameraReady(true)}
                                    className="object-cover w-full h-full transform scale-x-[-1]"
                                />
                            ) : (
                                <svg className="w-20 h-20 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            )}
                        </div>

                        <button
                            onClick={capture}
                            disabled={!cameraActive || !cameraReady}
                            className="w-full bg-fintech-accent hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {cameraReady ? 'Capture & Analyze' : 'Starting Camera...'}
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-fade-in flex flex-col items-center py-8">
                        <div className="relative w-48 h-48 rounded-full border-4 border-fintech-accent bg-fintech-dark/50 flex items-center justify-center mb-8 overflow-hidden">
                            {capturedImage && <img src={capturedImage} alt="Captured" className="object-cover w-full h-full opacity-50 transform scale-x-[-1]" />}
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-fintech-accent/40 transition-all duration-500"
                                style={{ height: `${scanProgress}%` }}
                            ></div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Analyzing Face Geometry...</h3>
                        <p className="text-fintech-accent font-mono">{scanProgress}%</p>
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-fade-in flex flex-col items-center py-12">
                        <div className="w-16 h-16 border-4 border-t-fintech-accent border-r-fintech-accent border-b-transparent border-l-transparent rounded-full animate-spin mb-6"></div>
                        <h3 className="text-xl font-bold text-white mb-2">AI Verification in Progress...</h3>
                        <p className="text-slate-400 text-sm text-center">
                            Validating liveliness via Hugging Face model and assigning your EVM Web3 Wallet.
                        </p>
                    </div>
                )}

                {step === 5 && (
                    <div className="animate-fade-in flex flex-col items-center py-10">
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Verification Complete!</h3>
                        <div className="bg-fintech-dark border border-fintech-border p-4 rounded-xl w-full text-center">
                            <p className="text-slate-300 text-sm mb-1">EVM Wallet Assigned</p>
                            <p className="text-emerald-400 font-mono text-xs break-all">{userProfile?.walletAddress || '0x...'}</p>
                        </div>
                        <p className="text-slate-400 text-sm mt-6">
                            Soulbound NFT issued. Redirecting to your dashboard...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KYCVerification;
