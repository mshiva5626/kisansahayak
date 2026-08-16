/**
 * Kisan Sahayak - Centralized Server-Side AI Model Architecture & Configuration
 * 
 * Enforces strict model configuration, provider adapters, credential safety,
 * startup validation, and calibrated agricultural completion execution.
 */

const dotenv = require('dotenv');
dotenv.config();

const MODEL_CONFIG = {
    provider: (process.env.MODEL_PROVIDER || 'openrouter').toLowerCase(),
    modelName: process.env.MODEL_NAME || 'nvidia/nemotron-3.5-lightning:free',
    temperature: parseFloat(process.env.MODEL_TEMPERATURE || '0.2'),
    maxTokens: parseInt(process.env.MODEL_MAX_TOKENS || '4096', 10),
    reasoningConfig: (() => {
        try {
            return process.env.MODEL_REASONING_CONFIG ? JSON.parse(process.env.MODEL_REASONING_CONFIG) : { effort: 'medium' };
        } catch {
            return { effort: 'medium' };
        }
    })(),
    visionProvider: (process.env.VISION_MODEL_PROVIDER || 'openrouter').toLowerCase(),
    visionModelName: process.env.VISION_MODEL_NAME || 'nvidia/nemotron-nano-12b-v2-vl:free',
    fallbackModelName: process.env.FALLBACK_MODEL_NAME || 'nvidia/nemotron-3-super-120b-a12b:free',
    
    // API Endpoints
    openRouterUrl: 'https://openrouter.ai/api/v1/chat/completions',
    nvidiaNimUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    
    // Timeout limits
    timeoutMs: 45000
};

/**
 * Startup validation function
 * Ensures valid provider, model name, and credentials exist before serving traffic.
 */
function validateAIConfig() {
    console.log('\n======================================================');
    console.log('🌾 KISAN SAHAYAK - CENTRAL AI CONFIGURATION VALIDATION');
    console.log('======================================================');
    
    const errors = [];
    
    if (!MODEL_CONFIG.provider) {
        errors.push("Missing MODEL_PROVIDER in environment variables.");
    }
    
    if (!MODEL_CONFIG.modelName) {
        errors.push("Missing MODEL_NAME in environment variables.");
    }
    
    if (MODEL_CONFIG.provider === 'openrouter') {
        const key = process.env.OPENROUTER_API_KEY;
        if (!key || !key.startsWith('sk-or-')) {
            errors.push("OPENROUTER_API_KEY is missing or invalid for provider 'openrouter'.");
        }
    } else if (MODEL_CONFIG.provider === 'nvidia') {
        const key = process.env.NVIDIA_API_KEY;
        if (!key) {
            errors.push("NVIDIA_API_KEY is missing for provider 'nvidia'.");
        }
    } else if (MODEL_CONFIG.provider === 'google') {
        const key = process.env.GEMINI_API_KEY;
        if (!key || !key.startsWith('AIza')) {
            errors.push("GEMINI_API_KEY is missing or invalid for provider 'google'.");
        }
    } else {
        errors.push(`Unsupported MODEL_PROVIDER: '${MODEL_CONFIG.provider}'. Supported: openrouter, nvidia, google.`);
    }
    
    if (errors.length > 0) {
        console.error('❌ AI CONFIGURATION STARTUP ERRORS:');
        errors.forEach(err => console.error(`  - ${err}`));
        console.error('======================================================\n');
        throw new Error(`AI Configuration Startup Failure: ${errors.join(' | ')}`);
    }
    
    console.log(`✅ Provider:          ${MODEL_CONFIG.provider.toUpperCase()}`);
    console.log(`✅ Primary Model:     ${MODEL_CONFIG.modelName}`);
    console.log(`✅ Default Temp:      ${MODEL_CONFIG.temperature}`);
    console.log(`✅ Max Tokens:        ${MODEL_CONFIG.maxTokens}`);
    console.log(`✅ Vision Model:      ${MODEL_CONFIG.visionModelName}`);
    console.log(`✅ Fallback Model:    ${MODEL_CONFIG.fallbackModelName || 'None configured'}`);
    console.log('======================================================\n');
    
    return true;
}

/**
 * Execute completion request through configured provider adapter
 */
async function generateAgriculturalCompletion({
    messages,
    systemInstruction,
    temperature = MODEL_CONFIG.temperature,
    maxTokens = MODEL_CONFIG.maxTokens,
    responseFormat = null,
    modelOverride = null,
    providerOverride = null
}) {
    const provider = providerOverride || MODEL_CONFIG.provider;
    const model = modelOverride || MODEL_CONFIG.modelName;
    
    // Prepare full messages array
    const fullMessages = [];
    if (systemInstruction) {
        fullMessages.push({ role: 'system', content: systemInstruction });
    }
    fullMessages.push(...messages);
    
    try {
        console.log(`\n[AI Copilot Engine] Dispatching request to [${provider.toUpperCase()}] model: ${model}`);
        console.log(`[AI Copilot Engine] Temp: ${temperature} | MaxTokens: ${maxTokens} | MsgCount: ${fullMessages.length}`);
        
        if (provider === 'openrouter') {
            return await callOpenRouter({
                model,
                messages: fullMessages,
                temperature,
                maxTokens,
                responseFormat
            });
        } else if (provider === 'nvidia') {
            return await callNvidiaNim({
                model,
                messages: fullMessages,
                temperature,
                maxTokens,
                responseFormat
            });
        } else if (provider === 'google') {
            return await callGoogleGemini({
                model,
                systemInstruction,
                messages,
                temperature,
                maxTokens,
                responseFormat
            });
        }
    } catch (primaryError) {
        console.error(`❌ [AI Copilot Engine] Primary Model Error (${model}):`, primaryError.message);
        
        // Attempt explicit fallback ONLY if configured by developer
        if (MODEL_CONFIG.fallbackModelName && MODEL_CONFIG.fallbackModelName !== model) {
            console.warn(`🔄 [AI Copilot Engine] Attempting developer-configured fallback model: ${MODEL_CONFIG.fallbackModelName}`);
            try {
                return await callOpenRouter({
                    model: MODEL_CONFIG.fallbackModelName,
                    messages: fullMessages,
                    temperature,
                    maxTokens,
                    responseFormat
                });
            } catch (fallbackError) {
                console.error(`❌ [AI Copilot Engine] Fallback Model Error:`, fallbackError.message);
            }
        }
        
        throw new Error(`Agricultural AI Copilot service encountered an error: ${primaryError.message}`);
    }
}

