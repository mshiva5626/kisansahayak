import React, { useState, useEffect } from 'react';
import { mandiAPI } from '../api';
import LocationModal from '../components/LocationModal';

const LiveMarketPrices = ({ onBack, userProfile, selectedFarmId, userLocation, onLocationChange }) => {
    const [prices, setPrices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    // Active State & District resolution
    const activeState = userLocation?.state || userProfile?.state || 'Madhya Pradesh';
    const activeDistrict = userLocation?.district || userProfile?.district || 'Indore';

    const fetchPrices = async (cropFilter = '', searchFilter = '') => {
        setIsLoading(true);
        setError(null);

        try {
            const { data } = await mandiAPI.getPrices(
                selectedFarmId || '', 
                activeState, 
                activeDistrict, 
                cropFilter === 'All' ? '' : cropFilter,
                searchFilter
            );
            setPrices(data.prices || []);
        } catch (err) {
            console.error("Failed to fetch Mandi prices:", err);
            setError(err.response?.data?.message || "Mandi price data unavailable for your area.");
            setPrices([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices(activeCategory === 'All' ? '' : activeCategory, searchQuery);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeState, activeDistrict, selectedFarmId]);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        fetchPrices(activeCategory === 'All' ? '' : activeCategory, searchQuery);
    };

    const handleCommodityChipClick = (cropName) => {
        setActiveCategory(cropName);
        fetchPrices(cropName === 'All' ? '' : cropName, searchQuery);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const commodityChips = [
        'All', 'Wheat', 'Soybean', 'Onion', 'Potato', 'Garlic', 
        'Mustard', 'Cotton', 'Red Chilli', 'Paddy', 'Turmeric', 'Cumin (Jeera)', 'Chana'
    ];

    // Client-side quick filter
    const filteredPrices = prices.filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const crop = (item.commodity || item.crop_name || '').toLowerCase();
        const market = (item.market_name || '').toLowerCase();
        const variety = (item.variety || '').toLowerCase();
        return crop.includes(q) || market.includes(q) || variety.includes(q);
    });

    return (
        <div className="relative flex min-h-full w-full flex-col overflow-hidden max-w-md mx-auto bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] font-display text-slate-900 dark:text-slate-100 antialiased pb-20">
            {/* Header Section */}
            <header className="relative bg-gradient-to-b from-[#021309] via-[#052615] to-[#0a3d22] text-white pb-6 pt-10 px-5 rounded-b-[2.5rem] border-b border-emerald-500/20 shadow-2xl z-10 overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#0ED054]/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none"></div>

                {/* Top Nav & Location Bar */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <button 
                        onClick={onBack} 
                        className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-2xl transition-all flex items-center justify-center cursor-pointer backdrop-blur-md border border-white/15"
                    >
                        <span className="material-symbols-outlined text-xl text-white">arrow_back</span>
                    </button>

                    {/* Interactive Mandi Location Badge (Upright) */}
                    <button
                        onClick={() => setIsLocationModalOpen(true)}
                        className="flex items-center space-x-2 bg-black/40 hover:bg-black/60 active:scale-95 border border-[#0ED054]/40 px-3.5 py-1.5 rounded-full text-white backdrop-blur-md transition-all cursor-pointer shadow-lg"
                        title="Change Mandi Location"
                    >
                        <span className="material-symbols-outlined text-base text-[#0ED054] animate-pulse">location_on</span>
                        <div className="text-left">
                            <span className="text-[9px] uppercase font-bold text-[#0ED054] block leading-none">Mandi Location</span>
                            <span className="text-xs font-extrabold text-white leading-tight">
                                {activeDistrict}, {activeState}
                            </span>
                        </div>
                        <span className="material-icons text-xs text-[#0ED054]">expand_more</span>
                    </button>
                </div>

                {/* Title & Verified Government Badge */}
                <div className="relative z-10 mb-4">
                    <div className="inline-flex items-center space-x-1.5 bg-[#0ED054]/15 border border-[#0ED054]/30 px-3 py-1 rounded-full mb-2">
                        <span className="w-2 h-2 rounded-full bg-[#0ED054] animate-ping"></span>
                        <span className="text-[10px] font-extrabold tracking-wider text-[#0ED054] uppercase">
                            Agmarknet & e-NAM Verified Daily Rates
                        </span>
                    </div>

                    <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2 leading-tight">
                        <span>Mandi Bhav</span>
                        <span className="text-[#0ED054] text-lg font-bold">(दैनिक थोक भाव)</span>
                    </h1>
                    <p className="text-xs text-gray-300">
                        Official APMC wholesale auction rates & daily price movements.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative z-10">
                    <form onSubmit={handleSearchSubmit} className="relative flex w-full items-center">
                        <div className="absolute left-3.5 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Search commodity or APMC mandi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-2xl border-none bg-white dark:bg-slate-900/90 py-3 pl-11 pr-10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0ED054] shadow-lg text-xs font-semibold"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); fetchPrices(activeCategory === 'All' ? '' : activeCategory, ''); }}
                                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <span className="material-icons text-sm">close</span>
                            </button>
                        )}
                    </form>
                </div>
            </header>

            {/* Quick Commodity Filter Chips */}
            <div className="px-4 py-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto no-scrollbar flex space-x-2">
                {commodityChips.map((chip) => {
                    const isSelected = activeCategory === chip;
                    return (
                        <button
                            key={chip}
                            onClick={() => handleCommodityChipClick(chip)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                                isSelected
                                    ? 'bg-[#0ED054] text-slate-950 shadow-md shadow-[#0ED054]/20 scale-105'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {chip}
                        </button>
                    );
                })}
            </div>

            {/* Main Mandi Rates List */}
            <main className="flex-1 px-4 py-4 overflow-y-auto no-scrollbar space-y-3">
                {isLoading ? (
                    <div className="py-16 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full border-3 border-[#0ED054] border-t-transparent animate-spin mx-auto"></div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Fetching verified Agmarknet rates for {activeDistrict}, {activeState}...
                        </p>
                    </div>
                ) : error ? (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs text-center space-y-2">
                        <span className="material-icons text-2xl text-amber-500">info</span>
                        <p className="font-semibold">{error}</p>
                        <button
                            onClick={() => setIsLocationModalOpen(true)}
                            className="py-2 px-4 rounded-xl bg-amber-600 text-white font-bold text-xs"
                        >
                            Change Mandi Location
                        </button>
                    </div>
                ) : filteredPrices.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                        <span className="material-symbols-outlined text-4xl text-slate-400">storefront</span>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                            No Mandi rates found for "{searchQuery || activeCategory}" in {activeDistrict}.
                        </p>
                        <p className="text-xs text-slate-400">
                            Try changing the commodity filter or selecting a nearby APMC district.
                        </p>
                        <button
                            onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
                            className="mt-2 text-xs font-bold text-[#0ED054] hover:underline"
                        >
                            View All Commodities
                        </button>
                    </div>
                ) : (
                    filteredPrices.map((item, idx) => {
                        const priceChange = typeof item.price_change === 'number' && !isNaN(item.price_change) 
                            ? item.price_change 
                            : (item.modal_price && item.prev_modal_price ? item.modal_price - item.prev_modal_price : 0);
                        const isHike = item.trend === 'hike' || priceChange > 0;
                        const isLower = item.trend === 'lower' || priceChange < 0;

                        return (
                            <div 
                                key={item.id || idx}
                                className="krishi-glass rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 shadow-md hover:shadow-lg transition-all space-y-3"
                            >
                                {/* Top Row: Commodity & Hike/Lower Badge */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                                                {item.commodity}
                                            </h3>
                                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                ({item.variety || 'Standard Grade'})
                                            </span>
                                        </div>
                                        <p className="text-xs font-semibold text-[#0ED054] flex items-center gap-1 mt-0.5">
                                            <span className="material-symbols-outlined text-xs">storefront</span>
                                            {item.market_name}
                                        </p>
                                    </div>

                                    {/* Daily Trend Badge (Hike / Lower / Steady) */}
                                    <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center space-x-1 ${
                                        isHike 
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                            : isLower 
                                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' 
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                    }`}>
                                        <span>{isHike ? '▲' : isLower ? '▼' : '●'}</span>
                                        <span>
                                            {priceChange !== 0 
                                                ? `${priceChange > 0 ? '+' : ''}₹${priceChange}` 
                                                : 'Steady'}
                                        </span>
                                        <span className="text-[10px] font-normal opacity-80">({item.trend_pct || '0.00%'})</span>
                                    </div>
                                </div>

                                {/* Center: Modal Price & Rate per kg */}
                                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Min Price</span>
                                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                                            {formatCurrency(item.min_price)}
                                        </span>
                                        <span className="text-[9px] text-slate-400 block">/ Quintal</span>
                                    </div>
                                    <div className="border-x border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-extrabold text-[#0ED054] uppercase block">Modal (Avg)</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white">
                                            {formatCurrency(item.modal_price)}
                                        </span>
                                        <span className="text-[10px] font-bold text-[#0ED054] block">
                                            ₹{(item.modal_price / 100).toFixed(2)}/kg
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Max Price</span>
                                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                                            {formatCurrency(item.max_price)}
                                        </span>
                                        <span className="text-[9px] text-slate-400 block">/ Quintal</span>
                                    </div>
                                </div>

                                {/* Bottom Meta: MSP & Official Verification */}
                                <div className="flex items-center justify-between text-[11px] pt-1">
                                    <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                                        <span className="material-icons text-xs text-amber-500">verified</span>
                                        {item.msp ? (
                                            <span>
                                                Govt MSP: <strong className="text-slate-700 dark:text-slate-200">₹{item.msp.toLocaleString('en-IN')}/q</strong>
                                                {item.modal_price >= item.msp ? (
                                                    <span className="text-emerald-500 font-bold ml-1">(+₹{item.modal_price - item.msp})</span>
                                                ) : (
                                                    <span className="text-rose-500 font-bold ml-1">(-₹{item.msp - item.modal_price})</span>
                                                )}
                                            </span>
                                        ) : (
                                            <span>Commercial Crop</span>
                                        )}
                                    </div>

                                    {item.arrivals && (
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            Arrivals: {item.arrivals}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Authentic Sources Footer Card */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1.5 mt-4">
                    <div className="flex items-center space-x-2 text-[#0ED054] font-extrabold">
                        <span className="material-icons text-base">verified_user</span>
                        <span>Official Data Grounding Notice</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                        Prices are verified daily from the <strong>Directorate of Marketing and Inspection (Agmarknet)</strong> and the <strong>National Agriculture Market (e-NAM)</strong>, Ministry of Agriculture & Farmers Welfare, Government of India.
                    </p>
                </div>
            </main>

            {/* Location Selector Modal */}
            <LocationModal
                isOpen={isLocationModalOpen}
                currentLocation={{ state: activeState, district: activeDistrict }}
                onSelectLocation={(newLoc) => {
                    if (onLocationChange) {
                        onLocationChange(newLoc);
                    }
                }}
                onClose={() => setIsLocationModalOpen(false)}
            />
        </div>
    );
};

export default LiveMarketPrices;
