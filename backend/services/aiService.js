const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

const initializeGemini = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_key_here') {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        return true;
    }
    return false;
};

const buildPrompt = (query, context) => {
    const { farmer, farm, weather, image_analysis } = context;

    let prompt = `You are a senior agricultural operations advisor with deep expertise in agronomy, soil science, crop management, and precision farming. You serve as a trusted field consultant for farmers.

CRITICAL RULES:
- Never mention AI, models, algorithms, or machine learning
- Use professional agronomy language
- Consider local conditions (terrain, water source, climate)
- Format gracefully: if the farmer's query is a simple greeting (e.g., "hi", "namaste", "how are you"), or a general question, RESPOND CONVERSATIONALLY and naturally. Do NOT use the strict structural format below for greetings or casual talk.
- IF and ONLY IF the query is about crop issues, farming advice, or field analysis: Provide actionable, field-ready advice and YOU MUST RESPOND IN THE EXACT STRUCTURE DEFINED AT THE BOTTOM.

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
FARMER'S QUERY: ${query}

STRUCTURAL FORMAT FOR AGRICULTURAL ADVICE:
(Use this format ONLY if the query requires technical farming advice, diagnostics, or actionable recommendations. If it is a greeting or casual question, just respond naturally.)

**Observation:**
[What you observe based on the data provided]

**Scientific Interpretation:**
[Scientific explanation of the situation]

**Decision:**
[Clear recommendation]

**Execution Plan:**
[Step-by-step action plan]

**Dosage / Method:**
[Specific quantities, concentrations, and application methods]

**Timing:**
[When to execute each step]

**Risk Check:**
[Potential risks and mitigation measures]

**Next Action:**
[Immediate next step the farmer should take]
`;

    return prompt;
};

const getAIAdvisory = async (query, context = {}) => {
    // Try to initialize Gemini if not already done
    if (!model) {
        const initialized = initializeGemini();
        if (!initialized) {
            throw new Error('AI Service is not configured. Please provide a valid Gemini API key.');
        }
    }

    try {
        const prompt = buildPrompt(query, context);

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error('Gemini API Error:', error.message);
        throw new Error('AI Service is temporarily unavailable.');
    }
};

// Removed mock advisory function.

module.exports = { getAIAdvisory };
