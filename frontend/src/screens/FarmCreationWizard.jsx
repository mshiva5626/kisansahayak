import React, { useState, useEffect } from 'react';
import { farmAPI } from '../api';

const FarmCreationWizard = ({ onBack, onComplete }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle | fetching | success | error
    const [formData, setFormData] = useState({
        name: '',
        area: '',
        unit: 'Acres',
        latitude: '',
        longitude: '',
        state: '',
        district: '',
        address: '',
        terrain: 'Plain',
        waterSources: ['Rainfed'],
        crop: 'Wheat',
        sowingDate: ''
    });

    // Fetch GPS location when entering step 2
    useEffect(() => {
        if (step === 2 && !formData.latitude) {
            fetchCurrentLocation();
        }
    }, [step]);

    const fetchCurrentLocation = () => {
        setLocationStatus('fetching');
        if (!navigator.geolocation) {
            setLocationStatus('error');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                setFormData(prev => ({ ...prev, latitude: lat.toFixed(4), longitude: lon.toFixed(4) }));
                setLocationStatus('success');
                // Try to get address from coordinates via reverse geocoding
                try {
                    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`);
                    const geo = await resp.json();
                    if (geo && geo.address) {
                        setFormData(prev => ({
                            ...prev,
                            state: geo.address.state || '',
                            district: geo.address.state_district || geo.address.county || geo.address.city || '',
                            address: geo.display_name || ''
                        }));
                    }
                } catch (e) {
                    console.log('Reverse geocoding failed, using coords only');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLocationStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleNext = async () => {
        if (step === 1) {
            if (!formData.name || !formData.area) return alert('Please provide farm name and area.');
        } else if (step === 2) {
            if (!formData.latitude || !formData.longitude) return alert('Please pin your farm location.');
        } else if (step === 3) {
            if (!formData.terrain || formData.waterSources.length === 0) return alert('Please select terrain and at least one water source.');
        }

        if (step < 4) {
            setStep(step + 1);
        } else {
            if (!formData.crop) return alert('Please specify the primary crop.');

            try {
                setIsLoading(true);
                const payload = {
                    name: formData.name,
                    farm_name: formData.name,
                    area: formData.area,
                    latitude: parseFloat(formData.latitude) || 0,
                    longitude: parseFloat(formData.longitude) || 0,
                    state: formData.state,
                    terrain_type: formData.terrain,
                    water_source: formData.waterSources.join(', '),
                    crop_type: formData.crop,
                    sowing_date: formData.sowingDate,
                    location: {
                        lat: parseFloat(formData.latitude) || 0,
                        lon: parseFloat(formData.longitude) || 0,
                        address: formData.address
                    }
                };
                const { data } = await farmAPI.createFarm(payload);
                onComplete(data.farm);
            } catch (error) {
                alert('Failed to save farm: ' + (error.response?.data?.message || error.message));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            onBack();
        }
    };

    const coordsDisplay = formData.latitude && formData.longitude
        ? `${formData.latitude}° N, ${formData.longitude}° E`
        : 'Not set';

    const inputClasses = "w-full px-4 py-3.5 rounded-xl bg-white/40 dark:bg-black/30 border border-white/60 dark:border-emerald-500/10 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 outline-none text-slate-905 dark:text-white transition-all text-sm";
    const labelClasses = "block text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 ml-1";

    return (
        <div className="bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] text-slate-800 dark:text-slate-100 font-display antialiased min-h-screen flex flex-col relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header */}
            <header className={`flex items-center justify-between px-6 pt-12 pb-4 z-20 shrink-0 border-b border-white/20 dark:border-emerald-500/5 bg-white/30 dark:bg-[#03140A]/30 backdrop-blur-md ${step === 2 ? 'absolute top-0 left-0 w-full' : ''}`}>
                <button
                    onClick={handleBack}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 dark:bg-white/10 shadow-sm active:scale-95 transition-transform text-slate-800 dark:text-white tactile-btn"
                >
                    <span className="material-icons">arrow_back</span>
                </button>
                <h1 className={`text-base font-bold tracking-tight ${step === 2 ? 'text-slate-950 dark:text-white drop-shadow-md' : 'text-slate-900 dark:text-white'}`}>
                    {step === 4 ? 'Review & Confirm' : 'Add Connected Farm'}
                </h1>
                <div className="w-10"></div>
            </header>

            {/* Step 2 Map Background */}
            {step === 2 && (
                <div className="absolute inset-0 z-0">
                    <img
                        alt="Map"
                        className="w-full h-full object-cover saturate-110 contrast-110"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWmm-zamQdZ3NiMoxZ0_oJTwhTSgvEnMpeQkpVaKl8pM13n9GZ4XeoQAVXEpIrFFccsMVbSOPfr6jGil0XBAtZZVhOOMbbcfaEqPaXN-ceD9QRksZgqgvwty25jRNE0PZ4LT2KxHeDIBF5grDX4spmyEQtfaRmpXxlD_L_uRNMd0fbWoZy8zb4ctfSijC7hBh8TRA8QKlWKcqbEz5WRqjmfXtRO09yCHgYHjJwpYxHWnD0o4g457wHpxU2li4WaOMlPkjEspBFB6La"
                    />
                    <div className="absolute inset-0 bg-black/10 dark:bg-[#03140A]/20"></div>
                </div>
            )}

            {/* Main Content Area */}
            <main className={`flex-1 z-10 flex flex-col overflow-y-auto no-scrollbar pb-36 ${step === 2 ? 'relative' : 'px-6'}`}>
                {/* Progress Indicator */}
                {step !== 2 && step !== 4 && (
                    <div className="mb-6 mt-6">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Step {step} of 4</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{Math.round((step / 4) * 100)}% Complete</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-[#13ec13] rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                style={{ width: `${(step / 4) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className="animate-fade-in space-y-6 mt-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight">Create Farm Sheet</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-1">Configure your farm coordinates and dimensions to feed localized satellite insights.</p>
                        </div>
                        <div className="krishi-glass rounded-2xl p-5 shadow-lg border border-white/50 dark:border-emerald-500/10">
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClasses}>Farm Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Green Valley Field"
                                        className={inputClasses}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Total Size</label>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            placeholder="0.0"
                                            className={`${inputClasses} flex-1 rounded-r-none border-r-0`}
                                            value={formData.area}
                                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        />
                                        <select
                                            className="px-4 py-3.5 bg-slate-50 dark:bg-[#081d11] border border-white/60 dark:border-emerald-500/10 rounded-r-xl text-xs font-bold text-slate-700 dark:text-emerald-400 outline-none cursor-pointer"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            style={{ colorScheme: 'dark' }}
                                        >
                                            <option className="bg-white dark:bg-[#081d11] text-slate-900 dark:text-white">Acres</option>
                                            <option className="bg-white dark:bg-[#081d11] text-slate-900 dark:text-white">Hectares</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Location Pinning */}
                {step === 2 && (
                    <div className="relative h-full pointer-events-none">
                        {/* Map Overlay Info */}
                        <div className="absolute top-28 left-6 right-6 pointer-events-auto">
                            <div className="krishi-glass p-5 rounded-2xl shadow-xl border border-white/60 dark:border-emerald-500/10 max-h-[70vh] overflow-y-auto no-scrollbar">
                                <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    <span>Step 2 of 4</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">50% Complete</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-white/10 h-1 rounded-full mb-3.5">
                                    <div className="bg-emerald-500 h-full rounded-full w-1/2"></div>
                                </div>
                                <h1 className="text-base font-bold text-slate-950 dark:text-white">Pin coordinates</h1>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mb-3">
                                    {locationStatus === 'fetching' ? 'Pinpointing GPS location via satellite...' :
                                        locationStatus === 'success' ? 'Coordinates found! Tap to refresh GPS sensor.' :
                                            locationStatus === 'error' ? 'GPS failed. Please enter coordinates manually below.' :
                                                'Enable GPS or input coordinate grids.'}
                                </p>

                                {/* Coordinates Display */}
                                {formData.latitude && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-3">
                                        <div className="flex items-center gap-1.5 mb-1 text-emerald-700 dark:text-emerald-400">
                                            <span className="material-icons text-sm">my_location</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wide">Pin Details</span>
                                        </div>
                                        <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">{coordsDisplay}</p>
                                        {formData.address && (
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">{formData.address}</p>
                                        )}
                                    </div>
                                )}

                                {/* Manual coordinate entry */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 block ml-0.5">Latitude</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            placeholder="e.g. 18.5204"
                                            className={`${inputClasses} px-3 py-2 text-xs`}
                                            value={formData.latitude}
                                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 block ml-0.5">Longitude</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            placeholder="e.g. 73.8567"
                                            className={`${inputClasses} px-3 py-2 text-xs`}
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 block ml-0.5">State</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Punjab"
                                            className={`${inputClasses} px-3 py-2 text-xs`}
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 block ml-0.5">District</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Ludhiana"
                                            className={`${inputClasses} px-3 py-2 text-xs`}
                                            value={formData.district}
                                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Central Pin */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-16">
                            <div className="flex flex-col items-center">
                                <div className="mb-1.5 px-2.5 py-0.5 bg-black/80 dark:bg-[#03140A]/90 text-white text-[9px] font-bold rounded-md shadow-md border border-white/10 uppercase tracking-wider">
                                    {locationStatus === 'success' ? '📍 Pin Active' : 'Target'}
                                </div>
                                <div className={`relative w-8 h-8 ${locationStatus === 'success' ? 'bg-emerald-500' : 'bg-slate-400'} rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-300`}>
                                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                    {locationStatus === 'success' && (
                                        <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-75"></div>
                                    )}
                                </div>
                                <div className={`w-0.5 h-6 ${locationStatus === 'success' ? 'bg-emerald-500' : 'bg-slate-400'} transition-all`}></div>
                            </div>
                        </div>

                        {/* Location FAB */}
                        <div className="absolute bottom-40 right-6 pointer-events-auto">
                            <button
                                onClick={fetchCurrentLocation}
                                className={`${locationStatus === 'fetching' ? 'animate-pulse scale-95' : ''} bg-white dark:bg-[#03140A] border border-white/60 dark:border-emerald-500/20 p-3.5 rounded-xl shadow-lg text-emerald-500 active:scale-90 transition-transform cursor-pointer flex items-center justify-center`}
                            >
                                <span className="material-icons-round text-xl">{locationStatus === 'fetching' ? 'sync' : 'my_location'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Terrain & Water */}
                {step === 3 && (
                    <div className="animate-fade-in space-y-6 mt-4 tilt-card-container">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">Terrain Landscape</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Select agricultural topography of your field.</p>
                            <div className="space-y-3.5 text-left">
                                {['Plain', 'Sloping', 'Hilly'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setFormData({ ...formData, terrain: t })}
                                        className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all tilt-card cursor-pointer ${formData.terrain === t ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-md' : 'border-white/60 dark:border-white/5 bg-white/40 dark:bg-white/5'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.terrain === t ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                            <span className="material-icons text-2xl">{t === 'Plain' ? 'landscape' : t === 'Sloping' ? 'terrain' : 'filter_hdr'}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-bold text-sm ${formData.terrain === t ? 'text-slate-955 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{t} Fields</h3>
                                            <p className="text-[10px] opacity-60 leading-none mt-1">Excellent soil stability for robust tillage.</p>
                                        </div>
                                        {formData.terrain === t && <span className="material-icons text-emerald-500">check_circle</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline mb-3">
                                <h2 className="text-xl font-bold tracking-tight text-slate-955 dark:text-white">Primary Water Source</h2>
                                <span className="text-[9px] uppercase font-bold text-emerald-500 tracking-wider">Multi-select</span>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {['Rainfed', 'Canal', 'Borewell', 'Drip', 'Sprinkler'].map((w) => (
                                    <button
                                        key={w}
                                        onClick={() => {
                                            const newSources = formData.waterSources.includes(w)
                                                ? formData.waterSources.filter(s => s !== w)
                                                : [...formData.waterSources, w];
                                            setFormData({ ...formData, waterSources: newSources });
                                        }}
                                        className={`px-4 py-2.5 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer tactile-btn ${
                                            formData.waterSources.includes(w) 
                                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                                                : 'border-white/60 dark:border-white/5 bg-white/40 dark:bg-white/5 text-slate-500'
                                        }`}
                                    >
                                        <span className="material-icons-round text-base">{w === 'Rainfed' ? 'cloud' : w === 'Canal' ? 'water' : 'opacity'}</span>
                                        <span>{w}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div className="animate-fade-in space-y-4 px-1 mt-4">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight">Review & Confirm</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verify that your agricultural layout is configured correctly.</p>
                        </div>

                        <div className="space-y-4 text-left">
                            {/* General Info */}
                            <div className="krishi-glass rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2.5 mb-3 border-b border-white/20 dark:border-emerald-500/5 pb-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <span className="material-icons-outlined text-base">assignment</span>
                                    </div>
                                    <h3 className="text-sm font-bold">General Dimensions</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Farm Title</p><p className="font-bold text-xs">{formData.name || 'Not set'}</p></div>
                                    <div><p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Calculated Area</p><p className="font-bold text-xs">{formData.area || '0'} {formData.unit}</p></div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="krishi-glass rounded-2xl p-5 shadow-sm relative overflow-hidden">
                                <div className="flex items-center gap-2.5 mb-3 border-b border-white/20 dark:border-emerald-500/5 pb-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <span className="material-icons-outlined text-base">place</span>
                                    </div>
                                    <h3 className="text-sm font-bold">Location Pin</h3>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2.5">
                                        <div><p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Regional Territory</p><p className="font-bold text-xs">{formData.district || 'Not set'}, {formData.state || 'Not set'}</p></div>
                                        <div><p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">GPS Coordinate</p><p className="font-bold text-[10px] font-mono text-emerald-700 dark:text-emerald-400">{coordsDisplay}</p></div>
                                    </div>
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-emerald-500/10 dark:bg-[#081d11] border border-emerald-500/20 flex items-center justify-center shrink-0">
                                        {formData.latitude ? (
                                            <div className="text-center">
                                                <span className="material-icons text-emerald-500 text-2xl animate-pulse">pin_drop</span>
                                                <p className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mt-0.5">GPS PIN</p>
                                            </div>
                                        ) : (
                                            <span className="material-icons text-slate-300 text-3xl">location_off</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Crop Details */}
                            <div className="krishi-glass rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2.5 mb-3 border-b border-white/20 dark:border-emerald-500/5 pb-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <span className="material-icons-outlined text-base">grass</span>
                                    </div>
                                    <h3 className="text-sm font-bold">Active Crop Sheet</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-white/20 dark:border-emerald-500/5">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Crop Sown</p>
                                        <input
                                            type="text"
                                            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold text-right border border-emerald-500/20 focus:ring-1 focus:ring-emerald-500 outline-none min-w-[120px]"
                                            value={formData.crop}
                                            onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sowing Timestamp</p>
                                        <input
                                            type="date"
                                            className="text-xs font-bold bg-white/40 dark:bg-black/25 border border-white/60 dark:border-emerald-500/10 rounded-xl px-3 py-1.5 text-right focus:ring-1 focus:ring-emerald-500 outline-none min-w-[140px]"
                                            value={formData.sowingDate}
                                            onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Terrain Summary */}
                            <div className="krishi-glass rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2.5 mb-3 border-b border-white/20 dark:border-emerald-500/5 pb-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <span className="material-icons-outlined text-base">terrain</span>
                                    </div>
                                    <h3 className="text-sm font-bold">Terrain & Hydration</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Topography</p><p className="font-bold text-xs">{formData.terrain} Fields</p></div>
                                    <div><p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Water Systems</p><p className="font-bold text-xs truncate">{formData.waterSources.join(', ')}</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Action Bar */}
            <div className={`p-6 bg-gradient-to-t from-[#e3eae4] via-[#e3eae4] to-transparent dark:from-[#081d11] dark:via-[#081d11] pt-12 z-30 shrink-0 absolute bottom-0 left-0 w-full`}>
                <div className="flex flex-col gap-2.5">
                    <button
                        onClick={handleNext}
                        disabled={isLoading}
                        className="w-full btn-glass-glow text-white font-bold py-4 px-6 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 tactile-btn cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <span className="material-icons animate-spin text-lg">sync</span>
                                <span className="text-sm">Configuring Farm Sheet...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-sm">{step === 4 ? 'Confirm & Create Farm' : 'Continue'}</span>
                                <span className="material-icons text-lg">{step === 4 ? 'check_circle' : 'arrow_forward'}</span>
                            </>
                        )}
                    </button>
                    {step === 4 && (
                        <button onClick={() => setStep(1)} className="w-full py-2 text-slate-400 hover:text-emerald-500 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors">Review Configurations</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FarmCreationWizard;
