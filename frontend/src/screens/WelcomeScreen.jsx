import React from 'react';

const WelcomeScreen = ({ onGetStarted, onLogin }) => {
    return (
        <div className="mx-auto max-w-md h-screen relative flex flex-col justify-between bg-oyster shadow-2xl overflow-hidden">
            {/* Background Image with Fade */}
            <div className="absolute inset-0 z-0 h-3/4 w-full">
                <img
                    alt="Close up of green wheat field texture"
                    className="w-full h-full object-cover opacity-80 dark:opacity-40"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkHDtTJ2fIFiFySwW9G1peF15PBuD4SId7THOWcevZCWvHNVn1GYtdGzVhY1cKrPC3QnLRG8WIUPE4LXcI0hMGPQqzBGMtNLqZKvZv1-cbZkPizxQCrdlvl5Ov0qr84br7Z5MBuyLhSe0uttXowb7Z9SQpj2u57Uqmeh9BbBznFRLWpBHW8sDHB4kd1oi41T5Z3r3QKqG2zA7fwdF8j5SCG1KFbtAurmI8h4vri8bglf8h5QfEDWR-1ofTHzPd9fQ4TVytqaQdyUkp"
                />
                {/* Gradient Overlay to fade image into background color */}
                <div className="absolute inset-0 agri-overlay z-10"></div>
            </div>

            {/* Top Navigation / Language Selector */}
            <div className="relative z-20 px-6 pt-12 flex justify-end w-full">
                <button className="flex items-center space-x-1 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/20 shadow-sm transition active:scale-95">
                    <span className="material-icons text-primary text-sm">language</span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">English</span>
                    <span className="material-icons text-gray-400 text-xs">expand_more</span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="relative z-20 flex flex-col items-center justify-end h-full px-8 pb-10 w-full">
                {/* Logo & Branding */}
                <div className="flex flex-col items-center mb-12 text-center w-full animate-fade-in-up">
                    <div className="mb-6 p-4 bg-white dark:bg-background-dark rounded-2xl shadow-lg shadow-primary/10 border border-primary/10">
                        <div className="w-12 h-12 flex items-center justify-center text-primary">
                            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,8,17,8,17,8Z"></path>
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                        Kisan Sahayak
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                        Cultivating Success
                    </p>
                    <p className="mt-4 text-sm text-gray-400 dark:text-gray-500 max-w-[240px] leading-relaxed">
                        Smart farming tools for a better, sustainable future.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="w-full space-y-4 mb-8 animate-fade-in-up delay-100">
                    <button
                        onClick={onGetStarted}
                        className="w-full bg-primary hover:bg-[#0fd662] text-white dark:text-background-dark font-semibold py-4 px-6 rounded-xl shadow-lg shadow-primary/25 transition-all transform active:scale-[0.98] flex items-center justify-center group"
                    >
                        <span>Get Started</span>
                        <span className="material-icons ml-2 text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                    <button
                        onClick={onLogin}
                        className="w-full bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-700 dark:text-gray-200 font-medium py-4 px-6 rounded-xl transition-all transform active:scale-[0.98] active:bg-gray-50 dark:active:bg-gray-800"
                    >
                        Log In
                    </button>
                </div>

                {/* Footer Links */}
                <div className="text-center">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        By continuing, you agree to our
                        <a className="underline hover:text-primary transition-colors ml-1" href="#">Terms of Service</a>
                        and
                        <a className="underline hover:text-primary transition-colors ml-1" href="#">Privacy Policy</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
