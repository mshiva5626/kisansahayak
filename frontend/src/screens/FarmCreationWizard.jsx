import React, { useState, useEffect } from 'react';
import { farmAPI } from '../api';
import InteractiveGoogleMap from '../components/InteractiveGoogleMap';
import { detectAndResolveCurrentLocation } from '../utils/geolocation';

const POPULAR_CROPS = [
    { name: 'Wheat', icon: '🌾' },
    { name: 'Paddy (Rice)', icon: '🍚' },
    { name: 'Cotton', icon: '🌿' },
    { name: 'Soybean', icon: '🫘' },
    { name: 'Sugarcane', icon: '🎋' },
    { name: 'Maize', icon: '🌽' },
    { name: 'Mustard', icon: '🌻' },
    { name: 'Onion', icon: '🧅' },
    { name: 'Tomato', icon: '🍅' },
    { name: 'Chilli', icon: '🌶️' },
    { name: 'Brinjal', icon: '🍆' },
    { name: 'Groundnut', icon: '🥜' },
    { name: 'Gram (Chana)', icon: '🧆' },
    { name: 'Potato', icon: '🥔' }
];

const SOIL_TYPES = [
    'Black Clayey (Regur)',
    'Alluvial Loam',
    'Red & Yellow Soil',
    'Sandy Loam',
    'Laterite / Mountain'
];

const IRRIGATION_OPTIONS = [
    'Drip Irrigation',
    'Borewell',
    'Canal Water',
    'Sprinkler System',
    'Rainfed'
];

