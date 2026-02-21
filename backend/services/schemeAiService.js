const OPENROUTER_API_KEY = process.env.SCHEMES_API_KEY || "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";
const MODEL_NAME = "stepfun/step-3.5-flash:free";

/**
 * Generates an AI response based on user queries regarding schemes.
 * Injecting the current matching schemes as context.
 */
const getSchemeAdvice = async (messages, schemesContext, userState) => {
    try {
        console.log(`\n--- OPENROUTER SCHEME AI REQUEST ---`);
        console.log(`Model: ${MODEL_NAME}`);

        // Build context payload from schemes
        const schemeDetails = schemesContext.map(s =>
            `- **${s.name}** (${s.ministry || 'N/A'}):\n  Benefits: ${s.benefits}\n  Eligibility: ${s.eligibility || 'N/A'}\n  Apply: ${s.application_guidance || 'N/A'}`
        ).join('\n\n');

        const systemPrompt = `You are a knowledgeable AI Assistant specializing in Indian Government Agricultural Schemes.
    You help farmers understand the schemes available to them. 

    Consider the following context:
    User's State: ${userState || 'Not specified'}
    
    Here is the list of currently visible government schemes on the farmer's dashboard:
    ${schemeDetails ? schemeDetails : "(No specific schemes available, provide general guidance)"}
    
    CRITICAL RULES:
    1. Be concise, polite, and farmer-friendly in your answers.
    2. Only answer questions based on the schemes provided in the context above. If they ask about something else, politely guide them back to discussing agricultural schemes.
    3. Provide accurate information about eligibility and application steps based ONLY on the context.
    4. Keep your responses short (under 4-5 sentences) unless explaining a complex eligibility rule. Provide bullet points if explaining steps.`;

        // Combine system prompt with user history
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        // Standard HTTP Fetch to OpenRouter (non-streaming for reliability)
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: apiMessages,
                stream: false
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`OpenRouter Fetch Error: ${response.status} - ${errBody}`);
            throw new Error(`OpenRouter returned status ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "I couldn't process your request regarding schemes right now.";

        console.log(`OpenRouter Scheme AI Response received. Length: ${reply.length} chars.`);
        return reply;

    } catch (error) {
        console.error('Scheme AI Service Error:', error.message);
        throw new Error('Failed to generate scheme advice: ' + error.message);
    }
};

/**
 * Asks the AI to generate a list of real and current agricultural schemes 
 * for a specific Indian state in real-time.
 */
const generateRealtimeSchemes = async (state) => {
    try {
        console.log(`\n--- OPENROUTER REALTIME SCHEME SYNC ---`);
        const userState = state || 'India';

        const systemPrompt = `You are an expert in Indian government agricultural schemes. 
The user is a farmer from the state of: ${userState}.
Your task is to provide exactly 5 real, active, and highly relevant government agricultural schemes available to them. 

CRITICAL RULE: You MUST output ONLY a valid JSON array of objects. Do not include markdown formatting like \`\`\`json or any conversational text.

Each object in the array MUST have exactly these keys:
- "name": (String) Name of the scheme
- "ministry": (String) The responsible ministry or department
- "benefits": (String) 1-2 sentences summarizing financial or material benefits
- "eligibility": (String) 1-2 sentences summarizing who is eligible
- "application_guidance": (String) Short steps on how to apply or where to go
- "scheme_type": (String) Must be exactly "central" or "state"
- "state": (String) The specific state name, or "All" if it's Central`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [{ role: 'system', content: systemPrompt }],
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter returned status ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "[]";

        // Cleanup potential markdown blocks if the AI disobeys the instruction
        let cleanedReply = reply.trim();
        if (cleanedReply.startsWith("```json")) {
            cleanedReply = cleanedReply.replace(/```json/gi, '').replace(/```/g, '').trim();
        } else if (cleanedReply.startsWith("```")) {
            cleanedReply = cleanedReply.replace(/```/g, '').trim();
        }

        const parsedSchemes = JSON.parse(cleanedReply);

        // Assign a mock _id to each for frontend mapping
        const schemesWithIds = parsedSchemes.map((s, i) => ({
            ...s,
            _id: `ai-gen-${Date.now()}-${i}`
        }));

        console.log(`Successfully generated ${schemesWithIds.length} realtime schemes for ${userState}.`);
        return schemesWithIds;

    } catch (error) {
        console.error('Realtime Scheme AI Service Error:', error.message);
        throw new Error('Failed to generate realtime schemes: ' + error.message);
    }
}

module.exports = {
    getSchemeAdvice,
    generateRealtimeSchemes
};
