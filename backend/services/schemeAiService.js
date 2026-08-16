/**
 * Kisan Sahayak - Government Schemes AI Advisory & Verification Service
 * 
 * Provides verified guidance on official Central and State government schemes,
 * eligibility verification, and direct portal links without fabrication.
 */

const { generateAgriculturalCompletion } = require('../config/aiConfig');
const { getAllSchemes } = require('../knowledge/knowledgeBase');

/**
 * Generates an AI response for questions regarding government schemes
 */
const getSchemeAdvice = async (messages, schemesContext, userState) => {
    try {
        const verifiedSchemes = getAllSchemes(userState);
        const combinedSchemes = schemesContext && schemesContext.length > 0 ? schemesContext : verifiedSchemes;

        const schemeDetails = combinedSchemes.map(s =>
            `- **${s.name}** (${s.ministry || s.scheme_type || 'Govt'}):\n  • Benefits: ${s.benefits}\n  • Eligibility: ${s.eligibility || 'N/A'}\n  • Application Guidance: ${s.application_guidance || 'N/A'}\n  • Official Website: ${s.website_url || 'https://agricoop.nic.in'}`
        ).join('\n\n');

        const systemPrompt = `You are a Senior Agricultural Extension Officer specializing in Indian Government Agricultural Schemes and DBT Portals.
You assist farmers with accurate eligibility rules, required documentation, and application steps.

FARMER STATE: ${userState || 'All India'}

OFFICIAL VERIFIED SCHEMES DIRECTORY:
${schemeDetails}

CRITICAL RULES:
1. Ground your answers strictly in the verified schemes provided in the directory above.
2. Clearly mention the official portal URLs (e.g. pmkisan.gov.in, pmfby.gov.in, agriinfra.dac.gov.in) and required documents (Aadhaar, Land RoR/Khatian, Bank passbook).
3. If the user asks about a scheme not in the verified list, state that they should verify with their local District Agriculture Office or CSC rather than guessing.
4. Keep the explanation concise, polite, structured with bullet points, and farmer-friendly.`;

        const formattedMessages = messages.map(m => ({
            role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
            content: m.content
        }));

        const reply = await generateAgriculturalCompletion({
            messages: formattedMessages,
            systemInstruction: systemPrompt,
            temperature: 0.2
        });

        return reply;

    } catch (error) {
        console.error('Scheme AI Service Error:', error.message);
        throw new Error('Failed to generate scheme advice: ' + error.message);
    }
};

/**
 * Returns verified real-time schemes for a state from the authoritative registry
 */
const generateRealtimeSchemes = async (state) => {
    try {
        const userState = state || 'All India';
        const schemes = getAllSchemes(userState);

        const formattedSchemes = schemes.map((s, i) => ({
            _id: s.id || `scheme-${Date.now()}-${i}`,
            name: s.name,
            ministry: s.ministry,
            benefits: s.benefits,
            eligibility: s.eligibility,
            application_guidance: s.application_guidance,
            scheme_type: s.scheme_type,
            state: s.state,
            website_url: s.website_url
        }));

        return formattedSchemes;

    } catch (error) {
        console.error('Realtime Scheme Registry Error:', error.message);
        throw new Error('Failed to retrieve realtime schemes: ' + error.message);
    }
};

module.exports = {
    getSchemeAdvice,
    generateRealtimeSchemes
};
