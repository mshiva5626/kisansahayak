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
        district: '',
        preferred_language: 'en'
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

    const inputClasses = "w-full bg-white/40 dark:bg-black/30 border border-white/60 dark:border-emerald-500/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all";

    return (
        <div className="bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] font-display text-slate-800 dark:text-slate-100 h-screen flex flex-col overflow-hidden antialiased relative">
            {/* Ambient glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Navigation */}
            <header className="flex-none px-6 pt-12 pb-4 flex items-center justify-between bg-white/30 dark:bg-[#03140A]/30 backdrop-blur-md sticky top-0 z-50 border-b border-white/20 dark:border-emerald-500/5">
                <button 
                    onClick={onBack} 
                    className="p-2 -ml-2 rounded-full hover:bg-white/40 dark:hover:bg-white/5 transition-all text-slate-800 dark:text-white active:scale-90 tactile-btn"
                >
                    <span className="material-icons-outlined text-2xl">chevron_left</span>
                </button>
                <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Profile & Settings</h1>
                <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all active:scale-95 tactile-btn ${isEditing ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}
                >
                    {isSaving ? 'Saving...' : isEditing ? 'Done' : 'Edit'}
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar px-5 pb-24 relative z-10">
                {/* Profile Card */}
                <section className="mt-4 mb-5">
                    <div className="krishi-glass rounded-2xl p-5 shadow-lg border border-white/50 dark:border-emerald-500/10">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img
                                    alt="Profile"
                                    className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/40"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV30o_jGYgPGZ1dja5QIZVRGd-DySKW5BdoaQMBrg8FMLfZmSdEMaBo_8oqFXODQfyovEpfDZMKF5VOL6_INMSmMW_EMBiQp7R_rOJpvS8gfo5wOlYGNerF5sMRHtqTQALxNtSSduITDWdKiupOw44l3qFBlCsWBoSGGGmAAL_adQHVPCGJHYUN3W3I_LGoDXPrHGlHwtC3dixbuWvYuHUnGixQs1O8rkEg-fIr2GIH_pd7Ewcvz5jeM8OQyMhHGbeix0Bu4K-xSL3"
                                />
                                {isEditing && (
                                    <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full shadow-md flex items-center justify-center border border-white dark:border-[#03140A]">
                                        <span className="material-icons-outlined text-xs">photo_camera</span>
                                    </div>
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
                                            className={inputClasses}
                                        />
                                        <input
                                            type="text"
                                            value={formData.mobile_number}
                                            onChange={e => setFormData({ ...formData, mobile_number: e.target.value })}
                                            placeholder="Mobile Number"
                                            className={inputClasses}
                                        />
                                        <input
                                            type="text"
                                            value={formData.farming_type}
                                            onChange={e => setFormData({ ...formData, farming_type: e.target.value })}
                                            placeholder="Primary Crop (e.g. Cotton)"
                                            className={inputClasses}
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formData.state}
                                                onChange={e => setFormData({ ...formData, state: e.target.value })}
                                                placeholder="State"
                                                className={`${inputClasses} w-1/2`}
                                            />
                                            <input
                                                type="text"
                                                value={formData.district}
                                                onChange={e => setFormData({ ...formData, district: e.target.value })}
                                                placeholder="District"
                                                className={`${inputClasses} w-1/2`}
                                            />
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={formData.preferred_language || 'en'}
                                                onChange={e => setFormData({ ...formData, preferred_language: e.target.value })}
                                                className={`${inputClasses} appearance-none pr-8`}
                                                style={{ colorScheme: 'dark' }}
                                            >
                                                <option value="en" className="bg-white dark:bg-[#081d11] text-slate-900 dark:text-white">English</option>
                                                <option value="hi" className="bg-white dark:bg-[#081d11] text-slate-900 dark:text-white">Hindi</option>
                                                <option value="mr" className="bg-white dark:bg-[#081d11] text-slate-900 dark:text-white">Marathi</option>
                                                <option value="te" className="bg-white dark:bg-[#081d11] text-slate-900 dark:text-white">Telugu</option>
                                                <option value="ta" className="bg-white dark:bg-[#081d11] text-slate-900 dark:text-white">Tamil</option>
                                                <option value="gu" className="bg-white dark:bg-[#081d11] text-slate-900 dark:text-white">Gujarati</option>
                                                <option value="bn" className="bg-white dark:bg-[#081d11] text-slate-900 dark:text-white">Bengali</option>
                                                <option value="pa" className="bg-white dark:bg-[#081d11] text-slate-900 dark:text-white">Punjabi</option>
                                            </select>
                                            <span className="material-icons-round text-emerald-500 absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">keyboard_arrow_down</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-base font-bold text-slate-950 dark:text-white truncate">{userProfile?.name || 'Farmer'}</h2>
                                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{userProfile?.email}</p>
                                        <div className="flex items-center text-slate-500 dark:text-slate-400 mt-1">
                                            <span className="material-icons-outlined text-xs mr-1">{userProfile?.mobile_number ? 'phone' : 'location_on'}</span>
                                            <span className="text-xs truncate">{userProfile?.mobile_number || 'No phone set'} • {userProfile?.state || 'No state'}</span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 tracking-wider">
                                                {userProfile?.farming_type || 'Crop Not Set'}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Settings Group: Preferences */}
                <section className="mb-5">
                    <h3 className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2 ml-1">Preferences</h3>
                    <div className="krishi-glass rounded-2xl overflow-hidden shadow-md border border-white/50 dark:border-emerald-500/10">
                        {[
                            { label: 'Language Selection', sub: 'Change preferred app language', icon: 'translate', screen: 'language', color: 'emerald' },
                            { label: 'Farm Profiles', sub: 'Add, edit, or configure farms', icon: 'agriculture', screen: 'farm-list', color: 'emerald' }
                        ].map((item, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => onNavigate(item.screen)}
                                className="w-full flex items-center justify-between p-4 hover:bg-white/40 dark:hover:bg-white/5 transition-all group border-b border-white/20 dark:border-emerald-500/5 last:border-0 tactile-btn cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <span className="material-icons-outlined text-lg">{item.icon}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                                <span className="material-icons-outlined text-slate-400 group-hover:text-emerald-500 transition-colors">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Settings Group: Notifications */}
                <section className="mb-5">
                    <h3 className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2 ml-1">Alerts & Notifications</h3>
                    <div className="krishi-glass rounded-2xl overflow-hidden shadow-md border border-white/50 dark:border-emerald-500/10">
                        {/* Weather Alerts */}
                        <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-emerald-500/5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                                    <span className="material-icons-outlined text-lg">cloud</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Weather Alerts</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">Rain & Storm warning updates</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setWeatherAlerts(!weatherAlerts)}
                                className={`w-11 h-6 rounded-full relative cursor-pointer transition-all duration-300 border border-slate-200 dark:border-white/10 ${weatherAlerts ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-200 dark:bg-white/5'}`}
                            >
                                <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-300 ${weatherAlerts ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                            </div>
                        </div>
                        {/* Market Prices */}
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <span className="material-icons-outlined text-lg">currency_rupee</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Mandi Prices</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">Daily local APMC price updates</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setMarketPrices(!marketPrices)}
                                className={`w-11 h-6 rounded-full relative cursor-pointer transition-all duration-300 border border-slate-200 dark:border-white/10 ${marketPrices ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-200 dark:bg-white/5'}`}
                            >
                                <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-300 ${marketPrices ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Settings Group: Trust & AI */}
                <section className="mb-6">
                    <h3 className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2 ml-1">Trust & AI Advisory</h3>
                    <div className="krishi-glass rounded-2xl overflow-hidden shadow-md border border-white/50 dark:border-emerald-500/10">
                        {[
                            { label: 'AI Model Safety', sub: 'Learn how your crop logs are analyzed', icon: 'psychology', color: 'purple' },
                            { label: 'Agronomist Support', sub: 'Reach certified agricultural assistance', icon: 'headset_mic', color: 'rose' }
                        ].map((item, idx) => (
                            <button key={idx} className="w-full flex items-center justify-between p-4 hover:bg-white/40 dark:hover:bg-white/5 transition-all group border-b border-white/20 dark:border-emerald-500/5 last:border-0 tactile-btn cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl bg-${item.color}-500/10 dark:bg-${item.color}-500/20 flex items-center justify-center text-${item.color}-600 dark:text-${item.color}-400`}>
                                        <span className="material-icons-outlined text-lg">{item.icon}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                                <span className="material-icons-outlined text-slate-400 group-hover:text-emerald-500 transition-colors">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Logout */}
                <button 
                    onClick={handleLogout} 
                    className="w-full bg-white/40 dark:bg-white/5 text-red-500 dark:text-red-400 font-bold p-3.5 rounded-2xl mb-8 border border-red-500/20 shadow-md hover:bg-red-500/10 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer tactile-btn text-xs uppercase tracking-wider"
                >
                    <span className="material-icons-outlined text-base">logout</span>
                    Sign Out Securely
                </button>
                <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-mono mb-4">Kisan Sahayak v2.5.0</p>
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
