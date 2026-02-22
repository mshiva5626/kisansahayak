import React, { useState, useEffect } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import { weatherAPI, farmAPI } from '../api';

const WeatherInsights = ({ onBack, onNavigate, selectedFarmId }) => {
    const [weather, setWeather] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [locationName, setLocationName] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeather = async () => {
            setIsLoading(true);
            setError(null);

            if (!selectedFarmId) {
                setError('No farm selected. Please select a farm to view weather data.');
                setIsLoading(false);
                return;
            }

            try {
                const { data: farmData } = await farmAPI.getFarmById(selectedFarmId);
                const farm = farmData.farm;

                const lat = farm.latitude || farm.location?.lat;
                const lon = farm.longitude || farm.location?.lon;

                if (!lat || !lon) {
                    setError('Location not configured.');
                    setLocationName(farm.farm_name || 'Unknown');
                    setIsLoading(false);
                    return;
                }

                setLocationName(farm.state ? `${farm.farm_name}, ${farm.state}` : farm.farm_name || 'Your Farm');

                const { data } = await weatherAPI.getWeather(lat, lon);
                setWeather({
                    temp: Math.round(data.temperature ?? data.temp),
                    condition: data.condition || 'Unknown',
                    humidity: data.humidity,
                    wind: data.wind_speed || 0,
                    forecast: data.forecast || []
                });
            } catch (err) {
                console.error('Weather error:', err);
                setError('Failed to load weather data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchWeather();
    }, [selectedFarmId]);

    // Generate agri-recommendation based on real weather
    const getAgriRecommendation = () => {
        if (!weather) return '';
        if (weather.humidity > 80) {
            return `High humidity (${weather.humidity}%) creates conditions favorable for fungal infections. Monitor crops closely, ensure proper drainage, and consider preventive fungicide application.`;
        }
        if (weather.temp > 38) {
            return `High temperature (${weather.temp}°C) may cause heat stress. Increase irrigation frequency, apply mulch to retain soil moisture, and avoid mid-day field activities.`;
        }
        if (weather.wind > 30) {
            return `Strong winds (${weather.wind} km/h) detected. Postpone any spraying operations. Check crop supports and windbreaks for damage.`;
        }
        if (weather.condition?.toLowerCase().includes('rain')) {
            return `Rain expected. Postpone fertilizer and pesticide application. Ensure field drainage channels are clear. Good time for transplanting.`;
        }
        return `Current conditions (${weather.temp}°C, ${weather.humidity}% humidity) are favorable for field operations. Good conditions for fertilizer application and irrigation scheduling.`;
    };

    if (isLoading) {
        return (
            <div className="bg-background-light dark:bg-background-dark h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500">Loading weather data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-white font-display antialiased h-screen w-full overflow-hidden flex flex-col relative">
                <header className="px-6 py-12 flex justify-between items-center z-40 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
                            <span className="material-icons-round">arrow_back</span>
                        </button>
                        <span className="font-semibold text-lg">Weather</span>
                    </div>
                </header>
                <div className="flex-1 flex items-center justify-center px-6">
                    <div className="text-center">
                        <span className="material-icons-round text-6xl text-gray-300 dark:text-gray-600 mb-4 block">cloud_off</span>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
                        <button onClick={onBack} className="mt-4 px-6 py-2 bg-primary text-black rounded-xl text-sm font-semibold">Go Back</button>
                    </div>
                </div>
                <BottomNavbar activeTab="dashboard" onNavigate={onNavigate} />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-[#0a140a] font-display text-white relative">
            {/* Ambient Background Gradient for Weather */}
            <div className={`fixed inset-0 z-0 pointer-events-none transition-colors duration-1000 ${weather?.condition?.toLowerCase().includes('rain') ? 'bg-gradient-to-b from-[#1a2b3c] to-[#0a140a]' : 'bg-gradient-to-b from-[#0a2e1a] to-[#0a140a]'}`}></div>

            {/* Header */}
            <header className="px-5 pt-12 pb-6 relative z-10 sticky top-0 bg-[#0a140a]/80 backdrop-blur-xl border-b border-[#1a3a1a]">
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1a2e1a] border border-[#2a4a2a] text-[#8abf8a] hover:text-white transition-all">
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div className="text-center flex-1">
                        <h1 className="text-xl font-bold tracking-wide">Weather Insights</h1>
                        <p className="text-[#8abf8a] text-xs flex items-center justify-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            {locationName}
                        </p>
                    </div>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1a2e1a] border border-[#2a4a2a] text-[#8abf8a] hover:text-white transition-all">
                        <span className="material-symbols-outlined text-xl">share</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 relative z-10 px-5 pt-6 space-y-6">

                {/* Hero Current Weather */}
                {weather && (
                    <div className="relative text-center pb-6">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#13ec6d]/10 rounded-full blur-3xl -z-10"></div>
                        <div className="flex justify-center mb-2">
                            {weather.condition?.toLowerCase().includes('rain') ? (
                                <span className="material-symbols-outlined text-6xl text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]">rainy</span>
                            ) : weather.condition?.toLowerCase().includes('cloud') ? (
                                <span className="material-symbols-outlined text-6xl text-gray-300 drop-shadow-[0_0_15px_rgba(209,213,219,0.5)]">cloudy</span>
                            ) : (
                                <span className="material-symbols-outlined text-6xl text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">sunny</span>
                            )}
                        </div>
                        <div className="flex items-start justify-center">
                            <h2 className="text-[5rem] font-black leading-none tracking-tighter mix-blend-screen">{weather.temp}</h2>
                            <span className="text-3xl font-bold mt-2 text-[#8abf8a]">°C</span>
                        </div>
                        <p className="text-xl text-white font-medium capitalize mt-1 tracking-wide">{weather.condition}</p>
                        <div className="flex items-center justify-center gap-3 mt-3">
                            <span className="bg-[#1a2e1a] border border-[#2a4a2a] px-3 py-1 rounded-full text-xs text-[#8abf8a] font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">thermostat</span>
                                Feels like {weather.temp + 1}°
                            </span>
                        </div>
                    </div>
                )}

                {/* Metrics Grid */}
                {weather && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#1a2e1a]/90 backdrop-blur-md border border-[#2a4a2a] shadow-lg rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                            <div className="flex items-center gap-2 text-[#a8dda8] text-[11px] uppercase tracking-widest font-bold">
                                <span className="material-symbols-outlined text-blue-400 text-sm">water_drop</span>
                                Humidity
                            </div>
                            <div className="text-3xl font-black text-white">{weather.humidity}<span className="text-sm font-bold text-[#8abf8a] ml-1">%</span></div>
                            <div className="text-[11px] font-bold text-[#8abf8a] mt-1">{weather.humidity > 70 ? 'High' : 'Normal'} Range</div>
                        </div>

                        <div className="bg-[#1a2e1a]/90 backdrop-blur-md border border-[#2a4a2a] shadow-lg rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-gray-400/10 rounded-full blur-xl group-hover:bg-gray-400/20 transition-all"></div>
                            <div className="flex items-center gap-2 text-[#a8dda8] text-[11px] uppercase tracking-widest font-bold">
                                <span className="material-symbols-outlined text-gray-400 text-sm">air</span>
                                Wind
                            </div>
                            <div className="text-3xl font-black text-white">{weather.wind}<span className="text-sm font-bold text-[#8abf8a] ml-1">km/h</span></div>
                            <div className="text-[11px] font-bold text-[#8abf8a] mt-1">{weather.wind > 20 ? 'Strong' : 'Light Breeze'}</div>
                        </div>

                        <div className="bg-[#1a2e1a]/90 backdrop-blur-md border border-[#2a4a2a] shadow-lg rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-400/10 rounded-full blur-xl group-hover:bg-blue-400/20 transition-all"></div>
                            <div className="flex items-center gap-2 text-[#a8dda8] text-[11px] uppercase tracking-widest font-bold">
                                <span className="material-symbols-outlined text-blue-400 text-sm">umbrella</span>
                                Rain Chance
                            </div>
                            <div className="text-3xl font-black text-white">{weather.condition?.toLowerCase().includes('rain') ? '80' : '10'}<span className="text-sm font-bold text-[#8abf8a] ml-1">%</span></div>
                            <div className="text-[11px] font-bold text-[#8abf8a] mt-1">Next 24 Hours</div>
                        </div>

                        <div className="bg-[#1a2e1a]/90 backdrop-blur-md border border-[#2a4a2a] shadow-lg rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition-all"></div>
                            <div className="flex items-center gap-2 text-[#a8dda8] text-[11px] uppercase tracking-widest font-bold">
                                <span className="material-symbols-outlined text-orange-400 text-sm">wb_sunny</span>
                                UV Index
                            </div>
                            <div className="text-3xl font-black text-white">6<span className="text-sm font-bold text-[#8abf8a] ml-1">/11</span></div>
                            <div className="text-[11px] font-bold text-orange-400 mt-1">Moderate</div>
                        </div>
                    </div>
                )}

                {/* Agri-Insight Card */}
                {weather && (
                    <div className="relative mt-2 p-[1px] rounded-2xl overflow-hidden bg-gradient-to-r from-[#13ec6d] via-[#10b953] to-[#0a662e] shadow-[0_0_20px_rgba(19,236,109,0.15)]">
                        <div className="bg-[#0f1f0f] rounded-2xl p-4 h-full">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 shrink-0 rounded-full bg-[#13ec6d]/20 flex items-center justify-center border border-[#13ec6d]/30">
                                    <span className="material-symbols-outlined text-[#13ec6d] text-2xl">psychology</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                                        AI Agronomist
                                        <span className="w-2 h-2 rounded-full bg-[#13ec6d] animate-pulse"></span>
                                    </h3>
                                    <p className="text-[#8abf8a] text-sm leading-relaxed mb-3">
                                        {getAgriRecommendation()}
                                    </p>
                                    <button className="text-[#13ec6d] text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:underline">
                                        View Detailed Advisory <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detailed Forecast */}
                {weather?.forecast && weather.forecast.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-white font-bold tracking-wide mb-4">7-Day Forecast</h3>
                        <div className="bg-[#1a2e1a]/90 backdrop-blur-md border border-[#2a4a2a] shadow-lg rounded-2xl overflow-hidden">
                            <div className="flex flex-col">
                                {weather.forecast.map((day, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 border-b last:border-0 border-[#2a4a2a]">
                                        <div className="w-24 text-[15px] font-bold text-white">
                                            {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="flex-1 flex items-center justify-start gap-3">
                                            <span className="material-symbols-outlined text-gray-300">
                                                {day.condition?.toLowerCase().includes('rain') ? 'rainy'
                                                    : day.condition?.toLowerCase().includes('cloud') ? 'cloudy'
                                                        : 'sunny'}
                                            </span>
                                            {day.precipitation > 0 && (
                                                <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded flex items-center">
                                                    <span className="material-symbols-outlined text-[10px] mr-0.5">water_drop</span>
                                                    {day.precipitation}mm
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-24 flex items-center justify-end gap-2 text-[15px]">
                                            <span className="text-white font-black">{Math.round(day.temp_max)}°</span>
                                            <span className="text-[#8abf8a] font-bold">{Math.round(day.temp_min)}°</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <BottomNavbar activeTab="dashboard" onNavigate={onNavigate} />
        </div>
    );
};

export default WeatherInsights;
