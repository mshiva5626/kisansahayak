import React, { useState } from 'react';

const OTPVerification = ({ onVerify, onBack, phoneNumber }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']); // Changed to 6 digits for standard backend
    const [activeIndex, setActiveIndex] = useState(0);

    const handleKeyClick = (key) => {
        const newOtp = [...otp];
        if (key === 'backspace' || key === 'Backspace') {
            if (newOtp[activeIndex] === '' && activeIndex > 0) {
                newOtp[activeIndex - 1] = '';
                setActiveIndex(activeIndex - 1);
            } else {
                newOtp[activeIndex] = '';
            }
        } else if (!isNaN(key) && key !== null && key !== ' ') {
            if (activeIndex < 6) {
                newOtp[activeIndex] = key.toString();
                if (activeIndex < 5) setActiveIndex(activeIndex + 1);
            }
        }
        setOtp(newOtp);
    };

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Backspace') {
                handleKeyClick('backspace');
            } else if (/^[0-9]$/.test(e.key)) {
                handleKeyClick(e.key);
            } else if (e.key === 'Enter') {
                handleVerify();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, otp]);

    const handleVerify = () => {
        const fullOtp = otp.join('');
        if (fullOtp.length < 6) return alert('Please enter full OTP');
        onVerify(fullOtp);
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 h-screen flex flex-col overflow-hidden antialiased">
            {/* Mock Status Bar */}
            <div className="w-full h-12 flex justify-between items-center px-6 pt-2 shrink-0 z-20">
                <div className="text-sm font-semibold dark:text-white">9:41</div>
                <div className="flex gap-2 text-slate-900 dark:text-white">
                    <span className="material-icons text-sm">signal_cellular_alt</span>
                    <span className="material-icons text-sm">wifi</span>
                    <span className="material-icons text-sm">battery_full</span>
                </div>
            </div>

            {/* Navigation Header */}
            <header className="px-4 py-2 flex items-center shrink-0 z-10">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                >
                    <span className="material-icons">arrow_back_ios_new</span>
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col px-6 pt-4 pb-6 relative z-0">
                {/* Hero Illustration */}
                <div className="flex justify-center mb-8 mt-2">
                    <div className="w-24 h-24 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center relative">
                        <div className="absolute w-full h-full rounded-full border border-primary/20 animate-pulse"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-background-dark shadow-sm">
                            <span className="material-icons text-sm">check</span>
                        </div>
                        <span className="material-icons text-5xl text-primary-dark dark:text-primary">lock_person</span>
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center mb-10 space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Verify Account</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed px-4">
                        We have sent a verification code to <br />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{phoneNumber || '+91 98765 43210'}</span>
                        <button className="text-primary-dark dark:text-primary ml-1 font-medium text-xs hover:underline" onClick={onBack}>Edit</button>
                    </p>
                </div>

                {/* OTP Input Group */}
                <div className="flex justify-between max-w-[340px] mx-auto w-full gap-2 mb-8">
                    {otp.map((digit, idx) => (
                        <div
                            key={idx}
                            className={`w-12 h-14 flex items-center justify-center text-2xl font-semibold bg-white dark:bg-slate-800 border-2 ${activeIndex === idx ? 'border-primary ring-4 ring-primary/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl transition-all text-slate-900 dark:text-white shadow-sm cursor-pointer`}
                            onClick={() => setActiveIndex(idx)}
                        >
                            {digit}
                        </div>
                    ))}
                </div>

                {/* Timer & Resend */}
                <div className="text-center mb-auto">
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                        Resend code in <span className="font-medium font-mono text-slate-600 dark:text-slate-300">00:24</span>
                    </p>
                </div>

                {/* Bottom Action Area */}
                <div className="mt-4">
                    <button
                        onClick={handleVerify}
                        className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all duration-200 text-background-dark font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                    >
                        <span>Verify Now</span>
                        <span className="material-icons text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>

                    <div className="flex items-center justify-center gap-1.5 mt-6 mb-2 opacity-60">
                        <span className="material-icons text-xs text-slate-400">gpp_good</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Secured by Kisan Sahayak</span>
                    </div>
                </div>
            </main>

            {/* IOS Keyboard Simulation */}
            <div className="bg-slate-100 dark:bg-[#1c1c1e] w-full shrink-0 border-t border-slate-200 dark:border-slate-700 pb-8 pt-2 select-none relative z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="flex justify-center border-b border-slate-200 dark:border-slate-600/50 pb-2 mb-2">
                    <div
                        className="bg-white dark:bg-slate-700 px-4 py-2 rounded-lg shadow-sm flex flex-col items-center cursor-pointer active:bg-slate-50 dark:active:bg-slate-600"
                        onClick={() => { setOtp(['1', '2', '3', '4', '5', '6']); setActiveIndex(5); }}
                    >
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">From Messages</span>
                        <span className="text-lg font-semibold text-slate-900 dark:text-white">123456</span>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-y-4 px-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'backspace'].map((key, idx) => (
                        <div key={idx} className="flex justify-center">
                            {key !== null && (
                                <button
                                    onClick={() => handleKeyClick(key)}
                                    className={`w-[90%] h-12 ${key === 'backspace' ? 'flex items-center justify-center' : 'bg-white dark:bg-[#2c2c2e] rounded-lg shadow-sm text-2xl font-normal'} text-black dark:text-white active:bg-slate-200 dark:active:bg-slate-500`}
                                >
                                    {key === 'backspace' ? <span className="material-icons">backspace</span> : key}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
