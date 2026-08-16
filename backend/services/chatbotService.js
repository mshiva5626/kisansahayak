/**
 * Kisan Sahayak - Dedicated Agricultural Chatbot Service
 * 
 * Provides interactive multi-turn copilot dialogue, incorporating farm context,
 * verified RAG literature, and local language localization.
 */

const { getAIAdvisory } = require('./aiService');

async function getChatbotResponse(userMessageOrHistory, context = {}) {
    try {
        const responseText = await getAIAdvisory(userMessageOrHistory, context);
        return responseText;
    } catch (error) {
        console.error("❌ Chatbot Service Exception:", error.message);
        throw error;
    }
}

module.exports = {
    getChatbotResponse
};
