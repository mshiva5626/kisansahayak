// backend/services/chatbotService.js
const { OpenRouter } = require("@openrouter/sdk");

/**
 * Clean, non-streaming chatbot extraction service
 * Extracted specifically for /ai/chat routes per user requirements
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

        console.log(`🤖 Generating Chatbot response via OpenRouter (arcee-ai/trinity-large-preview)...`);
        
        // Exact non-streaming specification requested by user
        const response = await openrouter.chat.send({
            chatGenerationParams: {
                model: "arcee-ai/trinity-large-preview:free",
                messages: messagesArray,
                stream: false
            }
        });

        // Extract text safely from standard OpenRouter JSON payload
        const outputText = response?.choices?.[0]?.message?.content;
        
        if (!outputText) {
            console.error("❌ Chatbot Error: Malformed response from OpenRouter", response);
            return "AI service unavailable, try again later";
        }

        return outputText;

    } catch (error) {
        console.error("❌ Chatbot Service Exception:", error.message);
        return "AI service unavailable, try again later";
    }
}

module.exports = {
    getChatbotResponse
};
