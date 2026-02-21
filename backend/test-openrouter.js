const { OpenRouter } = require("@openrouter/sdk");

const openrouter = new OpenRouter({
    apiKey: "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"
});

async function testConnection() {
    console.log("Checking OpenRouter connection...");
    try {
        const stream = await openrouter.chat.send({
            model: "stepfun/step-3.5-flash:free",
            messages: [
                {
                    role: "user",
                    content: "Reply with the exact word: SUCCESS"
                }
            ],
            stream: true
        });

        let response = "";
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                response += content;
            }
        }

        console.log("✓ Connection Successful!");
        console.log("Response:", response.trim());

    } catch (err) {
        console.error("❌ Connection failed!");
        console.error(err.message || err);
    }
}

testConnection();
