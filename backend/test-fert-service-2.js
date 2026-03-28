require('dotenv').config();
const { callLiquidModel } = require('./services/fertilizerService');

async function debug() {
    try {
        console.log("Starting test with API KEY:", process.env.FERTILIZER_API_KEY ? "LOADED" : "MISSING");
        const messages = [{ role: 'user', content: 'What is Urea?' }];
        const response = await callLiquidModel(messages);
        console.log("SUCCESS:");
        console.log(response);
    } catch(err) {
        console.error("SERVICE CRASH CAUGHT:");
        console.error(err);
    }
}
debug();
