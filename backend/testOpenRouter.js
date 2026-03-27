const axios = require('axios');
const OPENROUTER_API_KEY = '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';

async function run() {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: 'test message please respond with hello' }],
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:5000',
                'Content-Type': 'application/json'
            }
        });

        console.log('SUCCESS:', response.data.choices[0].message.content);
    } catch (e) {
        console.log('ERROR:', e.response?.data || e.message);
    }
}
run();
