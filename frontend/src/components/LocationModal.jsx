import React, { useState } from 'react';
import { detectAndResolveCurrentLocation } from '../utils/geolocation';

// Curated list of major agricultural states and their prominent APMC market districts
const AGRI_LOCATIONS = [
    {
        state: "Madhya Pradesh",
        districts: ["Indore", "Ujjain", "Neemuch", "Mandsaur", "Khargone", "Bhopal", "Sehore", "Jabalpur", "Gwalior", "Hoshangabad", "Dewas", "Ratlam"]
    },
    {
        state: "Maharashtra",
        districts: ["Nashik", "Pune", "Thane", "Jalgaon", "Latur", "Solapur", "Nagpur", "Ahmednagar", "Kolhapur", "Amravati", "Sangli", "Nanded"]
    },
    {
        state: "Punjab",
        districts: ["Ludhiana", "Patiala", "Amritsar", "Jalandhar", "Bathinda", "Sangrur", "Ferozepur", "Hoshiarpur", "Gurdaspur", "Moga"]
    },
    {
        state: "Haryana",
        districts: ["Karnal", "Kurukshetra", "Ambala", "Sirsa", "Hisar", "Kaithal", "Panipat", "Sonipat", "Rohtak", "Fatehabad"]
    },
    {
        state: "Gujarat",
        districts: ["Rajkot", "Mehsana", "Surat", "Ahmedabad", "Amreli", "Junagadh", "Bhavnagar", "Vadodara", "Banaskantha", "Patan"]
    },
    {
        state: "Rajasthan",
        districts: ["Kota", "Sri Ganganagar", "Jaipur", "Jodhpur", "Bikaner", "Baran", "Alwar", "Nagaur", "Hanumangarh", "Chittorgarh"]
    },
    {
        state: "Odisha",
        districts: ["Cuttack", "Bargarh", "Sambalpur", "Bhubaneswar", "Balasore", "Ganjam", "Kalahandi", "Puri", "Bolangir", "Koraput"]
    },
    {
        state: "Uttar Pradesh",
        districts: ["Agra", "Ghaziabad", "Kanpur Nagar", "Varanasi", "Meerut", "Mathura", "Bareilly", "Aligarh", "Prayagraj", "Lucknow", "Gorakhpur", "Moradabad"]
    },
    {
        state: "Andhra Pradesh",
        districts: ["Guntur", "Kurnool", "Krishna", "West Godavari", "East Godavari", "Visakhapatnam", "Anantapur", "Nellore", "Chittoor"]
    },
    {
        state: "Telangana",
        districts: ["Warangal", "Nizamabad", "Hyderabad", "Khammam", "Karimnagar", "Nalgonda", "Mahabubnagar", "Medak", "Adilabad"]
    },
    {
        state: "Karnataka",
        districts: ["Kalaburagi", "Bengaluru Urban", "Belgaum", "Davanagere", "Shimoga", "Hubli", "Mysore", "Bellary", "Raichur", "Bagalkot"]
    },
    {
        state: "Tamil Nadu",
        districts: ["Chennai", "Erode", "Madurai", "Tiruchirappalli", "Coimbatore", "Thanjavur", "Salem", "Dindigul", "Vellore", "Tirunelveli"]
    },
    {
        state: "Bihar",
        districts: ["Purnia", "Patna", "Muzaffarpur", "Bhagalpur", "Gaya", "Samastipur", "Rohtas", "Katihar", "Begusarai"]
    },
    {
        state: "West Bengal",
        districts: ["Hooghly", "Kolkata", "Burdwan", "Nadia", "North 24 Parganas", "Murshidabad", "Malda", "Siliguri"]
    },
    {
        state: "Chhattisgarh",
        districts: ["Raipur", "Durg", "Rajnandgaon", "Bilaspur", "Dhamtari", "Mahasamund", "Janjgir-Champa"]
    }
];