const FarmCreationWizard = ({ onBack, onComplete }) => {
    // 3-Step Clear, Uncongested Workflow:
    // Step 1: Farm Name & Land Area
    // Step 2: Google Maps Terrain Pinning & Live Location
    // Step 3: Crop, Soil, Variety & Irrigation Details
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        area: '',
        unit: 'Acres',
        latitude: 20.5937,
        longitude: 78.9629,
        state: '',
        district: '',
        subDistrict: '',
        village: '',
        address: '',
        plotNotes: '',
        crop: 'Wheat',
        variety: '',
        sowingDate: new Date().toISOString().split('T')[0],
        soilType: 'Alluvial Loam',
        waterSources: ['Drip Irrigation'],
        source: 'GPS Terrain Map'
    });

    // Auto-detect GPS location when wizard opens
    useEffect(() => {
        detectAndResolveCurrentLocation()
            .then((loc) => {
                if (loc && loc.latitude) {
                    setFormData((prev) => ({
                        ...prev,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        state: loc.state && loc.state !== 'India' ? loc.state : prev.state,
                        district: loc.district || prev.district,
                        subDistrict: loc.subDistrict || prev.subDistrict,
                        village: loc.locality || prev.village,
                        address: loc.formattedAddress || prev.address
                    }));
                }
            })
            .catch(() => {
                // Ignore initial GPS silent fail
            });
    }, []);

    // Handle Map Pinning from Google Maps
    const handleMapLocationSelect = (locDetails) => {
        if (!locDetails) return;
        setFormData((prev) => ({
            ...prev,
            latitude: locDetails.latitude || prev.latitude,
            longitude: locDetails.longitude || prev.longitude,
            state: locDetails.state && locDetails.state !== 'India' ? locDetails.state : prev.state,
            district: locDetails.district || prev.district,
            subDistrict: locDetails.subDistrict || prev.subDistrict,
            village: locDetails.locality || prev.village,
            address: locDetails.formattedAddress || `${locDetails.district || 'Farm'}, ${locDetails.state || 'India'}`,
            source: locDetails.source || 'Google Map Pin'
        }));
    };

    // Toggle irrigation checkboxes
    const toggleWaterSource = (source) => {
        setFormData((prev) => {
            const exists = prev.waterSources.includes(source);
            if (exists) {
                if (prev.waterSources.length === 1) return prev;
                return { ...prev, waterSources: prev.waterSources.filter((s) => s !== source) };
            } else {
                return { ...prev, waterSources: [...prev.waterSources, source] };
            }
        });
    };

    // Step 1 Validation & Next
    const handleStep1Next = () => {
        if (!formData.name.trim()) {
            alert('Please enter a Farm Name (e.g. Ramesh North Field).');
            return;
        }
        if (!formData.area || parseFloat(formData.area) <= 0) {
            alert('Please enter a valid Land Area.');
            return;
        }
        setStep(2);
    };

    // Step 2 Validation & Next
    const handleStep2Next = () => {
        if (!formData.latitude || !formData.longitude) {
            alert('Please pin your farm coordinates on the map.');
            return;
        }
        setStep(3);
    };

    // Final Save Farm Submission
    const handleSaveFarm = async () => {
        const finalCrop = formData.crop?.trim() || 'Wheat';

        if (!finalCrop) {
            alert('Please type or select your cultivated crop.');
            return;
        }

        try {
            setIsLoading(true);
            const payload = {
                name: formData.name.trim(),
                farm_name: formData.name.trim(),
                area: parseFloat(formData.area),
                unit: formData.unit,
                crop_type: finalCrop,
                crop_variety: formData.variety.trim() || undefined,
                sowing_date: formData.sowingDate,
                soil_type: formData.soilType,
                water_source: formData.waterSources.join(', '),
                terrain_type: 'Topographic Terrain',
                state: formData.state || 'India',
                district: formData.district || 'Regional District',
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                location: {
                    lat: parseFloat(formData.latitude),
                    lon: parseFloat(formData.longitude),
                    address: formData.address || `${formData.district}, ${formData.state}`,
                    notes: formData.plotNotes
                }
            };

            const { data } = await farmAPI.createFarm(payload);
            onComplete(data.farm);
        } catch (error) {
            alert('Failed to register farm: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#07130c] text-slate-100 font-display antialiased flex flex-col relative selection:bg-emerald-500/30">
            {/* Top Navigation Bar with Clear 3-Step Indicator */}
            <header className="sticky top-0 z-30 px-6 pt-12 pb-4 bg-[#07130c]/90 border-b border-white/10 backdrop-blur-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (step === 1) onBack();
                            else setStep(step - 1);
                        }}
                        className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Back"
                    >
                        <span className="material-icons-round text-lg">arrow_back</span>
                    </button>

                    <div>
                        <h1 className="font-bold text-base md:text-lg text-white leading-tight flex items-center gap-2">
                            <span>
                                {step === 1 && 'Step 1: Farm & Land Area'}
                                {step === 2 && 'Step 2: Pin Location on Google Map'}
                                {step === 3 && 'Step 3: Crop, Soil & Irrigation'}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                                {step} of 3
                            </span>
                        </h1>
                        <p className="text-xs text-emerald-400 font-medium">
                            {step === 1 && 'Name your farm and define total land size'}
                            {step === 2 && 'Locate your agricultural plot on Google Terrain view'}
                            {step === 3 && 'Specify crops, sowing schedule and soil details'}
                        </p>
                    </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-2">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            onClick={() => {
                                if (s === 1) setStep(1);
                                if (s === 2 && formData.name && formData.area) setStep(2);
                                if (s === 3 && formData.name && formData.area && formData.latitude) setStep(3);
                            }}
                            className={`w-7 h-2 rounded-full transition-all cursor-pointer ${
                                step === s
                                    ? 'bg-primary shadow-[0_0_12px_rgba(19,236,19,0.6)] w-9'
                                    : step > s
                                        ? 'bg-primary/40'
                                        : 'bg-white/10'
                            }`}
                            title={`Jump to Step ${s}`}
                        />
                    ))}
                </div>
            </header>

            {/* ========================================================================= */}
            {/* STEP 1: FARM NAME & LAND AREA (Clean, Spacious, Uncongested)               */}
            {/* ========================================================================= */}
            {step === 1 && (
                <main className="flex-1 max-w-xl w-full mx-auto p-6 flex flex-col justify-center space-y-6 animate-fade-in pb-32">
                    {/* Welcome Banner */}
                    <div className="text-center space-y-1.5 mb-2">
                        <div className="w-14 h-14 mx-auto rounded-3xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
                            <span className="material-symbols-outlined text-3xl">add_location_alt</span>
                        </div>
                        <h2 className="text-xl font-extrabold text-white">Create New Farm Profile</h2>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                            Start by giving your farm a recognizable name and specifying your land measurement.
                        </p>
                    </div>

                    {/* Clean Form Card */}
                    <div className="p-6 md:p-8 rounded-3xl bg-[#0c2415]/85 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6">
                        {/* Farm Name Field */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
                                🌾 Farm Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Ramesh Green Field, East Plot #1"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white/10 transition-all shadow-inner"
                                autoFocus
                            />
                            <p className="text-[11px] text-slate-400">
                                Tip: Name your plots separately if you cultivate different crops.
                            </p>
                        </div>

                        {/* Land Size & Unit Field */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
                                📐 Total Land Size <span className="text-red-400">*</span>
                            </label>
                            <div className="flex">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    placeholder="e.g. 5.0"
                                    value={formData.area}
                                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                    className="flex-1 px-4 py-3.5 rounded-l-2xl bg-white/5 border border-r-0 border-white/10 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white/10 transition-all shadow-inner"
                                />
                                <select
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="px-4 py-3.5 rounded-r-2xl bg-[#0e2c1a] border border-white/10 text-emerald-300 text-xs font-bold focus:outline-none cursor-pointer"
                                >
                                    <option value="Acres">Acres</option>
                                    <option value="Hectares">Hectares</option>
                                    <option value="Bigha">Bigha</option>
                                    <option value="Gunta">Gunta</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Step 1 Next Button */}
                    <button
                        type="button"
                        onClick={handleStep1Next}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0ED054] to-[#0a9e3e] text-white font-extrabold text-sm shadow-xl shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                        <span>Next: Pin Field on Google Map</span>
                        <span className="material-icons-round text-lg">arrow_forward</span>
                    </button>
                </main>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: GOOGLE MAPS TERRAIN MAPPING & PINNING                             */}
            {/* ========================================================================= */}
            {step === 2 && (
                <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-4 animate-fade-in pb-32">
                    {/* Live Location Info Banner */}
                    <div className="p-3.5 rounded-2xl bg-[#0c2415]/90 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-lg backdrop-blur-md">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
                            <div>
                                <p className="text-xs font-bold text-white">Google Maps Field Pinning</p>
                                <p className="text-[11px] text-emerald-400">
                                    Map is centered at your live GPS. Drag marker or tap to position over your plot.
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] uppercase font-extrabold bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 rounded-xl">
                            Live GPS
                        </span>
                    </div>

                    {/* Interactive Google Map with Terrain / Satellite Toggle */}
                    <InteractiveGoogleMap
                        initialLat={formData.latitude}
                        initialLon={formData.longitude}
                        selectedLocation={{ latitude: formData.latitude, longitude: formData.longitude }}
                        onLocationSelect={handleMapLocationSelect}
                        height="420px"
                    />

                    {/* Detected Location Card & Survey Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-[#0c2415]/80 border border-white/10 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base text-primary">pin_drop</span>
                                    <span>Detected Field Address</span>
                                </span>
                                <span className="text-[10px] text-emerald-400 font-mono">
                                    {Number(formData.latitude).toFixed(4)}°, {Number(formData.longitude).toFixed(4)}°
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-white bg-white/5 p-2.5 rounded-xl border border-white/5 truncate">
                                {formData.address || 'Locating address...'}
                            </p>
                            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                                <div>State: <strong className="text-white">{formData.state || 'Detected'}</strong></div>
                                <div>District: <strong className="text-white">{formData.district || 'Detected'}</strong></div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#0c2415]/80 border border-white/10 space-y-1.5">
                            <label className="block text-xs font-bold text-emerald-300">
                                Survey No. / Field Notes (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Survey #42 / Near Canal Road / North Well"
                                value={formData.plotNotes}
                                onChange={(e) => setFormData({ ...formData, plotNotes: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-primary font-medium"
                            />
                            <p className="text-[10px] text-slate-400">
                                Used by AI to tailor hyper-local soil moisture and irrigation advisories.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 Actions */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                        >
                            Back to Name
                        </button>
                        <button
                            type="button"
                            onClick={handleStep2Next}
                            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#0ED054] to-[#0a9e3e] text-white text-xs font-extrabold shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                        >
                            <span>Next: Crop & Soil Details</span>
                            <span className="material-icons-round text-base">arrow_forward</span>
                        </button>
                    </div>
                </main>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: CROP, SOIL, IRRIGATION & SOWING DETAILS                           */}
            {/* ========================================================================= */}
            {step === 3 && (
                <main className="flex-1 max-w-2xl w-full mx-auto p-6 space-y-6 animate-fade-in pb-36">
                    {/* Cultivated Crop Input & Suggestions */}
                    <div className="p-5 rounded-3xl bg-[#0c2415]/85 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
                                🌿 Cultivated Crop Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Type crop name (e.g. Wheat, Paddy, Dragon Fruit, Cotton...)"
                                value={formData.crop}
                                onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                                className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white/10 transition-all shadow-inner"
                            />
                        </div>

                        {/* Quick One-Tap Crop Chips */}
                        <div className="space-y-1.5">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Quick Crop Suggestions:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {POPULAR_CROPS.map((c) => {
                                    const isSelected = formData.crop.toLowerCase().trim() === c.name.toLowerCase().trim();
                                    return (
                                        <button
                                            key={c.name}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, crop: c.name })}
                                            className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-primary/25 border-primary text-emerald-300 shadow-[0_0_12px_rgba(19,236,19,0.2)]'
                                                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                                            }`}
                                        >
                                            <span className="text-sm">{c.icon}</span>
                                            <span>{c.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Optional Crop Variety Input */}
                        <div className="pt-3 border-t border-white/10 space-y-1.5">
                            <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
                                Seed Variety / Hybrid Name <span className="text-slate-500 font-normal lowercase">(optional)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. HD-2967, Sharbati, Sona Masoori, BT-2, Desi"
                                value={formData.variety}
                                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Sowing Date & Soil Type */}
                    <div className="p-5 rounded-3xl bg-[#0c2415]/85 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
                        <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-primary">calendar_month</span>
                            <span>Sowing Date & Soil Profile</span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-extrabold uppercase text-slate-300 mb-1.5">
                                    Sowing Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.sowingDate}
                                    onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-primary"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-extrabold uppercase text-slate-300 mb-1.5">
                                    Soil Classification
                                </label>
                                <select
                                    value={formData.soilType}
                                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e2c1a] border border-white/10 text-emerald-300 text-xs font-bold focus:outline-none cursor-pointer"
                                >
                                    {SOIL_TYPES.map((st) => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Irrigation Facilities Multi-Select */}
                        <div className="pt-2 border-t border-white/10">
                            <label className="block text-[11px] font-extrabold uppercase text-slate-300 mb-2">
                                Irrigation Facilities (Select All That Apply)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {IRRIGATION_OPTIONS.map((irr) => {
                                    const active = formData.waterSources.includes(irr);
                                    return (
                                        <button
                                            key={irr}
                                            type="button"
                                            onClick={() => toggleWaterSource(irr)}
                                            className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                active
                                                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-sm'
                                                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <span className="material-icons-round text-sm">{active ? 'check_circle' : 'add'}</span>
                                            <span>{irr}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Final Confirmation & Save Card */}
                    <div className="p-4 rounded-3xl bg-gradient-to-r from-[#0c2e17] to-[#0e3b1d] border border-primary/40 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
                        <div>
                            <p className="text-xs font-black text-white">
                                {formData.name} • {formData.area} {formData.unit}
                            </p>
                            <p className="text-[11px] text-emerald-300 font-medium">
                                {formData.crop} • {formData.soilType} • {formData.district || 'India'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveFarm}
                                disabled={isLoading}
                                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0ED054] to-[#0a9e3e] text-white text-xs font-black shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 uppercase tracking-wider"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="material-icons-round animate-spin text-sm">sync</span>
                                        <span>Saving Profile...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons-round text-base">check_circle</span>
                                        <span>Register & Connect Farm</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </main>
            )}
        </div>
    );
};

export default FarmCreationWizard;
