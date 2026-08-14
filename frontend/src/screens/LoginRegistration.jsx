import React, { useState } from 'react';
import { authAPI } from '../api';

const LoginRegistration = ({ onLogin, onRegister, onGoogleLogin, onBack }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Password Reset State
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1 = request email, 2 = enter otp/new pass
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [resetNewPassword, setResetNewPassword] = useState('');
    const [resetStatus, setResetStatus] = useState('');

    const handleRequestReset = async () => {
        if (!resetEmail) return setResetStatus('Enter your registered email address');
        setResetStatus('Sending OTP...');
        try {
            await authAPI.requestPasswordReset(resetEmail);
            setResetStatus('');
            setResetStep(2);
        } catch (err) {
            setResetStatus(err.response?.data?.message || 'Failed to send OTP. Check email.');
        }
    };

    const handleVerifyReset = async () => {
        if (!resetOtp || resetNewPassword.length < 6) return setResetStatus('Valid 6-digit OTP and 6+ char password required');
        setResetStatus('Verifying OTP...');
        try {
            await authAPI.verifyPasswordReset(resetEmail, resetOtp, resetNewPassword);
            alert('Password reset successfully! Please login with your new password.');
            setShowResetModal(false);
            setResetStep(1);
            setResetEmail('');
            setResetOtp('');
            setResetNewPassword('');
            setResetStatus('');
            setErrorMsg('');
        } catch (err) {
            setResetStatus(err.response?.data?.message || 'Failed to reset password');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!email.trim() || !password.trim()) {
            setErrorMsg('Please fill in both email and password.');
            return;
        }

        if (!isLogin && !name.trim()) {
            setErrorMsg('Please enter your full name.');
            return;
        }

        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);
        try {
            if (isLogin) {
                await onLogin(email.trim(), password);
            } else {
                await onRegister(email.trim(), password, name.trim());
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || (isLogin ? 'Login failed. Please verify credentials.' : 'Registration failed. Try again.');
            setErrorMsg(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleClick = async () => {
        setErrorMsg('');
        setIsGoogleLoading(true);
        try {
            if (onGoogleLogin) {
                await onGoogleLogin();
            } else {
                // Fallback to direct auth URL
                const { data } = await authAPI.getGoogleAuthUrl(window.location.origin);
                if (data?.url) {
                    window.location.href = data.url;
                }
            }
        } catch (err) {
            console.error('Google Sign In failed:', err);
            setErrorMsg(err.message || 'Could not initiate Google sign in. Please try again.');
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display antialiased min-h-full flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100 relative w-full">
            {/* Header */}
            {isLogin ? (
                <header className="relative pt-20 pb-16 px-6 flex flex-col items-center justify-center rounded-b-[2.5rem] shadow-lg z-20 shrink-0 overflow-hidden min-h-[280px]">
                    <div className="absolute inset-0 z-0">
                        <img alt="Golden wheat field sunset" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl9s9050b-jlOfCaRfnfIzJZqr8Fpc57EBR92FlTqV7Gnk1nTjlV-cCf01-MPaunVG7ef8WyTCCWJzLtBoP3gNPkDPaJets5eeme5ve4E71jj1UZ_NTasKwuwBkWwhnf--0J0ePVGWI0-05C-A1Lm8Yuj3xvdVcCvbyH4v2uqT84Rp7BPEenmJV_Jcbd0Yr8nGfr1yTmZw2x1jzo3C75FRpScNtrubONiDpq-atZG3lDch6b7cL7-BLxeFXVztXiKASNxuhNKX7TfG" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40"></div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1.5 w-full relative z-10 mt-auto mb-2">
                        <div className="text-center flex flex-col items-center drop-shadow-lg">
                            <h1 className="text-[32px] font-extrabold tracking-tight leading-none text-white uppercase drop-shadow-md font-display">
                                KISAN SAHAYAK
                            </h1>
                            <p className="text-white/95 text-lg font-bold mt-1 tracking-wide drop-shadow-md">किसान सहायक</p>
                        </div>
                    </div>
                </header>
            ) : (
                <header className="w-full h-64 pb-12 px-6 flex flex-col items-center justify-center relative header-curve shadow-lg z-10 overflow-hidden shrink-0">
                    <div className="absolute inset-0 z-0">
                        <img alt="Wheat field sunset background" className="w-full h-full object-cover opacity-90 brightness-75" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLx6mQT-tjf3diBnz-t1x-zbd6s7_-QxNN2hKefHDO1xIPb4hJlyEfhSs9orJsjFQLT4toWc9-tEiurOPhsiqqSQFj7N2ykbiCyuwJlB44oHLO93zM927yOQssThRwDbvdasCczG1rWcvZEgHvQz7wEwMaDj-bXbu07RiuA0BaVGcNkPp4eCB7tT9nhjYuHVsGGPdESZlDt4hGjjgz07O8fzSiTTVjk1FLKrDBVAmE4ISGLH-1g65BdOTjt7wxmf-UlPZmriA1hWRW" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center mt-4">
                        <h1 className="text-white text-3xl font-extrabold tracking-tight mb-1 flex flex-col items-center leading-tight drop-shadow-md">
                            KISAN SAHAYAK
                        </h1>
                        <p className="text-white/90 text-lg font-bold mt-1 tracking-wide drop-shadow-md">किसान सहायक</p>
                    </div>
                </header>
            )}

            <main className={`flex-1 relative flex flex-col w-full max-w-md mx-auto z-10 ${isLogin ? '-mt-6' : '-mt-10'}`}>
                {isLogin && (
                    <div className="absolute inset-0 z-0 opacity-[0.06] bg-farmer-pattern bg-cover bg-center pointer-events-none grayscale" data-alt="Indian farmer working in a field"></div>
                )}
                <div className={`flex-1 overflow-y-auto no-scrollbar relative z-10 px-6 ${isLogin ? 'pb-4' : 'pb-8'}`}>
                    <div className="krishi-glass rounded-3xl shadow-2xl p-6 border border-white/60 dark:border-white/10 mb-4 backdrop-blur-xl">

                        {/* Switch Mode Tabs */}
                        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-6 border border-slate-200/50 dark:border-slate-700/50">
                            <button
                                type="button"
                                onClick={() => { setIsLogin(true); setErrorMsg(''); }}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${isLogin ? 'bg-white dark:bg-slate-700 text-brand-green dark:text-green-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsLogin(false); setErrorMsg(''); }}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 text-primary-dark dark:text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
                            >
                                Register
                            </button>
                        </div>

                        <div className="mb-6 text-center sm:text-left">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                {isLogin ? 'Welcome Back Farmer' : 'Create Farmer Account'}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">
                                {isLogin ? 'Login to access your farms, AI advisory & market prices' : 'Join Kisan Sahayak for AI smart farming tools'}
                            </p>
                        </div>

                        {/* Error Alert Banner */}
                        {errorMsg && (
                            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-sm">
                                <span className="material-symbols-outlined text-red-500 text-lg shrink-0">error</span>
                                <div className="flex-1">{errorMsg}</div>
                            </div>
                        )}

                        {/* Google OAuth Button */}
                        <div className="mb-5">
                            <button
                                type="button"
                                onClick={handleGoogleClick}
                                disabled={isGoogleLoading || isLoading}
                                className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60"
                            >
                                {isGoogleLoading ? (
                                    <span className="material-icons animate-spin text-base text-primary">sync</span>
                                ) : (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                    </svg>
                                )}
                                <span>{isLogin ? 'Continue with Google' : 'Sign up with Google'}</span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative py-2 mb-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                                <span className="px-3 bg-white/90 dark:bg-slate-800/90 text-slate-400 font-semibold rounded-full">Or with Email</span>
                            </div>
                        </div>

                        {/* Email Form */}
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {!isLogin && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ml-1" htmlFor="fullname">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-lg">person</span>
                                        </div>
                                        <input
                                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all text-sm shadow-sm focus:outline-none"
                                            id="fullname"
                                            placeholder="ex. Rajesh Kumar"
                                            type="text"
                                            value={name}
                                            onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ml-1">
                                    {isLogin ? 'Email Address or Mobile' : 'Email Address'}
                                </label>
                                <div className="relative flex items-center group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-brand-green transition-colors text-lg">
                                            {isLogin ? 'account_circle' : 'mail'}
                                        </span>
                                    </div>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-sm transition-all shadow-sm"
                                        placeholder={isLogin ? "farmer@example.com" : "ex. rajesh@kisan.com"}
                                        type={isLogin ? "text" : "email"}
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ml-1">
                                    Password
                                </label>
                                <div className="relative flex items-center group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 group-focus-within:text-brand-green transition-colors text-lg">lock</span>
                                    </div>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-11 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-sm transition-all shadow-sm"
                                        placeholder={isLogin ? "••••••••" : "Minimum 6 characters"}
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                                    />
                                    <button 
                                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center" 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {showPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>
                                {isLogin && (
                                    <div className="flex justify-end pt-0.5">
                                        <button 
                                            type="button" 
                                            onClick={() => setShowResetModal(true)} 
                                            className="text-xs font-semibold text-brand-green hover:text-green-700 dark:text-green-400 transition-colors"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!isLogin && (
                                <div className="flex items-start gap-2.5 mt-2 px-1">
                                    <div className="flex items-center h-5">
                                        <input defaultChecked className="w-4 h-4 border-slate-300 rounded text-primary focus:ring-primary/50 dark:border-slate-600 dark:bg-slate-700" id="terms" type="checkbox" />
                                    </div>
                                    <label className="text-xs text-slate-600 dark:text-slate-300 leading-tight" htmlFor="terms">
                                        I agree to the <span className="text-brand-green font-medium">Terms of Service</span> and <span className="text-brand-green font-medium">Privacy Policy</span>.
                                    </label>
                                </div>
                            )}

                            <button
                                className={isLogin ? "w-full glass-glow-button text-white font-bold text-base py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4 tracking-wider uppercase disabled:opacity-50 active:scale-[0.98] transition-all" : "w-full btn-glass-glow text-white font-bold text-base py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 active:scale-[0.98] shadow-lg"}
                                type="submit"
                                disabled={isLoading || isGoogleLoading}
                            >
                                {isLoading ? (
                                    <span className="material-icons animate-spin text-lg">sync</span>
                                ) : (
                                    <>
                                        <span>{isLogin ? 'LOGIN' : 'CREATE ACCOUNT'}</span>
                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="p-2 text-center">
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {isLogin ? "Don't have an account?" : "Already registered?"}
                            <button 
                                type="button" 
                                onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} 
                                className="font-bold text-brand-green ml-1.5 hover:underline"
                            >
                                {isLogin ? 'Register Here' : 'Login Here'}
                            </button>
                        </p>
                        <div className="mt-3">
                            <button
                                onClick={onBack}
                                className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-brand-green transition-colors"
                            >
                                <span className="material-icons text-sm mr-1">arrow_back</span>
                                Back to Welcome
                            </button>
                        </div>
                    </div>
                </div>
            </main>

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

                        <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">{resetStep === 1 ? 'Reset Password' : 'Enter OTP'}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                            {resetStep === 1
                                ? 'Enter your email to receive a 6-digit verification code.'
                                : `OTP sent to ${resetEmail}. Enter it below with your new password.`}
                        </p>

                        {resetStatus && (
                            <div className={`p-3 rounded-xl text-xs font-semibold mb-4 ${resetStatus.includes('Send') || resetStatus.includes('Verif') ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300'}`}>
                                {resetStatus}
                            </div>
                        )}

                        {resetStep === 1 ? (
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    placeholder="Registered Email Address"
                                    value={resetEmail}
                                    onChange={e => setResetEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                                <button
                                    onClick={handleRequestReset}
                                    className="w-full glass-glow-button text-white font-bold py-3 rounded-xl shadow-md active:scale-[0.98] transition-all border-none"
                                >
                                    Send Verification OTP
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
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
                                <div>
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
                                    Confirm Reset Password
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

