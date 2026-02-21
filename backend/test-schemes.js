require('dotenv').config();
const { generateRealtimeSchemes } = require('./services/schemeAiService');

async function test() {
    try {
        console.log("Testing generateRealtimeSchemes...");
        const result = await generateRealtimeSchemes('Odisha');
        console.log("Success! Result:", result);
    } catch (e) {
        console.error("Test Failed:", e);
    }
}
test();
