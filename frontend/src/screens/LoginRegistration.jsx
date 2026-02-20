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
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute top-40 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
            </div>

            {/* Main Container */}
            <div className="w-full max-w-md px-6 py-8 relative z-10 flex flex-col h-full justify-between min-h-[600px]">
                {/* Logo */}
                <div className="flex flex-col items-center pt-8 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
                        <span className="material-icons text-background-dark text-4xl">agriculture</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Kisan Sahayak</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Premium Agricultural Assistant</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 dark:bg-surface-dark rounded-xl p-1 mb-6">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        Register
                    </button>
                </div>

                {/* Form */}
                <div className="flex-1 flex flex-col justify-center mb-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {isLogin ? 'Sign in to access your farm dashboard' : 'Register to start managing your farms'}
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1" htmlFor="name">Full Name</label>
                                <input
                                    className="block w-full rounded-xl border-0 py-3.5 px-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-sm dark:bg-surface-dark dark:ring-slate-700 dark:text-white dark:placeholder:text-slate-500 transition-all duration-200"
                                    id="name"
                                    placeholder="e.g. Rajesh Kumar"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1" htmlFor="email">Email Address</label>
                            <input
                                className="block w-full rounded-xl border-0 py-3.5 px-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-sm dark:bg-surface-dark dark:ring-slate-700 dark:text-white dark:placeholder:text-slate-500 transition-all duration-200"
                                id="email"
                                placeholder="farmer@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1" htmlFor="password">Password</label>
                            <input
                                className="block w-full rounded-xl border-0 py-3.5 px-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-sm dark:bg-surface-dark dark:ring-slate-700 dark:text-white dark:placeholder:text-slate-500 transition-all duration-200"
                                id="password"
                                placeholder="••••••••"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {isLogin && (
                                <div className="flex justify-end mt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowResetModal(true)}
                                        className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-background-dark bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 disabled:opacity-60 items-center gap-2"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading && <span className="material-icons animate-spin text-lg">sync</span>}
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-center gap-2">
                        <span className="h-px w-16 bg-slate-200 dark:bg-slate-700"></span>
                        <span className="text-xs text-slate-400 uppercase font-medium">Or continue with</span>
                        <span className="h-px w-16 bg-slate-200 dark:bg-slate-700"></span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-surface-dark text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" type="button">
                            <svg aria-hidden="true" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"></path>
                            </svg>
                            Google
                        </button>
                        <button className="flex items-center justify-center px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-surface-dark text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" type="button">
                            Guest
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                        By continuing, you agree to our
                        <a className="text-primary hover:text-primary-dark hover:underline font-medium ml-1" href="#">Terms of Service</a>
                        {' '}and
                        <a className="text-primary hover:text-primary-dark hover:underline font-medium ml-1" href="#">Privacy Policy</a>.
                    </p>
                    <button
                        onClick={onBack}
                        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                    >
                        <span className="material-icons text-base mr-1">arrow_back</span>
                        Back to Welcome
                    </button>
                </div>
            </div>
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

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
                                    className="w-full py-3 bg-primary text-black font-bold rounded-xl shadow-md active:scale-[0.98] transition-all"
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
                                    className="w-full py-3 bg-primary text-black font-bold rounded-xl shadow-md active:scale-[0.98] transition-all mt-2"
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
