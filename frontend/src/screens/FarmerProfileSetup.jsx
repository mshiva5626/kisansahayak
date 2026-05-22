import React, { useState } from 'react';

const FarmerProfileSetup = ({ onComplete, onBack }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        state: '',
        district: '',
        farmingType: 'Crop Farming',
        landSize: '',
        experience: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const profileData = {
            name: formData.name,
            mobile_number: formData.phone || '',
            state: formData.state || '',
            district: formData.district || '',
            farming_type: formData.farmingType || 'Crop Farming'
        };
        onComplete(profileData);
    };

    const inputClasses = "w-full px-4 py-3.5 rounded-xl bg-white/40 dark:bg-black/30 backdrop-blur-md border border-white/60 dark:border-emerald-500/10 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 outline-none transition-all text-sm shadow-sm placeholder:text-gray-400 text-gray-900 dark:text-white";
    const labelClasses = "block text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1.5 ml-1";

    const farmingTypes = ['Crop Farming', 'Mixed Farming', 'Organic Farming', 'Dairy Farming', 'Horticulture'];

    return (
        <div className="bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] font-display text-slate-800 dark:text-slate-100 min-h-screen flex flex-col antialiased relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-white/30 dark:bg-[#03140A]/30 backdrop-blur-md z-10 border-b border-white/20 dark:border-emerald-500/5">
                <button 
                    onClick={onBack} 
                    className="p-2 -ml-2 rounded-full hover:bg-white/40 dark:hover:bg-white/5 transition-all text-slate-800 dark:text-slate-200 active:scale-90 tactile-btn"
                >
                    <span className="material-icons-round text-2xl">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Complete Profile</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 px-6 pb-12 overflow-y-auto no-scrollbar relative z-10">
                <div className="mb-6 text-center mt-4">
                    <div className="relative w-20 h-20 mx-auto mb-3">
                        {/* Pulsing ring */}
                        <div className="absolute inset-0 rounded-full border border-emerald-500/40 animate-ping opacity-75"></div>
                        <div className="relative w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                            <span className="material-icons-round text-4xl text-emerald-600 dark:text-emerald-400">person_add</span>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs max-w-[260px] mx-auto leading-relaxed">
                        Tell us more about yourself to personalize your experience.
                    </p>
                </div>

                <div className="krishi-glass rounded-2xl p-5 shadow-lg border border-white/50 dark:border-emerald-500/10">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={labelClasses}>Full Name</label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Rajesh Kumar"
                                className={inputClasses}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Phone Number</label>
                            <input
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                                className={inputClasses}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClasses}>State</label>
                                <input
                                    required
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="e.g. Punjab"
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>District</label>
                                <input
                                    required
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    placeholder="e.g. Ludhiana"
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Farming Type</label>
                            <div className="relative">
                                <select
                                    name="farmingType"
                                    value={formData.farmingType}
                                    onChange={handleChange}
                                    className={`${inputClasses} appearance-none cursor-pointer pr-10`}
                                    style={{ colorScheme: 'dark' }}
                                >
                                    {farmingTypes.map(t => (
                                        <option key={t} value={t} className="bg-white dark:bg-[#081d11] text-slate-900 dark:text-white">{t}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 dark:text-emerald-400">
                                    <span className="material-icons-round">keyboard_arrow_down</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClasses}>Land (Acres)</label>
                                <input
                                    type="number"
                                    name="landSize"
                                    value={formData.landSize}
                                    onChange={handleChange}
                                    placeholder="Area"
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Experience (Yrs)</label>
                                <input
                                    type="number"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleChange}
                                    placeholder="Years"
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full btn-glass-glow text-white font-bold text-base py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all tactile-btn cursor-pointer"
                            >
                                Save & Continue
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default FarmerProfileSetup;
