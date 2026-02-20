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

    return (
        <div className="w-full max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen relative flex flex-col font-display antialiased">
            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex justify-between items-center z-10 sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-sm">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-300">
                    <span className="material-icons-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h1>
                <button
                    onClick={() => onNavigate('settings')}
                    className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-primary"
                >
                    <span className="material-icons-outlined text-2xl">edit</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-5 pb-8 overflow-y-auto no-scrollbar">
                {/* Hero Section */}
                <div className="flex flex-col items-center mt-2 mb-8">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-full p-1 bg-white dark:bg-white/10 shadow-soft">
                            <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="material-icons-round text-primary text-5xl">person</span>
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-1 bg-white dark:bg-background-dark p-1 rounded-full">
                            <div className="bg-primary text-white rounded-full p-1 shadow-sm flex items-center justify-center w-8 h-8">
                                <span className="material-icons text-sm font-bold">check</span>
                            </div>
                        </div>
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">{displayProfile.name || 'Farmer'}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary-dark dark:text-primary text-xs font-semibold rounded-full border border-primary/20">
                            {displayProfile.farming_type || 'Farmer'}
                        </span>
                    </div>
                </div>

                {/* Personal Details Card */}
                <div className="bg-white dark:bg-white/5 rounded-2xl p-5 mb-5 shadow-soft border border-gray-100 dark:border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-icons-outlined text-primary text-xl">person</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Personal Details</h3>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Full Name', val: displayProfile.name || 'Not set', icon: 'badge' },
                            { label: 'Email', val: displayProfile.email || 'Not set', icon: 'email' },
                            { label: 'Mobile', val: displayProfile.mobile_number || 'Not set', icon: 'phone' },
                            { label: 'State', val: displayProfile.state || 'Not set', icon: 'location_on' },
                            { label: 'District', val: displayProfile.district || 'Not set', icon: 'map' },
                            { label: 'Language', val: displayProfile.preferred_language || 'English', icon: 'translate' }
                        ].map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                                    <span className="material-icons-outlined text-gray-400 text-sm">{detail.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 font-medium">{detail.label}</p>
                                    <p className={`text-sm font-medium ${detail.val === 'Not set' ? 'text-gray-400 italic' : 'text-gray-800 dark:text-gray-200'}`}>{detail.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Agricultural Profile Card */}
                <div className="bg-white dark:bg-white/5 rounded-2xl p-5 mb-5 shadow-soft border border-gray-100 dark:border-white/5 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full -ml-8 -mb-8 blur-2xl pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-outlined text-primary text-xl">agriculture</span>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Agricultural Profile</h3>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Farming Type</p>
                            <p className="text-base font-bold text-gray-900 dark:text-white capitalize">{displayProfile.farming_type || 'Not specified'}</p>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-2">
                            Farm-specific details are available on individual farm pages
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mb-6">
                    <button
                        onClick={() => onNavigate('settings')}
                        className="w-full py-3.5 bg-primary text-black rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-400 transition-colors shadow-sm"
                    >
                        <span className="material-icons-outlined">edit</span>
                        Edit Profile
                    </button>
                    <button
                        onClick={() => onNavigate('farm-list')}
                        className="w-full py-3.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
                    >
                        <span className="material-icons-outlined text-gray-500 dark:text-gray-400">landscape</span>
                        My Farms
                    </button>
                    <button onClick={onLogout} className="w-full py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-medium transition-colors text-sm">
                        Log Out
                    </button>
                </div>
                <p className="text-center text-xs text-gray-400 pb-4">App Version 2.4.0 • Kisan Sahayak</p>
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
