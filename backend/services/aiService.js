const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.CROP_ANALYSIS_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const buildPrompt = (context) => {
    const { farmer, farm, weather, image_analysis } = context;

    let prompt = `You are a Senior Agricultural Operations Advisor. You must provide highly professional, precise, crisp, and friendly advice.

CRITICAL RULES:
- YOU MUST detect the language of the user's input query and YOU MUST respond in EXACTLY the same language. For example, if the user asks in Hindi, you must reply in Hindi. Do not use English unless the user used English. This is extremely important.
- BE CONCISE AND PRECISE. Use exact scientific calculations where applicable. Analyze the provided farm data (area size, exact weather temperature/humidity, crop type) and output specific numbers (e.g., NPK ratios, calculated water requirements in liters, exact dates).
- Never mention AI, models, algorithms, or machine learning.
- Use professional agronomy and agricultural language.
- Consider chat history and previous context in your response.
- If the user sends a simple greeting, respond with a warm, friendly, and professional greeting and ask how you can assist their farm operations today.
- If the query is about crop issues, farming advice, or field analysis: Provide scientifically backed, actionable, field-ready advice and YOU MUST RESPOND IN THE EXACT STRUCTURE DEFINED AT THE BOTTOM.

FARMER CONTEXT:
`;

    if (farmer) {
        prompt += `- Name: ${farmer.name || 'Not provided'}
- State: ${farmer.state || 'Not provided'}
- District: ${farmer.district || 'Not provided'}
- Farming Type: ${farmer.farming_type || 'Not specified'}
`;
    }

    if (farm) {
        prompt += `
FARM DETAILS:
- Farm Name: ${farm.farm_name || 'Not provided'}
- State: ${farm.state || 'Not provided'}
- Area: ${farm.area || 'Not provided'}
- Terrain: ${farm.terrain_type || 'Not provided'}
- Water Source: ${farm.water_source || 'Not provided'}
- Crop: ${farm.crop_type || 'Not provided'}
- Sowing Date: ${farm.sowing_date || 'Not provided'}
- Location: ${farm.latitude || 'N/A'}, ${farm.longitude || 'N/A'}
`;
    }

    if (weather) {
        prompt += `
CURRENT WEATHER CONDITIONS:
- Temperature: ${weather.temperature || weather.temp || 'N/A'}°C
- Humidity: ${weather.humidity || 'N/A'}%
- Rainfall: ${weather.rainfall || 'N/A'}mm
- Condition: ${weather.condition || 'N/A'}
- Forecast: ${weather.forecast ? JSON.stringify(weather.forecast.slice(0, 3)) : 'N/A'}
`;
    }

    if (image_analysis) {
        prompt += `
FIELD IMAGE ANALYSIS:
- Type: ${image_analysis.image_type || 'field'}
- Observations: ${JSON.stringify(image_analysis.analysis_result || image_analysis)}
- Confidence: ${image_analysis.confidence_score || 'N/A'}
`;
    }

    if (context.schemes && context.schemes.length > 0) {
        prompt += `
AVAILABLE GOVERNMENT SCHEMES FOR THIS LOCATION:
${context.schemes.map(s => `- ${s.name} (${s.scheme_type === 'central' ? 'Central' : s.state}): ${s.benefits}`).join('\n')}

If the farmer's query relates to financial assistance, subsidies, or general help, or if any of these schemes are highly relevant to their situation, you MUST recommend 1-2 relevant schemes from this list.
`;
    }

    prompt += `
STRUCTURAL FORMAT FOR AGRICULTURAL ADVICE:
(Use this format ONLY if the query requires technical farming advice, diagnostics, or actionable recommendations. If it is a greeting or casual question, just respond naturally.)

Observation:
[What you observe based on the data provided]

Scientific Interpretation:
[Scientific explanation of the situation]

Decision:
[Clear recommendation]

Execution Plan:
[Step-by-step action plan]

Dosage / Method:
[Specific quantities, concentrations, and application methods]

Timing:
[When to execute each step]

Risk Check:
[Potential risks and mitigation measures]

Next Action:
[Immediate next step the farmer should take]
`;

    return prompt;
};

const getAIAdvisory = async (queryOrMessages, context = {}) => {
    try {
        const systemPrompt = buildPrompt(context);
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        let contents = [];

        if (Array.isArray(queryOrMessages)) {
            // Map chat history to Gemini format
            contents = queryOrMessages.map(msg => {
                // Gemini expects roles 'user' or 'model'. OpenRouter/OpenAI uses 'assistant'.
                const role = msg.role === 'assistant' ? 'model' : 'user';
                return { role, parts: [{ text: msg.content }] };
            });
        } else {
            // Single query (fallback)
            contents = [{ role: 'user', parts: [{ text: queryOrMessages }] }];
        }

        console.log('\n--- GEMINI 2.0 FLASH API REQUEST ---');
        console.log(`Context Keys: ${Object.keys(context).join(', ')}`);

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: contents,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7
            }
        });

        const text = response.text;

        console.log('\n--- GEMINI 2.0 FLASH API RESPONSE ---');
        console.log(text.substring(0, 500) + (text.length > 500 ? '...\n[Truncated]' : ''));
        console.log('---------------------------\n');

        return text;
    } catch (error) {
        console.error('\n❌ Gemini API Error:', error.message);
        
        // --- FALLBACK TO OPENROUTER ---
        if (OPENROUTER_API_KEY) {
            console.log('🔄 Attempting fallback to OpenRouter API...');
            try {
                let orMessages = [{ role: 'system', content: buildPrompt(context) }];
                if (Array.isArray(queryOrMessages)) {
                    orMessages = orMessages.concat(queryOrMessages);
                } else {
                    orMessages.push({ role: 'user', content: queryOrMessages });
                }

                const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model: 'google/gemini-2.5-flash', // OpenRouter path for latest Gemini
                    messages: orMessages,
                    temperature: 0.7
                }, {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'http://localhost:5000',
                        'Content-Type': 'application/json'
                    }
                });

                const text = response.data.choices[0].message.content;
                console.log('\n--- OPENROUTER FALLBACK RESPONSE ---');
                console.log(text.substring(0, 500) + '...\n');
                return text;
            } catch (fallbackError) {
                console.error('❌ OpenRouter Fallback Error:', fallbackError.message);
            }
        }

        throw new Error('AI Service is temporarily unavailable due to high traffic. Please try again later.');
    }
};

// Removed mock advisory function.

module.exports = { getAIAdvisory };
