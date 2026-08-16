import React from 'react';
import { LANGUAGES, getTranslation } from '../utils/translations';

const LanguageModal = ({ isOpen, currentLang = 'en', onSelectLanguage, onClose }) => {
    if (!isOpen) return null;

    const t = (key) => getTranslation(currentLang, key);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in font-display">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative flex flex-col max-h-[85vh]">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Close"
                >
                    <span className="material-icons text-xl">close</span>
                </button>

                {/* Header */}
                <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#0ED054]/15 border border-[#0ED054]/30 text-[#0ED054] flex items-center justify-center">
                        <span className="material-icons text-2xl">translate</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                            {t('selectLanguage')}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('selectLanguageDesc')}
                        </p>
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-3"></div>

                {/* Language Grid */}
                <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 gap-2.5 py-1">
                    {LANGUAGES.map((lang) => {
                        const isSelected = currentLang === lang.code;
                        return (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    onSelectLanguage(lang.code);
                                    onClose();
                                }}
                                className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative cursor-pointer ${
                                    isSelected
                                        ? 'bg-[#0ED054]/15 border-[#0ED054] shadow-sm shadow-[#0ED054]/10'
                                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:border-[#0ED054]/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <div className="flex justify-between items-center w-full mb-1">
                                    <span className="text-xl">{lang.flag}</span>
                                    {isSelected && (
                                        <span className="material-icons text-[#0ED054] text-base">check_circle</span>
                                    )}
                                </div>
                                <span className={`text-sm font-extrabold block leading-tight ${isSelected ? 'text-[#0ED054]' : 'text-slate-900 dark:text-white'}`}>
                                    {lang.native}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    {lang.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Footer confirmation */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
                    >
                        Done / ਬੰਦ ਕਰੋ / बंद करें
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LanguageModal;
