require('dotenv').config({ path: './backend/.env' });
const { callLiquidModel } = require('./backend/services/fertilizerService');

async function test() {
    try {
        console.log("Testing callLiquidModel directly with API KEY:", process.env.FERTILIZER_API_KEY ? "Loaded" : "MISSING!");
        const messages = [{ role: 'user', content: 'Price of Urea?' }];
        const response = await callLiquidModel(messages);
        console.log("SUCCESS RESPONSE:");
        console.log(response);
    } catch (err) {
        console.error("FATAL SERVICE ERROR CAUGHT:");
        console.error(err.message || err);
    }
}
test();
