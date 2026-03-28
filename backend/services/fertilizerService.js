// Model fallback chain — tries each model until one works
const FERTILIZER_MODELS = [
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-3-4b-it:free',
    'mistralai/mistral-7b-instruct:free',
    'liquid/lfm-2.5-1.2b-thinking:free'
];

const systemPrompt = `You are an expert Agricultural Fertilizer AI Assistant on the 'Fertilizer Marketplace' platform for Indian farmers.

CRITICAL RULES — ALWAYS FOLLOW:
1. PRICING: You MUST always state current approximate Indian government-subsidized fertilizer prices. Use these:
   - Urea: ₹266 per 45kg bag (₹5.91/kg) - NBS subsidized
   - DAP (Di-ammonium Phosphate): ₹1,350 per 50kg bag (₹27/kg) 
   - MOP (Muriate of Potash): ₹1,700 per 50kg bag (₹34/kg)
   - NPK (10:26:26): ₹1,470 per 50kg bag
   - NPK (12:32:16): ₹1,420 per 50kg bag
   - SSP (Single Super Phosphate): ₹450 per 50kg bag
   - Neem-coated Urea: ₹266 per 45kg bag
   NEVER say you cannot provide prices. These are official GOI-subsidized MRP figures.

2. DOSAGE FORMULAS: For any crop, always use authentic ICAR (Indian Council of Agricultural Research) recommended NPK dosages. Format as:
   - Total NPK requirement (kg/acre or kg/hectare)  
   - Which fertilizer to use for each nutrient
   - Exact quantity of each fertilizer bag needed
   - Application timing: Basal (at sowing) vs Top Dressing (after germination)

3. FORMAT: Use clean Markdown tables with ₹ costs. Be precise and authoritative.

Example for WHEAT (per acre):
 - N: 60 kg → Urea 130 kg (₹765) 
 - P: 30 kg → DAP 65 kg (₹1,755)  
 - K: 30 kg → MOP 50 kg (₹1,700)`;

const tryModelRequest = async (apiKey, model, messages) => {
    console.log(`[FertilizerService] Trying model: ${model}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout per model
    
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
                "X-Title": "Kisan Sahayak Fertilizer Market",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ model, messages }),
            signal: controller.signal
        });

        clearTimeout(timeout);
        
        if (!response.ok) {
            const errText = await response.text();
            console.warn(`[FertilizerService] ${model} returned HTTP ${response.status}: ${errText.substring(0, 200)}`);
            return null; // Signal to try next model
        }

        const result = await response.json();
        
        // Check for valid content (handle empty/null responses from unstable free models)
        const content = result?.choices?.[0]?.message?.content || result?.choices?.[0]?.text;
        if (!content || content.trim().length === 0) {
            console.warn(`[FertilizerService] ${model} returned empty content.`);
            return null; // Signal to try next model
        }
        
        console.log(`[FertilizerService] ✅ Success with model: ${model} (${content.length} chars)`);
        return content;
        
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            console.warn(`[FertilizerService] ${model} timed out after 30s.`);
        } else {
            console.warn(`[FertilizerService] ${model} fetch error: ${err.message}`);
        }
        return null; // Signal to try next model
    }
};

const callLiquidModel = async (messages, context = null) => {
    const API_KEY = process.env.FERTILIZER_API_KEY;
    
    if (!API_KEY) {
        console.error("[FertilizerService] FERTILIZER_API_KEY is missing from environment variables!");
        throw new Error("Fertilizer API key is not configured.");
    }
    
    console.log(`[FertilizerService] API Key loaded: ${API_KEY.substring(0, 15)}...`);

    // Build conversation with system prompt
    const conversationContent = [
        { role: "system", content: context 
            ? systemPrompt + `\n\nFARMER CONTEXT: ${JSON.stringify(context)}` 
            : systemPrompt 
        },
        ...messages
    ];

    // Try each model in the fallback chain
    for (const model of FERTILIZER_MODELS) {
        const result = await tryModelRequest(API_KEY, model, conversationContent);
        if (result) return result;
        console.log(`[FertilizerService] Falling back to next model...`);
    }

    // All models failed
    throw new Error("All AI models are currently unavailable. Please try again in a moment.");
};

module.exports = { callLiquidModel };
