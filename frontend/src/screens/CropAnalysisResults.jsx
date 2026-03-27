import React from 'react';

const CropAnalysisResults = ({ onBack, onViewTreatment, scanResult }) => {
    const analysis = scanResult?.analysis || {};
    const isError = analysis.disease_name === 'Analysis Unavailable' || analysis.overall_assessment === 'Analysis Unavailable' || !analysis.disease_name;
    const isHealthy = !isError && (
        analysis.severity === 'Healthy' || 
        analysis.causal_agent === 'Healthy' ||
        (scanResult?.indicators?.length === 0 && !analysis.overall_assessment?.toLowerCase().includes('disease'))
    );

    const getSeverityStyle = (severity) => {
        const s = (severity || '').toLowerCase();
        if (s === 'healthy') return { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', icon: 'verified', border: 'border-green-200 dark:border-green-800' };
        if (s === 'mild') return { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', icon: 'warning', border: 'border-yellow-200 dark:border-yellow-800' };
        if (s === 'moderate') return { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', icon: 'error', border: 'border-orange-200 dark:border-orange-800' };
        if (s === 'severe') return { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-600 dark:text-red-300', icon: 'dangerous', border: 'border-red-200 dark:border-red-800' };
        if (s === 'critical') return { bg: 'bg-red-200 dark:bg-red-900/60', text: 'text-red-700 dark:text-red-200', icon: 'emergency', border: 'border-red-300 dark:border-red-700' };
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-300', icon: 'help', border: 'border-gray-200 dark:border-gray-700' };
    };

    const severityStyle = getSeverityStyle(analysis.severity);

    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-background-dark h-screen relative shadow-2xl overflow-hidden flex flex-col font-display antialiased">
            {/* Header */}
            <header className="absolute top-0 left-0 w-full z-20 px-4 pt-12 pb-4 flex items-center justify-between bg-gradient-to-b from-black/60 via-black/40 to-transparent">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                >
                    <span className="material-icons text-xl pl-1">arrow_back_ios</span>
                </button>
                <h1 className="text-white text-lg font-bold tracking-wide drop-shadow-md">{scanResult?.crop || 'Crop'} Analysis</h1>
                <div className="w-10"></div>
            </header>

            {/* Main Content Area: Image + Markers */}
            <main className="flex-grow relative h-full bg-black">
                {/* Scanned Image */}
                <div className="absolute inset-0 w-full h-[50%]">
                    <img
                        alt="Scanned Crop"
                        className="w-full h-full object-cover"
                        src={scanResult?.image_url || "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1920&auto=format&fit=crop"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-background-dark via-transparent to-transparent"></div>
                </div>

                {/* Pinpoint Marker properly aligned in absolute center of viewport image context */}
                {!isError && (
                    <div className="absolute top-[25%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <div className={`absolute inset-0 rounded-full ${isHealthy ? 'bg-primary' : 'bg-red-500'} border-[3px] border-white shadow-[0_0_15px_rgba(0,0,0,0.5)] animate-ping opacity-60`}></div>
                            <div className={`relative w-8 h-8 rounded-full ${isHealthy ? 'bg-primary' : 'bg-red-500'} border-[3px] border-white shadow-xl flex items-center justify-center`}>
                                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Sheet */}
            <div className="absolute bottom-0 left-0 w-full z-20 p-4 pb-8" style={{ maxHeight: '72%' }}>
                <div className="bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-6 shadow-2xl overflow-y-auto max-h-full">
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-5 shrink-0"></div>

                    {/* Disease Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="text-left flex-1 pr-3">
                            {/* Only show AI Confirmed badges if successful analysis */}
                            {!isError && (
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-green-800 dark:text-green-100 border border-primary/30 shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 shadow-sm"></span>
                                        AI Confirmed
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{Math.round((scanResult?.confidence || 0) * 100)}% Confidence</span>
                                </div>
                            )}
                            <h2 className={`text-xl font-extrabold leading-tight ${isError ? 'text-red-600 dark:text-red-400 mt-1' : 'text-gray-900 dark:text-white'}`}>
                                {analysis.disease_name || analysis.overall_assessment || 'Diagnostic Complete'}
                            </h2>
                            {!isError && analysis.scientific_name && (
                                <p className="text-xs text-gray-400 italic mt-1">{analysis.scientific_name}</p>
                            )}
                        </div>
                        
                        <div className={`h-12 w-12 rounded-full ${isError ? 'bg-red-50 text-red-500' : isHealthy ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'} flex items-center justify-center shrink-0 shadow-inner`}>
                            <span className="material-icons text-2xl">{isError ? 'error_outline' : isHealthy ? 'verified' : 'coronavirus'}</span>
                        </div>
                    </div>

                    {/* Severity + Causal Agent Badges */}
                    {!isError && (
                        <div className="flex items-center gap-2 mb-5 flex-wrap">
                            {analysis.severity && analysis.severity !== 'Unknown' && (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${severityStyle.bg} ${severityStyle.text} border ${severityStyle.border}`}>
                                    <span className="material-symbols-outlined text-[14px]">{severityStyle.icon}</span>
                                    {analysis.severity}
                                    {analysis.severity_percentage && analysis.severity_percentage !== 'N/A' && ` • ${analysis.severity_percentage}`}
                                </span>
                            )}
                            {analysis.causal_agent && analysis.causal_agent !== 'Unknown' && analysis.causal_agent !== 'Healthy' && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    {analysis.causal_agent}
                                </span>
                            )}
                            {analysis.spread_risk && analysis.spread_risk !== 'Unknown' && (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${analysis.spread_risk === 'High' ? 'bg-red-100 text-red-600' : analysis.spread_risk === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                    Spread: {analysis.spread_risk}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Overall Assessment */}
                    <div className={`mb-5 rounded-2xl p-4 border ${isError ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30' : 'bg-gray-50 dark:bg-gray-800/80 border-gray-100 dark:border-gray-700'}`}>
                        <p className={`text-[13px] leading-relaxed text-left ${isError ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                            {analysis.overall_assessment || 'Analysis complete.'}
                        </p>
                        {!isError && analysis.yield_impact && !isHealthy && (
                            <p className="text-[12px] text-red-600 dark:text-red-400 font-medium mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <strong>Yield Impact Alert:</strong> {analysis.yield_impact}
                            </p>
                        )}
                    </div>

                    {/* Symptoms */}
                    {!isError && scanResult?.indicators?.length > 0 && (
                        <div className="mb-5 pl-1">
                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">visibility</span> Symptoms Observed</h3>
                            <div className="space-y-2">
                                {scanResult.indicators.map((symptom, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[13px] text-red-400 mt-0.5 shrink-0">emergency</span>
                                        <span className="text-[13px] text-gray-600 dark:text-gray-300 leading-snug">{symptom}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Environment Context */}
                    {!isError && !isHealthy && analysis.environmental_context && (
                        <div className="mb-5 pl-1">
                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[15px]">device_thermostat</span>
                                Environmental Triggers
                            </h3>
                            <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed text-left bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                {analysis.environmental_context}
                            </p>
                        </div>
                    )}

                    {/* 3-Tier IPM Action Plan */}
                    {!isError && !isHealthy && (analysis.ipm_immediate || analysis.ipm_organic || analysis.ipm_chemical) && (
                        <div className="mb-6 space-y-3">
                            <h3 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-1.5 pl-1">
                                <span className="material-symbols-outlined text-[16px] text-primary">healing</span>
                                Clinical Action Plan
                            </h3>

                            {/* Tier 1 */}
                            {analysis.ipm_immediate && (
                                <div className="bg-red-50/80 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl rounded-l-none p-3.5 shadow-sm">
                                    <h4 className="text-[11px] font-extrabold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1.5 flex items-center"><span className="material-symbols-outlined text-[14px] mr-1">timer</span> Immediate Action</h4>
                                    <p className="text-[13px] text-red-900/80 dark:text-red-200 leading-snug">{analysis.ipm_immediate}</p>
                                </div>
                            )}

                            {/* Tier 2 */}
                            {analysis.ipm_organic && (
                                <div className="bg-green-50/80 dark:bg-green-900/20 border-l-4 border-green-500 rounded-xl rounded-l-none p-3.5 shadow-sm">
                                    <h4 className="text-[11px] font-extrabold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1.5 flex items-center"><span className="material-symbols-outlined text-[14px] mr-1">compost</span> Organic Treatment</h4>
                                    <p className="text-[13px] text-green-900/80 dark:text-green-200 leading-snug">{analysis.ipm_organic}</p>
                                </div>
                            )}

                            {/* Tier 3 */}
                            {analysis.ipm_chemical && analysis.ipm_chemical.active_ingredient && (
                                <div className="bg-orange-50/80 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-xl rounded-l-none p-3.5 shadow-sm">
                                    <h4 className="text-[11px] font-extrabold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-2 flex items-center"><span className="material-symbols-outlined text-[14px] mr-1">science</span> Chemical Intervention</h4>
                                    <div className="grid grid-cols-2 gap-3 text-[12px] text-orange-900/80 dark:text-orange-200">
                                        <div className="bg-orange-100/50 dark:bg-orange-800/30 p-2 rounded-lg"><span className="block font-bold text-orange-800 dark:text-orange-300 mb-0.5">Active Ingredient</span>{analysis.ipm_chemical.active_ingredient}</div>
                                        <div className="bg-orange-100/50 dark:bg-orange-800/30 p-2 rounded-lg"><span className="block font-bold text-orange-800 dark:text-orange-300 mb-0.5">Concentration</span>{analysis.ipm_chemical.concentration || 'Standard'}</div>
                                        <div className="col-span-2"><span className="font-bold text-orange-800 dark:text-orange-300">Dosage:</span> {analysis.ipm_chemical.dosage}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3 mt-4">
                        {!isError && (
                            <button
                                onClick={onViewTreatment}
                                className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-black text-white dark:text-slate-900 font-bold py-3.5 px-6 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <span className="material-icons text-[20px]">psychology</span>
                                <span>Discuss with Farm Advisor</span>
                            </button>
                        )}
                        <button
                            onClick={onBack}
                            className={`w-full font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isError ? 'bg-slate-900 text-white' : 'bg-primary hover:bg-[#10d463] text-black shadow-primary/30'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{isError ? 'refresh' : 'add_a_photo'}</span>
                            <span>{isError ? 'Try Scanning Again' : 'Scan Another Leaf'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CropAnalysisResults;
