const axios = require('axios');

const KEYS = [
    { name: 'Chatbot Key (new ec64)', key: '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' },
    { name: 'Image Analysis Key (8b29)', key: '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' },
    { name: 'Old Chatbot Key (18c0)', key: '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' },
];

async function testKey({ name, key }) {
    try {
        const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'say hello' }],
        }, {
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            timeout: 10000
        });
        console.log(`✅ [WORKING] ${name}: "${res.data.choices[0].message.content.substring(0, 50)}"`);
    } catch (e) {
        const errData = e.response?.data?.error;
        console.log(`❌ [FAILED]  ${name}: HTTP ${e.response?.status} - ${errData?.message || e.message}`);
    }
}

(async () => {
    for (const k of KEYS) await testKey(k);
})();
