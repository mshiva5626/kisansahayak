import React, { useState, useEffect } from 'react';
import farmerImg from '../assets/farmer.jpg';
import { getTranslation, LANGUAGES } from '../utils/translations';
import LanguageModal from '../components/LanguageModal';

const WelcomeScreen = ({ language = 'en', onLanguageChange, onLogin, onRegister, onDemoLogin }) => {
    const [isSplashLoading, setIsSplashLoading] = useState(true);
    const [isLangModalOpen, setIsLangModalOpen] = useState(false);

    useEffect(() => {
        // Logo splash loading animation for 1.2 seconds on initial load
        const timer = setTimeout(() => {
            setIsSplashLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const t = (key) => getTranslation(language, key);
    const currentLangObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    if (isSplashLoading) {
        return (
            <div className="w-full min-h-full flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-emerald-50/40 relative overflow-hidden font-display text-slate-800 p-6">
                {/* Soft Ambient Glow */}
                <div className="absolute w-72 h-72 rounded-full bg-emerald-200/30 blur-[100px] animate-pulse pointer-events-none"></div>
                <div className="absolute w-48 h-48 rounded-full bg-amber-100/40 blur-[80px] pointer-events-none"></div>

                {/* Animated Logo Emblem */}
                <div className="relative z-10 flex flex-col items-center animate-fade-in text-center">
                    <div className="relative w-22 h-22 rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-[2px] shadow-xl flex items-center justify-center mb-6 shadow-emerald-500/20 animate-bounce-short">
                        <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/40 to-transparent"></div>
                            <svg className="w-11 h-11 text-emerald-600 drop-shadow-sm animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,8,17,8,17,8Z"></path>
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase mb-1">
                        {t('appName')}
                    </h1>
                    <p className="text-emerald-700 text-base font-bold tracking-wide mb-4">
                        {t('appTagline')}
                    </p>

                    <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase">
                            {t('welcomeBadge')}
                        </span>
                    </div>
                </div>

                <div className="absolute bottom-8 text-center text-xs text-slate-400 font-medium">
                    {t('powering')} 🌾
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-full flex flex-col bg-gradient-to-b from-emerald-50/50 via-[#f8fafc] to-white overflow-x-hidden relative font-display text-slate-800">
            {/* Top Subtle Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] h-[240px] bg-emerald-100/30 rounded-full blur-[80px] z-0 pointer-events-none"></div>

            {/* Top Navigation Bar */}
            <div className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 w-full pt-10 pb-4 px-6 flex justify-between items-center z-20 shrink-0 shadow-xs">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-[1.5px] shadow-sm flex items-center justify-center">
                        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,8,17,8,17,8Z"></path>
                            </svg>
                        </div>
                    </div>
                    <div>
                        <span className="text-slate-900 font-extrabold text-lg tracking-wide block leading-none">
                            {t('appName')}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 tracking-wider uppercase">
                            {t('appTagline')}
                        </span>
                    </div>
                </div>

                {/* Instant Language Selection Button */}
                <button
                    onClick={() => setIsLangModalOpen(true)}
                    className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-xs transition-all active:scale-95 text-slate-700 cursor-pointer"
                    title={t('changeLanguage')}
                >
                    <span className="text-sm">{currentLangObj.flag}</span>
                    <span className="text-xs font-bold text-slate-800">{currentLangObj.native}</span>
                    <span className="material-icons text-slate-400 text-sm">expand_more</span>
                </button>
            </div>

            {/* Hero Image Section */}
            <div className="relative z-10 w-full h-[28vh] min-h-[200px] rounded-b-[32px] overflow-hidden shadow-sm shrink-0 bg-slate-100 border-b border-slate-200/60">
                <img
                    alt="Indian Farmer in lush field"
                    className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-1000"
                    src={farmerImg}
                    style={{ objectPosition: 'center 25%' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>

            {/* Main Welcome Card */}
            <div className="flex-1 flex flex-col items-center justify-between px-6 pt-2 pb-6 z-10 relative">
                <div className="w-full bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl -mt-8 relative z-20 flex flex-col items-center text-center">
                    <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full mb-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
                            {t('welcomeBadge')}
                        </span>
                    </div>

                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-snug mb-2">
                        {t('welcomeTitle1')}<br />
                        <span className="text-emerald-600">{t('welcomeTitle2')}</span>
                    </h1>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-[310px]">
                        {t('welcomeSubtitle')}
                    </p>
                </div>

                {/* Primary & Secondary Action CTAs */}
                <div className="w-full flex flex-col space-y-2.5 mt-auto pt-5">
                    {/* Primary Button: Register / Create Account */}
                    <button
                        onClick={onRegister || onLogin}
                        className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                        <span className="material-icons text-lg">person_add</span>
                        <span>{t('registerCta')}</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>

                    {/* Secondary Button: Login to Account */}
                    <button
                        onClick={onLogin}
                        className="w-full py-3 px-6 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                        <span className="material-icons text-base text-emerald-600">login</span>
                        <span>{t('loginCta')}</span>
                    </button>

                    {/* Quick Demo Access Button */}
                    {onDemoLogin && (
                        <button
                            onClick={onDemoLogin}
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm text-emerald-600">agriculture</span>
                            <span>{language === 'hi' ? 'अतिथि / डेमो मोड (तुरंत देखें)' : 'Quick Demo Access (Explore App)'}</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    )}

                    <div className="pt-1 text-center">
                        <div className="inline-flex items-center space-x-2 text-[11px] text-slate-400">
                            <span>{t('trustBadge')}</span>
                            <span>🇮🇳</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Language Modal */}
            <LanguageModal
                isOpen={isLangModalOpen}
                currentLang={language}
                onSelectLanguage={(newLang) => {
                    if (onLanguageChange) onLanguageChange(newLang);
                }}
                onClose={() => setIsLangModalOpen(false)}
            />
        </div>
    );
};

export default WelcomeScreen;
