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
        <div className="bg-[#0a0f0a] font-display antialiased overflow-hidden h-full w-full relative">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Background Image / Camera Feed Simulation */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1920&auto=format&fit=crop"
                    alt="Camera view of plant leaves"
                    className="w-full h-full object-cover grayscale-[20%] brightness-75"
                />

                {/* Dark overlay for better contrast */}
                <div className="absolute inset-0 bg-black/40"></div>

                {/* Vignette effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
            </div>

            {/* Top Control Bar */}
            <header className="absolute top-0 left-0 right-0 z-20 px-5 pt-12 pb-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors active:scale-95">
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-orange-500 animate-ping' : 'bg-[#13ec6d] animate-pulse'} shadow-[0_0_8px_rgba(19,236,109,0.8)]`}></span>
                    <span className="text-[10px] uppercase tracking-widest text-[#13ec6d] font-bold">AI Scanner</span>
                </div>

                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors active:scale-95">
                    <span className="material-symbols-outlined">flash_on</span>
                </button>
            </header>

            {/* Main Scanning Viewfinder */}
            <main className="absolute inset-0 z-10 flex flex-col items-center justify-center -mt-10 pointer-events-none">

                {/* Scanning Reticle */}
                <div className="relative w-72 h-72">
                    {/* Animated scanning line */}
                    {isScanning && (
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#13ec6d] to-transparent z-10 shadow-[0_0_15px_rgba(19,236,109,0.8)] scan-line"></div>
                    )}

                    {/* Corner Borders */}
                    <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 ${isScanning ? 'border-orange-500' : 'border-[#13ec6d]'} shadow-[0_0_10px_rgba(19,236,109,0.4)] rounded-tl-xl transition-colors`}></div>
                    <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 ${isScanning ? 'border-orange-500' : 'border-[#13ec6d]'} shadow-[0_0_10px_rgba(19,236,109,0.4)] rounded-tr-xl transition-colors`}></div>
                    <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 ${isScanning ? 'border-orange-500' : 'border-[#13ec6d]'} shadow-[0_0_10px_rgba(19,236,109,0.4)] rounded-bl-xl transition-colors`}></div>
                    <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 ${isScanning ? 'border-orange-500' : 'border-[#13ec6d]'} shadow-[0_0_10px_rgba(19,236,109,0.4)] rounded-br-xl transition-colors`}></div>

                    {/* Focus Indicators */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center opacity-50">
                        <div className="w-1 h-1 bg-[#13ec6d] rounded-full"></div>
                        <div className="absolute w-full h-px bg-[#13ec6d]/30"></div>
                        <div className="absolute w-px h-full bg-[#13ec6d]/30"></div>
                    </div>
                </div>

                {/* Instruction Text */}
                <div className="mt-12 bg-black/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#13ec6d] text-sm animate-pulse">{isScanning ? 'sync' : 'center_focus_weak'}</span>
                    <p className="text-white text-sm font-medium tracking-wide">
                        {isScanning ? 'Analyzing crop issue...' : 'Align affected leaf within frame'}
                    </p>
                </div>
            </main>

            {/* Error Toast */}
            {error && (
                <div className="absolute top-28 left-4 right-4 z-30 bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="text-white/80 hover:text-white pointer-events-auto">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            )}

            {/* No Farm Warning */}
            {!selectedFarmId && (
                <div className="absolute top-28 left-4 right-4 z-30 bg-yellow-500/90 backdrop-blur-md text-black px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">warning</span>
                    <span>Select a farm first to use crop scanner</span>
                </div>
            )}

            {/* Footer Controls */}
            <footer className="absolute bottom-0 left-0 right-0 z-20 pb-10 pt-16 px-8 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center">

                {/* Control Buttons */}
                <div className="flex items-center justify-between w-full max-w-[280px]">

                    {/* Gallery Button */}
                    <button
                        onClick={triggerFileInput}
                        disabled={isScanning || !selectedFarmId}
                        className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-xl mb-0.5">photo_library</span>
                    </button>

                    {/* Shutter Button */}
                    <div className="relative flex items-center justify-center">
                        <div className={`absolute inset-0 rounded-full border-2 ${isScanning ? 'border-orange-500 animate-spin' : 'border-[#13ec6d]'} opacity-50 scale-110`}></div>
                        <button
                            onClick={triggerFileInput}
                            disabled={isScanning || !selectedFarmId}
                            className={`w-[72px] h-[72px] rounded-full border-4 ${isScanning ? 'border-orange-500' : 'border-white'} flex items-center justify-center active:scale-95 transition-transform bg-black/20 backdrop-blur-sm disabled:opacity-50`}
                        >
                            <div className={`w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] ${isScanning ? 'bg-orange-500' : ''}`}>
                                {isScanning && <span className="material-symbols-outlined text-white text-2xl animate-spin">sync</span>}
                            </div>
                        </button>
                    </div>

                    {/* Tips Button */}
                    <button className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95">
                        <span className="material-symbols-outlined text-xl mb-0.5">lightbulb</span>
                    </button>

                </div>

                <div className="mt-8 text-center px-4">
                    <p className="text-gray-400 text-xs">Ensure good lighting and a clear background for best AI analysis results.</p>
                </div>
            </footer>
        </div>
    );
};

export default CropScannerViewfinder;
