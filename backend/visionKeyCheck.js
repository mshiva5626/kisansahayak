require('dotenv').config();
(async () => {
    const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.CROP_ANALYSIS_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: 'nvidia/nemotron-nano-12b-v2-vl:free',
            messages: [{role: "user", content: [{ type: "text", text: "hello" }, { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgo" } }] }]
        })
    });
    const result = await response.json();
    require('fs').writeFileSync('clean_response.txt', 'STATUS: ' + response.status + '\nDATA: ' + JSON.stringify(result), 'utf8');
})();
