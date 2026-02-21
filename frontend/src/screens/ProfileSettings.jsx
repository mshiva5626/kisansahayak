import React, { useState, useEffect } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import { authAPI } from '../api';

const ProfileSettings = ({ onBack, onSave, onNavigate, userProfile, setUserProfile, onLogout }) => {
    const [weatherAlerts, setWeatherAlerts] = useState(true);
    const [marketPrices, setMarketPrices] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Editable form state
    const [formData, setFormData] = useState({
        name: '',
        mobile_number: '',
        farming_type: '',
        state: '',
        district: ''
    });

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || '',
                mobile_number: userProfile.mobile_number || '',
                farming_type: userProfile.farming_type || '',
                state: userProfile.state || '',
                district: userProfile.district || '',
                preferred_language: userProfile.preferred_language || 'en'
            });
        }
    }, [userProfile]);

    const handleLogout = () => {
        if (onLogout) onLogout();
    };

    const handleSaveProfile = async () => {
        if (!isEditing) {
            setIsEditing(true);
            return;
        }

        setIsSaving(true);
        try {
            const { data } = await authAPI.updateProfile(formData);
            setUserProfile(data.user);
            setIsEditing(false);
            if (onSave) onSave();
        } catch (error) {
            alert('Failed to update profile: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 h-screen flex flex-col overflow-hidden antialiased">
            {/* Top Navigation */}
            <header className="flex-none px-6 pt-12 pb-4 flex items-center justify-between bg-white dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-50">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-800 dark:text-white">
                    <span className="material-icons-outlined text-2xl">chevron_left</span>
                </button>
                <h1 className="text-lg font-semibold tracking-tight">Profile & Settings</h1>
                <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className={`p-2 -mr-2 font-medium text-sm transition-colors ${isEditing ? 'text-primary' : 'text-gray-500'}`}
                >
                    {isSaving ? 'Saving...' : isEditing ? 'Done' : 'Edit'}
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar px-5 pb-24">
                {/* Profile Card */}
                <section className="mt-4 mb-8">
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-soft flex items-center gap-5 border border-gray-100 dark:border-white/5">
                        <div className="relative">
                            <img
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover ring-4 ring-background-light dark:ring-background-dark"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV30o_jGYgPGZ1dja5QIZVRGd-DySKW5BdoaQMBrg8FMLfZmSdEMaBo_8oqFXODQfyovEpfDZMKF5VOL6_INMSmMW_EMBiQp7R_rOJpvS8gfo5wOlYGNerF5sMRHtqTQALxNtSSduITDWdKiupOw44l3qFBlCsWBoSGGGmAAL_adQHVPCGJHYUN3W3I_LGoDXPrHGlHwtC3dixbuWvYuHUnGixQs1O8rkEg-fIr2GIH_pd7Ewcvz5jeM8OQyMhHGbeix0Bu4K-xSL3"
                            />
                            {isEditing && (
                                <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-lg hover:bg-primary-dark transition-colors flex items-center justify-center">
                                    <span className="material-icons-outlined text-sm">photo_camera</span>
                                </button>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Full Name"
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                                    />
                                    <input
                                        type="text"
                                        value={formData.mobile_number}
                                        onChange={e => setFormData({ ...formData, mobile_number: e.target.value })}
                                        placeholder="Mobile Number"
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                                    />
                                    <input
                                        type="text"
                                        value={formData.farming_type}
                                        onChange={e => setFormData({ ...formData, farming_type: e.target.value })}
                                        placeholder="Primary Crop (e.g. Cotton)"
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                                    />
                                    <input
                                        type="email"
                                        value={userProfile?.email || ''}
                                        disabled
                                        placeholder="Email (Read Only)"
                                        className="w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-500 cursor-not-allowed outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                                            placeholder="State"
                                            className="w-1/2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                                        />
                                        <input
                                            type="text"
                                            value={formData.district}
                                            onChange={e => setFormData({ ...formData, district: e.target.value })}
                                            placeholder="District"
                                            className="w-1/2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                                        />
                                    </div>
                                    <select
                                        value={formData.preferred_language || 'en'}
                                        onChange={e => setFormData({ ...formData, preferred_language: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                                    >
                                        <option value="en">English</option>
                                        <option value="hi">Hindi</option>
                                        <option value="mr">Marathi</option>
                                        <option value="te">Telugu</option>
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{userProfile?.name || 'Farmer'}</h2>
                                    <p className="text-sm text-gray-500 font-mono mt-0.5">{userProfile?.email}</p>
                                    <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1">
                                        <span className="material-icons-outlined text-base mr-1">{userProfile?.mobile_number ? 'phone' : 'location_on'}</span>
                                        <span className="text-sm truncate">{userProfile?.mobile_number || 'No phone set'} • {userProfile?.state || 'No state'}</span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-green-700 dark:text-green-300 border border-primary/20">
                                            {userProfile?.farming_type || 'Crop Not Set'}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* Settings Group: Preferences */}
                <section className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Preferences</h3>
                    <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
                        {[
                            { label: 'Language', sub: 'English (India)', icon: 'translate', color: 'blue' },
                            { label: 'Farm Details', sub: 'Crops, Soil Type, Size', icon: 'agriculture', color: 'amber' }
                        ].map((item, idx) => (
                            <button key={idx} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group border-b border-gray-100 dark:border-white/5 last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl bg-${item.color}-50 dark:bg-${item.color}-900/20 flex items-center justify-center text-${item.color}-600 dark:text-${item.color}-400`}>
                                        <span className="material-icons-outlined">{item.icon}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-base font-medium text-gray-900 dark:text-white">{item.label}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.sub}</p>
                                    </div>
                                </div>
                                <span className="material-icons-outlined text-gray-400">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Settings Group: Notifications */}
                <section className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Alerts & Notifications</h3>
                    <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
                        {/* Weather Alerts */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                                    <span className="material-icons-outlined">cloud</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-base font-medium text-gray-900 dark:text-white">Weather Alerts</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Rain & Storm warnings</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setWeatherAlerts(!weatherAlerts)}
                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${weatherAlerts ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${weatherAlerts ? 'translate-x-7' : 'translate-x-1'}`}></div>
                            </div>
                        </div>
                        {/* Market Prices */}
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <span className="material-icons-outlined">currency_rupee</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-base font-medium text-gray-900 dark:text-white">Mandi Prices</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Daily APMC updates</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setMarketPrices(!marketPrices)}
                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${marketPrices ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${marketPrices ? 'translate-x-7' : 'translate-x-1'}`}></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Settings Group: Trust & AI */}
                <section className="mb-8">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Trust & AI</h3>
                    <div className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
                        {[
                            { label: 'AI Transparency', sub: 'How we use your farm data', icon: 'psychology', color: 'purple' },
                            { label: 'Help & Support', sub: 'Contact our agronomists', icon: 'headset_mic', color: 'rose' }
                        ].map((item, idx) => (
                            <button key={idx} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group border-b border-gray-100 dark:border-white/5 last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl bg-${item.color}-50 dark:bg-${item.color}-900/20 flex items-center justify-center text-${item.color}-600 dark:text-${item.color}-400`}>
                                        <span className="material-icons-outlined">{item.icon}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-base font-medium text-gray-900 dark:text-white">{item.label}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.sub}</p>
                                    </div>
                                </div>
                                <span className="material-icons-outlined text-gray-400">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Logout */}
                <button onClick={handleLogout} className="w-full bg-white dark:bg-white/5 text-red-500 dark:text-red-400 font-medium p-4 rounded-xl mb-8 border border-red-100 dark:border-red-900/30 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2">
                    <span className="material-icons-outlined text-xl">logout</span>
                    Sign Out
                </button>
                <p className="text-center text-xs text-gray-400 mb-6">Kisan Sahayak v2.4.1</p>
            </main>

            {/* Bottom Navigation */}
            <BottomNavbar
                activeTab="community"
                onNavigate={onNavigate}
            />
        </div>
    );
};

export default ProfileSettings;
