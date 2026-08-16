import React, { useState, useEffect } from 'react';
import { authAPI } from '../api';
import { getTranslation, LANGUAGES } from '../utils/translations';
import LanguageModal from '../components/LanguageModal';

const LoginRegistration = ({ 
    initialTab = 'login', 
    language = 'en',
    onLanguageChange,
    onLogin, 
    onRegister, 
    onGoogleLogin, 
    onBack 
}) => {
    const [isLogin, setIsLogin] = useState(initialTab === 'login');
    const [loginInput, setLoginInput] = useState(''); // Supports both Email and Mobile
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLangModalOpen, setIsLangModalOpen] = useState(false);

    // --- 3-Step Registration State ---
    const [regStep, setRegStep] = useState(1); // 1 = Account, 2 = Farm Quiz, 3 = Completed
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [showRegPassword, setShowRegPassword] = useState(false);

    // Step 2 Farm & Education Quiz State
    const [landSize, setLandSize] = useState('landSemi');
    const [experience, setExperience] = useState('expSkilled');
    const [estimatedRevenue, setEstimatedRevenue] = useState('rev3');
    const [hasDegree, setHasDegree] = useState('yes'); // 'yes' | 'no'
    const [qualification, setQualification] = useState('qualAgri');
    const [advisoryLanguage, setAdvisoryLanguage] = useState(language);
    const [farmingType, setFarmingType] = useState('typeOrganic');

    // Password Reset Modal State
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [resetNewPassword, setResetNewPassword] = useState('');
    const [resetStatus, setResetStatus] = useState('');

    const t = (key) => getTranslation(language, key);
    const currentLangObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    useEffect(() => {
        setIsLogin(initialTab === 'login');
        if (initialTab === 'register') {
            setRegStep(1);
        }
        setErrorMsg('');
    }, [initialTab]);

    useEffect(() => {
        setAdvisoryLanguage(language);
    }, [language]);

    // Handle Login Submit
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!loginInput.trim() || !password.trim()) {
            setErrorMsg(language === 'hi' ? 'कृपया अपना ईमेल या मोबाइल नंबर और पासवर्ड दर्ज करें।' : 'Please enter your Email or Mobile Number and Password.');
            return;
        }

        if (password.length < 6) {
            setErrorMsg(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        try {
            await onLogin(loginInput.trim(), password);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || (language === 'hi' ? 'अमान्य विवरण। कृपया जांचें या नया खाता बनाएं।' : 'Invalid credentials. Please verify or register.');
            setErrorMsg(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 1 Validation -> Proceed to Step 2
    const handleProceedToStep2 = (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!name.trim()) {
            setErrorMsg(language === 'hi' ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your full name.');
            return;
        }
        if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, '').length < 10) {
            setErrorMsg(language === 'hi' ? 'कृपया वैध 10-अंकीय मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
            return;
        }
        if (!regEmail.trim() || !regEmail.includes('@')) {
            setErrorMsg(language === 'hi' ? 'कृपया वैध ईमेल पता दर्ज करें।' : 'Please enter a valid email address.');
            return;
        }
        if (regPassword.length < 6) {
            setErrorMsg(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
            return;
        }

        setRegStep(2);
    };

    // Step 2 Quiz Submit -> Create Farmer Account (Step 3)
    const handleCompleteRegistration = async () => {
        setErrorMsg('');
        setIsLoading(true);

        const assignedRole = hasDegree === 'yes' ? 'verified_agri_entrepreneur' : 'verified_farmer';
        const rawLand = t(landSize);
        const rawExp = t(experience);
        const rawRev = t(estimatedRevenue);
        const rawQual = hasDegree === 'yes' ? t(qualification) : 'School / High School';
        const rawFarming = t(farmingType);

        const registrationPayload = {
            name: name.trim(),
            age: age ? Number(age) : null,
            mobile_number: mobileNumber.trim(),
            email: regEmail.trim().toLowerCase(),
            password: regPassword,
            land_size: rawLand,
            experience_years: rawExp,
            estimated_revenue: rawRev,
            has_degree: hasDegree === 'yes',
            education_qualification: rawQual,
            role: assignedRole,
            preferred_language: advisoryLanguage || language,
            farming_type: rawFarming
        };

        try {
            await onRegister(registrationPayload);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
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

    return (
        <div className="bg-background-light dark:bg-background-dark font-display antialiased min-h-full flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100 relative w-full">
            {/* Header with Aesthetic Curve & Emblem */}
            <header className="relative pt-10 pb-14 px-6 flex flex-col items-center justify-center rounded-b-[2.5rem] shadow-xl z-20 shrink-0 overflow-hidden min-h-[220px] bg-gradient-to-b from-[#021309] via-[#052615] to-[#0a3d22]">
                <div className="absolute inset-0 z-0">
                    <img 
                        alt="Lush agricultural farm" 
                        className="w-full h-full object-cover opacity-35 brightness-75 scale-105" 
                        src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1200&auto=format&fit=crop" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#021309] via-[#052615]/70 to-transparent"></div>
                </div>

                {/* Top Language Switcher in Header */}
                <div className="absolute top-4 right-5 z-20">
                    <button
                        onClick={() => setIsLangModalOpen(true)}
                        className="flex items-center space-x-1.5 bg-black/40 hover:bg-black/60 border border-white/20 px-3 py-1 rounded-full text-white text-xs font-bold backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                        <span>{currentLangObj.flag}</span>
                        <span>{currentLangObj.native}</span>
                        <span className="material-icons text-xs">expand_more</span>
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center gap-1.5 w-full relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#083D20] via-[#0ED054] to-[#34d399] p-[1.5px] shadow-xl flex items-center justify-center mb-1">
                        <div className="w-full h-full bg-[#02170b] rounded-[14px] flex items-center justify-center">
                            <svg className="w-6 h-6 text-[#0ED054]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,8,17,8,17,8Z"></path>
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight leading-none text-white uppercase drop-shadow-md">
                        {t('appName')}
                    </h1>
                    <p className="text-[#0ED054] text-xs font-bold tracking-wide drop-shadow">
                        {t('appTagline')}
                    </p>
                </div>
            </header>

            {/* Main Interactive Card */}
            <main className="flex-1 relative flex flex-col w-full max-w-md mx-auto z-10 -mt-8">
                <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-5 pb-8">
                    <div className="krishi-glass rounded-[28px] shadow-2xl p-6 border border-white/60 dark:border-white/10 backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95">
                        
                        {/* Switch Mode Tabs (Login vs Register) */}
                        <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl mb-6 border border-slate-200/60 dark:border-slate-700/60">
                            <button
                                type="button"
                                onClick={() => { setIsLogin(true); setErrorMsg(''); }}
                                className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                    isLogin 
                                        ? 'bg-gradient-to-r from-[#0ED054] to-[#0aa140] text-white shadow-md' 
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {t('loginTab')}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsLogin(false); setRegStep(1); setErrorMsg(''); }}
                                className={`flex-1 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                    !isLogin 
                                        ? 'bg-gradient-to-r from-[#0ED054] to-[#0aa140] text-white shadow-md' 
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {t('registerTab')}
                            </button>
                        </div>

                        {/* Error Alert Banner */}
                        {errorMsg && (
                            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-sm">
                                <span className="material-symbols-outlined text-red-500 text-lg shrink-0">error</span>
                                <div className="flex-1">{errorMsg}</div>
                            </div>
                        )}

                        {/* ========================================================================= */}
                        {/* VIEW 1: LOGIN TAB                                                        */}
                        {/* ========================================================================= */}
                        {isLogin ? (
                            <div>
                                <div className="mb-5">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                        {t('loginTitle')}
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                                        {t('loginSubtitle')}
                                    </p>
                                </div>

                                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                                    {/* Email or Mobile Input */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                            {t('emailOrMobileLabel')}
                                        </label>
                                        <div className="relative flex items-center group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0ED054]">
                                                <span className="material-symbols-outlined text-[20px]">contact_mail</span>
                                            </div>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0ED054] focus:ring-2 focus:ring-[#0ED054]/20 text-sm transition-all shadow-sm font-medium"
                                                placeholder={t('emailOrMobilePlaceholder')}
                                                type="text"
                                                autoComplete="username"
                                                value={loginInput}
                                                onChange={(e) => { setLoginInput(e.target.value); setErrorMsg(''); }}
                                            />
                                        </div>
                                    </div>

                                    {/* Password Input */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                                {t('passwordLabel')}
                                            </label>
                                            <button 
                                                type="button" 
                                                onClick={() => setShowResetModal(true)} 
                                                className="text-xs font-semibold text-[#0ED054] hover:underline"
                                            >
                                                {t('forgotPassword')}
                                            </button>
                                        </div>
                                        <div className="relative flex items-center group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0ED054]">
                                                <span className="material-symbols-outlined text-[20px]">lock</span>
                                            </div>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-11 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0ED054] focus:ring-2 focus:ring-[#0ED054]/20 text-sm transition-all shadow-sm font-medium"
                                                placeholder={t('passwordPlaceholder')}
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="current-password"
                                                value={password}
                                                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                                            />
                                            <button 
                                                className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center p-1" 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                tabIndex={-1}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">
                                                    {showPassword ? 'visibility' : 'visibility_off'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Primary Login Button */}
                                    <button
                                        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#0ED054] via-[#10b94b] to-[#0a9e3d] text-white font-extrabold text-sm shadow-lg hover:shadow-[#0ED054]/30 border border-[#0ED054]/30 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 tracking-wider uppercase cursor-pointer disabled:opacity-50 mt-2"
                                        type="submit"
                                        disabled={isLoading || isGoogleLoading}
                                    >
                                        {isLoading ? (
                                            <span className="material-icons animate-spin text-lg">sync</span>
                                        ) : (
                                            <>
                                                <span>{t('loginButton')}</span>
                                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Divider */}
                                <div className="relative py-4 my-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200 dark:border-slate-700/80"></div>
                                    </div>
                                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                                        <span className="px-3 bg-white/95 dark:bg-slate-900/95 text-slate-400 rounded-full">
                                            {t('orConnectWith')}
                                        </span>
                                    </div>
                                </div>

                                {/* Google Sign-In Button on LOWER SIDE */}
                                <button
                                    type="button"
                                    onClick={handleGoogleClick}
                                    disabled={isGoogleLoading || isLoading}
                                    className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60 cursor-pointer group"
                                >
                                    {isGoogleLoading ? (
                                        <span className="material-icons animate-spin text-base text-[#0ED054]">sync</span>
                                    ) : (
                                        <svg className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                        </svg>
                                    )}
                                    <span>{isGoogleLoading ? 'Connecting...' : t('signInWithGoogle')}</span>
                                </button>
                            </div>
                        ) : (
                            /* ========================================================================= */
                            /* VIEW 2: 3-STEP FARMER REGISTRATION WIZARD                                 */
                            /* ========================================================================= */
                            <div>
                                {/* Step Indicator */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                                        <span className={regStep >= 1 ? 'text-[#0ED054]' : 'text-slate-400'}>
                                            {t('step1Title')}
                                        </span>
                                        <span className={regStep >= 2 ? 'text-[#0ED054]' : 'text-slate-400'}>
                                            {t('step2Title')}
                                        </span>
                                        <span className={regStep === 3 ? 'text-[#0ED054]' : 'text-slate-400'}>
                                            {t('step3Title')}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                                        <div 
                                            className="bg-gradient-to-r from-[#0ED054] to-[#10b94b] h-full transition-all duration-300 rounded-full"
                                            style={{ width: regStep === 1 ? '33%' : regStep === 2 ? '66%' : '100%' }}
                                        ></div>
                                    </div>
                                </div>

                                {/* STEP 1 OF 3: Account & Personal Credentials */}
                                {regStep === 1 && (
                                    <form className="space-y-3.5" onSubmit={handleProceedToStep2}>
                                        <div className="mb-2">
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                                {t('step1Header')}
                                            </h2>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs">
                                                {t('step1Desc')}
                                            </p>
                                        </div>

                                        {/* Full Name */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                                {t('fullNameLabel')} *
                                            </label>
                                            <div className="relative flex items-center group">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0ED054]">
                                                    <span className="material-symbols-outlined text-[19px]">person</span>
                                                </div>
                                                <input
                                                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0ED054] focus:ring-2 focus:ring-[#0ED054]/20 text-sm"
                                                    placeholder={t('fullNamePlaceholder')}
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Age & Mobile Row */}
                                        <div className="grid grid-cols-3 gap-2.5">
                                            <div className="space-y-1 col-span-1">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                                    {t('ageLabel')}
                                                </label>
                                                <input
                                                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0ED054] focus:ring-2 focus:ring-[#0ED054]/20 text-sm text-center"
                                                    placeholder={t('agePlaceholder')}
                                                    type="number"
                                                    min="18"
                                                    max="99"
                                                    value={age}
                                                    onChange={(e) => setAge(e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1 col-span-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                                    {t('mobileLabel')} *
                                                </label>
                                                <div className="relative flex items-center group">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0ED054]">
                                                        <span className="material-symbols-outlined text-[19px]">call</span>
                                                    </div>
                                                    <input
                                                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0ED054] focus:ring-2 focus:ring-[#0ED054]/20 text-sm"
                                                        placeholder={t('mobilePlaceholder')}
                                                        type="tel"
                                                        maxLength={10}
                                                        value={mobileNumber}
                                                        onChange={(e) => { setMobileNumber(e.target.value); setErrorMsg(''); }}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Email Address */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                                {t('emailLabel')} *
                                            </label>
                                            <div className="relative flex items-center group">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0ED054]">
                                                    <span className="material-symbols-outlined text-[19px]">mail</span>
                                                </div>
                                                <input
                                                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0ED054] focus:ring-2 focus:ring-[#0ED054]/20 text-sm"
                                                    placeholder={t('emailPlaceholder')}
                                                    type="email"
                                                    autoComplete="email"
                                                    value={regEmail}
                                                    onChange={(e) => { setRegEmail(e.target.value); setErrorMsg(''); }}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Password */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1">
                                                {t('createPasswordLabel')} *
                                            </label>
                                            <div className="relative flex items-center group">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0ED054]">
                                                    <span className="material-symbols-outlined text-[19px]">lock</span>
                                                </div>
                                                <input
                                                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-11 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0ED054] focus:ring-2 focus:ring-[#0ED054]/20 text-sm"
                                                    placeholder={t('createPasswordPlaceholder')}
                                                    type={showRegPassword ? "text" : "password"}
                                                    autoComplete="new-password"
                                                    value={regPassword}
                                                    onChange={(e) => { setRegPassword(e.target.value); setErrorMsg(''); }}
                                                    required
                                                />
                                                <button 
                                                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1" 
                                                    type="button"
                                                    onClick={() => setShowRegPassword(!showRegPassword)}
                                                    tabIndex={-1}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {showRegPassword ? 'visibility' : 'visibility_off'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Next to Step 2 Button */}
                                        <button
                                            type="submit"
                                            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#0ED054] via-[#10b94b] to-[#0a9e3d] text-white font-extrabold text-sm shadow-lg hover:shadow-[#0ED054]/30 border border-[#0ED054]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 tracking-wider uppercase cursor-pointer mt-4"
                                        >
                                            <span>{t('nextToStep2')}</span>
                                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                        </button>
                                    </form>
                                )}

                                {/* STEP 2 OF 3: Farm Profile & Background Quiz */}
                                {regStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="mb-2">
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                                {t('step2Header')}
                                            </h2>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs">
                                                {t('step2Desc')}
                                            </p>
                                        </div>

                                        {/* 1. Amount of Land */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                                {t('landQuestion')}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['landMarginal', 'landSmall', 'landSemi', 'landMedium', 'landLarge'].map((key) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setLandSize(key)}
                                                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                                                            landSize === key 
                                                                ? 'bg-[#0ED054]/15 border-[#0ED054] text-[#0ED054] shadow-sm' 
                                                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {t(key)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 2. Farming Experience */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                                {t('expQuestion')}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['expBeginner', 'expGrowing', 'expSkilled', 'expVeteran'].map((key) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setExperience(key)}
                                                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                                                            experience === key 
                                                                ? 'bg-[#0ED054]/15 border-[#0ED054] text-[#0ED054] shadow-sm' 
                                                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {t(key)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 3. Estimated Annual Revenue */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                                {t('revQuestion')}
                                            </label>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {['rev1', 'rev2', 'rev3', 'rev4', 'rev5'].map((key) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setEstimatedRevenue(key)}
                                                        className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                                                            estimatedRevenue === key 
                                                                ? 'bg-[#0ED054]/15 border-[#0ED054] text-[#0ED054] shadow-sm' 
                                                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {t(key)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 4. Graduation / Degree Qualification (New Feature) */}
                                        <div className="space-y-2 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center justify-between">
                                                <span>{t('eduQuestion')}</span>
                                                <span className="material-icons text-base text-[#0ED054]">school</span>
                                            </label>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setHasDegree('yes')}
                                                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                                                        hasDegree === 'yes'
                                                            ? 'bg-[#0ED054]/20 border-[#0ED054] text-[#0ED054] shadow-sm'
                                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {t('eduYes')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setHasDegree('no')}
                                                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                                                        hasDegree === 'no'
                                                            ? 'bg-[#0ED054]/20 border-[#0ED054] text-[#0ED054] shadow-sm'
                                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {t('eduNo')}
                                                </button>
                                            </div>

                                            {/* Sub-Question if hasDegree is YES */}
                                            {hasDegree === 'yes' ? (
                                                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
                                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {t('qualificationQuestion')}
                                                    </label>
                                                    <div className="grid grid-cols-1 gap-1.5">
                                                        {['qualAgri', 'qualTech', 'qualGeneral', 'qualDiploma', 'qualPostGrad', 'qualOther'].map((key) => (
                                                            <button
                                                                key={key}
                                                                type="button"
                                                                onClick={() => setQualification(key)}
                                                                className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                                                                    qualification === key 
                                                                        ? 'bg-[#0ED054]/15 border-[#0ED054] text-[#0ED054]' 
                                                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                                }`}
                                                            >
                                                                <span>{t(key)}</span>
                                                                {qualification === key && (
                                                                    <span className="material-icons text-[#0ED054] text-sm">check_circle</span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Tier Badge Preview */}
                                                    <div className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/15 to-[#0ED054]/15 border border-amber-500/30 p-2.5 rounded-xl mt-2">
                                                        <span className="material-icons text-amber-500 text-lg">workspace_premium</span>
                                                        <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                                                            {t('tierAgriEnt')} ★
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2 bg-[#0ED054]/10 border border-[#0ED054]/30 p-2.5 rounded-xl mt-2 animate-fade-in">
                                                    <span className="material-icons text-[#0ED054] text-lg">verified</span>
                                                    <span className="text-xs font-extrabold text-[#0ED054]">
                                                        {t('tierFarmer')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* 5. Advisory Language */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                                {t('langQuestion')}
                                            </label>
                                            <select
                                                value={advisoryLanguage}
                                                onChange={(e) => setAdvisoryLanguage(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3.5 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-[#0ED054]"
                                            >
                                                {LANGUAGES.map((l) => (
                                                    <option key={l.code} value={l.code}>
                                                        {l.native} ({l.name})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 6. Type of Farming */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                                {t('typeQuestion')}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['typeOrganic', 'typeConventional', 'typeHorticulture', 'typeMixed'].map((key) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setFarmingType(key)}
                                                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                                                            farmingType === key 
                                                                ? 'bg-[#0ED054]/15 border-[#0ED054] text-[#0ED054] shadow-sm' 
                                                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {t(key)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Navigation Buttons for Step 2 */}
                                        <div className="flex gap-2.5 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setRegStep(1)}
                                                className="w-1/3 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                                            >
                                                {t('backButton')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCompleteRegistration}
                                                disabled={isLoading}
                                                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0ED054] via-[#10b94b] to-[#0a9e3d] text-white font-extrabold text-xs shadow-lg hover:shadow-[#0ED054]/30 border border-[#0ED054]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 uppercase cursor-pointer"
                                            >
                                                {isLoading ? (
                                                    <span className="material-icons animate-spin text-base">sync</span>
                                                ) : (
                                                    <>
                                                        <span>{t('completeRegisterButton')}</span>
                                                        <span className="material-symbols-outlined text-base">check_circle</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3 OF 3: Registration Complete & Summary Badge */}
                                {regStep === 3 && (
                                    <div className="text-center py-2 animate-fade-in">
                                        <div className="w-16 h-16 rounded-full bg-[#0ED054]/20 border-2 border-[#0ED054] text-[#0ED054] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#0ED054]/20">
                                            <span className="material-icons text-3xl">verified</span>
                                        </div>

                                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
                                            {t('step3Header')}
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                            {t('step3Desc')}
                                        </p>

                                        {/* Summary Card */}
                                        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 text-left mb-5 space-y-2 text-xs">
                                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                                                <span className="text-slate-500 font-medium">{t('farmerNameLabel')}:</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{name}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                                                <span className="text-slate-500 font-medium">{t('contactLabel')}:</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{mobileNumber}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                                                <span className="text-slate-500 font-medium">{t('landLabel')}:</span>
                                                <span className="font-bold text-[#0ED054]">{t(landSize)}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5 items-center">
                                                <span className="text-slate-500 font-medium">{t('verificationStatusLabel')}:</span>
                                                <span className={`font-extrabold px-2.5 py-0.5 rounded-full text-[11px] ${
                                                    hasDegree === 'yes'
                                                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                                        : 'bg-[#0ED054]/20 text-[#0ED054] border border-[#0ED054]/30'
                                                }`}>
                                                    {hasDegree === 'yes' ? `★ ${t('verifiedAgriEntrepreneur')}` : `✓ ${t('verifiedFarmer')}`}
                                                </span>
                                            </div>
                                            {hasDegree === 'yes' && (
                                                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                                                    <span className="text-slate-500 font-medium">{t('qualificationLabel')}:</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{t(qualification)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                                                <span className="text-slate-500 font-medium">{t('farmingTypeLabel')}:</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{t(farmingType)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 font-medium">{t('advisoryLanguageLabel')}:</span>
                                                <span className="font-bold text-slate-900 dark:text-white uppercase">{advisoryLanguage}</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => window.location.reload()}
                                            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#0ED054] via-[#10b94b] to-[#0a9e3d] text-white font-extrabold text-sm shadow-xl hover:shadow-[#0ED054]/40 border border-[#0ED054]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase cursor-pointer"
                                        >
                                            <span>{t('enterDashboardButton')}</span>
                                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom Back and Switch Navigation */}
                    <div className="p-2 text-center">
                        <p className="text-slate-600 dark:text-slate-400 text-xs">
                            {isLogin ? t('dontHaveAccount') : t('alreadyRegistered')}
                            <button 
                                type="button" 
                                onClick={() => { setIsLogin(!isLogin); setRegStep(1); setErrorMsg(''); }} 
                                className="font-bold text-[#0ED054] ml-1.5 hover:underline cursor-pointer"
                            >
                                {isLogin ? t('registerHere') : t('loginHere')}
                            </button>
                        </p>
                        <div className="mt-2.5">
                            <button
                                onClick={onBack}
                                className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#0ED054] transition-colors cursor-pointer"
                            >
                                <span className="material-icons text-sm mr-1">arrow_back</span>
                                {t('backToWelcome')}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Language Modal */}
            <LanguageModal
                isOpen={isLangModalOpen}
                currentLang={language}
                onSelectLanguage={(newLang) => {
                    if (onLanguageChange) onLanguageChange(newLang);
                }}
                onClose={() => setIsLangModalOpen(false)}
            />

            {/* OTP Password Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-fade-in border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => { setShowResetModal(false); setResetStep(1); setResetStatus(''); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                        >
                            <span className="material-icons">close</span>
                        </button>

                        <div className="w-12 h-12 rounded-full bg-[#0ED054]/15 text-[#0ED054] flex items-center justify-center mb-4">
                            <span className="material-icons text-2xl">{resetStep === 1 ? 'mark_email_read' : 'lock_reset'}</span>
                        </div>

                        <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">{resetStep === 1 ? 'Reset Password' : 'Enter OTP'}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                            {resetStep === 1
                                ? 'Enter your registered email address to receive a 6-digit verification code.'
                                : `Enter the 6-digit OTP sent to ${resetEmail} and choose a new password.`}
                        </p>

                        {resetStatus && (
                            <div className="mb-4 text-xs font-semibold p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0ED054]">
                                {resetStatus}
                            </div>
                        )}

                        {resetStep === 1 ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm mt-1 text-slate-900 dark:text-white focus:outline-none focus:border-[#0ED054]"
                                        placeholder="farmer@example.com"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleRequestReset}
                                    className="w-full py-3 bg-[#0ED054] text-white font-bold rounded-xl text-sm hover:brightness-105 cursor-pointer"
                                >
                                    Send Verification OTP
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">6-Digit OTP</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm mt-1 text-center font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-[#0ED054]"
                                        placeholder="123456"
                                        value={resetOtp}
                                        onChange={(e) => setResetOtp(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">New Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm mt-1 text-slate-900 dark:text-white focus:outline-none focus:border-[#0ED054]"
                                        placeholder="Min. 6 characters"
                                        value={resetNewPassword}
                                        onChange={(e) => setResetNewPassword(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleVerifyReset}
                                    className="w-full py-3 bg-[#0ED054] text-white font-bold rounded-xl text-sm hover:brightness-105 cursor-pointer"
                                >
                                    Verify & Change Password
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
