const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = 'AIzaSyB8tYK85eeSqkMzJApW3gAhKXFk-Z26utg';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function run() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: 'cotton crop ka spacing batao' }] }],
            config: {
                systemInstruction: 'Be helpful.',
                temperature: 0.7
            }
        });
        console.log(response.text);
    } catch (e) {
        console.log('REAL ERROR:', JSON.stringify(e, null, 2));
        console.log(e.message);
    }
}
run();
