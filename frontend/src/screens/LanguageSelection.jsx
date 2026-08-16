import React, { useState } from 'react';
import { LANGUAGES, getTranslation } from '../utils/translations';

const LanguageSelection = ({ currentLanguage = 'en', onContinue }) => {
    const [selectedLang, setSelectedLang] = useState(currentLanguage);

    const t = (key) => getTranslation(selectedLang, key);

    return (
        <div className="bg-gradient-to-b from-[#fafcfb] to-[#f4f7f5] dark:from-[#021309] dark:to-[#062413] font-display text-gray-800 dark:text-gray-100 min-h-screen flex flex-col antialiased">
            {/* Header Section */}
            <header className="px-6 pt-10 pb-4 flex flex-col items-center text-center shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-[#0ED054]/15 dark:bg-[#0ED054]/20 flex items-center justify-center mb-3 shadow-md border border-[#0ED054]/30">
                    <span className="material-icons text-[#0ED054] text-3xl">translate</span>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
                    {t('selectLanguage')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs max-w-xs mx-auto leading-relaxed">
                    {t('selectLanguageDesc')}
                </p>
            </header>

            {/* Language Grid */}
            <main className="flex-1 px-5 pb-28 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                    {LANGUAGES.map((lang) => {
                        const isSelected = selectedLang === lang.code;
                        return (
                            <button
                                key={lang.code}
                                onClick={() => setSelectedLang(lang.code)}
                                className={`group relative flex flex-col items-center p-4 krishi-glass rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                                    isSelected 
                                        ? 'border-[#0ED054] bg-[#0ED054]/10 shadow-[0_8px_20px_rgba(14,208,84,0.15)] scale-[1.02]' 
                                        : 'border-transparent bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-white/10 shadow-card hover:shadow-md'
                                }`}
                            >
                                <div className="absolute top-3 right-3">
                                    <span className={`material-icons text-base ${isSelected ? 'text-[#0ED054]' : 'text-gray-300 dark:text-gray-600'}`}>
                                        {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                                    </span>
                                </div>
                                <div className="text-2xl mb-1.5">{lang.flag}</div>
                                <h3 className={`font-extrabold text-base ${isSelected ? 'text-[#0ED054]' : 'text-gray-900 dark:text-white'}`}>
                                    {lang.native}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{lang.name}</span>
                            </button>
                        );
                    })}
                </div>
            </main>

            {/* Footer Action */}
            <footer className="fixed bottom-0 left-0 right-0 p-5 krishi-glass border-t border-white/20 dark:border-white/5 z-10 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
                <button
                    onClick={() => onContinue(selectedLang)}
                    className="w-full bg-gradient-to-r from-[#0ED054] via-[#10b94b] to-[#0a9e3d] text-white font-extrabold text-base py-4 rounded-2xl shadow-xl shadow-[#0ED054]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                    <span>{selectedLang === 'hi' ? 'आगे बढ़ें' : selectedLang === 'or' ? 'ଆଗକୁ ବଢ଼ନ୍ତୁ' : selectedLang === 'te' ? 'కొనసాగించండి' : 'Continue'}</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
            </footer>
        </div>
    );
};

export default LanguageSelection;
