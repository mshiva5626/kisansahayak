import React, { useState } from 'react';
import { authAPI } from '../api';

const LoginRegistration = ({ onLogin, onRegister, onBack }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Password Reset State
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1 = request email, 2 = enter otp/new pass
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [resetNewPassword, setResetNewPassword] = useState('');
    const [resetStatus, setResetStatus] = useState('');

    const handleRequestReset = async () => {
        if (!resetEmail) return setResetStatus('Enter your email address');
        setResetStatus('Sending OTP...');
        try {
            await authAPI.requestPasswordReset(resetEmail);
            setResetStatus('');
            setResetStep(2);
        } catch (err) {
            setResetStatus(err.response?.data?.message || 'Failed to send OTP');
        }
    };

    const handleVerifyReset = async () => {
        if (!resetOtp || resetNewPassword.length < 6) return setResetStatus('Valid OTP and 6+ char password required');
        setResetStatus('Verifying...');
        try {
            await authAPI.verifyPasswordReset(resetEmail, resetOtp, resetNewPassword);
            alert('Password reset successfully! Please login with your new password.');
            setShowResetModal(false);
            setResetStep(1);
            setResetEmail('');
            setResetOtp('');
            setResetNewPassword('');
            setResetStatus('');
        } catch (err) {
            setResetStatus(err.response?.data?.message || 'Failed to reset password');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return alert('Please fill in all fields');
        if (!isLogin && !name) return alert('Please enter your name');
        if (password.length < 6) return alert('Password must be at least 6 characters');

        setIsLoading(true);
        try {
            if (isLogin) {
                await onLogin(email, password);
            } else {
                await onRegister(email, password, name);
            }
        } catch (err) {
            // Error handled in parent
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display antialiased min-h-full flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100 relative w-full">
            {/* Conditional Header based on isLogin */}
            {isLogin ? (
                <header className="relative pt-24 pb-20 px-6 flex flex-col items-center justify-center rounded-b-[2.5rem] shadow-lg z-20 shrink-0 overflow-hidden min-h-[320px]">
                    <div className="absolute inset-0 z-0">
                        <img alt="Golden wheat field sunset" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl9s9050b-jlOfCaRfnfIzJZqr8Fpc57EBR92FlTqV7Gnk1nTjlV-cCf01-MPaunVG7ef8WyTCCWJzLtBoP3gNPkDPaJets5eeme5ve4E71jj1UZ_NTasKwuwBkWwhnf--0J0ePVGWI0-05C-A1Lm8Yuj3xvdVcCvbyH4v2uqT84Rp7BPEenmJV_Jcbd0Yr8nGfr1yTmZw2x1jzo3C75FRpScNtrubONiDpq-atZG3lDch6b7cL7-BLxeFXVztXiKASNxuhNKX7TfG" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30"></div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 w-full relative z-10 mt-auto mb-4">
                        <div className="text-center flex flex-col items-center drop-shadow-lg">
                            <h1 className="text-[36px] font-extrabold tracking-tight leading-none text-white uppercase drop-shadow-md font-display">
                                KISAN SAHAYAK
                            </h1>
                            <p className="text-white text-xl font-bold mt-1 tracking-wide drop-shadow-md">किसान सहायक</p>
                        </div>
                    </div>
                </header>
            ) : (
                <header className="w-full h-72 pb-16 px-6 flex flex-col items-center justify-center relative header-curve shadow-lg z-10 overflow-hidden shrink-0">
                    <div className="absolute inset-0 z-0">
                        <img alt="Wheat field sunset background" className="w-full h-full object-cover opacity-90 brightness-75" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLx6mQT-tjf3diBnz-t1x-zbd6s7_-QxNN2hKefHDO1xIPb4hJlyEfhSs9orJsjFQLT4toWc9-tEiurOPhsiqqSQFj7N2ykbiCyuwJlB44oHLO93zM927yOQssThRwDbvdasCczG1rWcvZEgHvQz7wEwMaDj-bXbu07RiuA0BaVGcNkPp4eCB7tT9nhjYuHVsGGPdESZlDt4hGjjgz07O8fzSiTTVjk1FLKrDBVAmE4ISGLH-1g65BdOTjt7wxmf-UlPZmriA1hWRW" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center mt-6">
                        <h1 className="text-white text-4xl font-extrabold tracking-tight mb-2 flex flex-col items-center leading-tight drop-shadow-md">
                            KISAN SAHAYAK
                        </h1>
                        <p className="text-white/90 text-2xl font-bold mt-1 tracking-wide drop-shadow-md">किसान सहायक</p>
                    </div>
                </header>
            )}

            <main className={`flex-1 relative flex flex-col w-full max-w-md mx-auto z-10 ${isLogin ? '-mt-8' : '-mt-12'}`}>
                {isLogin && (
                    <div className="absolute inset-0 z-0 opacity-[0.06] bg-farmer-pattern bg-cover bg-center pointer-events-none grayscale" data-alt="Indian farmer working in a field"></div>
                )}
                <div className={`flex-1 overflow-y-auto no-scrollbar relative z-10 px-6 ${isLogin ? 'pb-4' : 'pb-8'}`}>
                    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-100 dark:border-slate-700 ${isLogin ? 'mb-6' : ''}`}>

                        <div className="mb-8 pt-2 text-center sm:text-left">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {isLogin ? 'Please login to access your dashboard' : 'Please fill in the details below to register.'}
                            </p>
                        </div>

                        <form className={isLogin ? "space-y-6" : "flex flex-col gap-5"} onSubmit={handleSubmit}>
                            {!isLogin && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ml-1" htmlFor="fullname">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">person</span>
                                        </div>
                                        <input
                                            className="block w-full pl-11 pr-4 py-3.5 bg-background-light dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm focus:outline-none"
                                            id="fullname"
                                            placeholder="ex. Rajesh Kumar"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className={isLogin ? "text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1" : "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ml-1"}>
                                    {isLogin ? 'Mobile Number or Email' : 'Email Address'}
                                </label>
                                <div className={isLogin ? "relative flex items-center group" : "relative group"}>
                                    {isLogin ? (
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-brand-green transition-colors duration-200">person</span>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
                                        </div>
                                    )}
                                    <input
                                        className={isLogin ? "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg py-3.5 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all duration-200" : "block w-full pl-11 pr-4 py-3.5 bg-background-light dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm focus:outline-none"}
                                        placeholder={isLogin ? "e.g. 9876543210" : "ex. rajesh@kisan.com"}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className={isLogin ? "text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1" : "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ml-1"}>
                                    {isLogin ? 'Password' : 'Create Password'}
                                </label>
                                <div className={isLogin ? "relative flex items-center group" : "relative group"}>
                                    {isLogin ? (
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-brand-green transition-colors duration-200">lock</span>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
                                        </div>
                                    )}
                                    <input
                                        className={isLogin ? "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg py-3.5 pl-12 pr-12 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all duration-200" : "block w-full pl-11 pr-12 py-3.5 bg-background-light dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm focus:outline-none"}
                                        placeholder={isLogin ? "Enter your password" : "••••••••"}
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button className={isLogin ? "absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center" : "absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"} type="button">
                                        <span className={isLogin ? "material-symbols-outlined text-[20px]" : "material-symbols-outlined text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}>{isLogin ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                                {isLogin && (
                                    <div className="flex justify-end pt-1">
                                        <button type="button" onClick={() => setShowResetModal(true)} className="text-sm font-medium text-brand-green hover:text-green-700 transition-colors">Forgot Password?</button>
                                    </div>
                                )}
                            </div>

                            {!isLogin && (
                                <div className="flex items-start gap-3 mt-1 px-1">
                                    <div className="flex items-center h-5">
                                        <input className="w-5 h-5 border-slate-300 rounded text-primary focus:ring-primary/50 dark:border-slate-600 dark:bg-slate-700" id="terms" type="checkbox" />
                                    </div>
                                    <label className="text-sm text-slate-600 dark:text-slate-300 leading-tight" htmlFor="terms">
                                        I agree to the <a className="text-primary-dark font-medium hover:underline" href="#">Terms &amp; Conditions</a> and <a className="text-primary-dark font-medium hover:underline" href="#">Privacy Policy</a>.
                                    </label>
                                </div>
                            )}

                            <button
                                className={isLogin ? "w-full glass-glow-button text-white font-bold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 mt-4 tracking-wider uppercase disabled:opacity-50" : "w-full btn-glass-glow active:scale-[0.97] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 mt-4 group disabled:opacity-50"}
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="material-icons animate-spin text-lg">sync</span>
                                ) : (
                                    <>
                                        {isLogin ? (
                                            <>
                                                <span>LOGIN</span>
                                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[22px] font-bold drop-shadow-sm">verified_user</span>
                                                <span className="tracking-wide text-lg drop-shadow-sm">Register Securely</span>
                                                <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">arrow_forward</span>
                                            </>
                                        )}
                                    </>
                                )}
                            </button>

                            {isLogin && (
                                <div className="relative py-2 mt-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase tracking-wider">
                                        <span className="px-2 bg-white dark:bg-slate-800 text-slate-400 font-semibold">Secure &amp; Encrypted</span>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    <div className={isLogin ? "p-4 text-center" : "mt-8 text-center"}>
                        {isLogin ? (
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Don't have an account?
                                <button type="button" onClick={() => setIsLogin(false)} className="font-bold text-brand-green ml-1 hover:underline">Register Here</button>
                            </p>
                        ) : (
                            <>
                                <p className="text-slate-600 dark:text-slate-400 text-base">
                                    Already have an account?
                                    <button type="button" onClick={() => setIsLogin(true)} className="text-primary-dark font-bold hover:text-primary transition-colors ml-1 inline-flex items-center gap-1 group">
                                        Login
                                        <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                                    </button>
                                </p>
                                <div className="mt-8 flex justify-center gap-4 opacity-50">
                                    <div className="h-1 w-1 rounded-full bg-slate-400"></div>
                                    <div className="h-1 w-1 rounded-full bg-slate-400"></div>
                                    <div className="h-1 w-1 rounded-full bg-slate-400"></div>
                                </div>
                            </>
                        )}
                        <div className="mt-4">
                            <button
                                onClick={onBack}
                                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                            >
                                <span className="material-icons text-base mr-1">arrow_back</span>
                                Back to Welcome
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {!isLogin && (
                <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-100 to-transparent dark:from-slate-900/50 pointer-events-none -z-10"></div>
            )}

            {/* OTP Password Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-fade-in border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => { setShowResetModal(false); setResetStep(1); setResetStatus(''); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                        >
                            <span className="material-icons">close</span>
                        </button>

                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                            <span className="material-icons text-2xl">{resetStep === 1 ? 'mark_email_read' : 'lock_reset'}</span>
                        </div>

                        <h3 className="text-xl font-bold mb-1">{resetStep === 1 ? 'Reset Password' : 'Enter OTP'}</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            {resetStep === 1
                                ? 'We will send a 6-digit OTP to your email.'
                                : `OTP sent to ${resetEmail}. Enter it below with your new password.`}
                        </p>

                        {resetStatus && (
                            <div className={`p-3 rounded-lg text-xs font-semibold mb-4 ${resetStatus.includes('Send') || resetStatus.includes('Verify') ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                {resetStatus}
                            </div>
                        )}

                        {resetStep === 1 ? (
                            <div className="space-y-4">
                                <input
                                    type="email"
                                    placeholder="Registered Email"
                                    value={resetEmail}
                                    onChange={e => setResetEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                                <button
                                    onClick={handleRequestReset}
                                    className="w-full glass-glow-button text-white font-bold py-3 rounded-xl shadow-md active:scale-[0.98] transition-all border-none"
                                >
                                    Send OTP
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1 block">6-Digit OTP</label>
                                    <input
                                        type="text"
                                        placeholder="123456"
                                        maxLength={6}
                                        value={resetOtp}
                                        onChange={e => setResetOtp(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div className="mt-3">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1 mb-1 block">New Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={resetNewPassword}
                                        onChange={e => setResetNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleVerifyReset}
                                    className="w-full glass-glow-button text-white font-bold py-3 rounded-xl shadow-md active:scale-[0.98] transition-all border-none mt-2"
                                >
                                    Confirm Reset
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginRegistration;
