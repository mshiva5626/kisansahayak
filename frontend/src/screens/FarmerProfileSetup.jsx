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

    const inputClasses = "w-full px-4 py-3.5 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm shadow-sm placeholder:text-gray-400";
    const labelClasses = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1";

    const farmingTypes = ['Crop Farming', 'Mixed Farming', 'Organic Farming', 'Dairy Farming', 'Horticulture'];

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 min-h-screen flex flex-col antialiased">
            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Complete Profile</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 px-6 pb-12 overflow-y-auto no-scrollbar">
                <div className="mb-8 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <span className="material-icons-round text-4xl text-primary">person_add</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Tell us more about yourself to personalize your experience.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
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

                    <div className="grid grid-cols-2 gap-4">
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
                        <select
                            name="farmingType"
                            value={formData.farmingType}
                            onChange={handleChange}
                            className={inputClasses}
                        >
                            {farmingTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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

                    <div className="pt-6">
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-dark text-background-dark font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                        >
                            Save & Continue
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default FarmerProfileSetup;
