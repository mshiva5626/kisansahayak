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
        <div className="relative flex min-h-full w-full flex-col overflow-hidden max-w-md mx-auto bg-[#f8fcf8] dark:bg-black font-display text-slate-900 dark:text-slate-100 antialiased pb-20">
            {/* Header */}
            <header className="bg-[#114011] text-white px-4 pt-12 pb-6 flex items-start justify-between shrink-0 shadow-sm relative z-20">
                <div className="flex items-start gap-4">
                    <button onClick={onBack} className="mt-1 flex items-center justify-center hover:bg-white/10 p-1 rounded-full transition-colors active:scale-95">
                        <span className="material-symbols-outlined font-bold text-xl">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-white mb-0.5">Soil Health Report</h1>
                        <p className="text-[#4ade80] text-xs font-semibold tracking-wide">
                            Kisan Sahayak ID: #{userProfile ? (userProfile._id || userProfile.id).substring(0, 7).toUpperCase() : 'KS-9821'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <button className="flex items-center justify-center hover:bg-white/10 p-1.5 rounded-full transition-colors active:scale-95">
                        <span className="material-symbols-outlined text-xl">share</span>
                    </button>
                    <button className="flex items-center justify-center hover:bg-white/10 p-1.5 rounded-full transition-colors active:scale-95">
                        <span className="material-symbols-outlined text-xl">more_vert</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4 z-10 relative">

                {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-xl text-sm border border-red-200 dark:border-red-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        {error}
                    </div>
                )}

                {/* Overall Status Card */}
                <div className="bg-white dark:bg-[#1a2e1a] rounded-[24px] p-6 mt-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <span className="material-symbols-outlined text-6xl">psychiatry</span>
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 tracking-wide">Overall Status</span>
                            <span className="text-[#114011] dark:text-[#4ade80] text-3xl font-bold">{reportData.status}</span>
                        </div>
                        <div className="relative">
                            <span className={`${getBadgeStyle(reportData.badge)} px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase`}>
                                {reportData.badge}
                            </span>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-5 pr-2">
                        {reportData.message}
                    </p>

                    <div className="flex items-center gap-1.5 text-[#94a3b8] text-xs font-medium border-t border-slate-100 dark:border-slate-800 pt-4">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        Tested on {reportData.date} • Valid for 6 months
                    </div>
                </div>

                {/* Soil Physical Analysis Section */}
                <div className="mt-8 mb-4">
                    <h2 className="text-[#64748b] text-xs font-bold tracking-widest uppercase mb-4 px-1">Soil Physical Analysis</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-[#1a2e1a] rounded-[20px] p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800">
                            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2 block">Color</span>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: reportData.colorHex || '#94a3b8' }}></div>
                                <span className="font-bold text-slate-900 dark:text-white text-[15px]">{reportData.color}</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1a2e1a] rounded-[20px] p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800">
                            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2 block">Texture</span>
                            <span className="font-bold text-slate-900 dark:text-white text-[15px]">{reportData.texture}</span>
                        </div>
                        <div className="bg-white dark:bg-[#1a2e1a] rounded-[20px] p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800">
                            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2 block">Soil Type</span>
                            <span className="font-bold text-slate-900 dark:text-white text-[15px]">{reportData.soilType || '—'}</span>
                        </div>
                        <div className="bg-white dark:bg-[#1a2e1a] rounded-[20px] p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800">
                            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2 block">Moisture</span>
                            <span className="font-bold text-slate-900 dark:text-white text-[15px]">{reportData.moisture || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Nutrient Analysis */}
                <div className="mt-6 mb-4">
                    <h2 className="text-[#64748b] text-xs font-bold tracking-widest uppercase mb-4 px-1">Nutrient Estimates</h2>
                    <div className="bg-white dark:bg-[#1a2e1a] rounded-[24px] p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800 space-y-3">
                        {[
                            { label: 'Nitrogen (N)', icon: 'eco', data: nutrients.nitrogen },
                            { label: 'Phosphorus (P)', icon: 'bubble_chart', data: nutrients.phosphorus },
                            { label: 'Potassium (K)', icon: 'diamond', data: nutrients.potassium },
                            { label: 'Organic Carbon', icon: 'compost', data: nutrients.organicCarbon },
                            { label: 'pH Level', icon: 'science', data: nutrients.pH },
                        ].map((item, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl ${getNutrientBg(item.data?.level)}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined text-[20px] ${getNutrientColor(item.data?.level)}`}>{item.icon}</span>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</span>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-bold ${getNutrientColor(item.data?.level)}`}>
                                        {item.data?.level || '—'}
                                    </span>
                                    {item.data?.value && item.data.value !== '—' && (
                                        <span className="text-xs text-slate-400 ml-1.5">({item.data.value})</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {!hasAnalyzed && (
                        <p className="text-xs text-slate-400 text-center mt-2">Upload a soil image for estimated values</p>
                    )}
                </div>

                {/* Upload Section */}
                <div className="mt-6 rounded-[28px] border-2 border-dashed border-[#86efac] bg-white dark:bg-[#0f1f0f] p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    {isAnalyzing && (
                        <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-[#00d100] border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-sm font-bold text-[#114011] dark:text-[#4ade80] animate-pulse">Analyzing Soil with AI...</p>
                            <p className="text-xs text-slate-400 mt-1">This may take 10-15 seconds</p>
                        </div>
                    )}

                    <div className="w-12 h-12 bg-[#dcfce7] rounded-[14px] flex items-center justify-center text-[#16a34a] mb-4">
                        <span className="material-symbols-outlined text-[28px]">upload_file</span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-[17px] mb-1">Add Soil Image</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-5">Upload photo for AI-powered analysis</p>

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
                        className="bg-[#00d100] hover:bg-[#00ba00] active:scale-95 text-black font-bold text-sm tracking-wide px-6 py-2.5 rounded-full transition-all shadow-[0_4px_14px_rgba(0,209,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        BROWSE FILES
                    </button>
                </div>

                {/* AI Smart Recommendation */}
                <div className="mt-6 bg-[#dcfce7] dark:bg-[#114011] rounded-[24px] p-5 pb-6 border border-[#bbf7d0] dark:border-[#14532d]">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-[#16a34a] dark:text-[#4ade80]">auto_awesome</span>
                        <h3 className="font-bold text-[#064e3b] dark:text-white text-[16px]">AI Smart Recommendation</h3>
                    </div>
                    <p
                        className="text-[#065f46] dark:text-[#a7f3d0] text-[14px] leading-relaxed mb-5"
                        dangerouslySetInnerHTML={{ __html: reportData.recommendationHtml }}
                    ></p>
                    <button className="text-[#064e3b] dark:text-white font-bold text-xs tracking-wide flex items-center gap-1 hover:opacity-80 transition-opacity">
                        VIEW COMPLETE PLAN <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                </div>
            </main>

            {/* Bottom Actions Overlay */}
            <div className="fixed bottom-24 left-0 right-0 z-40 px-4 max-w-md mx-auto">
                <button className="w-full bg-[#00d100] hover:bg-[#00ba00] active:scale-[0.98] text-black font-bold text-sm tracking-wide py-4.5 rounded-[16px] shadow-[0_8px_20px_-6px_rgba(0,209,0,0.5)] transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">download</span> PDF REPORT
                </button>
            </div>

            <BottomNavbar activeTab="reports" onNavigate={onNavigate} />
        </div>
    );
};

export default SoilHealthReport;
