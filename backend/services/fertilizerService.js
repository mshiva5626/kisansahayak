const { OpenRouter } = require("@openrouter/sdk");

const callLiquidModel = async (messages, context = null) => {
    try {
        const API_KEY = process.env.FERTILIZER_API_KEY;
        if (!API_KEY) {
            console.warn("WARNING: FERTILIZER_API_KEY is not defined in the environment.");
        }

        const openrouter = new OpenRouter({
            apiKey: API_KEY
        });

        let systemPrompt = `You are an expert Agricultural Fertilizer AI Assistant operating the 'Fertilizer Marketplace' platform for an Indian farmer application.
You help farmers pick the right fertilizer for their crops, understand pricing (in INR), dosage, and market trends.
Keep your responses exceptionally helpful, accurate, concise, and structured. 
IMPORTANT: Return responses in clean Markdown formatting to structure any tables or listed recommendations cleanly.`;

        // Properly structure the system prompt plus message history
        let conversationContent = messages;
        if (context) {
            const injectedMessage = {
                role: "system",
                content: systemPrompt + `\n\nUSER CONTEXT: ${JSON.stringify(context)}`
            };
            conversationContent = [injectedMessage, ...messages];
        } else {
            conversationContent = [{ role: "system", content: systemPrompt }, ...messages];
        }

        console.log(`[FertilizerService] Calling liquid/lfm-2.5-1.2b-thinking:free with ${conversationContent.length} messages...`);

        // Removing stream: true gives us the full payload natively
        const result = await openrouter.chat.send({
            model: "liquid/lfm-2.5-1.2b-thinking:free",
            messages: conversationContent
        });

        // Some models under OpenRouter respond with different payload shapes depending on the backend provider
        if (result?.choices?.[0]?.message?.content) {
            return result.choices[0].message.content;
        } else if (result?.choices?.[0]?.text) {
            return result.choices[0].text;
        }
        
        // Let's explicitly log what came back if we couldn't parse it cleanly
        console.warn("[FertilizerService] Unexpected Response Signature:", JSON.stringify(result).substring(0, 500));
        throw new Error("No valid response from Liquid AI.");
    } catch (error) {
        console.error("OpenRouter Liquid AI Error:", error.message || error);
        throw error;
    }
}

module.exports = {
    callLiquidModel
};