const LocationModal = ({ isOpen, currentLocation, onSelectLocation, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [locatingStatus, setLocatingStatus] = useState('');
    const [locateError, setLocateError] = useState('');

    if (!isOpen) return null;

    // Handle High-Accuracy Multi-Tier GPS Location Detection
    const handleGPSDetect = async () => {
        setIsLocating(true);
        setLocateError('');
        setLocatingStatus('📡 Acquiring high-precision GPS satellites...');

        try {
            const location = await detectAndResolveCurrentLocation((progress) => {
                setLocatingStatus(progress.message);
            });

            onSelectLocation({
                state: location.state,
                district: location.district,
                subDistrict: location.subDistrict || '',
                city: location.city || location.district,
                locality: location.locality || '',
                latitude: location.latitude,
                longitude: location.longitude,
                source: location.source || 'GPS Verified'
            });

            setIsLocating(false);
            setLocatingStatus('');
            onClose();
        } catch (err) {
            console.warn('GPS Detection Error:', err.message);
            setLocateError(err.message || 'Could not access GPS. Please choose your district from the list below.');
            setIsLocating(false);
            setLocatingStatus('');
        }
    };

    // Filter districts and states
    const query = searchQuery.toLowerCase().trim();
    const filteredLocations = AGRI_LOCATIONS.map(item => {
        const stateMatches = item.state.toLowerCase().includes(query);
        const matchedDistricts = item.districts.filter(d => 
            stateMatches || d.toLowerCase().includes(query)
        );
        return {
            state: item.state,
            districts: matchedDistricts
        };
    }).filter(item => item.districts.length > 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-display">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative flex flex-col max-h-[85vh]">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <span className="material-icons text-xl">close</span>
                </button>

                {/* Header */}
                <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0ED054]/15 border border-[#0ED054]/30 text-[#0ED054] flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">location_on</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                            Select Mandi Location
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Updates live APMC rates, weather & AI advisory
                        </p>
                    </div>
                </div>

                {/* Current Active Location Display */}
                {currentLocation?.district && (
                    <div className="bg-[#0ED054]/10 border border-[#0ED054]/25 rounded-2xl p-2.5 mb-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#0ED054] animate-ping"></span>
                            <span className="text-xs font-extrabold text-[#0ED054]">
                                Active: {currentLocation.district}, {currentLocation.state}
                            </span>
                        </div>
                        <span className="text-[10px] bg-[#0ED054]/20 text-[#0ED054] font-bold px-2 py-0.5 rounded-full">
                            Current
                        </span>
                    </div>
                )}

                {/* 1-Click GPS Auto Detect Button */}
                <button
                    onClick={handleGPSDetect}
                    disabled={isLocating}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0ED054] via-[#10b94b] to-[#0a9e3d] text-white font-extrabold text-xs shadow-lg hover:shadow-[#0ED054]/30 border border-[#0ED054]/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer mb-3 uppercase tracking-wider"
                >
                    {isLocating ? (
                        <>
                            <span className="material-icons animate-spin text-sm">sync</span>
                            <span>Detecting GPS Location...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-base">my_location</span>
                            <span>Use Current GPS Location</span>
                        </>
                    )}
                </button>

                {isLocating && locatingStatus && (
                    <div className="bg-[#0ED054]/10 border border-[#0ED054]/30 rounded-2xl p-2.5 mb-2.5 text-center text-xs font-bold text-[#0ED054] animate-pulse flex items-center justify-center gap-2">
                        <span className="material-icons animate-spin text-sm">sync</span>
                        <span>{locatingStatus}</span>
                    </div>
                )}

                {locateError && (
                    <p className="text-[11px] text-amber-500 font-semibold mb-2.5 text-center bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                        {locateError}
                    </p>
                )}

                {/* Search Box */}
                <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">search</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Search district or state (e.g. Indore, Nashik)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#0ED054]"
                    />
                </div>

                {/* District & State Selection List */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5">
                    {filteredLocations.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                            No matching districts found. Try another search.
                        </div>
                    ) : (
                        filteredLocations.map((item) => (
                            <div key={item.state} className="space-y-1.5">
                                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 flex items-center justify-between">
                                    <span>{item.state}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">{item.districts.length} Mandis</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {item.districts.map((district) => {
                                        const isSelected = currentLocation?.district?.toLowerCase() === district.toLowerCase();
                                        return (
                                            <button
                                                key={district}
                                                onClick={() => {
                                                    onSelectLocation({
                                                        state: item.state,
                                                        district: district,
                                                        city: district,
                                                        source: 'Manual Selection'
                                                    });
                                                    onClose();
                                                }}
                                                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                                                    isSelected
                                                        ? 'bg-[#0ED054]/20 border-[#0ED054] text-[#0ED054]'
                                                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-[#0ED054]/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <span className="truncate">{district}</span>
                                                {isSelected && (
                                                    <span className="material-icons text-[#0ED054] text-sm shrink-0">check_circle</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Disclaimer */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400">
                    Sourced from Directorate of Marketing & Inspection (Agmarknet) & e-NAM
                </div>
            </div>
        </div>
    );
};

export default LocationModal;
