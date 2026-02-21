const ARCEE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const ARCEE_MODEL = 'arcee-ai/trinity-large-preview:free';
const ARCEE_API_KEY = process.env.ARCEE_API_KEY || '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';

const buildPrompt = (context) => {
    const { farmer, farm, weather, image_analysis } = context;

    let prompt = `You are a Senior Agricultural Operations Advisor. You must provide highly professional, precise, crisp, and friendly advice.

CRITICAL RULES:
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
        const prompt = buildPrompt(context);

        let apiMessages = [{ role: 'system', content: prompt }];

        if (Array.isArray(queryOrMessages)) {
            // Include full chat history
            apiMessages = apiMessages.concat(queryOrMessages);
        } else {
            // Single query (fallback)
            apiMessages.push({ role: 'user', content: queryOrMessages });
        }

        console.log('\n--- ARCEE AI (OPENROUTER) API REQUEST ---');
        console.log(`Model: ${ARCEE_MODEL}`);
        console.log(`Context Keys: ${Object.keys(context).join(', ')}`);

        // Use native Node fetch (available in newer Node versions) or require it if using older ones
        // Assuming global fetch is available since Node 18+
        const response = await fetch(ARCEE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ARCEE_API_KEY}`,
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'Kisan Sahayak Farm Copilot',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: ARCEE_MODEL,
                messages: apiMessages,
                stream: false // Wait for full response, UI is not built for streaming yet
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Arcee AI responded with status: ${response.status} - ${errorBody}`);
        }

        const data = await response.json();
        const text = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';

        console.log('\n--- ARCEE AI API RESPONSE ---');
        console.log(text.substring(0, 500) + (text.length > 500 ? '...\n[Truncated]' : ''));
        console.log('---------------------------\n');

        return text;
    } catch (error) {
        console.error('\n❌ Arcee AI API Error:', error.message);
        throw new Error('AI Service is temporarily unavailable. Please try again later.');
    }
};

// Removed mock advisory function.

module.exports = { getAIAdvisory };
