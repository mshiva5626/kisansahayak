require('dotenv').config();
const { getWeather } = require('./services/weatherService');

(async () => {
    try {
        console.log('Testing Weatherbit API...');
        // Test with New Delhi coordinates
        const data = await getWeather(28.61, 77.20);
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Test failed:', err);
    }
})();
