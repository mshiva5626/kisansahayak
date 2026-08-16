/**
 * Kisan Sahayak - Core AI Advisory & Copilot Service
 * 
 * Provides evidence-grounded agricultural advisory, multi-source cross-referencing,
 * farm-context injection, multimodal attachment analysis, and verified citation formatting.
 */

const { generateAgriculturalCompletion } = require('../config/aiConfig');
const { buildAgriculturalSystemInstruction } = require('./promptEngine');
const { orchestrateTools } = require('./toolOrchestrator');
const { analyzeImageWithAI } = require('./imageAnalysisService');
const { fetchAndAnalyzeMultiSources } = require('./multiSourceEngine');

/**
 * Generates an evidence-grounded AI advisory for a farmer/farm query
 */
async function getAIAdvisory(queryOrMessages, context = {}) {
    const { 
        farmer = {}, 
        farm = null, 
        weather = null, 
        image_analysis = null, 
        attachments = [], 
        schemes = [], 
        language = null, 
        personalizationMode = 'farmer' 
    } = context;
    
    // Extract latest user query text and message history
    let latestQuery = '';
    let messagesHistory = [];
    
    if (Array.isArray(queryOrMessages)) {
        messagesHistory = queryOrMessages.map(msg => ({
            role: msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user',
            content: msg.content || msg.text || ''
        }));
        latestQuery = messagesHistory[messagesHistory.length - 1]?.content || '';
    } else {
        latestQuery = queryOrMessages || '';
        messagesHistory = [{ role: 'user', content: latestQuery }];
    }
    
    console.log(`\n======================================================`);
    console.log(`🌾 [AI Advisory Service] Processing Multi-Source Agronomic Query`);
    console.log(`Farmer: ${farmer.name || 'Anonymous'} | State: ${farm?.state || farmer.state || 'N/A'} | Crop: ${farm?.crop_type || 'N/A'}`);
    console.log(`Query: "${latestQuery.substring(0, 100)}${latestQuery.length > 100 ? '...' : ''}"`);
    console.log(`Attachments: ${attachments.length} attached`);
    console.log(`======================================================`);
    
    // 1. Process Multimodal Attachments (Images, Lab Tests, Text, Documents)
    let attachmentContext = '';
    if (Array.isArray(attachments) && attachments.length > 0) {
        for (let i = 0; i < attachments.length; i++) {
            const att = attachments[i];
            const fileName = att.name || `Attachment_${i + 1}`;
            const fileType = att.type || 'file';
            
            if (fileType === 'image' || (att.base64 && att.mimeType?.startsWith('image/'))) {
                console.log(`🔍 [AI Advisory] Analyzing image attachment: ${fileName}...`);
                try {
                    const imgDiag = await analyzeImageWithAI(att.base64, 'leaf', farm, farmer);
                    attachmentContext += `\n[ATTACHED IMAGE: "${fileName}"]\n`;
                    attachmentContext += `- Visual Pathology Diagnosis: ${imgDiag.analysis?.disease_name || 'Observed Symptoms'}\n`;
                    attachmentContext += `- Pathogen / Causal Agent: ${imgDiag.analysis?.causal_agent || 'Biological/Abiotic'}\n`;
                    attachmentContext += `- Severity & Risk: ${imgDiag.analysis?.severity || 'Moderate'} (${imgDiag.analysis?.severity_percentage || 'N/A'} affected)\n`;
                    attachmentContext += `- Observed Symptoms: ${(imgDiag.analysis?.symptoms_observed || []).join(', ')}\n`;
                    attachmentContext += `- Recommended Immediate Action: ${imgDiag.analysis?.immediate_action || 'Inspect field'}\n`;
                    attachmentContext += `- IPM Biological: ${imgDiag.analysis?.ipm_organic || 'N/A'}\n`;
                    if (imgDiag.analysis?.ipm_chemical) {
                        attachmentContext += `- IPM Chemical Active Ingredient: ${JSON.stringify(imgDiag.analysis.ipm_chemical)}\n`;
                    }
                } catch (imgErr) {
                    console.warn(`Warning: Image diagnostic failed for ${fileName}:`, imgErr.message);
                    attachmentContext += `\n[ATTACHED IMAGE: "${fileName}"] (User uploaded crop image for visual assessment)\n`;
                }
            } else if (att.textContent) {
                // Text file, Soil Lab card text, Word document text, or CSV report
                attachmentContext += `\n[ATTACHED DOCUMENT/LAB REPORT: "${fileName}"]\n`;
                attachmentContext += `Content:\n${att.textContent.substring(0, 5000)}\n`;
            }
        }
    }

    // 2. Ultra-Fast Parallel Multi-Source Intelligence Retrieval (ICAR, CIBRC, IMD, Agmarknet, Soil Health Card)
    const multiSourceResult = await fetchAndAnalyzeMultiSources({
        query: latestQuery + ' ' + attachmentContext,
        crop: farm?.crop_type,
        farm,
        userProfile: farmer,
        weather,
        attachments
    });

    const activeWeather = weather || multiSourceResult.weatherAnalysis;

    // Direct image analysis snippet if passed separately
    let directImageText = '';
    if (image_analysis) {
        directImageText = `\nFIELD IMAGE ANALYSIS EVIDENCE:\n`;
        directImageText += `- Diagnostic Result: ${JSON.stringify(image_analysis.analysis_result || image_analysis)}\n`;
        directImageText += `- Confidence Score: ${image_analysis.confidence_score || 'N/A'}\n`;
    }

    // 3. Build Master Agricultural System Instruction with Multi-Source Intelligence
    const systemInstruction = buildAgriculturalSystemInstruction({
        userProfile: farmer,
        farm,
        weather: activeWeather,
        ragContext: '',
        toolContext: multiSourceResult.multiSourceContext + directImageText,
        attachmentContext,
        personalizationMode: personalizationMode || farmer.personalization_mode || 'farmer',
        language: language || farmer.preferred_language || 'en'
    });

    // 4. Dispatch to Configured Central AI Model
    const completion = await generateAgriculturalCompletion({
        messages: messagesHistory,
        systemInstruction,
        temperature: 0.2, // Strict factual precision for agronomy
        maxTokens: 3500 // Full output headroom for reasoning models
    });

    return {
        response: completion,
        sources: multiSourceResult.verifiedSources,
        weather: activeWeather,
        cibrcMatches: multiSourceResult.cibrcMatches
    };
}

module.exports = {
    getAIAdvisory
};
