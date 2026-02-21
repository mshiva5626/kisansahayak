const fs = require('fs');
const path = require('path');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const VISION_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';
const API_KEY = process.env.ARCEE_API_KEY || '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';

const analyzeImageWithAI = async (imagePath, imageType, farm) => {
    try {
        // Read image file and convert to base64
        let base64Image = '';
        let mimeType = 'image/jpeg';

        if (imagePath.startsWith('http')) {
            console.log(`Fetching image from Supabase URL...`);
            const response = await fetch(imagePath);
            if (!response.ok) throw new Error(`HTTP error fetching image! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            base64Image = buffer.toString('base64');
            const contentType = response.headers.get('content-type');
            if (contentType) mimeType = contentType;
        } else {
            const absolutePath = path.resolve(imagePath);
            if (!fs.existsSync(absolutePath)) {
                console.error('Image file not found:', absolutePath);
                throw new Error('Image file not found on server.');
            }
            const imageData = fs.readFileSync(absolutePath);
            base64Image = imageData.toString('base64');

            const ext = path.extname(absolutePath).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.gif': 'image/gif'
            };
            mimeType = mimeTypes[ext] || 'image/jpeg';
        }

        const prompt = `You are an expert agricultural field analyst. Analyze this ${imageType} image from a farm growing ${farm?.crop_type || 'crops'} on ${farm?.terrain_type || 'flat'} terrain.

IMPORTANT:
- This is for decision-support, NOT disease diagnosis
- Handle variations in lighting and shadow
- Be professional and precise
- DO NOT mention AI or models

Analyze and extract:
1. COLOR PATTERNS: Describe dominant colors, discoloration, chlorosis, necrosis patterns
2. TEXTURE: Surface texture, roughness, uniformity, anomalies
3. CROP STRESS INDICATORS: Wilting, curling, spotting, stunting, pest damage signs
4. OVERALL ASSESSMENT: General health assessment with confidence level

Respond in this exact JSON format (and nothing else):
{
    "color_patterns": "description",
    "texture_analysis": "description",
    "stress_indicators": ["indicator1", "indicator2"],
    "overall_assessment": "description",
    "confidence": 0.85,
    "recommendations": ["rec1", "rec2"]
}`;

        console.log(`\n--- OPENROUTER VISION REQUEST ---`);
        console.log(`Model: ${VISION_MODEL}`);
        console.log(`Sending image (${mimeType}) analysis to OpenRouter...`);

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'Kisan Sahayak Farm Copilot',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: VISION_MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                        ]
                    }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenRouter responded with status: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const responseText = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';

        console.log(`\n--- OPENROUTER VISION RESPONSE ---`);
        console.log(responseText.substring(0, 500) + (responseText.length > 500 ? '...\n[Truncated]' : ''));
        console.log('------------------------------\n');

        // Try to parse as JSON
        let parsed;
        try {
            // Extract JSON from response (may be wrapped in markdown code block by Ollama)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (e) {
            parsed = null;
        }

        if (parsed) {
            return {
                analysis: {
                    color_patterns: parsed.color_patterns || 'No specific color anomalies noted.',
                    texture_analysis: parsed.texture_analysis || 'No specific texture anomalies noted.',
                    stress_indicators: parsed.stress_indicators || [],
                    overall_assessment: parsed.overall_assessment || 'General observations completed.',
                    recommendations: parsed.recommendations || []
                },
                confidence_score: parsed.confidence || 0.80,
                indicators: parsed.stress_indicators || []
            };
        }

        // Fallback: return raw text if JSON parsing failed
        return {
            analysis: { raw_analysis: responseText },
            confidence_score: 0.75,
            indicators: []
        };
    } catch (error) {
        console.error('Image Analysis Error:', error.message);
        throw new Error('AI Vision Service is temporarily unavailable. Please try again later.');
    }
};

module.exports = { analyzeImageWithAI };
