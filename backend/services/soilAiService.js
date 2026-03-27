const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.OPENROUTER_API_KEY || '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';

// Model fallback chain — best-to-worst for vision tasks
const VISION_MODELS = [
    'google/gemma-3-27b-it:free',
    'qwen/qwen2.5-vl-32b-instruct:free',
    'moonshotai/kimi-vl-a3b-thinking:free',
    'nvidia/nemotron-nano-12b-v2-vl:free'
];

const buildSoilPrompt = (farmContext) => {
    return `You are an expert soil scientist and agronomist with 20 years of experience in Indian agriculture. Analyze this soil image carefully.

FARM CONTEXT:
- State: ${farmContext?.state || 'Unknown'}
- District: ${farmContext?.district || 'Unknown'}
- Current Crop: ${farmContext?.crop_type || 'General'}
- Land Type: ${farmContext?.land_type || 'Plain'}

INSTRUCTIONS:
1. Carefully examine the soil color, texture, granularity, moisture appearance, and any visible organic matter.
2. Based on visual cues, estimate the soil health parameters.
3. Provide practical, region-specific fertilizer and amendment recommendations.
4. Consider the current crop when making recommendations.

Return ONLY a valid JSON object. No markdown, no code fences, no explanation text before or after.

{
  "status": "Optimal" or "Fair" or "Poor",
  "badge": "GOOD" or "OK" or "BAD",
  "message": "2-3 sentence summary of overall soil health assessment.",
  "soilType": "e.g. Alluvial, Black Cotton, Red, Laterite, Sandy, Clay, Loamy",
  "color": "e.g. Dark Brown, Reddish Brown, Black, Yellowish",
  "colorHex": "#hexcode for the dominant soil color",
  "texture": "e.g. Sandy, Clay, Loamy, Silty, Sandy Loam, Clay Loam",
  "moisture": "Low" or "Moderate" or "High",
  "nutrients": {
    "nitrogen": { "level": "Low" or "Medium" or "High", "value": "estimated kg/ha" },
    "phosphorus": { "level": "Low" or "Medium" or "High", "value": "estimated kg/ha" },
    "potassium": { "level": "Low" or "Medium" or "High", "value": "estimated kg/ha" },
    "organicCarbon": { "level": "Low" or "Medium" or "High", "value": "estimated %" },
    "pH": { "level": "Acidic" or "Neutral" or "Alkaline", "value": "estimated pH value like 6.5" }
  },
  "recommendationHtml": "Detailed HTML recommendation using <strong> and <span class='text-[#f97316] font-bold'> for emphasis. Include specific fertilizer names, quantities per acre, and timing advice relevant to the crop and region."
}`;
};

const callOpenRouter = async (model, prompt, imageBase64) => {
    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Kisan Sahayak Soil Test"
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: imageBase64 } }
                    ]
                }
            ],
            stream: false,
            temperature: 0.3
        })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(`API ${response.status}: ${result.error?.message || JSON.stringify(result).substring(0, 200)}`);
    }

    if (!result.choices || result.choices.length === 0) {
        throw new Error("No choices returned from API.");
    }

    return result.choices[0].message.content;
};

const parseResponse = (responseText) => {
    // Strip markdown fences
    let cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Extract the JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("No JSON object found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.status || !parsed.message) {
        throw new Error("Response missing required fields (status, message)");
    }

    return parsed;
};

const analyzeSoilImage = async (imageBase64, farmContext) => {
    const prompt = buildSoilPrompt(farmContext);
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    for (let i = 0; i < VISION_MODELS.length; i++) {
        const model = VISION_MODELS[i];
        try {
            console.log(`[Soil AI] Trying model ${i + 1}/${VISION_MODELS.length}: ${model}`);

            const responseText = await callOpenRouter(model, prompt, imageBase64);
            console.log(`[Soil AI] Raw response from ${model}:`, responseText.substring(0, 300));

            const parsed = parseResponse(responseText);

            // Ensure nutrients object has defaults
            if (!parsed.nutrients) {
                parsed.nutrients = {
                    nitrogen: { level: "Medium", value: "~250 kg/ha" },
                    phosphorus: { level: "Medium", value: "~20 kg/ha" },
                    potassium: { level: "Medium", value: "~200 kg/ha" },
                    organicCarbon: { level: "Medium", value: "~0.6%" },
                    pH: { level: "Neutral", value: "~6.8" }
                };
            }

            // Add metadata
            parsed.date = dateStr;
            parsed.modelUsed = model;

            console.log(`[Soil AI] ✅ Success with ${model}`);
            return parsed;

        } catch (err) {
            console.warn(`[Soil AI] ❌ Model ${model} failed: ${err.message}`);
            if (i === VISION_MODELS.length - 1) {
                console.error("[Soil AI] All models failed. Returning fallback.");
            }
        }
    }

    // All models failed — return graceful fallback
    return {
        status: 'Analysis Unavailable',
        badge: 'OK',
        message: 'AI analysis is temporarily unavailable. Please try again in a moment or consult your local agriculture office for a physical soil test.',
        soilType: 'Unknown',
        color: 'Unknown',
        colorHex: '#A0522D',
        texture: 'Unknown',
        moisture: 'Unknown',
        nutrients: {
            nitrogen: { level: "Unknown", value: "N/A" },
            phosphorus: { level: "Unknown", value: "N/A" },
            potassium: { level: "Unknown", value: "N/A" },
            organicCarbon: { level: "Unknown", value: "N/A" },
            pH: { level: "Unknown", value: "N/A" }
        },
        recommendationHtml: 'We could not complete the AI analysis at this time. Please try uploading the image again, or visit your nearest <strong class="text-slate-900 dark:text-white">Krishi Vigyan Kendra</strong> for a comprehensive physical soil test.',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
};

module.exports = { analyzeSoilImage };