/**
 * OpenRouter Provider Adapter
 */
async function callOpenRouter({ model, messages, temperature, maxTokens, responseFormat }) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured.");
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MODEL_CONFIG.timeoutMs);
    
    const requestBody = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens
    };
    
    if (responseFormat === 'json') {
        requestBody.response_format = { type: 'json_object' };
    }
    
    try {
        const response = await fetch(MODEL_CONFIG.openRouterUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'Kisan Sahayak AI Copilot'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenRouter HTTP ${response.status}: ${errText.substring(0, 300)}`);
        }
        
        const data = await response.json();
        const choice = data.choices?.[0];
        let content = choice?.message?.content || choice?.text || '';
        
        // Log reasoning tokens if provided
        if (data.usage?.completion_tokens_details?.reasoning_tokens || choice?.message?.reasoning) {
            const rTokens = data.usage?.completion_tokens_details?.reasoning_tokens || 'Present';
            console.log(`🧠 [AI Copilot Engine] Internal reasoning tokens: ${rTokens}`);
        }
        
        // Clean thinking/reasoning tags and plain-text thinking preambles
        content = cleanOutputText(content);
        
        console.log(`✅ [AI Copilot Engine] Response received (${content.length} chars)`);
        return content;
        
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            throw new Error(`AI Model request timed out after ${MODEL_CONFIG.timeoutMs / 1000}s`);
        }
        throw err;
    }
}

/**
 * Clean thinking/reasoning tags and preamble artifacts
 */
function cleanOutputText(content) {
    if (!content) return '';
    let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    
    const thinkMarkers = [
        "Here's a thinking process:",
        "Here's a breakdown of the thinking process:",
        "Here is the thinking process:",
        "Thinking Process:"
    ];
    
    const hasThinkPreamble = thinkMarkers.some(m => cleaned.toLowerCase().startsWith(m.toLowerCase()));
    
    if (hasThinkPreamble) {
        const splitRegex = /\n---\n|\n\*\*(?:Final Answer|Final Recommendation|Response|Advisory|Summary|🌱|Immediate):\*\*\n|\n###\s+|\n1\.\s+\*\*|\n\*\*🌱/i;
        const match = cleaned.match(splitRegex);
        if (match && match.index !== undefined) {
            cleaned = cleaned.substring(match.index).replace(/^\n---\n/, '').trim();
        }
    }
    return cleaned.trim();
}

/**
 * NVIDIA NIM Direct Provider Adapter
 */
async function callNvidiaNim({ model, messages, temperature, maxTokens }) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error("NVIDIA_API_KEY is not configured for direct NIM endpoint.");
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MODEL_CONFIG.timeoutMs);
    
    try {
        const response = await fetch(MODEL_CONFIG.nvidiaNimUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: maxTokens
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`NVIDIA NIM HTTP ${response.status}: ${errText.substring(0, 300)}`);
        }
        
        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '';
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        return content;
        
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

/**
 * Google Gemini Provider Adapter
 */
async function callGoogleGemini({ model, systemInstruction, messages, temperature }) {
    const { GoogleGenAI } = require('@google/genai');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing for Google provider.");
    
    const ai = new GoogleGenAI({ apiKey });
    
    const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));
    
    const response = await ai.models.generateContent({
        model: model || 'gemini-2.0-flash',
        contents,
        config: {
            systemInstruction,
            temperature
        }
    });
    
    return response.text || '';
}

/**
 * Vision Multimodal Adapter
 */
async function generateVisionAnalysis({ prompt, base64Image, mimeType = 'image/jpeg', temperature = 0.2 }) {
    const apiKey = process.env.CROP_ANALYSIS_API_KEY || process.env.OPENROUTER_API_KEY;
    const model = MODEL_CONFIG.visionModelName;
    
    console.log(`\n[Vision AI] Dispatching image analysis to ${model}...`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s for vision
    
    try {
        const response = await fetch(MODEL_CONFIG.openRouterUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'Kisan Sahayak Crop Scanner'
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: base64Image.startsWith('data:') ? base64Image : `data:${mimeType};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                temperature,
                max_tokens: 3000
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Vision API HTTP ${response.status}: ${errText.substring(0, 300)}`);
        }
        
        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '';
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        return content;
        
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

module.exports = {
    MODEL_CONFIG,
    validateAIConfig,
    generateAgriculturalCompletion,
    generateVisionAnalysis
};
