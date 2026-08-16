import React, { useState, useEffect } from 'react';
import { farmAPI } from '../api';
import InteractiveGoogleMap from '../components/InteractiveGoogleMap';
import { detectAndResolveCurrentLocation } from '../utils/geolocation';

const CROPS_LIST = [
    { name: 'Wheat', icon: '🌾', season: 'Rabi' },
    { name: 'Paddy (Rice)', icon: '🍚', season: 'Kharif' },
    { name: 'Cotton', icon: '🌿', season: 'Kharif' },
    { name: 'Soybean', icon: '🫘', season: 'Kharif' },
    { name: 'Sugarcane', icon: '🎋', season: 'Annual' },
    { name: 'Maize', icon: '🌽', season: 'Kharif' },
    { name: 'Mustard', icon: '🌻', season: 'Rabi' },
    { name: 'Onion', icon: '🧅', season: 'Rabi/Kharif' },
    { name: 'Tomato', icon: '🍅', season: 'All Season' },
    { name: 'Chilli', icon: '🌶️', season: 'All Season' },
    { name: 'Brinjal', icon: '🍆', season: 'All Season' },
    { name: 'Gram (Chana)', icon: '🧆', season: 'Rabi' },
    { name: 'Groundnut', icon: '🥜', season: 'Kharif' },
    { name: 'Potato', icon: '🥔', season: 'Rabi' }
];

const SOIL_TYPES = ['Black Clayey (Regur)', 'Alluvial Loam', 'Red & Yellow Soil', 'Sandy Loam', 'Laterite Soil'];
const WATER_SOURCES = ['Drip Irrigation', 'Borewell', 'Canal Water', 'Sprinkler System', 'Rainfed'];

