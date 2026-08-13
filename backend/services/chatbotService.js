// backend/services/chatbotService.js
const { OpenRouter } = require("@openrouter/sdk");

/**
 * Chatbot extraction service
 * Streams the response and logs reasoning tokens inside the terminal
 */
async function getChatbotResponse(userMessage) {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error("❌ Chatbot Error: OPENROUTER_API_KEY missing");
            return "AI service unavailable, try again later";
        }

        const openrouter = new OpenRouter({ apiKey });

        let messagesArray = [];
        if (Array.isArray(userMessage)) {
            messagesArray = userMessage;
        } else {
            messagesArray = [{ role: "user", content: userMessage }];
        }

        console.log(`🤖 Generating Chatbot response via OpenRouter (nvidia/nemotron-3.5-lightning:free)...`);

        // Stream the response to get reasoning tokens in usage
        const stream = await openrouter.chat.send({
            chatGenerationParams: {
                model: "nvidia/nemotron-3.5-lightning:free",
                messages: messagesArray,
                stream: true
            }
        });

        let responseText = "";
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                responseText += content;
                process.stdout.write(content);
            }

            // Usage information comes in the final chunk
            if (chunk.usage) {
                console.log("\nReasoning tokens:", chunk.usage.completionTokensDetails?.reasoningTokens);
            }
        }

        console.log("\n✅ Chatbot streaming finished.");

        return responseText;

    } catch (error) {
        console.error("❌ Chatbot Service Exception:", error.message);
        return "AI service unavailable, try again later";
    }
}

module.exports = {
    getChatbotResponse
};
