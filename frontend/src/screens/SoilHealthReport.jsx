import React, { useState, useRef } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import { soilAPI } from '../api';

const SoilHealthReport = ({ onBack, onNavigate, userProfile, selectedFarmId }) => {
    const fileInputRef = useRef(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    // Default placeholder data
    const [reportData, setReportData] = useState({
        status: 'Optimal',
        badge: 'GOOD',
        message: 'Upload a soil image to get AI-powered health analysis with nutrient estimates and recommendations.',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        soilType: '—',
        color: '—',
        colorHex: '#94a3b8',
        texture: '—',
        moisture: '—',
        nutrients: {
            nitrogen: { level: '—', value: '—' },
            phosphorus: { level: '—', value: '—' },
            potassium: { level: '—', value: '—' },
            organicCarbon: { level: '—', value: '—' },
            pH: { level: '—', value: '—' }
        },
        recommendationHtml: 'Upload a soil photo using the <strong class="text-slate-900 dark:text-white">Browse Files</strong> button below to receive AI-powered fertilizer and amendment recommendations tailored to your farm.'
    });

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image is too large (max 10MB). Please choose a smaller image.');
            return;
        }

        setError('');
        setIsAnalyzing(true);

        const reader = new FileReader();

        reader.onloadend = async () => {
            const base64Image = reader.result;

            try {
                const farmId = selectedFarmId || '';
                const response = await soilAPI.analyzeSoil(farmId, base64Image);
                const data = response.data;
                if (data && data.report) {
                    setReportData(data.report);
                    setHasAnalyzed(true);
                }
            } catch (apiError) {
                console.error("Soil API Error:", apiError?.response?.data || apiError.message);
                setError('AI analysis failed. Please try again or check your internet connection.');
                setReportData(prev => ({
                    ...prev,
                    status: 'Analysis Failed',
                    badge: 'BAD',
                    message: 'Could not complete the soil analysis. This may be a temporary issue. Please try uploading again.',
                }));
            } finally {
                setIsAnalyzing(false);
            }
        };

        reader.onerror = () => {
            console.error("FileReader error");
            setIsAnalyzing(false);
            setError('Could not read the image file. Please try a different image.');
        };

        reader.readAsDataURL(file);
    };

    const getNutrientColor = (level) => {
        if (!level || level === '—' || level === 'Unknown') return 'text-slate-400';
        const l = level.toLowerCase();
        if (l === 'high' || l === 'neutral') return 'text-[#16a34a]';
        if (l === 'medium' || l === 'moderate') return 'text-[#f97316]';
        return 'text-[#ef4444]';
    };

    const getNutrientBg = (level) => {
        if (!level || level === '—' || level === 'Unknown') return 'bg-slate-100 dark:bg-slate-800';
        const l = level.toLowerCase();
        if (l === 'high' || l === 'neutral') return 'bg-[#dcfce7] dark:bg-[#14532d]/40';
        if (l === 'medium' || l === 'moderate') return 'bg-[#fff7ed] dark:bg-[#431407]/40';
        return 'bg-[#fef2f2] dark:bg-[#450a0a]/40';
    };

    const getBadgeStyle = (badge) => {
        const b = (badge || '').toUpperCase();
        if (b === 'GOOD') return 'bg-[#dcfce7] text-[#14532d]';
        if (b === 'OK') return 'bg-[#fff7ed] text-[#9a3412]';
        return 'bg-[#fef2f2] text-[#991b1b]';
    };

    const nutrients = reportData.nutrients || {};

    return (
        <div className="relative flex min-h-full w-full flex-col overflow-hidden max-w-md mx-auto bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] font-display text-slate-900 dark:text-slate-100 antialiased pb-20">
            {/* Header */}
            <header className="relative bg-gradient-to-b from-[#03140A] to-[#083D20] text-white pb-6 pt-12 px-5 rounded-b-[2rem] border-b border-emerald-500/10 shadow-lg z-20 overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none"></div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-2 text-white">
                        <button onClick={onBack} className="mr-2 p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full transition-all flex items-center justify-center tactile-btn">
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black tracking-tight text-white mb-0.5">Soil Health Report</h1>
                            <p className="text-emerald-450 text-xs font-bold tracking-wide">
                                Kisan Sahayak ID: #{userProfile ? (userProfile._id || userProfile.id).substring(0, 7).toUpperCase() : 'KS-9821'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center justify-center bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all active:scale-95 tactile-btn">
                            <span className="material-symbols-outlined text-xl">share</span>
                        </button>
                        <button className="flex items-center justify-center bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all active:scale-95 tactile-btn">
                            <span className="material-symbols-outlined text-xl">more_vert</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-36 px-4 z-10 relative">

                {error && (
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 rounded-2xl text-sm font-semibold flex items-center gap-2 krishi-glass">
                        <span className="material-symbols-outlined text-[18px] text-rose-500">error</span>
                        {error}
                    </div>
                )}

                {/* Overall Status Card */}
                <div className="tilt-card-container mt-6">
                    <div className="tilt-card krishi-glass rounded-[24px] p-6 shadow-[0_4px_20px_-4px_rgba(8,61,32,0.15)] border border-white/50 dark:border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <span className="material-symbols-outlined text-6xl">psychiatry</span>
                        </div>
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex flex-col">
                                <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Overall Status</span>
                                <span className="text-emerald-700 dark:text-emerald-400 text-3xl font-black tracking-tight">{reportData.status}</span>
                            </div>
                            <div className="relative">
                                <span className={`${getBadgeStyle(reportData.badge)} px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-current/10 shadow-sm`}>
                                    {reportData.badge}
                                </span>
                            </div>
                        </div>

                        <p className="text-slate-600 dark:text-slate-350 text-sm leading-relaxed mb-5 pr-2 relative z-10 font-medium">
                            {reportData.message}
                        </p>

                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold border-t border-slate-200/50 dark:border-white/5 pt-4 relative z-10">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            Tested on {reportData.date} • Valid for 6 months
                        </div>
                    </div>
                </div>

                {/* Soil Physical Analysis Section */}
                <div className="mt-8 mb-4">
                    <h2 className="text-[#64748b] dark:text-[#a7f3d0] text-xs font-bold tracking-widest uppercase mb-4 px-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-emerald-500">grid_view</span>
                        Soil Physical Analysis
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="tilt-card-container">
                            <div className="tilt-card krishi-glass rounded-[20px] p-4 shadow-[0_2px_10px_-4px_rgba(8,61,32,0.1)] border border-white/50 dark:border-white/10">
                                <span className="text-slate-450 dark:text-slate-555 text-xs font-bold uppercase tracking-wider mb-2 block">Color</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full border border-white/55 shadow-inner" style={{ backgroundColor: reportData.colorHex || '#94a3b8' }}></div>
                                    <span className="font-extrabold text-slate-900 dark:text-white text-[15px] capitalize">{reportData.color}</span>
                                </div>
                            </div>
                        </div>
                        <div className="tilt-card-container">
                            <div className="tilt-card krishi-glass rounded-[20px] p-4 shadow-[0_2px_10px_-4px_rgba(8,61,32,0.1)] border border-white/50 dark:border-white/10">
                                <span className="text-slate-450 dark:text-slate-555 text-xs font-bold uppercase tracking-wider mb-2 block">Texture</span>
                                <span className="font-extrabold text-slate-900 dark:text-white text-[15px] capitalize">{reportData.texture}</span>
                            </div>
                        </div>
                        <div className="tilt-card-container">
                            <div className="tilt-card krishi-glass rounded-[20px] p-4 shadow-[0_2px_10px_-4px_rgba(8,61,32,0.1)] border border-white/50 dark:border-white/10">
                                <span className="text-slate-450 dark:text-slate-555 text-xs font-bold uppercase tracking-wider mb-2 block">Soil Type</span>
                                <span className="font-extrabold text-slate-900 dark:text-white text-[15px] capitalize">{reportData.soilType || '—'}</span>
                            </div>
                        </div>
                        <div className="tilt-card-container">
                            <div className="tilt-card krishi-glass rounded-[20px] p-4 shadow-[0_2px_10px_-4px_rgba(8,61,32,0.1)] border border-white/50 dark:border-white/10">
                                <span className="text-slate-450 dark:text-slate-555 text-xs font-bold uppercase tracking-wider mb-2 block">Moisture</span>
                                <span className="font-extrabold text-slate-900 dark:text-white text-[15px] capitalize">{reportData.moisture || '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nutrient Analysis */}
                <div className="mt-6 mb-4">
                    <h2 className="text-[#64748b] dark:text-[#a7f3d0] text-xs font-bold tracking-widest uppercase mb-4 px-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-emerald-500">biotech</span>
                        Nutrient Estimates
                    </h2>
                    <div className="tilt-card-container">
                        <div className="tilt-card krishi-glass rounded-[24px] p-5 shadow-[0_2px_10px_-4px_rgba(8,61,32,0.1)] border border-white/50 dark:border-white/10 space-y-3">
                            {[
                                { label: 'Nitrogen (N)', icon: 'eco', data: nutrients.nitrogen },
                                { label: 'Phosphorus (P)', icon: 'bubble_chart', data: nutrients.phosphorus },
                                { label: 'Potassium (K)', icon: 'diamond', data: nutrients.potassium },
                                { label: 'Organic Carbon', icon: 'compost', data: nutrients.organicCarbon },
                                { label: 'pH Level', icon: 'science', data: nutrients.pH },
                            ].map((item, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${getNutrientBg(item.data?.level)} border-white/20 dark:border-white/5`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`material-symbols-outlined text-[20px] ${getNutrientColor(item.data?.level)}`}>{item.icon}</span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-extrabold uppercase ${getNutrientColor(item.data?.level)}`}>
                                            {item.data?.level || '—'}
                                        </span>
                                        {item.data?.value && item.data.value !== '—' && (
                                            <span className="text-xs text-slate-400 ml-1.5 font-bold">({item.data.value})</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {!hasAnalyzed && (
                        <p className="text-xs text-slate-400 text-center mt-2 font-medium">Upload a soil image for estimated values</p>
                    )}
                </div>

                {/* Upload Section */}
                <div className="tilt-card-container mt-6">
                    <div className="tilt-card krishi-glass rounded-[28px] border-2 border-dashed border-[#86efac]/80 bg-white/50 dark:bg-emerald-950/10 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                        {isAnalyzing && (
                            <div className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-sm font-extrabold text-[#114011] dark:text-[#4ade80] animate-pulse">Analyzing Soil with AI...</p>
                                <p className="text-xs text-slate-400 mt-1">This may take 10-15 seconds</p>
                            </div>
                        )}

                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-[14px] flex items-center justify-center text-emerald-600 dark:text-emerald-450 mb-4 border border-emerald-200/50 dark:border-emerald-500/20 shadow-sm pointer-events-none">
                            <span className="material-symbols-outlined text-[28px]">upload_file</span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-[17px] mb-1">Add Soil Image</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-5 font-medium">Upload photo for AI-powered analysis</p>

                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/jpeg, image/png, image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={handleBrowseClick}
                            disabled={isAnalyzing}
                            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-xs tracking-widest px-6 py-3 rounded-full transition-all shadow-[0_4px_14px_rgba(16,163,74,0.3)] disabled:opacity-50 disabled:cursor-not-allowed tactile-btn"
                        >
                            BROWSE FILES
                        </button>
                    </div>
                </div>

                {/* AI Smart Recommendation */}
                <div className="tilt-card-container mt-6">
                    <div className="tilt-card krishi-glass rounded-[24px] p-5 pb-6 border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
                        {/* Elegant background highlight */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
                        
                        <div className="flex items-center gap-2 mb-3 relative z-10">
                            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-450">auto_awesome</span>
                            <h3 className="font-extrabold text-emerald-900 dark:text-white text-[16px]">AI Smart Recommendation</h3>
                        </div>
                        <p
                            className="text-[#065f46] dark:text-[#a7f3d0] text-[14px] leading-relaxed mb-5 relative z-10 font-semibold"
                            dangerouslySetInnerHTML={{ __html: reportData.recommendationHtml }}
                        ></p>
                        <button className="text-emerald-700 dark:text-emerald-450 font-bold text-xs tracking-wider flex items-center gap-1 hover:opacity-80 transition-all relative z-10 tactile-btn">
                            VIEW COMPLETE PLAN <span className="material-symbols-outlined text-[16px] text-emerald-500">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </main>

            {/* Bottom Actions Overlay */}
            <div className="fixed bottom-24 left-0 right-0 z-40 px-4 max-w-md mx-auto pointer-events-none">
                <div className="pointer-events-auto">
                    <button className="w-full btn-glass-glow text-white font-extrabold text-xs tracking-widest py-4.5 rounded-[18px] shadow-[0_8px_20px_-6px_rgba(14,208,84,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95 tactile-btn border border-white/20">
                        <span className="material-symbols-outlined text-[20px]">download</span> PDF REPORT
                    </button>
                </div>
            </div>

            <BottomNavbar activeTab="reports" onNavigate={onNavigate} />
        </div>
    );
};

export default SoilHealthReport;
