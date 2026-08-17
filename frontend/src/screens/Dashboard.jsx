import React, { useState, useEffect } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import SideDrawerMenu from '../components/SideDrawerMenu';
import DashboardSkeleton from '../components/DashboardSkeleton';
import LocationModal from '../components/LocationModal';
import { weatherAPI, farmAPI, mandiAPI, aiAPI } from '../api';

const Dashboard = ({ 
    onProfileClick, 
    onNotificationClick, 
    onAICopilotClick, 
    onScanClick, 
    onWeatherClick, 
    onFarmSwitcherClick, 
    onSchemesClick, 
    onMandiPricesClick, 
    onSoilTestClick, 
    onTodayFocusClick,
    onNavigate, 
    userProfile, 
    selectedFarmId,
    userLocation,
    onLocationChange
}) => {
    const [weather, setWeather] = useState(null);
    const [farm, setFarm] = useState(null);
    const [mandiSummary, setMandiSummary] = useState({ price: 2580, crop: 'Wheat', trend: 'hike', change: 70 });
    const [dailyTasksData, setDailyTasksData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTasksLoading, setIsTasksLoading] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    const activeState = userLocation?.state || userProfile?.state || 'Madhya Pradesh';
    const activeDistrict = userLocation?.district || userProfile?.district || 'Indore';
    const activeLanguage = userProfile?.preferred_language || localStorage.getItem('kisan_lang') || 'en';

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                let farmCrop = 'Wheat';
                let lat = userLocation?.latitude;
                let lon = userLocation?.longitude;

                if (selectedFarmId) {
                    try {
                        const { data } = await farmAPI.getFarmById(selectedFarmId);
                        if (data?.farm) {
                            setFarm(data.farm);
                            farmCrop = data.farm?.crop_type || 'Wheat';
                            lat = data.farm.latitude || data.farm.location?.lat || lat;
                            lon = data.farm.longitude || data.farm.location?.lon || lon;
                        }
                    } catch (fErr) {
                        console.warn('Farm load warning:', fErr.message);
                    }
                }

                // Weather fetch with graceful fallback to location coordinates
                if (lat && lon) {
                    try {
                        const { data: weatherData } = await weatherAPI.getWeather(lat, lon);
                        setWeather({
                            temp: Math.round(weatherData.temperature ?? weatherData.temp ?? 28),
                            condition: weatherData.condition || 'Clear Sky',
                            humidity: weatherData.humidity || 65,
                            wind_speed: weatherData.wind_speed || 12,
                            forecast: weatherData.forecast || []
                        });
                    } catch (e) {
                        console.error('Weather fetch failed:', e);
                    }
                }

                // Fetch authentic live mandi price for active location
                try {
                    const { data: mandiData } = await mandiAPI.getPrices(selectedFarmId || '', activeState, activeDistrict, farmCrop);
                    if (mandiData?.prices && mandiData.prices.length > 0) {
                        const topMandi = mandiData.prices[0];
                        setMandiSummary({
                            price: topMandi.modal_price,
                            crop: topMandi.commodity || farmCrop,
                            trend: topMandi.trend || 'hike',
                            change: topMandi.price_change || 0
                        });
                    }
                } catch (mErr) {
                    console.warn('Dashboard mandi fetch warning:', mErr);
                }

                // Fetch today's AI daily operations & field checks
                try {
                    setIsTasksLoading(true);
                    const { data: taskRes } = await aiAPI.getDailyTasks(selectedFarmId || 'default', activeLanguage);
                    if (taskRes?.data) {
                        setDailyTasksData(taskRes.data);
                    }
                } catch (tErr) {
                    console.warn('Dashboard tasks fetch warning:', tErr);
                } finally {
                    setIsTasksLoading(false);
                }

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [selectedFarmId, activeState, activeDistrict, userLocation, activeLanguage]);

    // Quick Task Completion Toggle directly from Dashboard
    const handleQuickTaskToggle = async (taskId, currentCompleted) => {
        const newCompleted = !currentCompleted;
        setDailyTasksData(prev => {
            if (!prev || !prev.tasks) return prev;
            return {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: newCompleted, dismissed: false } : t)
            };
        });

        try {
            await aiAPI.updateTaskStatus(selectedFarmId || 'default', taskId, { completed: newCompleted, dismissed: false });
        } catch (err) {
            console.warn('Failed to update task state:', err);
        }
    };

    // Quick Task Dismiss directly from Dashboard
    const handleQuickTaskDismiss = async (taskId) => {
        setDailyTasksData(prev => {
            if (!prev || !prev.tasks) return prev;
            return {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, dismissed: true, completed: false } : t)
            };
        });

        try {
            await aiAPI.updateTaskStatus(selectedFarmId || 'default', taskId, { dismissed: true, completed: false });
        } catch (err) {
            console.warn('Failed to dismiss task:', err);
        }
    };

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
                    <header className="relative bg-gradient-to-b from-[#052212] via-[#093a1e] to-[#0c4726] text-white pt-4 pb-8 safe-top rounded-b-[2.5rem] shadow-2xl border-b border-[#0ED054]/10 z-10 shrink-0">
                        {/* Interactive App Bar */}
                        <div className="px-6 flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={() => setIsDrawerOpen(true)}
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 cursor-pointer hover:bg-white/20 active:scale-95 transition-all shadow-md"
                                >
                                    <span className="material-symbols-outlined text-[#0ED054] text-[24px]">menu</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">Kissan Sahayak</h1>
                                    <p className="text-[10px] text-[#0ED054] font-bold tracking-widest uppercase">Smart Farming</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <button onClick={onNotificationClick} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 active:scale-95 transition-all relative shadow-md">
                                    <span className="material-symbols-outlined text-white text-[22px]">notifications</span>
                                    <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-red-500 border-2 border-[#0c4726] animate-ping"></span>
                                    <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-red-500 border-2 border-[#0c4726]"></span>
                                </button>
                                <div onClick={onProfileClick} className="h-10 w-10 rounded-2xl border-2 border-[#0ED054] overflow-hidden bg-white/20 cursor-pointer shadow-lg active:scale-95 transition-all" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD97JG_xEY2anBSsxKxdXwZYQSTYqM7GzyusAzNhDhew_BZvF6DKbvn6Sw10i6zzyH_eXif6lG1Wuk3XjqhLqX6hDgNFVRAjk9jYg3Cko4ZcLUaAIfL18HoGhDzQoXoIeVri-jFT3Zwa-XiFi0Yfb3BQljIro6U0iGSZAD-jJvcTzXCzUByA-XyTPQXHAs7UArQZqDmGTuSn4zRmxDKat4rSf3FMFHdtbnFLmWQKuu1_4tqGPpBFzAGG_B7SMVCH1xk6DrXjBBM6X5f')", backgroundSize: "cover", backgroundPosition: "center" }}>
                                </div>
                            </div>
                        </div>

                        {/* Top Location Feature (Upright & Functional) */}
                        <div className="px-6 pb-4 flex items-center justify-between">
                            <button
                                onClick={() => setIsLocationModalOpen(true)}
                                className="flex items-center space-x-2 bg-black/40 hover:bg-black/60 active:scale-95 border border-[#0ED054]/40 px-3.5 py-1.5 rounded-full text-white backdrop-blur-md transition-all cursor-pointer shadow-md"
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

                            <div className="flex items-center space-x-1.5 bg-white/10 px-2.5 py-1 rounded-full text-[10px] text-emerald-400 font-bold border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0ED054] animate-ping"></span>
                                <span>Agmarknet Verified</span>
                            </div>
                        </div>

                        {/* Interactive 3D Stats Deck */}
                        <div className="px-5 grid grid-cols-3 gap-3 pt-1 tilt-card-container">
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

                            {/* Mandi Wealth Card (Live & Grounded) */}
                            <div 
                                onClick={onMandiPricesClick}
                                className="krishi-glass dark:bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-between text-center cursor-pointer tilt-card relative"
                            >
                                <div className="flex items-center space-x-1">
                                    <span className="text-lg font-black text-[#EAB308]">₹{mandiSummary.price.toLocaleString('en-IN')}</span>
                                    <span className={`text-[10px] font-black ${mandiSummary.trend === 'hike' ? 'text-emerald-400' : mandiSummary.trend === 'lower' ? 'text-rose-400' : 'text-slate-400'}`}>
                                        {mandiSummary.trend === 'hike' ? '▲' : mandiSummary.trend === 'lower' ? '▼' : '●'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-300 font-bold flex items-center gap-0.5 mt-1 truncate w-full justify-center">
                                    <span className="material-symbols-outlined text-[13px] text-[#EAB308]">storefront</span>
                                    {mandiSummary.crop}
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
                                
                                <button onClick={onTodayFocusClick || (() => onNavigate('priority-tasks'))} className="flex flex-col items-center gap-2 group tactile-btn">
                                    <div className="h-13 w-13 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center transition-all group-active:scale-95 relative shadow-md">
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0ED054] opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0ED054]"></span>
                                        </span>
                                        <span className="material-symbols-outlined text-emerald-600 dark:text-[#0ED054] text-[26px]">task_alt</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Daily Checks</span>
                                </button>

                                <button onClick={onAICopilotClick} className="flex flex-col items-center gap-2 group tactile-btn">
                                    <div className="h-13 w-13 rounded-2xl bg-blue-100 dark:bg-blue-950/40 border border-blue-200/20 flex items-center justify-center transition-all group-active:scale-95 relative shadow-md">
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
                            </div>
                        </div>

                        {/* Interactive AI Daily Operations & Checks Tasks Bar */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#0ED054] animate-pulse"></span>
                                    <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Daily Checks & Tasks</h2>
                                </div>
                                <button 
                                    onClick={() => onNavigate('priority-tasks')} 
                                    className="text-[11px] font-bold text-[#0ED054] hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                    <span>View All</span>
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>

                            {/* Daily Operations Card */}
                            <div className="krishi-glass border border-emerald-500/20 dark:border-white/10 rounded-3xl p-4 shadow-xl">
                                {/* Header Info */}
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                            {dailyTasksData?.crop || farm?.crop_type || 'Crop'} Field Intelligence
                                        </span>
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                                            {dailyTasksData?.growth_stage || 'Active Field Operations'}
                                        </h3>
                                    </div>

                                    {dailyTasksData?.tasks && (
                                        <div className="text-right">
                                            <span className="text-xs font-black text-[#0ED054]">
                                                {dailyTasksData.tasks.filter(t => !t.dismissed && t.completed).length} / {dailyTasksData.tasks.filter(t => !t.dismissed).length}
                                            </span>
                                            <span className="text-[10px] text-gray-400 block">Done</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Tasks Interactive Checklist */}
                                {isTasksLoading ? (
                                    <div className="py-4 flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs text-gray-400">Loading daily checks...</span>
                                    </div>
                                ) : (dailyTasksData?.tasks || []).filter(t => !t.dismissed).length === 0 ? (
                                    <div className="py-3 text-center text-xs text-gray-400">
                                        All tasks completed for today! Great job.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2.5">
                                        {(dailyTasksData?.tasks || [])
                                            .filter(t => !t.dismissed)
                                            .slice(0, 3)
                                            .map((task) => (
                                                <div 
                                                    key={task.id}
                                                    className={`flex items-start justify-between p-2.5 rounded-2xl border transition-all ${
                                                        task.completed 
                                                            ? 'bg-emerald-500/10 border-emerald-500/30 opacity-75' 
                                                            : 'bg-white/40 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-emerald-500/30'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-2.5 flex-1 pr-2">
                                                        {/* Tick (✓) Checkbox */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleQuickTaskToggle(task.id, task.completed);
                                                            }}
                                                            className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                                                task.completed
                                                                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                                                                    : 'border-2 border-gray-300 dark:border-gray-600 hover:border-emerald-500 text-transparent'
                                                            }`}
                                                            title={task.completed ? 'Mark pending' : 'Mark completed'}
                                                        >
                                                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                                                        </button>

                                                        <div className="overflow-hidden">
                                                            <p className={`text-xs font-bold leading-tight ${
                                                                task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                                                            }`}>
                                                                {task.title}
                                                            </p>
                                                            {task.timing && (
                                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 mt-0.5">
                                                                    <span className="material-symbols-outlined text-[11px]">schedule</span>
                                                                    {task.timing}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Cross (✗) Dismiss Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleQuickTaskDismiss(task.id);
                                                        }}
                                                        className="text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                                                        title="Skip task"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                )}

                                {/* Bottom Survey / Full Checklist CTA */}
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => onNavigate('priority-tasks')}
                                        className="flex-1 py-2 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-sm">quiz</span>
                                        <span>Take Daily AI Survey</span>
                                    </button>
                                    <button
                                        onClick={() => onNavigate('priority-tasks')}
                                        className="py-2 px-3 bg-emerald-500 text-slate-950 font-bold text-[11px] rounded-xl shadow-md hover:bg-emerald-400 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                        <span>View Checklist</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
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
                </>
            )}
        </div>
    );
};

export default Dashboard;

