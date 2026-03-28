const callLiquidModel = async (messages, context = null) => {
    try {
        const API_KEY = process.env.FERTILIZER_API_KEY;
        if (!API_KEY) {
            console.warn("WARNING: FERTILIZER_API_KEY is not defined in the environment.");
        }

        let systemPrompt = `You are an expert Agricultural Fertilizer AI Assistant operating the 'Fertilizer Marketplace' platform for an Indian farmer application.
You help farmers pick the right fertilizer for their crops, understand pricing (in INR), dosage, and market trends.

CRITICAL INSTRUCTIONS FOR YOU:
1. PRICING: NEVER say you cannot fetch real-time prices. You MUST provide the current approximate standard retail prices for Indian government-subsidized fertilizers (e.g., Urea is roughly ₹266 per 45kg bag, DAP is ₹1350 per 50kg bag, MOP is ₹1700, NPK complexes are ₹1470). Use these baseline prices confidently when asked, and format them beautifully.
2. ACCURACY & DOSAGE: When asked for recommendations, you MUST provide EXACT, scientific, authentic dosage formulas (NPK ratios) and area-based calculations (e.g., kg per acre or hectare) strictly tailored to the specific crop. Provide the ideal split application timings (Basal vs Top dressing).
3. FORMATTING: Use clean Markdown tables to display dosage calculations and cost estimates. Emphasize key numbers in bold.

Keep your responses exceptionally helpful, highly authoritative, concise, and structured.`;

        // Properly structure the system prompt plus message history
        let conversationContent = messages;
        if (context) {
            const injectedMessage = {
                role: "system",
                content: systemPrompt + `\n\nUSER CONTEXT: ${JSON.stringify(context)}`
            };
            conversationContent = [injectedMessage, ...messages];
        } else {
            conversationContent = [{ role: "system", content: systemPrompt }, ...messages];
        }

        console.log(`[FertilizerService] Calling liquid/lfm-2.5-1.2b-thinking:free natively with ${conversationContent.length} messages...`);

        // Bypassing the @openrouter/sdk entirely to avoid strict Zod 'Input validation failed' exceptions on standard arrays
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "HTTP-Referer": "http://localhost:5173", // Required by OpenRouter protocol
                "X-Title": "Kisan Sahayak", // Required by OpenRouter protocol
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "liquid/lfm-2.5-1.2b-thinking:free",
                messages: conversationContent
            })
        });

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`OpenRouter Native Fetch Error: ${response.status} - ${errData}`);
        }

        const result = await response.json();

        // Native OpenRouter completion response signature payload mappings
        if (result?.choices?.[0]?.message?.content) {
            return result.choices[0].message.content;
        } else if (result?.choices?.[0]?.text) {
            return result.choices[0].text;
        }
        
        console.warn("[FertilizerService] Unexpected Response Signature:", JSON.stringify(result).substring(0, 500));
        throw new Error("No valid response from Liquid AI.");
    } catch (error) {
        console.error("OpenRouter Liquid AI Error:", error.message || error);
        throw error;
    }
}

module.exports = {
    callLiquidModel
};
