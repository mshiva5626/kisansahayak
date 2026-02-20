import React, { useEffect, useState } from 'react';

const AICopilotProcessingState = ({ onCancel, onComplete }) => {
    const [statusIndex, setStatusIndex] = useState(0);
    const statuses = [
        "Analyzing farm context...",
        "Checking weather conditions...",
        "Preparing execution plan..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % statuses.length);
        }, 3000);

        // Simulate completion after 9 seconds
        const timeout = setTimeout(() => {
            if (onComplete) onComplete();
        }, 9000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [onComplete]);

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300 selection:bg-primary selection:text-white">
            {/* Background Ambient Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl dark:bg-primary/10"></div>
                <div className="absolute -bottom-[10%] -left-[10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl dark:bg-primary/10"></div>
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(rgba(19,236,109,0.1)_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                {/* Subtle Leaf Contour (SVG Illustration) */}
                <svg className="absolute top-1/4 left-[-50px] w-64 h-64 text-primary/5 rotate-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22l1-2.3A4.49,4.49 0 0,0 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"></path>
                </svg>
            </div>

            {/* Main Mobile Container */}
            <div className="relative w-full max-w-md h-screen max-h-[900px] flex flex-col items-center justify-between p-8 z-10">
                <div className="w-full h-8"></div>

                {/* Central Processing Unit */}
                <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                    <div className="relative w-48 h-48 flex items-center justify-center mb-12">
                        {/* Ripples */}
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping-slow"></div>
                        <div className="absolute inset-4 rounded-full bg-primary/10 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_1.5s_infinite]"></div>

                        {/* Rotating Ring */}
                        <div className="absolute inset-[-10px] rounded-full border border-primary/20 border-t-primary/60 animate-spin-slow"></div>

                        {/* Core Orb */}
                        <div className="relative w-24 h-24 bg-gradient-to-tr from-primary to-[#86efac] rounded-full shadow-[0_0_40px_rgba(19,236,109,0.4)] animate-pulse-slow flex items-center justify-center z-10 overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 blur-sm scale-75 rounded-full"></div>
                            <span className="material-icons-round text-white text-4xl opacity-95">auto_awesome</span>
                        </div>
                    </div>

                    {/* Status Text Area */}
                    <div className="h-28 flex flex-col items-center justify-start text-center space-y-4">
                        <div className="relative h-8 w-full flex justify-center overflow-hidden">
                            {statuses.map((text, i) => (
                                <h2
                                    key={i}
                                    className={`absolute inset-0 text-xl md:text-2xl font-semibold text-slate-800 dark:text-white tracking-tight transition-all duration-700 transform ${i === statusIndex ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                                        }`}
                                >
                                    {text}
                                </h2>
                            ))}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">
                            This may take a few seconds
                        </p>
                    </div>

                    {/* Context Tags (Decorative bouncing dots) */}
                    <div className="absolute bottom-16 flex gap-2 opacity-30">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"></div>
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                </div>

                {/* Footer / Action Area */}
                <div className="w-full pb-12">
                    <button
                        onClick={onCancel}
                        className="w-full py-4 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-[0.98] outline-none"
                    >
                        Cancel Generation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AICopilotProcessingState;
