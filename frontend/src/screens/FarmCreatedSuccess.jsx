import React from 'react';

const FarmCreatedSuccess = ({ onGoToDashboard, onAddAnother }) => {
    return (
        <div className="bg-background-light dark:bg-background-dark font-display h-screen w-full overflow-hidden flex flex-col items-center justify-between relative selection:bg-primary selection:text-black">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FBFBF9] via-[#F4F8F4] to-[#E8F5E9] dark:from-background-dark dark:to-[#0a1a0a] -z-10"></div>

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-6 z-10 pt-20 pb-10">
                {/* Animated Success Visual */}
                <div className="relative flex items-center justify-center mb-10">
                    {/* Ripple Effect Rings */}
                    <div className="absolute w-24 h-24 bg-primary/20 rounded-full animate-ripple"></div>
                    <div className="absolute w-24 h-24 bg-primary/10 rounded-full animate-ripple [animation-delay:1s]"></div>
                    {/* Core Circle */}
                    <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-[#0ea80e] rounded-full flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(19,236,19,0.5)] z-10">
                        <span className="material-icons text-white text-5xl">check</span>
                    </div>
                </div>

                {/* Typography Block */}
                <div className="text-center space-y-3 animate-fade-in-up">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Farm Created<br />Successfully!
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-300 text-lg leading-relaxed max-w-[280px] mx-auto">
                        Your AI Copilot is now analyzing your farm for insights.
                    </p>
                </div>

                {/* AI Insight Card Preview */}
                <div className="mt-10 w-full bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800/50 opacity-0 animate-fade-in-up [animation-delay:0.3s] [animation-fill-mode:forwards]">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="material-icons text-blue-500 text-sm">auto_awesome</span>
                        </div>
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">AI Copilot</span>
                    </div>
                    <div className="space-y-2">
                        <div className="h-2 w-3/4 bg-neutral-100 dark:bg-neutral-700 rounded-full animate-pulse"></div>
                        <div className="h-2 w-1/2 bg-neutral-100 dark:bg-neutral-700 rounded-full animate-pulse [animation-delay:75ms]"></div>
                    </div>
                </div>
            </div>

            {/* Bottom Action Area */}
            <div className="w-full max-w-md px-6 pb-10 z-20 space-y-4">
                {/* Primary Button */}
                <button
                    onClick={onGoToDashboard}
                    className="w-full bg-primary hover:bg-[#11d411] text-neutral-900 font-bold py-4 px-6 rounded-lg shadow-lg shadow-primary/20 transform transition active:scale-[0.98] flex items-center justify-center space-x-2 group"
                >
                    <span>Go to Dashboard</span>
                    <span className="material-icons text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
                {/* Secondary Button */}
                <button
                    onClick={onAddAnother}
                    className="w-full bg-transparent hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-300 font-semibold py-4 px-6 rounded-lg border-2 border-transparent hover:border-neutral-200 dark:hover:border-white/10 transition flex items-center justify-center"
                >
                    <span className="material-icons text-lg mr-2 text-neutral-400">add</span>
                    <span>Add Another Farm</span>
                </button>
            </div>

            {/* Subtle Texture Overlay */}
            <div className="absolute top-0 right-0 p-10 opacity-20 pointer-events-none">
                <svg fill="none" height="100" viewbox="0 0 100 100" width="100" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0ZM50 90C27.9086 90 10 72.0914 10 50C10 27.9086 27.9086 10 50 10C72.0914 10 90 27.9086 90 50C90 72.0914 72.0914 90 50 90Z" fill="#13ec13"></path>
                    <path d="M50 20C33.4315 20 20 33.4315 20 50C20 66.5685 33.4315 80 50 80C66.5685 80 80 66.5685 80 50C80 33.4315 66.5685 20 50 20ZM50 70C38.9543 70 30 61.0457 30 50C30 38.9543 38.9543 30 50 30C61.0457 30 70 38.9543 70 50C70 61.0457 61.0457 70 50 70Z" fill="#13ec13" fill-opacity="0.5"></path>
                </svg>
            </div>

            <style>{`
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .animate-ripple { animation: ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
      `}</style>
        </div>
    );
};

export default FarmCreatedSuccess;
