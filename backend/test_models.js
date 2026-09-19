const apiKey = process.env.OPENROUTER_API_KEY || '';
const models = [
    'google/gemma-4-26b-a4b-it:free',
    'nex-agi/nex-n2.5-pro:free',
    'nex-agi/nex-n2.5-mini:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'thinkingmachines/inkling:free',
    'z-ai/glm-5.2:free'
];

async function test() {
    for (const m of models) {
        const t = Date.now();
        try {
            const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: m,
                    messages: [{ role: 'user', content: 'What is wheat crop? Reply in 2 sentences only. No thinking.' }],
                    max_tokens: 100
                }),
                signal: AbortSignal.timeout(30000)
            });
            const d = await r.json();
            const c = d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
            const elapsed = Date.now() - t;
            if (d.error) {
                console.log(m + ': ' + elapsed + 'ms -> ERROR: ' + d.error.message);
            } else {
                console.log(m + ': ' + elapsed + 'ms -> ' + (c ? 'OK: ' + c.substring(0, 100) : 'EMPTY CONTENT'));
            }
        } catch (e) {
            console.log(m + ': ' + (Date.now() - t) + 'ms -> FAIL: ' + e.message);
        }
    }
}

test();
