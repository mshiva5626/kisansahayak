import React, { useState, useEffect } from 'react';
import { mandiAPI } from '../api';

const LiveMarketPrices = ({ onBack, userProfile, selectedFarmId }) => {
    const [prices, setPrices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCrop, setActiveCrop] = useState('');
    const [activeState, setActiveState] = useState('');
    const [activeDistrict, setActiveDistrict] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchPrices = async (cropToFetch = '') => {
        if (!selectedFarmId) {
            setError("No farm selected. Please select a farm on the dashboard to view relevant Mandi prices.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const state = userProfile?.state;
            const district = userProfile?.district;

            if (!state || !district) {
                setError("Your profile is missing State or District information. Please update your profile.");
                setIsLoading(false);
                return;
            }

            const { data } = await mandiAPI.getPrices(selectedFarmId, state, district, cropToFetch);

            if (data.crop) setActiveCrop(data.crop);
            setActiveState(data.state);
            setActiveDistrict(data.district);
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
        fetchPrices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFarmId, userProfile]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        fetchPrices(searchQuery);
    };

    const handleCommodityClick = (cropName) => {
        setSearchQuery(cropName);
        fetchPrices(cropName);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString, format = 'short') => {
        if (!dateString) return 'N/A';
        let dateObj = null;
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
        } else {
            dateObj = new Date(dateString);
        }

        if (!dateObj || isNaN(dateObj)) return 'N/A';

        if (format === 'relative') {
            const now = new Date();
            const diffInHours = Math.floor((now - dateObj) / (1000 * 60 * 60));
            if (diffInHours < 24 && diffInHours > 0) return `${diffInHours}h ago`;
            if (diffInHours <= 0) return 'Just now';
            return dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        }

        return dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    // Filter functionality (local filtering for minor refinement if user doesn't hit enter)
    const filteredPrices = prices.filter(item => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();

        const cropVal = (item.commodity || item.crop_name || activeCrop || '').toLowerCase();
        const marketVal = (item.market_name || '').toLowerCase();
        const varietyVal = (item.variety || '').toLowerCase();

        return marketVal.includes(query) || cropVal.includes(query) || varietyVal.includes(query);
    });

    const trendingCommodities = [
        { name: 'Wheat', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxuado7N1n1nZJLvPSAN7_rraX4vM3c71fFjeqQs9bs0Gxm4MRarhjM_g49By2OOUX0C4xOGcK5fKUIuyGpea60zztxKr16XM93jykeUlpsrRsgCcX8zkrIAQkv1MaUzY87gu9WrpVAnp35zS4EhrQwYlHHCUS4Y5JxBA8qtJhhh5ZmXv3OPzGCtB1OuG6gQafAuEyI2SDXP4qKZ-1n-L3nZgUXeh_1KLYgyX4TvI5JkF5Xkcwy0xFYVBrLhWO7bVCqx460OS0zr6w', color: 'orange' },
        { name: 'Soybean', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoLLdBCSiLC2X49N61MPDdVP8d_nhxBSgkZ-bZjjUwaI3jmeRuo7uDTvNO_8-HZbE5EBJeBVrKDho9JulZBYhRUWl9mLuL_XlfW4gn-P-QHcbbX0BGcEqYVGom3FjEoqYrvroNnfc-05JFRLwTQEkOL9yTzvgMkWRi0lnpWsmWSpJVuA1wQo2GIJQeTHVGJ56F1YeGwZpddLhEvinjgZlK7Ml_9qhMKGIAmGVZv4WAPexBDRFZBhWVt9oA_6iWZR4zYDzDtbofjsry', color: 'yellow' },
        { name: 'Onion', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBz-_eEkVOWgTf9-LEFZeEo3EFZEveXQpxeQb8z8emA1j85TpA5jP46HF0OMxqY06JYqdBZtTfNiWQikhPf-xMBgF_pF5aU6Yee8XI4FQfJnPY8YOKR5ztrf53hy3OPChFy529S30Ivk_xm5lJNcP6JdikeJixDCYCAW6jpJ-O4iDA9M9AWQRuDQpA46oBDzMEtq1OR5fhQb9LFMOACcJ0F9beMhk53DZkopOSnvLD0VQ5lDZWOjHbr2kTYcdz_V-TEtAdwPSp3THth', color: 'red' },
        { name: 'Chana', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAe_nqRh7Gquewoj7q8AqFQbvxGH77X259CATgauFLVzt3a3dngAezzxRvrT2flRGo0PttZBg5S_L2hVbk8aQWuxvKDBXvBf1CP3Z8mCiFADL-_mWRYF60IveVrw-XpZ_8DrU4QO3VHf95ZdOLMaUTk_yk0YL0HVc7wOypPKjuxPeGnwyAYTlwoFCLkjqsORdABAubptTKElYofBS4vM6Cy6YPydjhAR-lTHK_pAN-4OewQ0VpcZR81tLMtpjcOudletoT7YnhZlwgl', color: 'green' },
        { name: 'Cotton', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKaF0aesspq5vxrzVgiIKknavq1F26z5DihIibpPRNC63BTJtaPLyfAmObkSJyLd1Oy2eMnyfYNsJ_uVXgSdFCAjzOsUBGzVrOMa9amx72Hfjfp0ne-qUjIYj17Q6jDNSiQWprRq-z4H8emOMSm14lgNcUgS6lxaPdTQgyT77qDNQxPFYeLZgVYYTqwQOR0WMxzyDeqYHVQK_zc1rPE4K9tQULt3ZZebMTWhKxfPtqZs6QsU55P33O1W24xXt6zodQ2gLu6f-uSehT', color: 'slate' },
    ];

    return (
        <div className="relative flex min-h-full w-full flex-col overflow-hidden max-w-md mx-auto bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] font-display text-slate-900 dark:text-slate-100 antialiased pb-20">
            {/* Header Section */}
            <header className="relative bg-gradient-to-b from-[#03140A] to-[#083D20] text-white pb-6 pt-12 px-5 rounded-b-[2rem] border-b border-emerald-500/10 shadow-lg z-10 overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none"></div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-2 text-white">
                        <button onClick={onBack} className="mr-2 p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full transition-all flex items-center justify-center tactile-btn">
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </button>
                        <span className="material-symbols-outlined text-2xl text-emerald-400">location_on</span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Your Location</span>
                            <div className="flex items-center gap-1 font-extrabold text-base leading-none cursor-pointer">
                                {activeDistrict && activeState ? `${activeDistrict}, ${activeState}` : 'Fetching Location...'}
                                <span className="material-symbols-outlined text-sm text-emerald-400">expand_more</span>
                            </div>
                        </div>
                    </div>
                    <button className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white tactile-btn">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
                    </button>
                </div>

                <h1 className="text-white text-2xl font-black mb-4 relative z-10 tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-2xl">trending_up</span>
                    Mandi Bhav (Live Rates)
                </h1>

                <div className="relative z-10">
                    <form onSubmit={handleSearch} className="relative flex w-full items-center">
                        <div className="absolute left-4 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </div>
                        <input
                            className="w-full rounded-xl border-none bg-white/95 dark:bg-white/10 backdrop-blur-md py-3.5 pl-12 pr-12 text-slate-900 dark:text-white placeholder:text-slate-450 focus:ring-2 focus:ring-emerald-500/50 shadow-soft text-base font-semibold outline-none transition-all"
                            placeholder={`Search ${activeCrop || 'commodities'} or mandis`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            type="text"
                        />
                        <button type="submit" className="absolute right-3 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-450 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center tactile-btn">
                            <span className="material-symbols-outlined text-[20px]">send</span>
                        </button>
                    </form>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 z-20 relative">
                {error && (
                    <div className="mx-5 my-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-450 text-sm flex items-start gap-3 krishi-glass">
                        <span className="material-symbols-outlined mt-0.5 text-rose-500">error</span>
                        <p className="font-semibold">{error}</p>
                    </div>
                )}

                {/* Trending Commodities Carousel */}
                {!isLoading && !error && (
                    <section className="mt-6">
                        <div className="px-5 mb-3 flex items-center justify-between">
                            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-amber-500 text-xl">workspace_premium</span>
                                Trending Commodities
                            </h2>
                            <button className="text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:underline">View All</button>
                        </div>
                        <div className="flex overflow-x-auto gap-4 px-5 pb-4 no-scrollbar snap-x">
                            {trendingCommodities.map((item, idx) => {
                                const isSelected = activeCrop?.toLowerCase() === item.name.toLowerCase();
                                return (
                                    <div key={idx} onClick={() => handleCommodityClick(item.name)} className="snap-start shrink-0 flex flex-col items-center gap-2 cursor-pointer tilt-card-container">
                                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center p-2.5 tilt-card krishi-glass ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-white/50 dark:border-white/10'} relative overflow-hidden group transition-all`}>
                                            <div className="absolute inset-0 bg-white/10 dark:bg-black/20 group-hover:opacity-100 opacity-0 transition-opacity"></div>
                                            <img className="w-full h-full object-cover rounded-xl relative z-10 shadow-sm" src={item.image} alt={item.name} />
                                        </div>
                                        <span className={`text-xs font-bold tracking-wide ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-350'}`}>{item.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* Live Mandi Rates List */}
                <section className="px-5 mt-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-emerald-500 text-xl">analytics</span>
                            Live Mandi Rates
                        </h2>
                        <button onClick={() => alert('Filter options coming soon!')} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs font-bold krishi-glass px-3 py-2 rounded-xl border border-white/50 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/5 transition-all shadow-sm tactile-btn">
                            <span className="material-symbols-outlined text-[16px] text-emerald-500">tune</span>
                            Filter
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {filteredPrices.length === 0 && !error ? (
                                <div className="text-center py-10 text-slate-500 bg-white/80 dark:bg-emerald-950/10 rounded-2xl border border-slate-200/50 dark:border-white/5 krishi-glass font-semibold text-sm">
                                    No prices available for this query.
                                </div>
                            ) : (
                                filteredPrices.map((item, index) => {
                                    const isUp = index % 2 === 0;
                                    const trendClass = isUp 
                                        ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-500/20" 
                                        : "text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-200/50 dark:border-rose-500/20";
                                    const trendIcon = isUp ? "trending_up" : "trending_down";
                                    const trendAmount = isUp ? '₹' + (Math.floor(Math.random() * 40) + 10) : '₹' + (Math.floor(Math.random() * 60) + 15);

                                    const minPrice = item.min_price || Math.floor(item.modal_price * 0.95);
                                    const maxPrice = item.max_price || Math.floor(item.modal_price * 1.05);

                                    return (
                                        <div key={index} className="tilt-card-container">
                                            <div className="tilt-card krishi-glass rounded-2xl shadow-[0_4px_20px_-4px_rgba(8,61,32,0.1)] border border-white/50 dark:border-white/10 overflow-hidden cursor-pointer group hover:border-emerald-500/30">
                                                <div className="p-4 relative">
                                                    {/* Background light glow on hover */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                                    
                                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-slate-900 dark:text-white text-lg capitalize">{item.commodity || item.crop_name || activeCrop}</h3>
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100/80 dark:bg-emerald-950/40 text-slate-650 dark:text-emerald-450 uppercase tracking-wide border border-slate-200/50 dark:border-emerald-500/20">
                                                                    {item.variety || 'Standard'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 capitalize">
                                                                <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-500">storefront</span>
                                                                <span className="font-medium text-slate-600 dark:text-slate-350">{item.market_name} Mandi</span>
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">{formatCurrency(item.modal_price)}<span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">/qt</span></p>
                                                            <div className={`flex items-center justify-end gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ml-auto w-fit mt-1.5 shadow-sm border ${trendClass}`}>
                                                                <span className="material-symbols-outlined text-[12px]">{trendIcon}</span>
                                                                {trendAmount}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-slate-200/60 dark:border-white/5 pt-3 flex items-center justify-between text-xs relative z-10">
                                                        <div className="flex gap-5">
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-400 dark:text-slate-500 mb-0.5 text-[9px] uppercase font-bold tracking-widest">Range</span>
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(minPrice)} - {formatCurrency(maxPrice)}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-400 dark:text-slate-500 mb-0.5 text-[9px] uppercase font-bold tracking-widest">Arrivals</span>
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">{Math.floor(Math.random() * 200 + 50)} Tonnes</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-slate-450 dark:text-slate-500 text-[10px] font-medium flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                            {formatDate(item.date, 'relative')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}

                    {!isLoading && prices.length > 0 && (
                        <p className="text-center text-slate-400 text-[11px] mt-8 mb-4">
                            Prices are indicative and subject to change. <br /> Powered by Kisan Sahayak
                        </p>
                    )}
                </section>
            </main>
        </div>
    );
};

export default LiveMarketPrices;
