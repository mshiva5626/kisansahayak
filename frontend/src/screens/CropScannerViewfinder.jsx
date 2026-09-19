import React, { useState, useRef, useEffect } from 'react';
import { imageAPI, farmAPI } from '../api';

const CropScannerViewfinder = ({ onBack, onCapture, selectedFarmId }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanStage, setScanStage] = useState(''); // 'uploading' | 'analyzing'
    const [error, setError] = useState(null);
    const [effectiveFarmId, setEffectiveFarmId] = useState(selectedFarmId || null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (selectedFarmId) {
            setEffectiveFarmId(selectedFarmId);
        } else {
            farmAPI.getFarms()
                .then(res => {
                    if (res?.data?.farms?.length > 0) {
                        setEffectiveFarmId(res.data.farms[0].id || res.data.farms[0]._id);
                    } else {
                        setEffectiveFarmId('default_field');
                    }
                })
                .catch(() => setEffectiveFarmId('default_field'));
        }
    }, [selectedFarmId]);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file (JPG, PNG, or WebP).');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image is too large (max 10MB). Please choose a smaller image.');
            return;
        }

        setIsScanning(true);
        setScanStage('uploading');
        setError(null);

        // Reset file input so the same file can be re-selected after an error
        if (fileInputRef.current) fileInputRef.current.value = '';

        try {
            const activeFarm = effectiveFarmId || 'default_field';

            // Step 1: Upload image
            const formData = new FormData();
            formData.append('image', file);
            formData.append('farm_id', activeFarm);
            formData.append('image_type', 'leaf');

            const { data: uploadData } = await imageAPI.uploadImage(formData);

            if (!uploadData?.image) {
                throw new Error('Upload succeeded but no image data was returned.');
            }

            // Step 2: Analyze with AI
            setScanStage('analyzing');
            const imageIdentifier = uploadData.image._id || uploadData.image.id;
            const { data: analysisData } = await imageAPI.analyzeImage(imageIdentifier);

            // Pass complete analysis result to parent
            onCapture({
                image_id: analysisData.image_id,
                image_type: analysisData.image_type,
                analysis: analysisData.analysis_result || analysisData,
                confidence: typeof analysisData.confidence === 'number' ? analysisData.confidence : analysisData.confidence_score,
                indicators: analysisData.indicators || analysisData.observations || [],
                image_url: uploadData.image.image_url,
                is_valid_crop_or_leaf: analysisData.is_valid_crop_or_leaf !== false && analysisData.analysis_result?.is_valid_crop_or_leaf !== false,
                crop: analysisData.crop || analysisData.analysis_result?.crop,
                observations: analysisData.observations || analysisData.analysis_result?.observations || [],
                possible_issue: analysisData.possible_issue || analysisData.analysis_result?.possible_issue,
                severity: analysisData.severity || analysisData.analysis_result?.severity,
                recommendation: analysisData.recommendation || analysisData.analysis_result?.recommendation,
                disclaimer: analysisData.disclaimer || analysisData.analysis_result?.disclaimer
            });
        } catch (err) {
            console.error('Scan Error:', err);
            const msg = err.response?.data?.message || err.message || 'Analysis failed.';
            setError(msg.includes('Farm not found')
                ? 'Could not find your farm. Please set up a farm first and try again.'
                : msg.includes('timed out')
                    ? 'AI analysis timed out. Please try again with a clearer image.'
                    : 'Analysis failed. Please try again with a clearer, well-lit image.');
            setIsScanning(false);
            setScanStage('');
        }
    };

    const triggerFileInput = () => {
        if (!isScanning && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const stageLabel = scanStage === 'uploading'
        ? 'Uploading image...'
        : scanStage === 'analyzing'
            ? 'AI is analyzing your crop...'
            : 'Align affected leaf within frame';

    return (
        <div className="bg-[#0a0f0a] font-display antialiased overflow-hidden h-full w-full relative">
            {/* Hidden file input — NO capture attr so gallery works everywhere */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1920&auto=format&fit=crop"
                    alt="Camera view of plant leaves"
                    className="w-full h-full object-cover grayscale-[20%] brightness-75"
                />
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
            </div>

            {/* Full-screen Loading Overlay */}
            {isScanning && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm">
                    {/* Animated ring */}
                    <div className="relative w-28 h-28 mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-[#13ec6d]/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#13ec6d] animate-spin"></div>
                        <div className="absolute inset-[10px] rounded-full border-4 border-transparent border-t-[#13ec6d]/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#13ec6d] text-3xl animate-pulse">
                                {scanStage === 'uploading' ? 'cloud_upload' : 'biotech'}
                            </span>
                        </div>
                    </div>

                    <p className="text-white text-base font-bold mb-2 tracking-wide">{stageLabel}</p>

                    {/* Step indicators */}
                    <div className="flex items-center gap-3 mt-3">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${scanStage === 'uploading' ? 'bg-[#13ec6d]/20 text-[#13ec6d] border border-[#13ec6d]/40' : 'bg-white/10 text-white/50 border border-white/10'}`}>
                            <span className="material-symbols-outlined text-[14px]">
                                {scanStage === 'analyzing' ? 'check_circle' : 'upload'}
                            </span>
                            Upload
                        </div>
                        <div className="w-4 h-px bg-white/20"></div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${scanStage === 'analyzing' ? 'bg-[#13ec6d]/20 text-[#13ec6d] border border-[#13ec6d]/40' : 'bg-white/10 text-white/50 border border-white/10'}`}>
                            <span className="material-symbols-outlined text-[14px]">psychology</span>
                            Analyze
                        </div>
                    </div>

                    <p className="text-gray-500 text-xs mt-5 px-8 text-center">
                        AI vision analysis may take 15–30 seconds
                    </p>
                </div>
            )}

            {/* Top Control Bar */}
            <header className="absolute top-0 left-0 right-0 z-20 px-5 pt-12 pb-4 flex justify-between items-center bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-transparent">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-colors active:scale-95 cursor-pointer">
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-white/40">
                    <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-amber-500 animate-ping' : 'bg-emerald-600 animate-pulse'}`}></span>
                    <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-extrabold">Leaf Doctor AI</span>
                </div>

                <div className="w-10 h-10"></div>
            </header>

            {/* Main Scanning Viewfinder */}
            <main className="absolute inset-0 z-10 flex flex-col items-center justify-center -mt-10 pointer-events-none">
                <div className="relative w-72 h-72">
                    {/* Animated scanning line */}
                    {isScanning && (
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-10 shadow-[0_0_15px_rgba(52,211,153,0.8)] scan-line"></div>
                    )}

                    {/* Corner Borders */}
                    <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 ${isScanning ? 'border-amber-400' : 'border-emerald-400'} shadow-[0_0_10px_rgba(52,211,153,0.5)] rounded-tl-2xl transition-colors`}></div>
                    <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 ${isScanning ? 'border-amber-400' : 'border-emerald-400'} shadow-[0_0_10px_rgba(52,211,153,0.5)] rounded-tr-2xl transition-colors`}></div>
                    <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 ${isScanning ? 'border-amber-400' : 'border-emerald-400'} shadow-[0_0_10px_rgba(52,211,153,0.5)] rounded-bl-2xl transition-colors`}></div>
                    <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 ${isScanning ? 'border-amber-400' : 'border-emerald-400'} shadow-[0_0_10px_rgba(52,211,153,0.5)] rounded-br-2xl transition-colors`}></div>

                    {/* Center crosshair */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center opacity-60">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                        <div className="absolute w-full h-px bg-emerald-400/40"></div>
                        <div className="absolute w-px h-full bg-emerald-400/40"></div>
                    </div>
                </div>

                {/* Status pill */}
                <div className="mt-10 bg-white/95 text-slate-800 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200 shadow-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-sm animate-pulse">
                        {isScanning ? 'sync' : 'center_focus_weak'}
                    </span>
                    <p className="text-slate-800 text-xs font-bold tracking-wide">{stageLabel}</p>
                </div>
            </main>

            {/* Error Toast */}
            {error && (
                <div className="absolute top-28 left-4 right-4 z-30 bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg">
                    <span className="material-symbols-outlined text-lg shrink-0">error</span>
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="text-white/80 hover:text-white pointer-events-auto shrink-0">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            )}

            {/* Footer Controls */}
            <footer className="absolute bottom-0 left-0 right-0 z-20 pb-10 pt-16 px-8 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center">
                <div className="flex items-center justify-between w-full max-w-[280px]">

                    {/* Gallery Button */}
                    <button
                        onClick={triggerFileInput}
                        disabled={isScanning}
                        className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-40 cursor-pointer"
                        title="Upload plant photo from gallery"
                    >
                        <span className="material-symbols-outlined text-xl mb-0.5">photo_library</span>
                    </button>

                    {/* Shutter Button */}
                    <div className="relative flex items-center justify-center">
                        <div className={`absolute inset-0 rounded-full border-2 ${isScanning ? 'border-orange-500 animate-spin' : 'border-[#13ec6d]'} opacity-50 scale-110`}></div>
                        <button
                            onClick={triggerFileInput}
                            disabled={isScanning}
                            className={`w-[72px] h-[72px] rounded-full border-4 ${isScanning ? 'border-orange-500' : 'border-white'} flex items-center justify-center active:scale-95 transition-transform bg-black/20 backdrop-blur-sm disabled:opacity-50 cursor-pointer`}
                            title="Capture crop symptom photo"
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] ${isScanning ? 'bg-orange-500' : 'bg-white'}`}>
                                {isScanning && <span className="material-symbols-outlined text-white text-2xl animate-spin">sync</span>}
                            </div>
                        </button>
                    </div>

                    {/* Tips Button */}
                    <button
                        onClick={() => {
                            setError('💡 Tip: Position a single affected leaf centrally in the frame with bright natural lighting. Avoid shadows and blur.');
                        }}
                        className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
                        title="Scanning tips"
                    >
                        <span className="material-symbols-outlined text-xl mb-0.5">lightbulb</span>
                    </button>
                </div>

                <div className="mt-8 text-center px-4">
                    <p className="text-gray-400 text-xs">Select a clear, well-lit photo of the affected leaf or crop.</p>
                </div>
            </footer>
        </div>
    );
};

export default CropScannerViewfinder;
