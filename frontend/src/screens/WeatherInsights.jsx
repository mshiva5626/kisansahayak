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
        <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-white font-display antialiased h-screen w-full overflow-hidden flex flex-col relative">
            {/* App Header */}
            <header className="px-6 py-12 flex justify-between items-center z-40 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
                        <span className="material-icons-round">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-primary">
                            <span className="material-icons-round text-lg">location_on</span>
                            <span className="font-semibold text-lg">{locationName}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Scroll Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 px-6 relative z-30 space-y-6 pt-6">
                {weather && (
                    <>
                        {/* Hero: Current Conditions */}
                        <section className="text-center relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10"></div>
                            <div className="flex flex-col items-center">
                                <h1 className="text-7xl font-bold tracking-tighter text-gray-900 dark:text-white">{weather.temp}°</h1>
                                <p className="text-xl font-medium text-primary mt-1">{weather.condition}</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Humidity {weather.humidity}% • Wind {weather.wind} km/h
                                </p>
                            </div>
                        </section>

                        {/* Metrics Grid */}
                        <section className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Humidity', val: `${weather.humidity}%`, icon: 'water_drop', sub: weather.humidity > 70 ? 'High — watch for fungi' : 'Normal range' },
                                { label: 'Wind Speed', val: `${weather.wind} km/h`, icon: 'air', sub: weather.wind > 20 ? 'Strong — avoid spray' : 'Light breeze' }
                            ].map((m, idx) => (
                                <div key={idx} className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                                    <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase tracking-wider font-bold">
                                        <span className="material-icons-round text-primary text-sm">{m.icon}</span>
                                        {m.label}
                                    </div>
                                    <div className="text-xl font-bold">{m.val}</div>
                                    {m.sub && <div className="text-[10px] text-gray-500">{m.sub}</div>}
                                </div>
                            ))}
                        </section>

                        {/* 7-Day Forecast */}
                        {weather.forecast.length > 0 && (
                            <section>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3">7-Day Forecast</h3>
                                <div className="space-y-2">
                                    {weather.forecast.map((day, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 rounded-xl px-4 py-3">
                                            <span className="text-sm text-gray-600 dark:text-gray-300 w-20">
                                                {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                                            </span>
                                            <span className="text-xs text-gray-400 flex-1 text-center">{day.condition}</span>
                                            <div className="flex items-center gap-2">
                                                {day.precipitation > 0 && (
                                                    <span className="text-xs text-blue-500 flex items-center gap-0.5">
                                                        <span className="material-icons-round text-xs">water_drop</span>
                                                        {day.precipitation}mm
                                                    </span>
                                                )}
                                                <span className="text-sm font-bold w-16 text-right">
                                                    {Math.round(day.temp_max)}° / {Math.round(day.temp_min)}°
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Agri-Insight Card */}
                        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                            <div className="flex items-start gap-3 mb-3">
                                <span className="bg-primary/20 text-primary p-2 rounded-xl">
                                    <span className="material-icons-round">agriculture</span>
                                </span>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Agri Weather Recommendation</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Based on {weather.condition} conditions</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                {getAgriRecommendation()}
                            </p>
                        </section>
                    </>
                )}
            </main>

            {/* Bottom Nav */}
            <BottomNavbar activeTab="dashboard" onNavigate={onNavigate} />
        </div>
    );
};

export default WeatherInsights;
