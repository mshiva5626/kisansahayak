import React, { useState, useEffect } from 'react';
import farmerImg from '../assets/farmer.jpg';
import { getTranslation, LANGUAGES } from '../utils/translations';
import LanguageModal from '../components/LanguageModal';

const WelcomeScreen = ({ language = 'en', onLanguageChange, onLogin, onRegister }) => {
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
            <div className="w-full min-h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#021309] via-[#052414] to-[#010a05] relative overflow-hidden font-display text-white p-6">
                {/* Radiant Ambient Glow */}
                <div className="absolute w-72 h-72 rounded-full bg-[#0ED054]/20 blur-[100px] animate-pulse pointer-events-none"></div>
                <div className="absolute w-48 h-48 rounded-full bg-[#EAB308]/15 blur-[80px] pointer-events-none"></div>

                {/* Animated Logo Emblem */}
                <div className="relative z-10 flex flex-col items-center animate-fade-in text-center">
                    <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#083D20] via-[#0B5C30] to-[#0ED054] p-[2px] shadow-2xl flex items-center justify-center mb-6 shadow-[#0ED054]/20 animate-bounce-short">
                        <div className="w-full h-full bg-[#031c0e] rounded-[22px] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#0ED054]/20 to-transparent"></div>
                            <svg className="w-12 h-12 text-[#0ED054] drop-shadow-md animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,8,17,8,17,8Z"></path>
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-3xl font-black tracking-tight text-white uppercase drop-shadow-lg mb-1">
                        {t('appName')}
                    </h1>
                    <p className="text-[#0ED054] text-lg font-bold tracking-wide drop-shadow mb-4">
                        {t('appTagline')}
                    </p>

                    <div className="flex items-center space-x-2 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-[#0ED054] animate-ping"></span>
                        <span className="text-xs font-semibold text-gray-200 tracking-wider uppercase">
                            {t('welcomeBadge')}
                        </span>
                    </div>
                </div>

                <div className="absolute bottom-8 text-center text-xs text-gray-400 font-medium">
                    {t('powering')} 🌾
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-full flex flex-col bg-gradient-to-b from-[#021309] via-[#062413] to-[#010904] overflow-x-hidden relative font-display text-white">
            {/* Top Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] h-[300px] bg-[#0ED054]/15 rounded-full blur-[90px] z-0 pointer-events-none"></div>

            {/* Top Navigation Bar */}
            <div className="bg-[#052b17]/70 backdrop-blur-xl border-b border-white/10 w-full pt-10 pb-4 px-6 flex justify-between items-center z-20 shrink-0 shadow-lg">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#083D20] to-[#0ED054] p-[1.5px] shadow-lg flex items-center justify-center">
                        <div className="w-full h-full bg-[#02170b] rounded-[14px] flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#0ED054]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,8,17,8,17,8Z"></path>
                            </svg>
                        </div>
                    </div>
                    <div>
                        <span className="text-white font-extrabold text-lg tracking-wide block leading-none">
                            {t('appName')}
                        </span>
                        <span className="text-[11px] font-bold text-[#0ED054] tracking-wider uppercase">
                            {t('appTagline')}
                        </span>
                    </div>
                </div>

                {/* Instant Language Selection Button */}
                <button
                    onClick={() => setIsLangModalOpen(true)}
                    className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 px-3.5 py-1.5 rounded-full shadow-sm transition-all duration-200 active:scale-95 text-white cursor-pointer"
                    title={t('changeLanguage')}
                >
                    <span className="text-base">{currentLangObj.flag}</span>
                    <span className="text-xs font-bold text-white/95">{currentLangObj.native}</span>
                    <span className="material-icons text-white/70 text-sm">expand_more</span>
                </button>
            </div>

            {/* Hero Image Section */}
            <div className="relative z-10 w-full h-[30vh] min-h-[220px] rounded-b-[36px] overflow-hidden shadow-2xl shrink-0 bg-slate-900 border-b border-white/10">
                <img
                    alt="Indian Farmer in lush field"
                    className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-1000"
                    src={farmerImg}
                    style={{ objectPosition: 'center 25%' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#021309] via-black/30 to-transparent"></div>
            </div>

            {/* Main Welcome Card */}
            <div className="flex-1 flex flex-col items-center justify-between px-6 pt-2 pb-6 z-10 relative">
                <div className="w-full krishi-glass rounded-3xl p-6 border border-white/15 shadow-2xl -mt-10 relative z-20 flex flex-col items-center text-center backdrop-blur-2xl">
                    <div className="inline-flex items-center space-x-2 bg-[#0ED054]/15 border border-[#0ED054]/30 px-3.5 py-1 rounded-full mb-3 shadow-inner">
                        <span className="w-2 h-2 rounded-full bg-[#0ED054] animate-pulse"></span>
                        <span className="text-[11px] font-bold tracking-wider text-[#0ED054] uppercase">
                            {t('welcomeBadge')}
                        </span>
                    </div>

                    <h1 className="text-2xl font-extrabold tracking-tight text-white leading-snug mb-2">
                        {t('welcomeTitle1')}<br />
                        <span className="text-[#0ED054]">{t('welcomeTitle2')}</span>
                    </h1>

                    <p className="text-xs text-gray-300 leading-relaxed max-w-[310px]">
                        {t('welcomeSubtitle')}
                    </p>
                </div>

                {/* Primary & Secondary Action CTAs */}
                <div className="w-full flex flex-col space-y-3 mt-auto pt-6">
                    {/* Primary Button: Register / Create Account */}
                    <button
                        onClick={onRegister || onLogin}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#0ED054] via-[#10b94b] to-[#0a9e3d] text-white font-bold text-base shadow-xl hover:shadow-[#0ED054]/30 border border-[#0ED054]/40 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
                        style={{ boxShadow: '0 8px 24px rgba(14,208,84,0.35)' }}
                    >
                        <span className="material-icons text-xl">person_add</span>
                        <span>{t('registerCta')}</span>
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>

                    {/* Secondary Button: Login to Account */}
                    <button
                        onClick={onLogin}
                        className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/20 text-white font-semibold text-sm backdrop-blur-md shadow-md active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                        <span className="material-icons text-lg text-[#0ED054]">login</span>
                        <span>{t('loginCta')}</span>
                    </button>

                    <div className="pt-2 text-center">
                        <div className="inline-flex items-center space-x-2 text-[11px] text-gray-400">
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
