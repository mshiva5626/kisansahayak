const axios = require('axios');

// In-memory weather cache: key = "lat,lon", value = { data, timestamp }
const weatherCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const getWeather = async (lat, lon) => {
    const cacheKey = `${parseFloat(lat).toFixed(2)},${parseFloat(lon).toFixed(2)}`;

    // Check cache
    const cached = weatherCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
        return { ...cached.data, cached: true };
    }

    try {
        // Open-Meteo API (no API key required)
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: lat,
                longitude: lon,
                current_weather: true,
                hourly: 'temperature_2m,relativehumidity_2m,precipitation',
                daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode',
                timezone: 'auto',
                forecast_days: 7
            }
        });

        const current = response.data.current_weather;
        const hourly = response.data.hourly;
        const daily = response.data.daily;

        // Build structured weather response
        const weatherData = {
            temperature: current.temperature,
            humidity: hourly.relativehumidity_2m?.[0] || null,
            rainfall: hourly.precipitation?.[0] || 0,
            condition: mapWeatherCode(current.weathercode),
            wind_speed: current.windspeed,
            forecast: daily ? daily.time.map((date, i) => ({
                date,
                temp_max: daily.temperature_2m_max?.[i],
                temp_min: daily.temperature_2m_min?.[i],
                precipitation: daily.precipitation_sum?.[i],
                condition: mapWeatherCode(daily.weathercode?.[i])
            })) : [],
            cached: false,
            last_updated: new Date().toISOString()
        };

        // Update cache
        weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });

        return weatherData;
    } catch (error) {
        console.error('Weather API Error:', error.message);
        throw new Error('Weather data temporarily unavailable');
    }
};

// Map WMO weather codes to human-readable conditions
const mapWeatherCode = (code) => {
    if (code === undefined || code === null) return 'Unknown';
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 49) return 'Foggy';
    if (code <= 59) return 'Drizzle';
    if (code <= 69) return 'Rain';
    if (code <= 79) return 'Snow';
    if (code <= 84) return 'Rain Showers';
    if (code <= 86) return 'Snow Showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Cloudy';
};

module.exports = { getWeather };
