import React from 'react';

const FarmCreatedSuccess = ({ onGoToDashboard, onAddAnother }) => {
    return (
        <div className="bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] font-display h-screen w-full overflow-hidden flex flex-col items-center justify-between relative selection:bg-emerald-500 selection:text-white">
            {/* Ambient glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-6 z-10 pt-20 pb-10">
                {/* Animated Success Visual */}
                <div className="relative flex items-center justify-center mb-10">
                    {/* Ripple Effect Rings */}
                    <div className="absolute w-24 h-24 bg-emerald-500/20 rounded-full animate-ripple"></div>
                    <div className="absolute w-24 h-24 bg-emerald-500/10 rounded-full animate-ripple [animation-delay:1s]"></div>
                    {/* Core Circle */}
                    <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] z-10">
                        <span className="material-icons text-white text-4xl">check</span>
                    </div>
                </div>

                {/* Typography Block */}
                <div className="text-center space-y-2.5 animate-fade-in-up">
                    <h1 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight leading-tight">
                        Farm Created<br />Successfully!
                    </h1>
                    <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed max-w-[240px] mx-auto">
                        Your connected agricultural grid is active. AI Copilot is now parsing crop charts.
                    </p>
                </div>

                {/* AI Insight Card Preview */}
                <div className="mt-8 w-full krishi-glass rounded-2xl p-4 shadow-md opacity-0 animate-fade-in-up [animation-delay:0.3s] [animation-fill-mode:forwards]">
                    <div className="flex items-center space-x-2.5 mb-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <span className="material-icons text-sm">auto_awesome</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-emerald-400 uppercase tracking-widest">AI Advisory Copilot</span>
                    </div>
                    <div className="space-y-2">
                        <div className="h-2 w-3/4 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse"></div>
                        <div className="h-2 w-1/2 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse [animation-delay:75ms]"></div>
                    </div>
                </div>
            </div>

            {/* Bottom Action Area */}
            <div className="w-full max-w-md px-6 pb-12 z-20 space-y-3 shrink-0">
                {/* Primary Button */}
                <button
                    onClick={onGoToDashboard}
                    className="w-full btn-glass-glow text-white font-bold py-4 px-6 rounded-xl shadow-lg active:scale-[0.98] flex items-center justify-center space-x-1.5 group tactile-btn cursor-pointer"
                >
                    <span className="text-sm">Go to Dashboard</span>
                    <span className="material-icons text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
                {/* Secondary Button */}
                <button
                    onClick={onAddAnother}
                    className="w-full bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center text-sm cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 active:scale-[0.98] tactile-btn"
                >
                    <span className="material-icons text-lg mr-2 text-slate-400">add</span>
                    <span>Add Another Farm</span>
                </button>
            </div>

            <style>{`
                @keyframes ripple {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(2.4); opacity: 0; }
                }
                .animate-ripple { animation: ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite; }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
            `}</style>
        </div>
    );
};

export default FarmCreatedSuccess;
