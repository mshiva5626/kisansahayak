const axios = require('axios');

const KEY_1 = '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';
const KEY_2 = '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';

async function testKey(name, key, model) {
    try {
        console.log(`\nTesting ${name} with ${model}...`);
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: model,
            messages: [{ role: 'user', content: 'say hello' }],
        }, {
            headers: {
                'Authorization': `Bearer ${key}`,
                'HTTP-Referer': 'http://localhost:5000',
                'Content-Type': 'application/json'
            }
        });
        console.log(`[SUCCESS] ${name}:`, response.data.choices[0].message.content);
    } catch (e) {
        console.log(`[ERROR] ${name}:`, JSON.stringify(e.response?.data || e.message));
    }
}

async function run() {
    await testKey('Chatbot Key (Free Model)', KEY_2, 'meta-llama/llama-3-8b-instruct:free');
    await testKey('Chatbot Key (Gemini)', KEY_2, 'google/gemini-1.5-flash');
}
run();
