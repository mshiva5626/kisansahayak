import React, { useState, useEffect } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import SideDrawerMenu from '../components/SideDrawerMenu';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { weatherAPI, farmAPI } from '../api';

const Dashboard = ({ onProfileClick, onNotificationClick, onAICopilotClick, onScanClick, onWeatherClick, onFarmSwitcherClick, onSchemesClick, onTodayFocusClick, onMandiPricesClick, onSoilTestClick, onNavigate, userProfile, selectedFarmId }) => {
    const [weather, setWeather] = useState(null);
    const [farm, setFarm] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (selectedFarmId) {
                    const { data } = await farmAPI.getFarmById(selectedFarmId);
                    setFarm(data.farm);

                    // Only fetch weather if farm has coordinates
                    const lat = data.farm.latitude || data.farm.location?.lat;
                    const lon = data.farm.longitude || data.farm.location?.lon;

                    if (lat && lon) {
                        try {
                            const { data: weatherData } = await weatherAPI.getWeatherByFarm(selectedFarmId);
                            setWeather({
                                temp: Math.round(weatherData.temperature ?? weatherData.temp),
                                condition: weatherData.condition || 'Unknown',
                                humidity: weatherData.humidity,
                                wind_speed: weatherData.wind_speed,
                                forecast: weatherData.forecast || []
                            });
                        } catch (e) {
                            console.error('Weather fetch failed:', e);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [selectedFarmId]);

    // Build conditional advisory text
    const getAdvisoryText = () => {
        if (!farm) return 'Select a farm to get personalized AI recommendations for your crops.';
        if (!farm.crop_type || !farm.latitude || !farm.longitude) return 'Insufficient farm setup. Please complete farm configuration.';
        if (weather && weather.humidity > 80) {
            return `High humidity detected (${weather.humidity}%). Monitor ${farm.crop_type} closely for fungal infections. Consider preventive spraying.`;
        }
        if (weather && weather.temp > 38) {
            return `High temperature alert (${weather.temp}°C). Ensure adequate irrigation for your ${farm.crop_type} crop. Avoid fertilizer application during peak heat.`;
        }
        if (weather) {
            return `Conditions are ${weather.condition.toLowerCase()} at ${weather.temp}°C. Your ${farm.crop_type} crop is in active growth — tap to get detailed advisory.`;
        }
        return `Your ${farm.crop_type} farm is set up. Tap to ask the AI assistant for field-ready advice.`;
    };

    // Get forecast summary for weather preview card
    const getForecastSummary = () => {
        if (!weather?.forecast?.length) return null;
        const next3 = weather.forecast.slice(0, 3);
        const hasRain = next3.some(d => d.precipitation > 0 || (d.condition && d.condition.toLowerCase().includes('rain')));
        if (hasRain) return 'Rain expected in next 3 days';
        return 'Clear skies expected';
    };

    return (
        <div className="relative flex min-h-full w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark max-w-md mx-auto">
            {isLoading ? (
                <DashboardSkeleton />
            ) : (
                <>
                    <header className="relative bg-gradient-to-b from-[#0a3f0a] to-[#145314] text-white pt-4 pb-8 safe-top rounded-b-[2rem] shadow-lg z-10 shrink-0">
                        <div className="px-6 flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={() => setIsDrawerOpen(true)}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-white/20 transition-all"
                                >
                                    <span className="material-symbols-outlined text-primary text-[24px] transition-all duration-300">menu</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight">Kisan Sahayak</h1>
                                    <p className="text-xs text-white/70 font-medium tracking-wide">Professional Farming</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={onNotificationClick} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors relative">
                                    <span className="material-symbols-outlined text-white text-[24px] transition-all duration-300">notifications</span>
                                    <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 border border-[#145314]"></span>
                                </button>
                                <div onClick={onProfileClick} className="h-10 w-10 rounded-full border-2 border-primary overflow-hidden bg-white/20 cursor-pointer" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD97JG_xEY2anBSsxKxdXwZYQSTYqM7GzyusAzNhDhew_BZvF6DKbvn6Sw10i6zzyH_eXif6lG1Wuk3XjqhLqX6hDgNFVRAjk9jYg3Cko4ZcLUaAIfL18HoGhDzQoXoIeVri-jFT3Zwa-XiFi0Yfb3BQljIro6U0iGSZAD-jJvcTzXCzUByA-XyTPQXHAs7UArQZqDmGTuSn4zRmxDKat4rSf3FMFHdtbnFLmWQKuu1_4tqGPpBFzAGG_B7SMVCH1xk6DrXjBBM6X5f')", backgroundSize: "cover", backgroundPosition: "center" }}>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 flex justify-between text-center pb-4">
                            <div className="flex flex-col items-center cursor-pointer" onClick={onWeatherClick}>
                                <span className="text-2xl font-bold text-white">{weather ? `${weather.temp}°C` : '—'}</span>
                                <span className="text-xs text-white/70 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px] transition-all duration-300">
                                        {weather?.condition?.toLowerCase().includes('rain') ? 'grain' : 'wb_sunny'}
                                    </span>
                                    {weather ? weather.condition : 'Weather'}
                                </span>
                            </div>
                            <div className="h-10 w-[1px] bg-white/20"></div>
                            <div className="flex flex-col items-center cursor-pointer" onClick={onMandiPricesClick}>
                                <span className="text-2xl font-bold text-white tracking-tight">₹2,450</span>
                                <span className="text-xs text-white/70">{farm?.crop_type || 'Crop'} / Qtl</span>
                            </div>
                            <div className="h-10 w-[1px] bg-white/20"></div>
                            <div className="flex flex-col items-center cursor-pointer" onClick={onFarmSwitcherClick}>
                                <span className="text-2xl font-bold text-primary max-w-[80px] truncate">{farm?.farm_name || 'Active'}</span>
                                <span className="text-xs text-white/70">Tap to Switch</span>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 px-4 -mt-6 pb-24 z-20 relative">
                        <>
                            {/* Horizontal Scroll Hero Banners */}
                            <div className="mb-6 overflow-x-auto hide-scrollbar flex gap-4 snap-x snap-mandatory">
                                <div onClick={onSchemesClick} className="cursor-pointer snap-center shrink-0 w-[85%] h-40 rounded-xl overflow-hidden relative shadow-md group hover:shadow-2xl transition-shadow duration-300">
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10 flex flex-col justify-center p-5">
                                        <span className="bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-2">Subsidy Scheme</span>
                                        <h3 className="text-white font-bold text-xl leading-tight w-3/4 mb-1">PM-Kisan Benefits</h3>
                                        <p className="text-white/80 text-xs mb-3">Next installment releasing soon</p>
                                        <button className="text-white bg-white/20 hover:bg-primary hover:text-black hover:scale-105 active:scale-95 backdrop-blur-sm text-xs font-semibold px-4 py-2 rounded-lg w-fit transition-all duration-300">Check Status</button>
                                    </div>
                                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD6rTykEoLw0FAsqaXZjNpLhE_Et9y0ZLltrar7tGnvNsbTo5Il98Spalex59RUpC1ovjnhbX87dhGKBehVB9pQ190wlN2LjY8MxRhlqrFTyrdCmW_BCM-gc7gG-utp2ejSEIwJ8uEV11BI0SpEaOazeqffOorRHa7r1MFQ1VHXQhhusrmAOYUGv4qeslP9MnKFy6yH1S25E0YA6Tm_bDHj6qZsWQhYFz89kQuZEVpDKfhmA3xIX5cRO2DgXRG-c8msJw13qX5hZaLg')" }}></div>
                                </div>
                                <div onClick={onNavigate} className="cursor-pointer snap-center shrink-0 w-[85%] h-40 rounded-xl overflow-hidden relative shadow-md group hover:shadow-2xl transition-shadow duration-300">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-900/40 to-transparent z-10 flex flex-col justify-center p-5">
                                        <span className="bg-blue-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-2">AI Copilot</span>
                                        <h3 className="text-white font-bold text-xl leading-tight w-3/4 mb-1">Smart Analytics</h3>
                                        <p className="text-white/80 text-xs mb-3 line-clamp-1">{getAdvisoryText()}</p>
                                        <button onClick={onAICopilotClick} className="text-white bg-white/20 hover:bg-primary hover:text-black hover:scale-105 active:scale-95 backdrop-blur-sm text-xs font-semibold px-4 py-2 rounded-lg w-fit transition-all duration-300">Ask Copilot</button>
                                    </div>
                                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBfroD5SxbYM2BsmbodcmetFS2IeMErpKQIwOChdXb9LAT2Z-PSc9Gt8kRPr8fLnIRCWmsYZifSIybOFmGq8mnHx_4Ny3-K91P90F8Xe5COZQlXccSskNNB75KX5T1QTGfUhUtV9cXKasuB-042doT_CWxWPsSbo0z2X_1MA9619rcpKbxMkgD_G8-pW8TAgx9CBRQtVTv-1sxy-Blkq6WMQEkK37MF2ASUNdFBa4bJ57ThUyDPaFr2sco1Xs3bWBqLeiEfp7bTKekr')" }}></div>
                                </div>
                            </div>

                            {/* Services Grid */}
                            <div className="bg-white dark:bg-[#1a2e1a] rounded-xl p-5 mb-6 border border-slate-100 dark:border-slate-800 shadow-premium">
                                <h2 className="font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider text-xs">Services</h2>
                                <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                    <button onClick={onWeatherClick} className="flex flex-col items-center gap-2 group">
                                        <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center transition-transform group-hover:scale-105">
                                            <span className="material-symbols-outlined text-purple-600 text-[24px] transition-all duration-300">cloud</span>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Weather</span>
                                    </button>
                                    <button onClick={onAICopilotClick} className="flex flex-col items-center gap-2 group">
                                        <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center transition-transform group-hover:scale-105 relative">
                                            {/* Pulse indicator for AI active */}
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                            </span>
                                            <span className="material-symbols-outlined text-blue-600 text-[24px] transition-all duration-300">smart_toy</span>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Copilot</span>
                                    </button>
                                    <button onClick={onSchemesClick} className="flex flex-col items-center gap-2 group">
                                        <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center transition-transform group-hover:scale-105">
                                            <span className="material-symbols-outlined text-orange-600 text-[24px] transition-all duration-300">description</span>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Schemes</span>
                                    </button>
                                    <button onClick={onScanClick} className="flex flex-col items-center gap-2 group">
                                        <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center transition-transform group-hover:scale-105">
                                            <span className="material-symbols-outlined text-green-600 text-[24px] transition-all duration-300">qr_code_scanner</span>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Scan</span>
                                    </button>
                                    <button onClick={onMandiPricesClick} className="flex flex-col items-center gap-2 group">
                                        <div className="h-12 w-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center transition-transform group-hover:scale-105">
                                            <span className="material-symbols-outlined text-pink-600 text-[24px] transition-all duration-300">storefront</span>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Mandi</span>
                                    </button>
                                    <button onClick={() => onNavigate('farm-list')} className="flex flex-col items-center gap-2 group">
                                        <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center transition-transform group-hover:scale-105">
                                            <span className="material-symbols-outlined text-indigo-600 text-[24px] transition-all duration-300">inventory_2</span>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">My Farms</span>
                                    </button>
                                    <button onClick={onTodayFocusClick} className="flex flex-col items-center gap-2 group">
                                        <div className="h-12 w-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center transition-transform group-hover:scale-105">
                                            <span className="material-symbols-outlined text-teal-600 text-[24px] transition-all duration-300">task_alt</span>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Tasks</span>
                                    </button>
                                    <button onClick={onSoilTestClick} className="flex flex-col items-center gap-2 group">
                                        <div className="h-12 w-12 rounded-xl bg-[#dcfce7] dark:bg-[#114011] flex items-center justify-center transition-transform group-hover:scale-105">
                                            <span className="material-symbols-outlined text-[#16a34a] text-[24px] transition-all duration-300">science</span>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Soil Test</span>
                                    </button>
                                </div>
                            </div>

                            {/* News & Advisory List */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">News &amp; Advisory</h2>
                                    <a className="text-sm font-semibold text-primary-dark hover:text-primary dark:text-primary transition-colors flex items-center" href="#">View All <span className="material-symbols-outlined text-sm ml-0.5 transition-all duration-300">chevron_right</span></a>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {weather && weather.forecast && weather.forecast.length > 0 && weather.forecast[0].precipitation > 0 ? (
                                        <div className="bg-white dark:bg-[#1a2e1a] p-4 rounded-xl shadow-card border border-l-4 border-l-red-500 border-y-slate-100 border-r-slate-100 dark:border-y-slate-800 dark:border-r-slate-800 flex gap-4 items-start hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                                            <div className="h-12 w-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex-shrink-0 flex items-center justify-center text-red-600">
                                                <span className="material-symbols-outlined transition-all duration-300">thunderstorm</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Heavy Rain Alert</h3>
                                                    <span className="text-[10px] text-slate-400">Now</span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Rainfall expected in your district. Ensure appropriate measures for your {farm.crop_type} crop.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-[#1a2e1a] p-4 rounded-xl shadow-card border border-l-4 border-l-blue-500 border-y-slate-100 border-r-slate-100 dark:border-y-slate-800 dark:border-r-slate-800 flex gap-4 items-start hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                                            <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex-shrink-0 flex items-center justify-center text-blue-600">
                                                <span className="material-symbols-outlined transition-all duration-300">wb_sunny</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Clear Weather</h3>
                                                    <span className="text-[10px] text-slate-400">Now</span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Optimal conditions for typical farming activities. Maintain regular irrigation schedule.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white dark:bg-[#1a2e1a] p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-800 flex gap-4 items-start hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                                        <div className="h-12 w-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex-shrink-0 flex items-center justify-center text-green-600">
                                            <span className="material-symbols-outlined transition-all duration-300">psychiatry</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Crop Action Priority</h3>
                                                <span className="text-[10px] text-slate-400">System</span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{getAdvisoryText()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Market Trends Scroll */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Market Trends</h2>
                                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider">Live</span>
                                </div>
                                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                                    <div onClick={onMandiPricesClick} className="min-w-[140px] bg-white dark:bg-[#1a2e1a] p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-800 flex flex-col gap-2 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-yellow-700 dark:text-yellow-400 text-lg transition-all duration-300">spa</span>
                                            </div>
                                            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded flex items-center">
                                                <span className="material-symbols-outlined text-[10px] mr-0.5 transition-all duration-300">trending_up</span> 2%
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Wheat</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">₹2,450</p>
                                        </div>
                                    </div>
                                    <div onClick={onMandiPricesClick} className="min-w-[140px] bg-white dark:bg-[#1a2e1a] p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-800 flex flex-col gap-2 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-red-700 dark:text-red-400 text-lg transition-all duration-300">nutrition</span>
                                            </div>
                                            <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded flex items-center">
                                                <span className="material-symbols-outlined text-[10px] mr-0.5 transition-all duration-300">trending_down</span> 0.5%
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Tomato</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">₹1,200</p>
                                        </div>
                                    </div>
                                    <div onClick={onMandiPricesClick} className="min-w-[140px] bg-white dark:bg-[#1a2e1a] p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-800 flex flex-col gap-2 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-orange-700 dark:text-orange-400 text-lg transition-all duration-300">grain</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded flex items-center">
                                                <span className="material-symbols-outlined text-[10px] mr-0.5 transition-all duration-300">remove</span> 0%
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Corn</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">₹1,890</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>

                    </main>

                    <BottomNavbar activeTab="dashboard" onNavigate={onNavigate} />

                    <SideDrawerMenu
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        userProfile={userProfile}
                        onNavigate={onNavigate}
                    />
                </>
            )}
        </div>
    );
};

export default Dashboard;
