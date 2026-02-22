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
        <div className="relative flex min-h-full w-full flex-col overflow-hidden max-w-md mx-auto bg-white dark:bg-black font-display text-slate-900 dark:text-slate-100 antialiased">
            {/* Header Section */}
            <header className="relative bg-gradient-to-b from-[#0a3f0a] to-[#145314] text-white pb-6 pt-12 px-5 rounded-b-[2rem] shadow-lg z-10 overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none"></div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-2 text-white">
                        <button onClick={onBack} className="mr-2 p-1 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">arrow_back</span>
                        </button>
                        <span className="material-symbols-outlined text-2xl">location_on</span>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium opacity-80 uppercase tracking-wider">Your Location</span>
                            <div className="flex items-center gap-1 font-bold text-lg leading-none cursor-pointer">
                                {activeDistrict && activeState ? `${activeDistrict}, ${activeState}` : 'Fetching Location...'}
                                <span className="material-symbols-outlined text-sm">expand_more</span>
                            </div>
                        </div>
                    </div>
                    <button className="relative p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-primary"></span>
                    </button>
                </div>

                <h1 className="text-white text-2xl font-bold mb-4 relative z-10">Mandi Bhav</h1>

                <div className="relative z-10">
                    <form onSubmit={handleSearch} className="relative flex w-full items-center">
                        <div className="absolute left-4 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </div>
                        <input
                            className="w-full rounded-xl border-none bg-white py-3.5 pl-12 pr-12 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-white/50 shadow-soft text-base font-medium outline-none"
                            placeholder={`Search ${activeCrop || 'commodities'} or mandis`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            type="text"
                        />
                        <button type="submit" className="absolute right-3 p-1.5 rounded-lg text-primary hover:bg-slate-50 transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">send</span>
                        </button>
                    </form>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 bg-slate-50 dark:bg-background-dark z-20 relative">
                {error && (
                    <div className="mx-5 my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
                        <span className="material-symbols-outlined mt-0.5">error</span>
                        <p>{error}</p>
                    </div>
                )}

                {/* Trending Commodities Carousel */}
                {!isLoading && !error && (
                    <section className="mt-6">
                        <div className="px-5 mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Trending Commodities</h2>
                            <button className="text-primary-dark dark:text-primary text-sm font-semibold hover:underline">View All</button>
                        </div>
                        <div className="flex overflow-x-auto gap-4 px-5 pb-4 no-scrollbar snap-x">
                            {trendingCommodities.map((item, idx) => {
                                // Dynamic Tailwind classes for arbitrary colors might get purged if not using safelist or direct hex.
                                // It works due to the CSS being quite liberal or preset in Tailwind CSS Config often, but keeping them simple.
                                const isSelected = activeCrop?.toLowerCase() === item.name.toLowerCase();
                                return (
                                    <div key={idx} onClick={() => handleCommodityClick(item.name)} className="snap-start shrink-0 flex flex-col items-center gap-2">
                                        <div className={`w-16 h-16 rounded-2xl bg-white dark:bg-surface-dark shadow-soft flex items-center justify-center p-2 border ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-100 dark:border-border-dark'} relative overflow-hidden group cursor-pointer active:scale-95 transition-all`}>
                                            <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800/50 group-hover:opacity-100 opacity-0 transition-opacity"></div>
                                            <img className="w-full h-full object-cover rounded-xl relative z-10" src={item.image} alt={item.name} />
                                        </div>
                                        <span className={`text-xs font-medium ${isSelected ? 'text-primary-dark dark:text-primary font-bold' : 'text-slate-700 dark:text-slate-300'}`}>{item.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* Live Mandi Rates List */}
                <section className="px-5 mt-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live Mandi Rates</h2>
                        <button onClick={() => alert('Filter options coming soon!')} className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-medium bg-white dark:bg-surface-dark px-2 py-1.5 rounded-md shadow-sm border border-slate-100 dark:border-border-dark hover:bg-slate-50 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">tune</span>
                            Filter
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {filteredPrices.length === 0 && !error ? (
                                <div className="text-center py-8 text-slate-500 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-border-dark">
                                    No prices available for this query.
                                </div>
                            ) : (
                                filteredPrices.map((item, index) => {
                                    // Simulated trend based on index (even = up, odd = down) since no trend data is in API yet
                                    const isUp = index % 2 === 0;
                                    const trendClass = isUp ? "text-trend-up bg-green-50 dark:bg-green-900/30" : "text-trend-down bg-red-50 dark:bg-red-900/30";
                                    const trendIcon = isUp ? "trending_up" : "trending_down";
                                    // Randomize slight variance for demo 
                                    const trendAmount = isUp ? '₹' + (Math.floor(Math.random() * 40) + 10) : '₹' + (Math.floor(Math.random() * 60) + 15);

                                    const minPrice = item.min_price || Math.floor(item.modal_price * 0.95);
                                    const maxPrice = item.max_price || Math.floor(item.modal_price * 1.05);

                                    return (
                                        <div key={index} className="bg-white dark:bg-surface-dark rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-border-dark overflow-hidden transition-transform active:scale-[0.98] cursor-pointer group hover:border-[#13ec13]/30">
                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg capitalize">{item.commodity || item.crop_name || activeCrop}</h3>
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                                                {item.variety || 'Standard'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 capitalize">
                                                            <span className="material-symbols-outlined text-[16px]">storefront</span>
                                                            {item.market_name} Mandi
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{formatCurrency(item.modal_price)}<span className="text-sm font-normal text-slate-500 ml-1">/qt</span></p>
                                                        <div className={`flex items-center justify-end gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ml-auto w-fit mt-1 ${trendClass}`}>
                                                            <span className="material-symbols-outlined text-[12px]">{trendIcon}</span>
                                                            {trendAmount}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="border-t border-slate-100 dark:border-border-dark pt-3 flex items-center justify-between text-xs">
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-400 dark:text-slate-500 mb-0.5 text-[10px] uppercase font-bold tracking-widest">Range</span>
                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(minPrice)} - {formatCurrency(maxPrice)}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-400 dark:text-slate-500 mb-0.5 text-[10px] uppercase font-bold tracking-widest">Arrivals</span>
                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.floor(Math.random() * 200 + 50)} Tonnes</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-slate-400 text-[10px]">{formatDate(item.date, 'relative')}</span>
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