const FarmCreationWizard = ({ onBack, onComplete }) => {
    // 2-Step Progressive Workflow: 1 = Farm & Crop Profile, 2 = Terrain Map & GPS Location
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form Data State
    const [formData, setFormData] = useState({
        name: '',
        area: '',
        unit: 'Acres',
        crop: 'Wheat',
        sowingDate: new Date().toISOString().split('T')[0],
        season: 'Rabi',
        soilType: 'Alluvial Loam',
        waterSources: ['Drip Irrigation'],
        latitude: 20.5937,
        longitude: 78.9629,
        state: '',
        district: '',
        subDistrict: '',
        village: '',
        address: '',
        plotNotes: '',
        source: 'GPS Terrain Pin'
    });

    // Auto-detect GPS when component mounts
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
                        address: loc.formattedAddress || prev.address
                    }));
                }
            })
            .catch(() => {
                // Ignore initial background locate failure
            });
    }, []);

    // Handle Map Pin / Location Selection from InteractiveGoogleMap
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
            source: locDetails.source || 'Interactive Map'
        }));
    };

    // Toggle water sources
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

    // Form submission
    const handleSaveFarm = async () => {
        if (!formData.name.trim()) {
            alert('Please provide a Farm Name.');
            setStep(1);
            return;
        }
        if (!formData.area || parseFloat(formData.area) <= 0) {
            alert('Please enter a valid farm area.');
            setStep(1);
            return;
        }
        if (!formData.latitude || !formData.longitude) {
            alert('Please pin your farm coordinates on the map.');
            return;
        }

        try {
            setIsLoading(true);
            const payload = {
                name: formData.name.trim(),
                farm_name: formData.name.trim(),
                area: parseFloat(formData.area),
                unit: formData.unit,
                crop_type: formData.crop,
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
            {/* Header */}
            <header className="sticky top-0 z-30 px-6 pt-12 pb-4 bg-[#07130c]/90 border-b border-white/10 backdrop-blur-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <button
                        onClick={step === 1 ? onBack : () => setStep(1)}
                        className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Back"
                    >
                        <span className="material-icons-round text-lg">arrow_back</span>
                    </button>

                    <div>
                        <h1 className="font-bold text-base md:text-lg text-white leading-tight flex items-center gap-2">
                            <span>{step === 1 ? 'Step 1: Farm & Crop Profile' : 'Step 2: Terrain Map & Field GPS'}</span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                                {step}/2
                            </span>
                        </h1>
                        <p className="text-xs text-emerald-400 font-medium">
                            {step === 1 ? 'Configure agronomic identity and crop schedule' : 'Pin precision boundary on Google Terrain map'}
                        </p>
                    </div>
                </div>

                {/* Step Indicator Progress Pills */}
                <div className="flex items-center gap-1.5">
                    <div
                        onClick={() => setStep(1)}
                        className={`w-8 h-2 rounded-full transition-all cursor-pointer ${
                            step === 1 ? 'bg-primary shadow-[0_0_10px_rgba(19,236,19,0.5)]' : 'bg-primary/40'
                        }`}
                    />
                    <div
                        onClick={() => formData.name && setStep(2)}
                        className={`w-8 h-2 rounded-full transition-all cursor-pointer ${
                            step === 2 ? 'bg-primary shadow-[0_0_10px_rgba(19,236,19,0.5)]' : 'bg-white/10'
                        }`}
                    />
                </div>
            </header>

            {/* Step 1: Agronomic & Crop Profile */}
            {step === 1 && (
                <main className="flex-1 max-w-2xl w-full mx-auto p-6 space-y-6 animate-fade-in pb-32">
                    {/* Basic Details Card */}
                    <div className="p-5 rounded-3xl bg-[#0c2415]/80 border border-white/10 backdrop-blur-md shadow-xl space-y-4">
                        <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-primary">agriculture</span>
                            <span>Farm Basic Identity</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-extrabold uppercase text-slate-300 mb-1.5 ml-1">
                                    Farm Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Green Acres North Field"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary focus:bg-white/10 transition-all font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-extrabold uppercase text-slate-300 mb-1.5 ml-1">
                                    Total Farm Size *
                                </label>
                                <div className="flex">
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 5.0"
                                        value={formData.area}
                                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        className="flex-1 px-4 py-3 rounded-l-2xl bg-white/5 border border-r-0 border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary focus:bg-white/10 transition-all font-semibold"
                                    />
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="px-3.5 py-3 rounded-r-2xl bg-[#0e2c1a] border border-white/10 text-emerald-300 text-xs font-bold focus:outline-none cursor-pointer"
                                    >
                                        <option value="Acres">Acres</option>
                                        <option value="Hectares">Hectares</option>
                                        <option value="Bigha">Bigha</option>
                                        <option value="Gunta">Gunta</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Primary Crop Selector */}
                    <div className="p-5 rounded-3xl bg-[#0c2415]/80 border border-white/10 backdrop-blur-md shadow-xl space-y-3">
                        <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-primary">eco</span>
                            <span>Select Primary Cultivated Crop</span>
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto no-scrollbar pr-1">
                            {CROPS_LIST.map((c) => {
                                const isSelected = formData.crop.toLowerCase() === c.name.toLowerCase() || formData.crop.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]);
                                return (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, crop: c.name, season: c.season })}
                                        className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                                            isSelected
                                                ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(19,236,19,0.2)]'
                                                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <span className="text-2xl shrink-0">{c.icon}</span>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold truncate">{c.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{c.season}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Soil Type & Irrigation Setup */}
                    <div className="p-5 rounded-3xl bg-[#0c2415]/80 border border-white/10 backdrop-blur-md shadow-xl space-y-4">
                        <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-primary">water_drop</span>
                            <span>Soil & Irrigation Profile</span>
                        </h3>

                        <div>
                            <label className="block text-[11px] font-extrabold uppercase text-slate-300 mb-1.5 ml-1">
                                Soil Type
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {SOIL_TYPES.map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, soilType: st })}
                                        className={`p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                                            formData.soilType === st
                                                ? 'bg-primary/20 border-primary text-emerald-300'
                                                : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-extrabold uppercase text-slate-300 mb-1.5 ml-1">
                                Water & Irrigation Sources (Select All That Apply)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {WATER_SOURCES.map((ws) => {
                                    const active = formData.waterSources.includes(ws);
                                    return (
                                        <button
                                            key={ws}
                                            type="button"
                                            onClick={() => toggleWaterSource(ws)}
                                            className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                active
                                                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                                                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <span className="material-icons-round text-sm">{active ? 'check_circle' : 'add'}</span>
                                            <span>{ws}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Continue to Step 2 Button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (!formData.name.trim()) return alert('Please enter a Farm Name.');
                            if (!formData.area) return alert('Please enter Farm Area.');
                            setStep(2);
                        }}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0ED054] to-[#0a9e3e] text-white font-extrabold text-sm shadow-xl shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                        <span>Next: Map Coordinates on Terrain View</span>
                        <span className="material-icons-round text-lg">arrow_forward</span>
                    </button>
                </main>
            )}

            {/* Step 2: Google Maps Terrain & Field Pinning */}
            {step === 2 && (
                <main className="flex-1 flex flex-col p-4 md:p-6 max-w-4xl w-full mx-auto space-y-4 animate-fade-in pb-32">
                    {/* Map Instructions Card */}
                    <div className="p-3.5 rounded-2xl bg-[#0c2415]/90 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-lg backdrop-blur-md">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
                            <div>
                                <p className="text-xs font-bold text-white">Google Maps High-Precision Terrain Pinning</p>
                                <p className="text-[11px] text-emerald-400">Drag marker directly to your field parcel or switch to Satellite view</p>
                            </div>
                        </div>
                        <span className="text-[10px] uppercase font-extrabold bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded-xl">
                            API Active
                        </span>
                    </div>

                    {/* Interactive Google Map Component with Terrain & Satellite Switcher */}
                    <InteractiveGoogleMap
                        initialLat={formData.latitude}
                        initialLon={formData.longitude}
                        selectedLocation={{ latitude: formData.latitude, longitude: formData.longitude }}
                        onLocationSelect={handleMapLocationSelect}
                        height="440px"
                    />

                    {/* Detected Location & Field Notes Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Auto-Resolved Address */}
                        <div className="p-4 rounded-2xl bg-[#0c2415]/80 border border-white/10 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base text-primary">location_on</span>
                                    <span>Detected Field Location</span>
                                </span>
                                <span className="text-[10px] text-emerald-400 font-mono">
                                    {Number(formData.latitude).toFixed(4)}°, {Number(formData.longitude).toFixed(4)}°
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-white bg-white/5 p-2.5 rounded-xl border border-white/5">
                                {formData.address || 'Pin location on the map above'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                                <div>State: <strong className="text-white">{formData.state || 'Detected via GPS'}</strong></div>
                                <div>District: <strong className="text-white">{formData.district || 'Detected via GPS'}</strong></div>
                            </div>
                        </div>

                        {/* Additional Plot Notes */}
                        <div className="p-4 rounded-2xl bg-[#0c2415]/80 border border-white/10 space-y-2">
                            <label className="block text-xs font-bold text-emerald-300">
                                Field Landmark / Survey No. (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Survey No. 42 / Near Canal / North Well"
                                value={formData.plotNotes}
                                onChange={(e) => setFormData({ ...formData, plotNotes: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-primary font-medium"
                            />
                            <p className="text-[10px] text-slate-400">Helps AI localize weather alerts and soil moisture satellite radar.</p>
                        </div>
                    </div>

                    {/* Review Summary Badge */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0c2e17] to-[#0e3b1d] border border-primary/40 flex flex-wrap items-center justify-between gap-3 shadow-xl">
                        <div>
                            <p className="text-xs font-extrabold text-white">{formData.name} • {formData.area} {formData.unit}</p>
                            <p className="text-[11px] text-emerald-300">{formData.crop} ({formData.season}) • {formData.soilType}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                            >
                                Edit Profile
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveFarm}
                                disabled={isLoading}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0ED054] to-[#0a9e3e] text-white text-xs font-black shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="material-icons-round animate-spin text-sm">sync</span>
                                        <span>Saving Farm...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons-round text-base">check_circle</span>
                                        <span>Confirm & Save Farm</span>
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
