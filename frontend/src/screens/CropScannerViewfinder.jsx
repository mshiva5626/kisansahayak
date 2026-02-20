import React, { useState, useRef } from 'react';
import { imageAPI } from '../api';

const CropScannerViewfinder = ({ onBack, onCapture, selectedFarmId }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!selectedFarmId) {
            setError('Please select a farm first before scanning crops.');
            return;
        }

        setIsScanning(true);
        setError(null);

        try {
            // Step 1: Upload image
            const formData = new FormData();
            formData.append('image', file);
            formData.append('farm_id', selectedFarmId);
            formData.append('image_type', 'leaf');

            const { data: uploadData } = await imageAPI.uploadImage(formData);

            // Step 2: Analyze the uploaded image with AI
            const { data: analysisData } = await imageAPI.analyzeImage(uploadData.image._id);

            // Pass complete analysis result to parent
            onCapture({
                image_id: analysisData.image_id,
                image_type: analysisData.image_type,
                analysis: analysisData.analysis_result,
                confidence: analysisData.confidence_score,
                indicators: analysisData.indicators,
                image_url: uploadData.image.image_url
            });
        } catch (err) {
            console.error('Scan Error:', err);
            setError(err.response?.data?.message || 'Analysis failed. Please try again with a clearer image.');
        } finally {
            setIsScanning(false);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="bg-background-dark font-display antialiased overflow-hidden h-screen w-full relative text-white selection:bg-primary selection:text-white">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Background Camera Feed Simulation */}
            <div className="absolute inset-0 z-0">
                <img
                    alt="Close up of a healthy green leaf with detailed veins"
                    className="w-full h-full object-cover saturate-110 contrast-110"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuACsVyoaJmCRgdaK__HCBBtUFNJjH-R21jz_qlZwVRMPXpvBc9MQBZ0rhkv0PxeELwcdwV-HTzoCtH_n75HotAx7iT-f5Q_07aOcur5jqVFqp1tVKsbbdjv8nt1DSjI22MXJ3MmiZ3ueMTpdigFGK9Ibv-Uqpz7dw0HtjQLHM6S2lfM2hUolqmNicy6b-uwzZ20r7-eaIpHm_K9RaQc3cV6fPcF-NhzTIjkQdL0IKQWA6HLN6cTg0XMchsAJ2eTWrARN2vAszLSRbhi"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(16,34,24,0.6)_80%)]"></div>
            </div>

            {/* Top Control Bar */}
            <header className="absolute top-0 left-0 right-0 z-20 pt-12 px-6 flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md border border-white/10 active:scale-95 transition-transform"
                >
                    <span className="material-icons text-white text-2xl">close</span>
                </button>
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
                    <span className={`w-2.5 h-2.5 rounded-full ${isScanning ? 'bg-orange-500 animate-ping' : 'bg-primary animate-pulse'} shadow-[0_0_10px_rgba(19,236,109,0.8)]`}></span>
                    <span className="text-xs font-bold tracking-widest text-primary uppercase">{isScanning ? 'Analyzing...' : 'AI ACTIVE'}</span>
                </div>
                <div className="w-10"></div>
            </header>

            {/* Center Scanning Area */}
            <main className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                <div className="relative w-80 h-80">
                    {isScanning && (
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent z-10 animate-scan shadow-[0_0_15px_rgba(19,236,109,0.5)]"></div>
                    )}
                    <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 ${isScanning ? 'border-orange-500' : 'border-primary'} rounded-tl-2xl transition-colors`}></div>
                    <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 ${isScanning ? 'border-orange-500' : 'border-primary'} rounded-tr-2xl transition-colors`}></div>
                    <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 ${isScanning ? 'border-orange-500' : 'border-primary'} rounded-bl-2xl transition-colors`}></div>
                    <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 ${isScanning ? 'border-orange-500' : 'border-primary'} rounded-br-2xl transition-colors`}></div>

                    <div className="absolute -bottom-16 left-0 right-0 flex justify-center">
                        <div className="bg-background-dark/80 backdrop-blur-md text-primary text-xs px-4 py-2 rounded-xl border border-primary/30 flex items-center gap-2 shadow-glow">
                            <span className="material-icons animate-spin text-base">{isScanning ? 'sync' : 'psychology'}</span>
                            <span className="font-semibold tracking-wide capitalize">{isScanning ? 'Analyzing crop image...' : 'Tap to capture or upload'}</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Error Toast */}
            {error && (
                <div className="absolute top-28 left-4 right-4 z-30 bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span className="material-icons text-lg">error</span>
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="text-white/80 hover:text-white">
                        <span className="material-icons text-lg">close</span>
                    </button>
                </div>
            )}

            {/* No Farm Warning */}
            {!selectedFarmId && (
                <div className="absolute top-28 left-4 right-4 z-30 bg-yellow-500/90 backdrop-blur-md text-black px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span className="material-icons text-lg">warning</span>
                    <span>Select a farm first to use crop scanner</span>
                </div>
            )}

            {/* Bottom Controls */}
            <footer className="absolute bottom-0 left-0 right-0 z-20 pb-12 pt-20 px-6 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent">
                <div className="max-w-md mx-auto relative">
                    <div className="text-center mb-10">
                        <p className="text-white font-bold text-xl drop-shadow-lg">{isScanning ? 'Analyzing crop image...' : 'Capture or upload a leaf photo'}</p>
                        <p className="text-white/60 text-sm mt-1">Take a close-up photo of the affected area</p>
                    </div>

                    <div className="flex items-center justify-center gap-8">
                        {/* Gallery button */}
                        <button
                            onClick={triggerFileInput}
                            disabled={isScanning || !selectedFarmId}
                            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                        >
                            <span className="material-icons text-white text-2xl">photo_library</span>
                        </button>

                        {/* Main capture button */}
                        <button
                            onClick={triggerFileInput}
                            disabled={isScanning || !selectedFarmId}
                            className={`relative w-24 h-24 rounded-full border-4 ${isScanning ? 'border-orange-500/50' : 'border-white/30'} p-1.5 flex items-center justify-center active:scale-95 transition-all shadow-2xl overflow-hidden disabled:opacity-50`}
                        >
                            <div className={`w-full h-full ${isScanning ? 'bg-orange-500' : 'bg-primary'} rounded-full transition-colors flex items-center justify-center`}>
                                <span className="material-icons text-background-dark text-4xl">{isScanning ? 'hourglass_top' : 'camera_alt'}</span>
                            </div>
                        </button>

                        {/* Placeholder for symmetry */}
                        <div className="w-14 h-14"></div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CropScannerViewfinder;
