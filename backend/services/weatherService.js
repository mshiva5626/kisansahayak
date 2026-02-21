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

    let weatherData;

    try {
        // We use Open-Meteo (which is free and highly accurate if configured right)
        // Adding more high-resolution models for Indian region (e.g. ECMWF or best_match)
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: lat,
                longitude: lon,
                current_weather: true,
                hourly: 'temperature_2m,relativehumidity_2m,precipitation,windspeed_10m',
                daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max',
                timezone: 'auto',
                forecast_days: 7,
                models: 'best_match' // This forces Open-Meteo to use the most accurate model for the coordinates
            }
        });

        const current = response.data.current_weather;
        const hourly = response.data.hourly;
        const daily = response.data.daily;

        weatherData = {
            temperature: current.temperature,
            // Find current humidity in hourly data by matching the current time
            humidity: hourly.relativehumidity_2m[hourly.time.indexOf(current.time)] || hourly.relativehumidity_2m[0],
            rainfall: hourly.precipitation[hourly.time.indexOf(current.time)] || 0,
            condition: mapWeatherCode(current.weathercode),
            wind_speed: current.windspeed,
            forecast: daily ? daily.time.map((date, i) => ({
                date,
                temp_max: daily.temperature_2m_max[i],
                temp_min: daily.temperature_2m_min[i],
                precipitation: daily.precipitation_sum[i],
                condition: mapWeatherCode(daily.weathercode[i])
            })) : [],
            cached: false,
            last_updated: new Date().toISOString(),
            source: 'open-meteo-high-res'
        };

        // Update cache
        weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });

        return weatherData;

    } catch (error) {
        console.error('Weather API Error:', error.message);
        throw new Error('Highly accurate weather data temporarily unavailable');
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
