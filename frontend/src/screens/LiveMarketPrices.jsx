import React, { useState, useEffect } from 'react';
import { mandiAPI } from '../api';

const LiveMarketPrices = ({ onBack, userProfile, selectedFarmId }) => {
    const [prices, setPrices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCrop, setActiveCrop] = useState('');
    const [activeState, setActiveState] = useState('');
    const [activeDistrict, setActiveDistrict] = useState('');

    useEffect(() => {
        const fetchPrices = async () => {
            if (!selectedFarmId) {
                setError("No farm selected. Please select a farm on the dashboard to view relevant Mandi prices.");
                setIsLoading(false);
                return;
            }

            try {
                const state = userProfile?.state;
                const district = userProfile?.district;

                if (!state || !district) {
                    setError("Your profile is missing State or District information. Please update your profile.");
                    setIsLoading(false);
                    return;
                }

                const { data } = await mandiAPI.getPrices(selectedFarmId, state, district);

                setActiveCrop(data.crop);
                setActiveState(data.state);
                setActiveDistrict(data.district);
                setPrices(data.prices || []);

            } catch (err) {
                console.error("Failed to fetch Mandi prices:", err);
                setError(err.response?.data?.message || "Mandi price data unavailable for your area.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrices();
    }, [selectedFarmId, userProfile]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        // Handle common data.gov format (DD/MM/YYYY)
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            }
        }
        return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 overflow-hidden">
            {/* Header */}
            <header className="bg-surface-light dark:bg-surface-dark px-5 pt-12 pb-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-icons text-gray-600 dark:text-gray-300">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Live Mandi Prices</h1>
                        <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            Real-time from data.gov.in
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-10">

                {/* Context Header */}
                {!isLoading && !error && activeCrop && (
                    <div className="bg-gradient-to-r from-purple-900 to-indigo-800 p-6 shadow-md relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 opacity-10">
                            <span className="material-icons text-[150px]">storefront</span>
                        </div>
                        <div className="relative z-10 text-white">
                            <p className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">
                                {activeDistrict}, {activeState}
                            </p>
                            <h2 className="text-3xl font-extrabold capitalize mb-2">{activeCrop}</h2>
                            <p className="text-sm text-purple-100">
                                {prices.length > 0
                                    ? `Showing prices across ${prices.length} regional markets.`
                                    : 'No active trading data today.'}
                            </p>

                            {prices.length > 0 && (
                                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
                                    <span className="text-xs font-medium text-purple-100">Top Modal Price:</span>
                                    <span className="font-bold text-lg">{formatCurrency(prices[0].modal_price)} / Qtl</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Syncing Mandi Data</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-[250px]">Fetching real-time wholesale prices for your authenticated district...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/50 dark:bg-white/5 rounded-3xl mx-5 mt-6 border border-gray-200 dark:border-white/10 shadow-sm animate-fade-in">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-icons text-3xl text-red-500">warning_amber</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Notice</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
                        <button onClick={onBack} className="text-primary font-bold hidden">
                            Go Back
                        </button>
                    </div>
                )}

                {/* Data Table */}
                {!isLoading && !error && prices.length > 0 && (
                    <div className="px-5 mt-6 animate-fade-in">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <div className="overflow-x-auto text-[13px] sm:text-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                            <th className="py-3 px-4 font-bold text-gray-600 dark:text-gray-300">Market</th>
                                            <th className="py-3 px-3 font-bold text-gray-600 dark:text-gray-300">Modal Price</th>
                                            <th className="py-3 px-3 hidden sm:table-cell font-bold text-gray-600 dark:text-gray-300">Min/Max</th>
                                            <th className="py-3 px-4 text-right font-bold text-gray-600 dark:text-gray-300 hidden md:table-cell">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {prices.map((price, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white flex flex-col sm:block">
                                                    {price.market_name}
                                                    <span className="text-[10px] text-gray-400 font-normal sm:hidden mt-1">{formatDate(price.date)}</span>
                                                </td>
                                                <td className="py-4 px-3 font-bold text-green-600 dark:text-green-400">
                                                    {formatCurrency(price.modal_price)}
                                                </td>
                                                <td className="py-4 px-3 hidden sm:table-cell text-gray-500 dark:text-gray-400">
                                                    {formatCurrency(price.min_price)} <br className="hidden sm:block" />
                                                    <span className="text-xs">- {formatCurrency(price.max_price)}</span>
                                                </td>
                                                <td className="py-4 px-4 text-right text-gray-400 hidden md:table-cell">
                                                    {formatDate(price.date)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State (API successful but no prices) */}
                {!isLoading && !error && prices.length === 0 && activeCrop && (
                    <div className="flex flex-col items-center justify-center p-8 text-center mx-5 mt-6 animate-fade-in">
                        <span className="material-icons text-5xl text-gray-300 dark:text-gray-600 mb-3 block">storefront</span>
                        <h3 className="text-gray-900 dark:text-white font-bold mb-1">No Real-Time Data</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No wholesale markets in {activeDistrict} have reported recent prices for {activeCrop}.</p>
                    </div>
                )}

            </main>
        </div>
    );
};

export default LiveMarketPrices;
