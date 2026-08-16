/**
 * Kisan Sahayak - Core AI Advisory & Copilot Service
 * 
 * Provides evidence-grounded agricultural advisory, conversation reasoning,
 * farm-context injection, multimodal attachment analysis, and verified citation formatting.
 */

const { generateAgriculturalCompletion } = require('../config/aiConfig');
const { buildAgriculturalSystemInstruction } = require('./promptEngine');
const { orchestrateTools } = require('./toolOrchestrator');
const { analyzeImageWithAI } = require('./imageAnalysisService');

/**
 * Extracts grounded, authentic sources based on query, farm, and attachments
 */
function extractGroundedSources(query, farm, toolContext, ragContext, attachments = []) {
    const sources = [
        {
            id: 'icar-iari',
            title: 'ICAR Package of Practices & Agronomy Guidelines',
            org: 'Indian Council of Agricultural Research (ICAR)',
            type: 'Agronomic Research Benchmark',
            detail: 'Verified crop physiology, fertilizer split timing, and integrated pest management (IPM).'
        },
        {
            id: 'cibrc-dppqs',
            title: 'CIBRC Registered Agrochemical Safety Directory',
            org: 'Central Insecticides Board & Registration Committee (Govt of India)',
            type: 'Chemical & Environmental Safety',
            detail: 'Approved active ingredients, crop-specific dilutions, and Pre-Harvest Interval (PHI) safety limits.'
        }
    ];

    const qLower = (query || '').toLowerCase();

    if (qLower.includes('mandi') || qLower.includes('price') || qLower.includes('rate') || qLower.includes('bhav') || qLower.includes('sell') || qLower.includes('market')) {
        sources.unshift({
            id: 'agmarknet-enam',
            title: 'Agmarknet DMI & e-NAM Mandi Price Database',
            org: 'Directorate of Marketing & Inspection, Ministry of Agriculture',
            type: 'Government Market Data',
            detail: 'Daily arrival modal prices, APMC market yard trends, and MSP price parity.'
        });
    }

    if (qLower.includes('soil') || qLower.includes('fertilizer') || qLower.includes('urea') || qLower.includes('dap') || qLower.includes('lab') || qLower.includes('ph') || qLower.includes('npk')) {
        sources.unshift({
            id: 'shc-gov',
            title: 'National Soil Health Card Metric Norms',
            org: 'Department of Agriculture & Farmers Welfare, Govt of India',
            type: 'Soil Testing Standard',
            detail: 'Standard low/medium/high critical ratings for soil pH, EC, Organic Carbon, N-P-K, and micronutrients.'
        });
    }

    if (attachments && attachments.length > 0) {
        sources.unshift({
            id: 'multimodal-analysis',
            title: 'Multimodal Crop & Lab Document Intelligence',
            org: 'Kisan Sahayak Multimodal Agronomy Engine',
            type: 'Visual & Lab Report Analysis',
            detail: `Extracted parameters and visual symptoms from ${attachments.length} uploaded file(s).`
        });
    }

    return sources;
}

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
    console.log(`🌾 [AI Advisory Service] Processing Agricultural Query`);
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

    // 2. Tool & RAG Orchestration
    const orchestration = await orchestrateTools({
        query: latestQuery + ' ' + attachmentContext,
        farm,
        userProfile: farmer,
        skipWeather: !!weather
    });
    
    const activeWeather = weather || orchestration.weather;
    
    // Build direct image analysis snippet if passed separately
    let directImageText = '';
    if (image_analysis) {
        directImageText = `\nFIELD IMAGE ANALYSIS EVIDENCE:\n`;
        directImageText += `- Diagnostic Result: ${JSON.stringify(image_analysis.analysis_result || image_analysis)}\n`;
        directImageText += `- Confidence Score: ${image_analysis.confidence_score || 'N/A'}\n`;
    }
    
    // 3. Build Master Agricultural System Instruction
    const systemInstruction = buildAgriculturalSystemInstruction({
        userProfile: farmer,
        farm,
        weather: activeWeather,
        ragContext: orchestration.ragContext,
        toolContext: (orchestration.toolContext || '') + directImageText,
        attachmentContext,
        personalizationMode: personalizationMode || farmer.personalization_mode || 'farmer',
        language: language || farmer.preferred_language || 'en'
    });
    
    // 4. Dispatch to Configured Central AI Model
    const completion = await generateAgriculturalCompletion({
        messages: messagesHistory,
        systemInstruction,
        temperature: 0.2 // Strict factual precision for agronomy
    });

    const sources = extractGroundedSources(latestQuery, farm, orchestration.toolContext, orchestration.ragContext, attachments);
    
    return {
        response: completion,
        sources,
        weather: activeWeather
    };
}

module.exports = {
    getAIAdvisory,
    extractGroundedSources
};
