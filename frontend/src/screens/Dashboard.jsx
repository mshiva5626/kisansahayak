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
            return `High humidity detected (${weather.humidity}%). Monitor ${farm.crop_type} closely for fungal infections.`;
        }
        if (weather && weather.temp > 38) {
            return `High temp alert (${weather.temp}°C). Irrigate your ${farm.crop_type} crop. Avoid daytime fertilizers.`;
        }
        if (weather) {
            return `Conditions are ${weather.condition.toLowerCase()} at ${weather.temp}°C. Ask AI for ${farm.crop_type} field tips.`;
        }
        return `Your ${farm.crop_type} farm is ready. Tap the Copilot orb to ask for field-ready advice.`;
    };

    return (
        <div className="relative flex min-h-full w-full flex-col overflow-x-hidden bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] max-w-md mx-auto font-sans pb-20">
            {isLoading ? (
                <DashboardSkeleton />
            ) : (
                <>
                    {/* Glowing Top Ambient light in dark mode */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[150px] bg-[#0ED054]/5 rounded-full blur-[60px] pointer-events-none z-0"></div>

                    {/* Premium Header */}
                    <header className="relative bg-gradient-to-b from-[#052212] via-[#093a1e] to-[#0c4726] text-white pt-4 pb-10 safe-top rounded-b-[2.5rem] shadow-2xl border-b border-[#0ED054]/10 z-10 shrink-0">
                        {/* Interactive App Bar */}
                        <div className="px-6 flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={() => setIsDrawerOpen(true)}
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 cursor-pointer hover:bg-white/20 active:scale-95 transition-all shadow-md"
                                >
                                    <span className="material-symbols-outlined text-[#0ED054] text-[24px]">menu</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">Kisan Sahayak</h1>
                                    <p className="text-[10px] text-[#0ED054] font-bold tracking-widest uppercase">Smart Farming</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={onNotificationClick} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 active:scale-95 transition-all relative shadow-md">
                                    <span className="material-symbols-outlined text-white text-[24px]">notifications</span>
                                    <span className="absolute top-3.5 right-3.5 h-2 w-2 rounded-full bg-red-500 border-2 border-[#0c4726] animate-ping"></span>
                                    <span className="absolute top-3.5 right-3.5 h-2 w-2 rounded-full bg-red-500 border-2 border-[#0c4726]"></span>
                                </button>
                                <div onClick={onProfileClick} className="h-11 w-11 rounded-2xl border-2 border-[#0ED054] overflow-hidden bg-white/20 cursor-pointer shadow-lg active:scale-95 transition-all" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD97JG_xEY2anBSsxKxdXwZYQSTYqM7GzyusAzNhDhew_BZvF6DKbvn6Sw10i6zzyH_eXif6lG1Wuk3XjqhLqX6hDgNFVRAjk9jYg3Cko4ZcLUaAIfL18HoGhDzQoXoIeVri-jFT3Zwa-XiFi0Yfb3BQljIro6U0iGSZAD-jJvcTzXCzUByA-XyTPQXHAs7UArQZqDmGTuSn4zRmxDKat4rSf3FMFHdtbnFLmWQKuu1_4tqGPpBFzAGG_B7SMVCH1xk6DrXjBBM6X5f')", backgroundSize: "cover", backgroundPosition: "center" }}>
                                </div>
                            </div>
                        </div>

                        {/* Interactive 3D Stats Deck */}
                        <div className="px-5 grid grid-cols-3 gap-3 pt-2 tilt-card-container">
                            {/* Weather Stats Card */}
                            <div 
                                onClick={onWeatherClick}
                                className="krishi-glass dark:bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-between text-center cursor-pointer tilt-card"
                            >
                                <span className="text-xl font-black text-white">{weather ? `${weather.temp}°C` : '—'}</span>
                                <span className="text-[10px] text-gray-300 font-bold flex items-center gap-1 mt-1">
                                    <span className="material-symbols-outlined text-[13px] text-[#0ED054]">
                                        {weather?.condition?.toLowerCase().includes('rain') ? 'grain' : 'wb_sunny'}
                                    </span>
                                    {weather ? weather.condition : 'Weather'}
                                </span>
                            </div>

                            {/* Mandi Wealth Card */}
                            <div 
                                onClick={onMandiPricesClick}
                                className="krishi-glass dark:bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-between text-center cursor-pointer tilt-card"
                            >
                                <span className="text-xl font-black text-[#EAB308]">₹2,450</span>
                                <span className="text-[10px] text-gray-300 font-bold flex items-center gap-0.5 mt-1 truncate w-full justify-center">
                                    <span className="material-symbols-outlined text-[13px] text-[#EAB308]">storefront</span>
                                    {farm?.crop_type || 'Wheat'}
                                </span>
                            </div>

                            {/* Farm Switcher Card */}
                            <div 
                                onClick={onFarmSwitcherClick}
                                className="krishi-glass dark:bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-between text-center cursor-pointer tilt-card"
                            >
                                <span className="text-xl font-black text-[#0ED054] max-w-[80px] truncate">{farm?.farm_name || 'My Farm'}</span>
                                <span className="text-[10px] text-gray-300 font-bold flex items-center gap-0.5 mt-1 justify-center">
                                    <span className="material-symbols-outlined text-[13px] text-[#0ED054]">swap_horiz</span>
                                    Switch
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="flex-1 px-4 -mt-5 pb-16 z-20 relative">
                        {/* Horizontal snap-scroll campaigns */}
                        <div className="mb-6 overflow-x-auto hide-scrollbar flex gap-4 snap-x snap-mandatory py-2">
                            {/* Scheme Promotion */}
                            <div onClick={onSchemesClick} className="cursor-pointer snap-center shrink-0 w-[88%] h-44 rounded-3xl overflow-hidden relative shadow-xl border border-white/10 hover:shadow-2xl active:scale-[0.98] transition-all duration-300 group">
                                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent z-10 flex flex-col justify-center p-5">
                                    <span className="bg-[#EAB308] text-black text-[9px] font-extrabold px-2.5 py-0.5 rounded-full w-fit mb-2 uppercase tracking-wider">Govt Scheme</span>
                                    <h3 className="text-white font-extrabold text-lg leading-snug w-3/4 mb-1">PM-Kisan Benefits</h3>
                                    <p className="text-gray-300 text-xs mb-3 font-medium">Next installment details inside</p>
                                    <button className="text-white bg-white/15 border border-white/15 hover:bg-[#0ED054] hover:text-black hover:border-transparent tactile-btn text-[11px] font-bold px-4 py-2 rounded-xl w-fit">Check Status</button>
                                </div>
                                <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD6rTykEoLw0FAsqaXZjNpLhE_Et9y0ZLltrar7tGnvNsbTo5Il98Spalex59RUpC1ovjnhbX87dhGKBehVB9pQ190wlN2LjY8MxRhlqrFTyrdCmW_BCM-gc7gG-utp2ejSEIwJ8uEV11BI0SpEaOazeqffOorRHa7r1MFQ1VHXQhhusrmAOYUGv4qeslP9MnKFy6yH1S25E0YA6Tm_bDHj6qZsWQhYFz89kQuZEVpDKfhmA3xIX5cRO2DgXRG-c8msJw13qX5hZaLg')" }}></div>
                            </div>
                                                   {/* Copilot Analytics promotion */}
                            <div onClick={onAICopilotClick} className="cursor-pointer snap-center shrink-0 w-[88%] h-44 rounded-3xl overflow-hidden relative shadow-xl border border-white/10 hover:shadow-2xl active:scale-[0.98] transition-all duration-300 group">
                                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent z-10 flex flex-col justify-center p-5">
                                    <span className="bg-[#0ED054] text-black text-[9px] font-extrabold px-2.5 py-0.5 rounded-full w-fit mb-2 uppercase tracking-wider">AI Advisory</span>
                                    <h3 className="text-white font-extrabold text-lg leading-snug w-3/4 mb-1">Intelligent Advisory</h3>
                                    <p className="text-gray-300 text-xs mb-3 font-medium line-clamp-1">{getAdvisoryText()}</p>
                                    <button className="text-white bg-white/15 border border-white/15 hover:bg-[#0ED054] hover:text-black hover:border-transparent tactile-btn text-[11px] font-bold px-4 py-2 rounded-xl w-fit">Ask Copilot</button>
                                </div>
                                <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDfroD5SxbYM2BsmbodcmetFS2IeMErpKQIwOChdXb9LAT2Z-PSc9Gt8kRPr8fLnIRCWmsYZifSIybOFmGq8mnHx_4Ny3-K91P90F8Xe5COZQlXccSskNNB75KX5T1QTGfUhUtV9cXKasuB-042doT_CWxWPsSbo0z2X_1MA9619rcpKbxMkgD_G8-pW8TAgx9CBRQtVTv-1sxy-Blkq6WMQEkK37MF2ASUNdFBa4bJ57ThUyDPaFr2sco1Xs3bWBqLeiEfp7bTKekr')" }}></div>
                            </div>

                            {/* AIF Insights Promotion */}
                            <div onClick={() => onNavigate('ami-insights')} className="cursor-pointer snap-center shrink-0 w-[88%] h-44 rounded-3xl overflow-hidden relative shadow-xl border border-white/10 hover:shadow-2xl active:scale-[0.98] transition-all duration-300 group">
                                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent z-10 flex flex-col justify-center p-5">
                                    <span className="bg-emerald-500 text-black text-[9px] font-extrabold px-2.5 py-0.5 rounded-full w-fit mb-2 uppercase tracking-wider">AIF Funding</span>
                                    <h3 className="text-white font-extrabold text-lg leading-snug w-3/4 mb-1">Agri Infra Fund</h3>
                                    <p className="text-gray-300 text-xs mb-3 font-medium">Explore warehouses & startups funded near you</p>
                                    <button className="text-white bg-white/15 border border-white/15 hover:bg-[#0ED054] hover:text-black hover:border-transparent tactile-btn text-[11px] font-bold px-4 py-2 rounded-xl w-fit">View Database</button>
                                </div>
                                <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop')" }}></div>
                            </div>
                        </div>

                        {/* Highly Tactile Services Panel */}
                        <div className="krishi-glass border border-white/20 dark:border-white/5 rounded-3xl p-5 mb-6 shadow-2xl relative">
                            <h2 className="font-extrabold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider text-[10px]">Farm Services</h2>
                            
                            <div className="grid grid-cols-4 gap-y-5 gap-x-2">
                                <button onClick={onWeatherClick} className="flex flex-col items-center gap-2 group tactile-btn">
                                    <div className="h-13 w-13 rounded-2xl bg-purple-100 dark:bg-purple-950/40 border border-purple-200/20 flex items-center justify-center transition-all group-active:scale-95 shadow-md">
                                        <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-[26px]">cloud</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Weather</span>
                                </button>
                                
                                <button onClick={onAICopilotClick} className="flex flex-col items-center gap-2 group tactile-btn">
                                    <div className="h-13 w-13 rounded-2xl bg-blue-100 dark:bg-blue-950/40 border border-blue-200/20 flex items-center justify-center transition-all group-active:scale-95 relative shadow-md">
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0ED054] opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0ED054]"></span>
                                        </span>
                                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[26px]">smart_toy</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Copilot</span>
                                </button>
                                
                                <button onClick={onSchemesClick} className="flex flex-col items-center gap-2 group tactile-btn">
                                    <div className="h-13 w-13 rounded-2xl bg-orange-100 dark:bg-orange-950/40 border border-orange-200/20 flex items-center justify-center transition-all group-active:scale-95 shadow-md">
                                        <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-[26px]">description</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Schemes</span>
                                </button>
                                
                                <button onClick={onScanClick} className="flex flex-col items-center gap-2 group tactile-btn">
                                    <div className="h-13 w-13 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200/20 flex items-center justify-center transition-all group-active:scale-95 shadow-md">
                                        <span className="material-symbols-outlined text-emerald-600 dark:text-[#0ED054] text-[26px]">qr_code_scanner</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Scan Crop</span>
                                </button>
                                
                                <button onClick={onMandiPricesClick} className="flex flex-col items-center gap-2 group tactile-btn">
                                    <div className="h-13 w-13 rounded-2xl bg-pink-100 dark:bg-pink-950/40 border border-pink-200/20 flex items-center justify-center transition-all group-active:scale-95 shadow-md">
                                        <span className="material-symbols-outlined text-pink-600 dark:text-pink-400 text-[26px]">storefront</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Mandi</span>
                                </button>
                                
                                <button onClick={() => onNavigate('farm-list')} className="flex flex-col items-center gap-2 group tactile-btn">
                                    <div className="h-13 w-13 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 border border-indigo-200/20 flex items-center justify-center transition-all group-active:scale-95 shadow-md">
                                        <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-[26px]">inventory_2</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">My Farms</span>
                                </button>
                                
                                <button onClick={() => onNavigate('fertilizer-marketplace')} className="flex flex-col items-center gap-2 group tactile-btn">
                                    <div className="h-13 w-13 rounded-2xl bg-sky-100 dark:bg-sky-950/40 border border-sky-200/20 flex items-center justify-center transition-all group-active:scale-95 shadow-md">
                                        <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-[26px]">shopping_bag</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Market</span>
                                </button>
                                
                                <button onClick={onSoilTestClick} className="flex flex-col items-center gap-2 group tactile-btn">
                                    <div className="h-13 w-13 rounded-2xl bg-green-100 dark:bg-green-950/40 border border-green-200/20 flex items-center justify-center transition-all group-active:scale-95 shadow-md">
                                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[26px]">science</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Soil Test</span>
                                </button>

                                <button onClick={() => onNavigate('ami-insights')} className="flex flex-col items-center gap-2 group tactile-btn">
                                    <div className="h-13 w-13 rounded-2xl bg-[#0ED054]/10 dark:bg-[#0ED054]/20 border border-[#0ED054]/20 flex items-center justify-center transition-all group-active:scale-95 shadow-md">
                                        <span className="material-symbols-outlined text-emerald-600 dark:text-[#0ED054] text-[26px]">account_balance</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">AIF Funds</span>
                                </button>
                            </div>
                        </div>

                        {/* Warning-tinted Glass Advisory Alert */}
                        <div className="mb-6">
                            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-3 px-1">Alerts & Advisory</h2>
                            
                            <div className="flex flex-col gap-3">
                                {weather && weather.forecast && weather.forecast.length > 0 && weather.forecast[0].precipitation > 0 ? (
                                    <div className="krishi-glass dark:bg-red-950/15 border border-l-4 border-l-red-500 border-white/20 dark:border-white/5 p-4 rounded-2xl shadow-lg flex gap-4 items-start active:scale-[0.99] transition-transform duration-200 cursor-pointer">
                                        <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/35 flex-shrink-0 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                                            <span className="material-symbols-outlined">thunderstorm</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Heavy Rain Alert</h3>
                                                <span className="text-[10px] text-red-500 dark:text-red-400 font-extrabold uppercase">Now</span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">Precipitation expected in your region. Secure open seeds and postpone irrigation plans.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="krishi-glass dark:bg-blue-950/10 border border-l-4 border-l-[#0ED054] border-white/20 dark:border-white/5 p-4 rounded-2xl shadow-lg flex gap-4 items-start active:scale-[0.99] transition-transform duration-200 cursor-pointer">
                                        <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex-shrink-0 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <span className="material-symbols-outlined">wb_sunny</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Optimal Weather</h3>
                                                <span className="text-[10px] text-[#0ED054] font-extrabold uppercase">Active</span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">Optimal clear skies. Ideal conditions for normal crop field operations and spraying.</p>
                                        </div>
                                    </div>
                                )}

                                <div onClick={onAICopilotClick} className="krishi-glass dark:bg-emerald-950/10 border border-l-4 border-l-[#0ED054] border-white/20 dark:border-white/5 p-4 rounded-2xl shadow-lg flex gap-4 items-start active:scale-[0.99] transition-transform duration-200 cursor-pointer">
                                    <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex-shrink-0 flex items-center justify-center text-emerald-600 dark:text-[#0ED054] shadow-sm">
                                        <span className="material-symbols-outlined">psychiatry</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">AI Recommendation</h3>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase">Copilot</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{getAdvisoryText()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Mandi Trends */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Live Market Trends</h2>
                                <span className="text-[9px] font-extrabold text-[#0ED054] bg-[#0ED054]/10 border border-[#0ED054]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Live</span>
                            </div>
                            
                            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-3">
                                <div onClick={onMandiPricesClick} className="min-w-[145px] krishi-glass dark:bg-white/5 border border-white/10 p-4 rounded-2xl shadow-md flex flex-col gap-2 hover:shadow-lg active:scale-95 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="h-8 w-8 rounded-xl bg-yellow-100 dark:bg-yellow-950/40 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-yellow-700 dark:text-yellow-400 text-lg">spa</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-green-600 dark:text-[#0ED054] bg-green-500/10 px-1.5 py-0.5 rounded flex items-center">
                                            <span className="material-symbols-outlined text-[10px] mr-0.5">trending_up</span> 2%
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Wheat</p>
                                        <p className="text-base font-extrabold text-gray-900 dark:text-white">₹2,450</p>
                                    </div>
                                </div>
                                
                                <div onClick={onMandiPricesClick} className="min-w-[145px] krishi-glass dark:bg-white/5 border border-white/10 p-4 rounded-2xl shadow-md flex flex-col gap-2 hover:shadow-lg active:scale-95 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="h-8 w-8 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-red-700 dark:text-red-400 text-lg">nutrition</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded flex items-center">
                                            <span className="material-symbols-outlined text-[10px] mr-0.5">trending_down</span> 0.5%
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Tomato</p>
                                        <p className="text-base font-extrabold text-gray-900 dark:text-white">₹1,200</p>
                                    </div>
                                </div>
                                
                                <div onClick={onMandiPricesClick} className="min-w-[145px] krishi-glass dark:bg-white/5 border border-white/10 p-4 rounded-2xl shadow-md flex flex-col gap-2 hover:shadow-lg active:scale-95 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="h-8 w-8 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-orange-700 dark:text-orange-400 text-lg">grain</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-500/10 px-1.5 py-0.5 rounded flex items-center">
                                            <span className="material-symbols-outlined text-[10px] mr-0.5">remove</span> 0%
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Corn</p>
                                        <p className="text-base font-extrabold text-gray-900 dark:text-white">₹1,890</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Bottom Sticky Interactive Navbar */}
                    <BottomNavbar activeTab="dashboard" onNavigate={onNavigate} />

                    {/* Side Navigation Menu Drawer */}
                    <SideDrawerMenu
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        userProfile={userProfile}
                        onNavigate={onNavigate}
                    />

                    {/* Floating Pulse 3D AI Copilot Orb - Easy Thumb Reach */}
                    <div 
                        onClick={onAICopilotClick}
                        className="fixed bottom-[88px] right-5 z-40 w-14 h-14 rounded-full copilot-3d-orb flex items-center justify-center cursor-pointer shadow-2xl border border-white/20 active:scale-90 transition-transform"
                    >
                        <span className="material-symbols-outlined text-white text-[28px] animate-pulse">smart_toy</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;

