import React, { useState, useEffect } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import { weatherAPI, farmAPI } from '../api';

const Dashboard = ({ onProfileClick, onNotificationClick, onAICopilotClick, onScanClick, onWeatherClick, onFarmSwitcherClick, onSchemesClick, onTodayFocusClick, onNavigate, userProfile, selectedFarmId }) => {
    const [weather, setWeather] = useState(null);
    const [farm, setFarm] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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
        <div className="mx-auto max-w-md w-full min-h-screen relative flex flex-col pb-24 bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 antialiased">
            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center gap-3 animate-fade-in">
                    <div className="relative" onClick={onProfileClick}>
                        <img
                            alt="Farmer Profile Portrait"
                            className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-white/10 shadow-sm cursor-pointer"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD97JG_xEY2anBSsxKxdXwZYQSTYqM7GzyusAzNhDhew_BZvF6DKbvn6Sw10i6zzyH_eXif6lG1Wuk3XjqhLqX6hDgNFVRAjk9jYg3Cko4ZcLUaAIfL18HoGhDzQoXoIeVri-jFT3Zwa-XiFi0Yfb3BQljIro6U0iGSZAD-jJvcTzXCzUByA-XyTPQXHAs7UArQZqDmGTuSn4zRmxDKat4rSf3FMFHdtbnFLmWQKuu1_4tqGPpBFzAGG_B7SMVCH1xk6DrXjBBM6X5f"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-background-dark"></div>
                    </div>
                    <div onClick={onFarmSwitcherClick} className="cursor-pointer group">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase flex items-center gap-1 group-hover:text-primary transition-colors">
                            {farm?.farm_name || 'No Farm Selected'}
                            <span className="material-icons-round text-xs">expand_more</span>
                        </p>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Namaste, {userProfile?.name?.split(' ')[0] || 'Farmer'}</h1>
                    </div>
                </div>
                <button
                    onClick={onNotificationClick}
                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                >
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-background-dark"></span>
                    <span className="material-icons-round text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">notifications</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-6 flex flex-col gap-6">
                {/* AI Copilot Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-glass border border-white/60 dark:border-white/5 p-6 animate-fade-in delay-100">
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 flex items-center justify-center">
                                    <div className="pulse-ring bg-primary/20"></div>
                                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 text-white">
                                        <span className="material-icons-round text-xl">smart_toy</span>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kisan Sahayak</h2>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                        <span className="text-xs font-medium text-primary uppercase tracking-wider">System Active</span>
                                    </div>
                                </div>
                            </div>
                            <span className="material-icons-round text-gray-300 dark:text-gray-600">more_horiz</span>
                        </div>
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed cursor-pointer" onClick={onTodayFocusClick}>
                                {getAdvisoryText()}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={onAICopilotClick}
                                    className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 px-4 rounded-xl text-sm font-semibold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons-round text-lg">mic</span>
                                    Ask Assistant
                                </button>
                                <button
                                    onClick={onScanClick}
                                    className="p-3 bg-white dark:bg-white/10 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm active:scale-95 transition-transform"
                                >
                                    <span className="material-icons-round text-gray-600 dark:text-white">qr_code_scanner</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="animate-fade-in delay-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-900 dark:text-white font-bold text-lg">Farm Overview</h3>
                        <button
                            onClick={() => onNavigate('farm-list')}
                            className="text-xs font-semibold text-primary uppercase tracking-wider hover:underline"
                        >
                            View Farms
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500 dark:text-blue-400">
                                    <span className="material-icons-round text-xl">water_drop</span>
                                </div>
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Humidity</span>
                            </div>
                            <div className="mt-2">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {weather ? `${weather.humidity}%` : '—'}
                                </span>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {weather ? 'Current' : 'No data'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="glass-panel p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow" onClick={onWeatherClick}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-500 dark:text-orange-400">
                                    <span className="material-icons-round text-xl">wb_sunny</span>
                                </div>
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Temp</span>
                            </div>
                            <div className="mt-2">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {weather ? `${weather.temp}°C` : '—'}
                                </span>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {weather ? weather.condition : 'No data'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="glass-panel p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-500 dark:text-purple-400">
                                    <span className="material-icons-round text-xl">storefront</span>
                                </div>
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Crop</span>
                            </div>
                            <div className="mt-2">
                                <span className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                                    {farm?.crop_type || 'None'}
                                </span>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {farm?.terrain_type ? `${farm.terrain_type} terrain` : 'No farm'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="glass-panel p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                                    <span className="material-icons-round text-xl">spa</span>
                                </div>
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Water</span>
                            </div>
                            <div className="mt-2">
                                <span className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                                    {farm?.water_source || 'N/A'}
                                </span>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {farm?.area ? `${farm.area} area` : 'Source'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Scroll */}
                <div className="w-full">
                    <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-3">Quick Actions</h3>
                    <div className="flex gap-3 overflow-x-auto scroll-hide pb-2">
                        {[
                            { label: 'Schemes', icon: 'account_balance', color: 'text-primary', action: onSchemesClick },
                            { label: 'My Farms', icon: 'inventory_2', color: 'text-blue-500', action: () => onNavigate('farm-list') },
                            { label: 'Add Farm', icon: 'add_circle', color: 'text-orange-500', action: () => onNavigate('farm-wizard') }
                        ].map((item, idx) => (
                            <button key={idx} onClick={item.action} className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap active:bg-gray-50 dark:active:bg-white/10">
                                <span className={`material-icons-round text-lg ${item.color}`}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Weather Preview Card */}
                <div
                    onClick={onWeatherClick}
                    className="relative overflow-hidden rounded-2xl h-32 w-full mt-2 cursor-pointer group"
                >
                    <img
                        alt="Sunny wheat field landscape"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPCITDbo1w7QkMMZuj8UimZhXwrrAZ6caiM9cQuWRdPlz5ZnGW24fmc4BQH7vdf6q6FFvxq05UAhSgtYHJnANY0T0VxouPHdIKkyTMlio7wVEGBtUn0N30HFpf2EaxwncQTM6Lk03qG8mckfreGxxyBQWJxTHMDt1SLmsCQE3485K-EFQu2eExZ8AfxUKzeSHxR2O6Zuxff6DZy_ebYfBW0Qm9NvY69jLkFlcBPC6blCZjfAKvaT0qTJqfdi-cwLeS5cIqfNTMxmtu"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                        <p className="text-xs font-medium uppercase tracking-wider opacity-80">Next 3 Days</p>
                        <p className="font-bold text-lg">
                            {weather ? getForecastSummary() || weather.condition : 'Select farm for weather'}
                        </p>
                    </div>
                    <div className="absolute bottom-4 right-4 text-white">
                        <span className="material-icons-round text-3xl">
                            {weather?.condition?.toLowerCase().includes('rain') ? 'grain' : 'wb_sunny'}
                        </span>
                    </div>
                </div>
            </main>

            {/* Floating Dock Navigation */}
            <BottomNavbar
                activeTab="dashboard"
                onNavigate={onNavigate}
            />
        </div>
    );
};

export default Dashboard;
