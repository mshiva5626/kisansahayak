/**
 * Kisan Sahayak - Core AI Advisory & Copilot Service
 * 
 * Provides evidence-grounded agricultural advisory, conversation reasoning,
 * farm-context injection, and verified citation formatting.
 */

const { generateAgriculturalCompletion } = require('../config/aiConfig');
const { buildAgriculturalSystemInstruction } = require('./promptEngine');
const { orchestrateTools } = require('./toolOrchestrator');

/**
 * Generates an evidence-grounded AI advisory for a farmer/farm query
 */
async function getAIAdvisory(queryOrMessages, context = {}) {
    const { farmer = {}, farm = null, weather = null, image_analysis = null, schemes = [], language = null, personalizationMode = 'farmer' } = context;
    
    // Extract latest user query text
    let latestQuery = '';
    let messagesHistory = [];
    
    if (Array.isArray(queryOrMessages)) {
        messagesHistory = queryOrMessages.map(msg => ({
            role: msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user',
            content: msg.content
        }));
        latestQuery = messagesHistory[messagesHistory.length - 1]?.content || '';
    } else {
        latestQuery = queryOrMessages || '';
        messagesHistory = [{ role: 'user', content: latestQuery }];
    }
    
    console.log(`\n======================================================`);
    console.log(`🌾 [AI Advisory Service] Processing Agricultural Query`);
    console.log(`Farmer: ${farmer.name || 'Anonymous'} | State: ${farm?.state || farmer.state || 'N/A'} | Crop: ${farm?.crop_type || 'N/A'}`);
    console.log(`Query: "${latestQuery.substring(0, 100)}${latestQuery.length > 100 ? '...' : ''}"`);
    console.log(`======================================================`);
    
    // 1. Tool & RAG Orchestration
    const orchestration = await orchestrateTools({
        query: latestQuery,
        farm,
        userProfile: farmer,
        skipWeather: !!weather // Don't re-fetch if caller provided weather
    });
    
    const activeWeather = weather || orchestration.weather;
    
    // Build image analysis snippet if available
    let imageAnalysisText = '';
    if (image_analysis) {
        imageAnalysisText = `\nFIELD IMAGE ANALYSIS EVIDENCE:\n`;
        imageAnalysisText += `- Type: ${image_analysis.image_type || 'Crop Leaf/Field'}\n`;
        imageAnalysisText += `- Diagnostic Result: ${JSON.stringify(image_analysis.analysis_result || image_analysis)}\n`;
        imageAnalysisText += `- Confidence Score: ${image_analysis.confidence_score || 'N/A'}\n`;
    }
    
    // 2. Build Master Agricultural System Instruction
    const systemInstruction = buildAgriculturalSystemInstruction({
        userProfile: farmer,
        farm,
        weather: activeWeather,
        ragContext: orchestration.ragContext,
        toolContext: (orchestration.toolContext || '') + imageAnalysisText,
        personalizationMode: personalizationMode || farmer.personalization_mode || 'farmer',
        language: language || farmer.preferred_language || 'en'
    });
    
    // 3. Dispatch to Configured Central AI Model
    const completion = await generateAgriculturalCompletion({
        messages: messagesHistory,
        systemInstruction,
        temperature: 0.2 // Factual precision for agronomy
    });
    
    return completion;
}

module.exports = {
    getAIAdvisory
};
