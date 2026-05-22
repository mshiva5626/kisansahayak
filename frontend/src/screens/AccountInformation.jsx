import React, { useState, useEffect } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import { authAPI } from '../api';

const AccountInformation = ({ onBack, onNavigate, userProfile, onLogout }) => {
    const [profile, setProfile] = useState(userProfile);

    // Refresh profile from backend on mount
    useEffect(() => {
        const refreshProfile = async () => {
            try {
                const { data } = await authAPI.getProfile();
                setProfile(data.user || data);
            } catch (e) {
                // Fallback to prop data
                console.error('Failed to refresh profile:', e);
            }
        };
        refreshProfile();
    }, []);

    const displayProfile = profile || userProfile || {};

    const langNames = {
        'en': 'English', 'hi': 'Hindi', 'পা': 'Punjabi', 'pa': 'Punjabi',
        'mr': 'Marathi', 'te': 'Telugu', 'ta': 'Tamil', 'gu': 'Gujarati', 'bn': 'Bengali'
    };
    const displayLanguage = langNames[displayProfile.preferred_language] || displayProfile.preferred_language || 'English';

    return (
        <div className="w-full max-w-md mx-auto bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] min-h-screen relative flex flex-col font-display text-slate-800 dark:text-slate-100 antialiased overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex justify-between items-center z-10 sticky top-0 bg-white/30 dark:bg-[#03140A]/30 backdrop-blur-md border-b border-white/20 dark:border-emerald-500/5">
                <button 
                    onClick={onBack} 
                    className="p-2 -ml-2 rounded-full hover:bg-white/40 dark:hover:bg-white/5 transition-all text-slate-800 dark:text-slate-200 active:scale-90 tactile-btn"
                >
                    <span className="material-icons-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-base font-bold text-slate-900 dark:text-white">Farmer Profile</h1>
                <button
                    onClick={() => onNavigate('settings')}
                    className="p-2 -mr-2 rounded-full hover:bg-white/40 dark:hover:bg-white/5 transition-all text-emerald-600 dark:text-emerald-400 active:scale-90 tactile-btn"
                >
                    <span className="material-icons-outlined text-2xl">edit</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-5 pb-24 overflow-y-auto no-scrollbar relative z-10">
                {/* Hero Section */}
                <div className="flex flex-col items-center mt-4 mb-6">
                    <div className="relative">
                        {/* Glow verification ring */}
                        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-emerald-500 to-[#13ec13] opacity-30 animate-pulse blur-sm"></div>
                        <div className="relative w-24 h-24 rounded-full p-0.5 bg-white dark:bg-emerald-500/20 shadow-md">
                            <div className="w-full h-full rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                                <span className="material-icons-round text-emerald-600 dark:text-emerald-400 text-4xl">person</span>
                            </div>
                        </div>
                        {/* Glowing Green Verification Badge */}
                        <div className="absolute bottom-0 right-0 p-0.5 bg-white dark:bg-[#03140A] rounded-full">
                            <div className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md relative">
                                <span className="absolute inset-0 rounded-full border border-emerald-500 animate-ping opacity-75"></span>
                                <span className="material-icons text-xs font-bold">check</span>
                            </div>
                        </div>
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">{displayProfile.name || 'Farmer'}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-3 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-full border border-emerald-500/20 tracking-wider">
                            {displayProfile.farming_type || 'Farmer'}
                        </span>
                    </div>
                </div>

                {/* Personal Details Card */}
                <div className="krishi-glass rounded-2xl p-5 mb-4 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                            <span className="material-icons-outlined text-emerald-600 dark:text-emerald-400 text-lg">badge</span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-950 dark:text-white">Personal Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Full Name', val: displayProfile.name || 'Not set', icon: 'person' },
                            { label: 'Email Address', val: displayProfile.email || 'Not set', icon: 'email' },
                            { label: 'Phone Number', val: displayProfile.mobile_number || 'Not set', icon: 'phone' },
                            { label: 'Language', val: displayLanguage, icon: 'translate' },
                            { label: 'State', val: displayProfile.state || 'Not set', icon: 'location_on' },
                            { label: 'District', val: displayProfile.district || 'Not set', icon: 'map' }
                        ].map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 bg-white/20 dark:bg-black/10 p-2.5 rounded-xl border border-white/40 dark:border-white/5">
                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                    <span className="material-icons-outlined text-slate-500 dark:text-emerald-400 text-xs">{detail.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">{detail.label}</p>
                                    <p className={`text-xs font-semibold truncate ${detail.val === 'Not set' ? 'text-slate-400 italic font-normal' : 'text-slate-800 dark:text-slate-200'}`}>{detail.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Agricultural Profile Card */}
                <div className="krishi-glass rounded-2xl p-5 mb-5 shadow-md relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full -ml-8 -mb-8 blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                            <span className="material-icons-outlined text-emerald-600 dark:text-emerald-400 text-lg">agriculture</span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-950 dark:text-white">Agricultural Credentials</h3>
                    </div>
                    <div className="space-y-2.5">
                        <div className="p-3.5 bg-white/20 dark:bg-black/10 rounded-xl border border-white/40 dark:border-white/5">
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">Primary Farming Type</p>
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400 capitalize">{displayProfile.farming_type || 'Not specified'}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium">
                            * Farm-specific soil reports, weather triggers, and crop analysis logs are managed within each digital farm sheet.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 mb-6">
                    <button
                        onClick={() => onNavigate('settings')}
                        className="w-full py-3.5 btn-glass-glow text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all tactile-btn cursor-pointer text-sm"
                    >
                        <span className="material-icons-outlined text-lg">edit</span>
                        Edit Settings & Preferences
                    </button>
                    <button
                        onClick={() => onNavigate('farm-list')}
                        className="w-full py-3.5 bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-sm active:scale-[0.98] tactile-btn cursor-pointer text-sm"
                    >
                        <span className="material-icons-outlined text-emerald-600 dark:text-emerald-400 text-lg">landscape</span>
                        My Connected Farms
                    </button>
                    <button 
                        onClick={onLogout} 
                        className="w-full py-3 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-900/10 rounded-xl font-bold transition-all text-xs uppercase tracking-wider cursor-pointer"
                    >
                        Sign Out Account
                    </button>
                </div>
                <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-mono pb-2">App Version 2.5.0 • Kisan Sahayak Secure</p>
            </main>

            {/* Bottom Navigation */}
            <BottomNavbar
                activeTab="account-info"
                onNavigate={onNavigate}
            />
        </div>
    );
};

export default AccountInformation;
