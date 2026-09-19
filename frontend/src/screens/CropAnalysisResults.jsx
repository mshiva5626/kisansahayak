import React from 'react';

const CropAnalysisResults = ({ onBack, onViewTreatment, scanResult }) => {
    const analysis = scanResult?.analysis || {};
    
    // Step 1: Check whether image was recognized as a valid crop/leaf
    const isValidCrop = scanResult?.is_valid_crop_or_leaf !== false && 
                        analysis?.is_valid_crop_or_leaf !== false &&
                        !/not a crop|not a plant|non-crop/i.test(analysis?.crop || scanResult?.crop || '') &&
                        !/not a crop|not a plant/i.test(analysis?.possible_issue || scanResult?.possible_issue || '');

    const cropName = scanResult?.crop || analysis.crop || analysis.crop_identified || 'Crop Leaf';
    const possibleIssue = scanResult?.possible_issue || analysis.possible_issue || analysis.disease_name || 'Visual Symptoms Observed';
    
    // Extract observations array
    const rawObs = scanResult?.observations || analysis.observations || scanResult?.indicators || analysis.symptoms_observed;
    const observations = Array.isArray(rawObs) ? rawObs : (rawObs ? [rawObs] : []);
    
    const severity = scanResult?.severity || analysis.severity || (isValidCrop ? 'Moderate' : 'N/A');
    const confidenceVal = typeof scanResult?.confidence === 'number' 
        ? scanResult.confidence 
        : typeof analysis.confidence === 'number' 
            ? analysis.confidence 
            : (scanResult?.confidence_score || 0.78);
    const confidencePercent = Math.round(confidenceVal * 100);

    const recommendation = scanResult?.recommendation || analysis.recommendation || analysis.overall_assessment || 
        (isValidCrop ? 'Isolate affected leaves and inspect nearby plants.' : 'Please point your camera at an actual plant leaf or crop and capture a clear, well-lit photo.');
    
    const disclaimer = scanResult?.disclaimer || analysis.disclaimer || 'AI image analysis is an initial screening, not a definitive diagnosis.';

    const isError = !isValidCrop || possibleIssue === 'Analysis Unavailable';
    const isHealthy = isValidCrop && (
        severity.toLowerCase() === 'healthy' || 
        analysis.causal_agent === 'Healthy' ||
        possibleIssue.toLowerCase().includes('healthy')
    );

    const getSeverityStyle = (s) => {
        const str = (s || '').toLowerCase();
        if (str === 'healthy') return { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: 'verified', border: 'border-emerald-200' };
        if (str === 'mild') return { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'warning', border: 'border-amber-200' };
        if (str === 'moderate') return { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'error', border: 'border-orange-200' };
        if (str === 'severe') return { bg: 'bg-rose-100', text: 'text-rose-800', icon: 'dangerous', border: 'border-rose-200' };
        if (str === 'critical') return { bg: 'bg-red-100', text: 'text-red-900', icon: 'emergency', border: 'border-red-300' };
        return { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'help', border: 'border-slate-200' };
    };

    const severityStyle = getSeverityStyle(severity);

    return (
        <div className="w-full max-w-md mx-auto bg-[#f8fafc] h-full relative overflow-hidden font-display antialiased flex flex-col text-slate-800">
            {/* Header */}
            <header className="absolute top-0 left-0 w-full z-20 px-4 pt-11 pb-3 flex items-center justify-between bg-gradient-to-b from-black/60 via-black/30 to-transparent">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 transition-colors cursor-pointer"
                >
                    <span className="material-icons text-lg pl-1">arrow_back_ios</span>
                </button>
                <div className="text-center">
                    <h1 className="text-white text-base font-bold tracking-wide drop-shadow-sm">
                        {isValidCrop ? `${cropName} Diagnostic` : 'Scan Verification'}
                    </h1>
                    <span className="text-[10px] text-white/80 font-medium">Plant Pathology Screen</span>
                </div>
                <div className="w-10"></div>
            </header>

            {/* Top Area: Image Backdrop */}
            <div className="absolute top-0 left-0 w-full h-[40vh] bg-slate-900">
                <img
                    alt="Scanned Subject"
                    className="w-full h-full object-cover opacity-90"
                    src={scanResult?.image_url || "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1920&auto=format&fit=crop"}
                />
                
                {/* Visual Pinpoint Target */}
                {isValidCrop && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none mt-2">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <div className={`absolute inset-0 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'} border-[3px] border-white shadow-lg animate-ping opacity-60`}></div>
                            <div className={`relative w-8 h-8 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'} border-[3px] border-white shadow-md flex items-center justify-center`}>
                                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-xs"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>

            {/* Bottom Sheet Modal */}
            <div className="absolute bottom-0 left-0 w-full h-[68vh] px-3 pb-3 z-20 flex flex-col">
                <div className="bg-white border border-slate-200/90 rounded-[32px] shadow-2xl flex-1 flex flex-col overflow-hidden">
                    
                    {/* Pull Tab Handle */}
                    <div className="pt-3 pb-2 shrink-0 bg-white flex justify-center sticky top-0 z-30 border-b border-slate-100">
                        <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                    </div>

                    {/* Scrollable Content Container */}
                    <div className="px-5 pb-5 flex-1 overflow-y-auto overflow-x-hidden stylized-scrollbar">
                        
                        {/* NON-CROP DETECTED WARNING STATE */}
                        {!isValidCrop ? (
                            <div className="py-3 text-left">
                                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                            <span className="material-icons text-xl">no_photography</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Verification Alert</span>
                                            <h2 className="text-base font-extrabold text-rose-900 leading-tight">
                                                {possibleIssue || "Not a Plant or Leaf"}
                                            </h2>
                                        </div>
                                    </div>
                                    <p className="text-xs text-rose-800 leading-relaxed mt-2">
                                        The AI vision engine determined this image does not depict a recognizable agricultural crop, plant, or leaf.
                                    </p>
                                </div>

                                {/* Observations */}
                                {observations.length > 0 && (
                                    <div className="mb-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[15px] text-slate-600">visibility</span> Observations
                                        </h3>
                                        <ul className="space-y-1.5 text-xs text-slate-700">
                                            {observations.map((obs, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-rose-500 font-bold">•</span>
                                                    <span>{obs}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recommendation for recapture */}
                                <div className="mb-4 bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                                    <h3 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[15px]">tips_and_updates</span> Recommendation
                                    </h3>
                                    <p className="text-xs text-emerald-900 leading-relaxed">
                                        {recommendation}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* VALID CROP DETECTED & ANALYZED */
                            <div className="text-left pt-2">
                                {/* Top Badges */}
                                <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
                                            {cropName}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                            {confidencePercent}% Confidence
                                        </span>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${severityStyle.bg} ${severityStyle.text} border ${severityStyle.border}`}>
                                        <span className="material-symbols-outlined text-[12px]">{severityStyle.icon}</span>
                                        {severity}
                                    </span>
                                </div>

                                {/* Possible Issue Headline */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1">
                                        <h2 className="text-lg font-extrabold text-slate-900 leading-snug">
                                            {possibleIssue}
                                        </h2>
                                        {analysis.scientific_name && analysis.scientific_name !== 'Pending verification' && (
                                            <p className="text-[11px] text-slate-500 italic mt-0.5">{analysis.scientific_name}</p>
                                        )}
                                    </div>
                                    <div className={`h-11 w-11 rounded-2xl ${isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'} flex items-center justify-center shrink-0 border border-slate-100 shadow-xs`}>
                                        <span className="material-icons text-xl">{isHealthy ? 'verified' : 'coronavirus'}</span>
                                    </div>
                                </div>

                                {/* Observations Section */}
                                {observations.length > 0 && (
                                    <div className="mb-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                                        <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[15px] text-emerald-600">feature_search</span>
                                            Observations
                                        </h3>
                                        <ul className="space-y-1.5">
                                            {observations.map((obs, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                                                    <span className="material-symbols-outlined text-[14px] text-emerald-600 mt-0.5 shrink-0">check_circle</span>
                                                    <span>{obs}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Pathologist Recommendation */}
                                <div className="mb-3.5 bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                                    <h3 className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[15px]">psychology</span>
                                        Recommendation
                                    </h3>
                                    <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                                        {recommendation}
                                    </p>
                                </div>

                                {/* NPSS Government Registry Reference */}
                                {(analysis.npss_reference_images?.length > 0 || analysis.npss_regional_reports) && (
                                    <div className="mb-3.5 border-t border-slate-100 pt-3">
                                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[15px] text-emerald-600">verified_user</span>
                                            NPSS Registry Insights
                                        </h3>
                                        {analysis.npss_regional_reports && (
                                            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2.5 mb-2">
                                                <span className="material-symbols-outlined text-[18px] text-emerald-600">map</span>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">
                                                        {analysis.npss_regional_reports.count || 0} Reports in {analysis.npss_regional_reports.district}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-medium">Official occurrence cases registered in {analysis.npss_regional_reports.state}.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 3-Tier Clinical Treatment Plan */}
                                {!isHealthy && (analysis.ipm_immediate || analysis.ipm_organic || analysis.ipm_chemical) && (
                                    <div className="mb-3.5 space-y-2">
                                        <h3 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[15px] text-emerald-600">healing</span>
                                            Integrated Pest Management (IPM)
                                        </h3>
                                        {analysis.ipm_immediate && (
                                            <div className="bg-rose-50 border-l-4 border-rose-500 rounded-xl p-2.5">
                                                <span className="text-[10px] font-bold text-rose-700 uppercase">Immediate Action</span>
                                                <p className="text-xs text-rose-900 mt-0.5">{analysis.ipm_immediate}</p>
                                            </div>
                                        )}
                                        {analysis.ipm_organic && (
                                            <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-xl p-2.5">
                                                <span className="text-[10px] font-bold text-emerald-700 uppercase">Organic Treatment</span>
                                                <p className="text-xs text-emerald-900 mt-0.5">{analysis.ipm_organic}</p>
                                            </div>
                                        )}
                                        {analysis.ipm_chemical?.active_ingredient && (
                                            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-2.5">
                                                <span className="text-[10px] font-bold text-amber-700 uppercase">Chemical Intervention</span>
                                                <p className="text-xs text-amber-900 mt-0.5">
                                                    <strong>{analysis.ipm_chemical.active_ingredient}</strong>: {analysis.ipm_chemical.dosage}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Standard Pathology Disclaimer */}
                        <div className="mt-2 mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-left">
                            <p className="text-[10px] text-slate-500 leading-normal flex items-start gap-1.5">
                                <span className="material-symbols-outlined text-[13px] text-slate-400 shrink-0 mt-0.5">info</span>
                                <span><strong>Disclaimer:</strong> {disclaimer}</span>
                            </p>
                        </div>

                        <div className="h-2"></div>
                    </div>

                    {/* Fixed Bottom Action Buttons */}
                    <div className="shrink-0 pt-2 pb-3 px-5 bg-white border-t border-slate-100 z-30">
                        <div className="space-y-2">
                            {isValidCrop && (
                                <button
                                    onClick={onViewTreatment}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-5 rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm cursor-pointer"
                                >
                                    <span className="material-icons text-base">support_agent</span>
                                    <span>Ask AI Copilot for Treatment</span>
                                </button>
                            )}
                            <button
                                onClick={onBack}
                                className={`w-full font-bold py-2.5 px-5 rounded-2xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm cursor-pointer ${
                                    !isValidCrop 
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                }`}
                            >
                                <span className="material-symbols-outlined text-base">add_a_photo</span>
                                <span>{!isValidCrop ? 'Capture Plant Leaf' : 'Scan Another Leaf'}</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CropAnalysisResults;
