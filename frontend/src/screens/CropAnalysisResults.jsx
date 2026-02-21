import React from 'react';

const CropAnalysisResults = ({ onBack, onViewTreatment, scanResult }) => {
    const isHealthy = scanResult?.indicators?.length === 0 && !scanResult?.analysis?.overall_assessment?.toLowerCase().includes('disease');

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
                <div className="absolute inset-0 w-full h-full bg-gray-200">
                    <img
                        alt="Scanned Crop"
                        className="w-full h-full object-cover"
                        src={scanResult?.image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuDZ793hAvSv1pjZAR504l1YZU042Rn44ee3WG1gvPOCRfX_9DJ9Ls0rJglI1fItvxJ4xBvBw6X_rJLHJSREsKc2MKQHQlTOJ1pwIjpxsf5kmzw05weAJrO9WKKGMQ62a_CSQD8ZxAqnZJ2QTbuNJkWbtHVX92VmkhMiGLwtoo-9dkA5JZ9bxGTBIqOKK7LwgEhrRWbYl2rWXxRutcAOLfOyEvIQ_84uODJaZAXUZwfnuViOkyjMyLcLHrIrwhkGNZ6a0ri6S51H0qmd"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent opacity-60"></div>
                </div>

                {/* Pinpoint Markers */}
                <div className="absolute top-[40%] left-[50%] z-10">
                    <div className="relative w-8 h-8">
                        <div className="absolute inset-0 rounded-full bg-primary border-2 border-white shadow-lg animate-ping opacity-75"></div>
                        <div className="relative w-8 h-8 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Sheet */}
            <div className="absolute bottom-0 left-0 w-full z-20 p-4 pb-8">
                <div className="bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
                    <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6 opacity-50 shrink-0"></div>

                    {/* Diagnosis Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="text-left">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-green-800 dark:text-green-100 border border-primary/30">
                                    <span className="w-1 h-1 rounded-full bg-primary mr-1"></span>
                                    AI Confirmed
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{Math.round((scanResult?.confidence || 0.92) * 100)}% Confidence</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mt-1">{scanResult?.analysis?.overall_assessment || scanResult?.analysis?.raw_analysis || 'Diagnostic Complete'}</h2>
                            <p className="text-xs text-gray-400 font-medium italic mt-2">Detected: {scanResult?.indicators?.length > 0 ? scanResult.indicators.join(', ') : 'No primary stress indicators'}</p>
                        </div>
                        <div className={`h-12 w-12 rounded-2xl ${isHealthy ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'} flex items-center justify-center shrink-0 ml-3`}>
                            <span className="material-icons text-2xl font-bold">{isHealthy ? 'verified' : 'warning'}</span>
                        </div>
                    </div>

                    {/* Brief Description */}
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-left">
                            <strong>Color & Texture:</strong> {scanResult?.analysis?.color_patterns} {scanResult?.analysis?.texture_analysis}
                        </p>
                        <p className="text-sm pt-3 font-semibold text-primary leading-relaxed text-left">
                            {scanResult?.analysis?.recommendations?.join(' ') || scanResult?.analysis?.raw_analysis || 'Please wait while AI generates treatment advice...'}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={onViewTreatment}
                            className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-black text-white dark:text-slate-900 font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <span className="material-icons text-lg">psychology</span>
                            <span>Ask AI for Treatment Plan</span>
                        </button>
                        <button
                            onClick={onBack}
                            className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center"
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
