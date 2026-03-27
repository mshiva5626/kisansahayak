import React from 'react';

const CropAnalysisResults = ({ onBack, onViewTreatment, scanResult }) => {
    const analysis = scanResult?.analysis || {};
    const isHealthy = analysis.severity === 'Healthy' || analysis.causal_agent === 'Healthy' ||
        (scanResult?.indicators?.length === 0 && !analysis.overall_assessment?.toLowerCase().includes('disease'));

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
            <header className="absolute top-0 left-0 w-full z-20 px-4 pt-12 pb-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                >
                    <span className="material-icons text-xl">arrow_back_ios_new</span>
                </button>
                <h1 className="text-white text-lg font-semibold tracking-wide drop-shadow-md">{scanResult?.crop || 'Crop'} Analysis</h1>
                <div className="w-10"></div>
            </header>

            {/* Main Content Area: Image + Markers */}
            <main className="flex-grow relative h-full">
                {/* Scanned Image */}
                <div className="absolute inset-0 w-full h-[45%] bg-gray-200">
                    <img
                        alt="Scanned Crop"
                        className="w-full h-full object-cover"
                        src={scanResult?.image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuDZ793hAvSv1pjZAR504l1YZU042Rn44ee3WG1gvPOCRfX_9DJ9Ls0rJglI1fItvxJ4xBvBw6X_rJLHJSREsKc2MKQHQlTOJ1pwIjpxsf5kmzw05weAJrO9WKKGMQ62a_CSQD8ZxAqnZJ2QTbuNJkWbtHVX92VmkhMiGLwtoo-9dkA5JZ9bxGTBIqOKK7LwgEhrRWbYl2rWXxRutcAOLfOyEvIQ_84uODJaZAXUZwfnuViOkyjMyLcLHrIrwhkGNZ6a0ri6S51H0qmd"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-background-dark via-transparent to-transparent"></div>
                </div>

                {/* Pinpoint Marker */}
                {!isHealthy && (
                    <div className="absolute top-[30%] left-[50%] z-10">
                        <div className="relative w-8 h-8">
                            <div className="absolute inset-0 rounded-full bg-red-500 border-2 border-white shadow-lg animate-ping opacity-75"></div>
                            <div className="relative w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                        </div>
                    </div>
                )}
                {isHealthy && (
                    <div className="absolute top-[30%] left-[50%] z-10">
                        <div className="relative w-8 h-8">
                            <div className="absolute inset-0 rounded-full bg-primary border-2 border-white shadow-lg animate-ping opacity-75"></div>
                            <div className="relative w-8 h-8 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Sheet */}
            <div className="absolute bottom-0 left-0 w-full z-20 p-4 pb-8" style={{ maxHeight: '68%' }}>
                <div className="bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl p-5 shadow-2xl overflow-y-auto max-h-full">
                    <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4 opacity-50 shrink-0"></div>

                    {/* Disease Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="text-left flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-green-800 dark:text-green-100 border border-primary/30">
                                    <span className="w-1 h-1 rounded-full bg-primary mr-1"></span>
                                    AI Confirmed
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{Math.round((scanResult?.confidence || 0) * 100)}% Confidence</span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mt-1">
                                {analysis.disease_name || analysis.overall_assessment || 'Diagnostic Complete'}
                            </h2>
                            {analysis.scientific_name && (
                                <p className="text-[11px] text-gray-400 italic mt-0.5">{analysis.scientific_name}</p>
                            )}
                        </div>
                        <div className={`h-11 w-11 rounded-2xl ${isHealthy ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'} flex items-center justify-center shrink-0 ml-3`}>
                            <span className="material-icons text-2xl font-bold">{isHealthy ? 'verified' : 'warning'}</span>
                        </div>
                    </div>

                    {/* Severity + Causal Agent Badges */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
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

                    {/* Overall Assessment */}
                    <div className="mb-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                        <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed text-left">
                            {analysis.overall_assessment || 'Analysis complete.'}
                        </p>
                        {analysis.yield_impact && !isHealthy && (
                            <p className="text-[12px] text-red-600 dark:text-red-400 font-medium mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <strong>Yield Impact:</strong> {analysis.yield_impact}
                            </p>
                        )}
                    </div>

                    {/* Symptoms */}
                    {scanResult?.indicators?.length > 0 && (
                        <div className="mb-5">
                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Symptoms Observed</h3>
                            <div className="space-y-1.5">
                                {scanResult.indicators.map((symptom, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[14px] text-red-400 mt-0.5 shrink-0">radio_button_checked</span>
                                        <span className="text-[13px] text-gray-600 dark:text-gray-300 leading-snug">{symptom}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Look-alikes */}
                    {!isHealthy && analysis.similar_diseases?.length > 0 && typeof analysis.similar_diseases[0] === 'object' && (
                        <div className="mb-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
                            <h3 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">find_replace</span>
                                Look-alike Diseases Ruled Out
                            </h3>
                            <div className="space-y-2">
                                {analysis.similar_diseases.map((sim, idx) => (
                                    <div key={idx} className="text-[12px] text-gray-600 dark:text-gray-400">
                                        <strong className="text-gray-800 dark:text-gray-200">{sim.name}</strong>
                                        <span className="text-gray-400 italic font-normal text-[11px]"> ({sim.scientific_name})</span>
                                        <p className="mt-0.5 leading-snug text-blue-800/70 dark:text-blue-300/60">— {sim.why_ruled_out}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Environment Context */}
                    {!isHealthy && analysis.environmental_context && (
                        <div className="mb-5">
                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">thermometer</span>
                                Environmental Triggers
                            </h3>
                            <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed text-left bg-gray-50 dark:bg-gray-800/30 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                                {analysis.environmental_context}
                            </p>
                        </div>
                    )}

                    {/* 3-Tier IPM Action Plan */}
                    {!isHealthy && (analysis.ipm_immediate || analysis.ipm_organic || analysis.ipm_chemical) && (
                        <div className="mb-5 space-y-3">
                            <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px]">medical_services</span>
                                Integrated Pest Management (IPM) Plan
                            </h3>

                            {/* Tier 1: Immediate */}
                            {analysis.ipm_immediate && (
                                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl p-3">
                                    <h4 className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Tier 1: Immediate Action</h4>
                                    <p className="text-[13px] text-red-800 dark:text-red-200 leading-snug">{analysis.ipm_immediate}</p>
                                </div>
                            )}

                            {/* Tier 2: Organic */}
                            {analysis.ipm_organic && (
                                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-xl p-3">
                                    <h4 className="text-[11px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1">Tier 2: Organic/Biological</h4>
                                    <p className="text-[13px] text-green-800 dark:text-green-200 leading-snug">{analysis.ipm_organic}</p>
                                </div>
                            )}

                            {/* Tier 3: Chemical */}
                            {analysis.ipm_chemical && analysis.ipm_chemical.active_ingredient && (
                                <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-r-xl p-3">
                                    <h4 className="text-[11px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-2">Tier 3: Chemical (Last Resort)</h4>
                                    <div className="grid grid-cols-2 gap-2 text-[12px] text-orange-900 dark:text-orange-200">
                                        <div><span className="font-semibold text-orange-800 dark:text-orange-300">Active Ingredient:</span> <br />{analysis.ipm_chemical.active_ingredient}</div>
                                        <div><span className="font-semibold text-orange-800 dark:text-orange-300">Concentration:</span> <br />{analysis.ipm_chemical.concentration || 'N/A'}</div>
                                        <div className="col-span-2 mt-1"><span className="font-semibold text-orange-800 dark:text-orange-300">Dosage:</span> {analysis.ipm_chemical.dosage}</div>
                                        <div className="col-span-2"><span className="font-semibold text-orange-800 dark:text-orange-300">Method & Frequency:</span> {analysis.ipm_chemical.application_method}, {analysis.ipm_chemical.frequency}</div>
                                        {analysis.ipm_chemical.phi_days && <div className="col-span-2"><span className="font-semibold text-orange-800 dark:text-orange-300">Pre-Harvest Interval:</span> {analysis.ipm_chemical.phi_days}</div>}
                                        {analysis.ipm_chemical.precaution && <div className="col-span-2 mt-1 pt-2 border-t border-orange-200/50 dark:border-orange-800/50 text-[11px] text-red-600 dark:text-red-400 font-medium">⚠️ {analysis.ipm_chemical.precaution}</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3 mt-6">
                        <button
                            onClick={onViewTreatment}
                            className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-black text-white dark:text-slate-900 font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <span className="material-icons text-lg">psychology</span>
                            <span>Discuss with AI Farm Advisor</span>
                        </button>
                        <button
                            onClick={onBack}
                            className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center"
                        >
                            <span>Scan Another Leaf</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CropAnalysisResults;
