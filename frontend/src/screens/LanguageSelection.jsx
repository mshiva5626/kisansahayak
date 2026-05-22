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

    const handleContinue = () => {
        const codes = {
            'English': 'en',
            'Hindi': 'hi',
            'Punjabi': 'pa',
            'Marathi': 'mr',
            'Telugu': 'te',
            'Tamil': 'ta',
            'Gujarati': 'gu',
            'Bengali': 'bn'
        };
        onContinue(codes[selectedLang] || 'en');
    };

    return (
        <div className="bg-gradient-to-b from-[#fafcfb] to-[#f4f7f5] dark:from-[#03140A] dark:to-[#081d11] font-display text-gray-800 dark:text-gray-100 min-h-screen flex flex-col antialiased selection:bg-primary selection:text-white">
            {/* Safe Area Spacer */}
            <div className="h-12 w-full shrink-0"></div>

            {/* Header Section */}
            <header className="px-6 pt-2 pb-6 flex flex-col items-center text-center shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6 shadow-md border border-primary/20">
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
            <main className="flex-1 px-5 pb-28 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-4 tilt-card-container">
                    {languages.map((lang) => (
                        <button
                            key={lang.name}
                            onClick={() => setSelectedLang(lang.name)}
                            className={`group relative flex flex-col items-center p-5 krishi-glass rounded-2xl border-2 transition-all duration-200 tilt-card ${selectedLang === lang.name ? 'border-[#0ED054] shadow-[0_8px_20px_rgba(14,208,84,0.15)] scale-[1.02]' : 'border-transparent hover:border-slate-200 dark:hover:border-white/10 shadow-card hover:shadow-lg'}`}
                        >
                            <div className={`absolute top-3 right-3 ${selectedLang === lang.name ? 'text-primary' : 'text-gray-300 dark:text-gray-600 group-hover:text-primary/50'}`}>
                                <span className="material-icons-outlined text-xl">
                                    {selectedLang === lang.name ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                            </div>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all ${selectedLang === lang.name ? 'bg-primary/20' : 'bg-gray-100 dark:bg-slate-800/80 group-hover:bg-primary/10'}`}>
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
            <footer className="fixed bottom-0 left-0 right-0 p-6 krishi-glass border-t border-white/20 dark:border-white/5 z-10 shadow-[0_-8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.3)]">
                <button
                    onClick={handleContinue}
                    className="w-full bg-gradient-to-r from-[#0ED054] to-[#0A9E3E] text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer tactile-btn"
                >
                    <span>Continue</span>
                    <span className="material-icons-outlined text-xl">arrow_forward</span>
                </button>
            </footer>
        </div>
    );
};

export default LanguageSelection;
