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
        if (step < 4) {
            setStep(step + 1);
        } else {
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

    return (
        <div className="bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100 font-display antialiased min-h-screen flex flex-col relative overflow-hidden selection:bg-primary selection:text-white">
            {/* Header */}
            <header className={`flex items-center justify-between px-6 py-4 z-20 shrink-0 ${step === 2 ? 'absolute top-0 left-0 w-full' : ''}`}>
                <button
                    onClick={handleBack}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-white/10 shadow-sm active:scale-95 transition-transform"
                >
                    <span className="material-icons text-gray-600 dark:text-white">arrow_back</span>
                </button>
                <h1 className={`text-lg font-semibold tracking-tight ${step === 2 ? 'text-white drop-shadow-md' : 'text-gray-900 dark:text-white'}`}>
                    {step === 4 ? 'Review & Confirm' : 'Add New Farm'}
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
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>
            )}

            {/* Main Content Area */}
            <main className={`flex-1 z-10 flex flex-col overflow-y-auto no-scrollbar ${step === 2 ? 'relative' : 'px-6'}`}>
                {/* Progress Indicator */}
                {step !== 2 && step !== 4 && (
                    <div className="mb-8 mt-2">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-medium text-primary">Step {step} of 4</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round((step / 4) * 100)}% Completed</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(step / 4) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className="animate-fade-in space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Create Your Farm</h2>
                            <p className="text-gray-500 dark:text-gray-400">Let's start with the basics to set up your digital workspace.</p>
                        </div>
                        <div className="bg-white/70 dark:bg-[#102218]/60 backdrop-blur-xl border border-white/40 dark:border-primary/10 rounded-2xl p-6 shadow-sm">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Farm Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Green Valley Field"
                                        className="w-full px-4 py-4 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none text-gray-900 dark:text-white"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Size</label>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            placeholder="0.0"
                                            className="flex-1 px-4 py-4 rounded-l-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 border-r-0 focus:ring-2 focus:ring-primary outline-none text-gray-900 dark:text-white"
                                            value={formData.area}
                                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        />
                                        <select
                                            className="px-4 py-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-r-xl text-gray-500 outline-none"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        >
                                            <option>Acres</option>
                                            <option>Hectares</option>
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
                        <div className="absolute top-24 left-6 right-6 pointer-events-auto">
                            <div className="bg-white/85 dark:bg-[#102210]/85 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-white/30">
                                <div className="flex items-center justify-between mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                                    <span>Step 2 of 4</span>
                                    <span className="text-primary">50% Completed</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mb-3">
                                    <div className="bg-primary h-full rounded-full w-1/2"></div>
                                </div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Pin farm location</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                    {locationStatus === 'fetching' ? 'Detecting your location...' :
                                        locationStatus === 'success' ? 'Location detected! Tap to refresh.' :
                                            locationStatus === 'error' ? 'Could not detect location. Enter manually below.' :
                                                'Tap the button below to detect your farm location.'}
                                </p>

                                {/* Coordinates Display */}
                                {formData.latitude && (
                                    <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="material-icons text-primary text-sm">my_location</span>
                                            <span className="text-xs font-bold text-primary uppercase">GPS Coordinates</span>
                                        </div>
                                        <p className="text-sm font-mono font-semibold text-gray-800 dark:text-white">{coordsDisplay}</p>
                                        {formData.address && (
                                            <p className="text-xs text-gray-500 mt-1 truncate">{formData.address}</p>
                                        )}
                                    </div>
                                )}

                                {/* Manual coordinate entry */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Latitude</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            placeholder="e.g. 18.5204"
                                            className="w-full px-3 py-2.5 rounded-lg bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-primary outline-none text-sm text-gray-900 dark:text-white"
                                            value={formData.latitude}
                                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Longitude</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            placeholder="e.g. 73.8567"
                                            className="w-full px-3 py-2.5 rounded-lg bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-primary outline-none text-sm text-gray-900 dark:text-white"
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">State</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Maharashtra"
                                            className="w-full px-3 py-2.5 rounded-lg bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-primary outline-none text-sm text-gray-900 dark:text-white"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">District</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Pune"
                                            className="w-full px-3 py-2.5 rounded-lg bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-primary outline-none text-sm text-gray-900 dark:text-white"
                                            value={formData.district}
                                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Central Pin */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-12">
                            <div className="flex flex-col items-center">
                                <div className="mb-2 px-3 py-1 bg-black/80 text-white text-[10px] rounded-lg">
                                    {locationStatus === 'success' ? '📍 Location Pinned' : 'Target Location'}
                                </div>
                                <div className={`relative w-8 h-8 ${locationStatus === 'success' ? 'bg-primary' : 'bg-gray-400'} rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-colors`}>
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                    {locationStatus === 'success' && (
                                        <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-75"></div>
                                    )}
                                </div>
                                <div className={`w-0.5 h-6 ${locationStatus === 'success' ? 'bg-primary' : 'bg-gray-400'} transition-colors`}></div>
                            </div>
                        </div>

                        {/* Location FAB */}
                        <div className="absolute bottom-40 right-6 pointer-events-auto">
                            <button
                                onClick={fetchCurrentLocation}
                                className={`${locationStatus === 'fetching' ? 'animate-pulse' : ''} bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg text-primary active:scale-90 transition-transform`}
                            >
                                <span className="material-icons">{locationStatus === 'fetching' ? 'sync' : 'my_location'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Terrain & Water */}
                {step === 3 && (
                    <div className="animate-fade-in space-y-10">
                        <div>
                            <h2 className="text-xl font-bold mb-2">Terrain Type</h2>
                            <p className="text-sm text-gray-500 mb-6">Select landscape of your farm.</p>
                            <div className="space-y-4 text-left">
                                {['Plain', 'Sloping', 'Hilly'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setFormData({ ...formData, terrain: t })}
                                        className={`w-full p-5 rounded-2xl border flex items-center gap-5 transition-all ${formData.terrain === t ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-white/5'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${formData.terrain === t ? 'bg-primary text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}>
                                            <span className="material-icons text-3xl">{t === 'Plain' ? 'landscape' : t === 'Sloping' ? 'terrain' : 'filter_hdr'}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-semibold text-lg ${formData.terrain === t ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{t}</h3>
                                            <p className="text-xs opacity-60">Suitable for various crop types.</p>
                                        </div>
                                        {formData.terrain === t && <span className="material-icons text-primary">check_circle</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline mb-4">
                                <h2 className="text-xl font-bold">Water Source</h2>
                                <span className="text-xs text-primary font-medium">Multi-select</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {['Rainfed', 'Canal', 'Borewell', 'Drip', 'Sprinkler'].map((w) => (
                                    <button
                                        key={w}
                                        onClick={() => {
                                            const newSources = formData.waterSources.includes(w)
                                                ? formData.waterSources.filter(s => s !== w)
                                                : [...formData.waterSources, w];
                                            setFormData({ ...formData, waterSources: newSources });
                                        }}
                                        className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all flex items-center gap-2 ${formData.waterSources.includes(w) ? 'border-primary bg-primary/10 text-primary' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 text-gray-500'}`}
                                    >
                                        <span className="material-icons text-lg">{w === 'Rainfed' ? 'cloud' : w === 'Canal' ? 'water' : 'opacity'}</span>
                                        {w}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div className="animate-fade-in space-y-6 px-6">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold mb-2">Review & Confirm</h2>
                            <p className="text-sm text-gray-500">Verify your farm details before saving.</p>
                        </div>

                        <div className="space-y-6 text-left">
                            {/* General Info */}
                            <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-primary-dark">
                                        <span className="material-icons">assignment</span>
                                    </div>
                                    <h3 className="text-lg font-bold">General Info</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Farm Name</p><p className="font-semibold">{formData.name || 'Not set'}</p></div>
                                    <div><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Total Area</p><p className="font-semibold">{formData.area || '0'} {formData.unit}</p></div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-sm relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                        <span className="material-icons">place</span>
                                    </div>
                                    <h3 className="text-lg font-bold">Location</h3>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">State</p><p className="font-semibold text-sm">{formData.state || 'Not set'}</p></div>
                                        <div><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">District</p><p className="font-semibold text-sm">{formData.district || 'Not set'}</p></div>
                                        <div><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Coordinates</p><p className="font-semibold text-xs font-mono">{coordsDisplay}</p></div>
                                    </div>
                                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        {formData.latitude ? (
                                            <div className="text-center">
                                                <span className="material-icons text-primary text-2xl">pin_drop</span>
                                                <p className="text-[8px] text-primary font-bold mt-1">PINNED</p>
                                            </div>
                                        ) : (
                                            <span className="material-icons text-gray-300 text-3xl">location_off</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Crop Details */}
                            <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-dark">
                                        <span className="material-icons">grass</span>
                                    </div>
                                    <h3 className="text-lg font-bold">Crop Details</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-dashed border-gray-100 dark:border-white/10">
                                        <p className="text-sm text-gray-500">Crop Selected</p>
                                        <input
                                            type="text"
                                            className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-xl text-xs font-bold text-right border border-green-200/50 dark:border-green-800/50 focus:ring-1 focus:ring-primary outline-none min-w-[120px]"
                                            value={formData.crop}
                                            onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-500">Sowing Date</p>
                                        <input
                                            type="date"
                                            className="text-sm font-semibold bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-3 py-1.5 text-right focus:ring-1 focus:ring-primary outline-none min-w-[140px]"
                                            value={formData.sowingDate}
                                            onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Terrain & Water Summary */}
                            <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                        <span className="material-icons">terrain</span>
                                    </div>
                                    <h3 className="text-lg font-bold">Terrain & Water</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Terrain</p><p className="font-semibold text-sm">{formData.terrain}</p></div>
                                    <div><p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Water Sources</p><p className="font-semibold text-sm">{formData.waterSources.join(', ')}</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Action Bar */}
            <div className={`p-6 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark pt-12 z-30 shrink-0 ${step === 2 ? 'absolute bottom-0 left-0 w-full' : ''}`}>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleNext}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <span className="material-icons animate-spin text-lg">sync</span>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <span>{step === 4 ? 'Confirm & Save Farm' : 'Next Step'}</span>
                                <span className="material-icons text-lg">{step === 4 ? 'check_circle' : 'arrow_forward'}</span>
                            </>
                        )}
                    </button>
                    {step === 4 && (
                        <button onClick={() => setStep(1)} className="w-full py-3 text-gray-500 font-semibold text-sm">Review Again</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FarmCreationWizard;
