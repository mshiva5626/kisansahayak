require('dotenv').config();
const { fetchMandiPrices } = require('./services/mandiService');

async function testMandi() {
    try {
        console.log("Testing Mandi Fetch...");
        const result = await fetchMandiPrices("Punjab", "Ludhiana", "Wheat");
        console.log("Success:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Test Failed:", e);
    }
}
testMandi();
