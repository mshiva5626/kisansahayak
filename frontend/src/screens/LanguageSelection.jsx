import React, { useState } from 'react';

const LanguageSelection = ({ onContinue }) => {
    const languages = [
        { code: 'En', name: 'English', native: 'English', selected: true },
        { code: 'अ', name: 'Hindi', native: 'हिन्दी' },
        { code: 'ੳ', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
        { code: 'म', name: 'Marathi', native: 'मराठी' },
        { code: 'అ', name: 'Telugu', native: 'తెలుగు' },
        { code: 'அ', name: 'Tamil', native: 'தமிழ்' },
        { code: 'ગ', name: 'Gujarati', native: 'ગુજરાતી' },
        { code: 'বা', name: 'Bengali', native: 'বাংলা' },
    ];

    const [selectedLang, setSelectedLang] = useState('English');

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 min-h-screen flex flex-col antialiased selection:bg-primary selection:text-white">
            {/* Safe Area Spacer */}
            <div className="h-12 w-full shrink-0"></div>

            {/* Header Section */}
            <header className="px-6 pt-2 pb-6 flex flex-col items-center text-center shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6 shadow-soft">
                    <span className="material-icons-outlined text-primary text-3xl">agriculture</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome to Kisan Sahayak
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                    Please select your preferred language to continue using the app.
                </p>
            </header>

            {/* Language Grid */}
            <main className="flex-1 px-5 pb-24 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                    {languages.map((lang) => (
                        <button
                            key={lang.name}
                            onClick={() => setSelectedLang(lang.name)}
                            className={`group relative flex flex-col items-center p-5 bg-surface-light dark:bg-surface-dark rounded-xl border-2 transition-all duration-200 ${selectedLang === lang.name ? 'border-primary shadow-soft' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-card hover:shadow-lg'}`}
                        >
                            <div className={`absolute top-3 right-3 ${selectedLang === lang.name ? 'text-primary' : 'text-gray-300 dark:text-gray-600 group-hover:text-primary/50'}`}>
                                <span className="material-icons-outlined text-xl">
                                    {selectedLang === lang.name ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                            </div>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all ${selectedLang === lang.name ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-primary/10'}`}>
                                <span className={`text-xl font-bold ${selectedLang === lang.name ? 'text-primary' : 'text-gray-700 dark:text-gray-300 group-hover:text-primary'}`}>
                                    {lang.code}
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">{lang.name}</h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lang.native}</span>
                        </button>
                    ))}
                </div>
            </main>

            {/* Footer Action */}
            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-10">
                <button
                    onClick={() => onContinue(selectedLang === 'Hindi' ? 'hi' : selectedLang === 'Marathi' ? 'mr' : 'en')}
                    className="w-full bg-primary hover:bg-primary-dark text-black dark:text-gray-900 font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <span>Continue</span>
                    <span className="material-icons-outlined text-xl">arrow_forward</span>
                </button>
                <div className="h-4 w-full"></div>
            </footer>
        </div>
    );
};

export default LanguageSelection;
