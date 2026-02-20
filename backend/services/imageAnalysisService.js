const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

let genAI = null;
let visionModel = null;

const initializeVision = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_key_here') {
        genAI = new GoogleGenerativeAI(apiKey);
        visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        return true;
    }
    return false;
};

const analyzeImageWithAI = async (imagePath, imageType, farm) => {
    // Try to initialize if not done
    if (!visionModel) {
        const initialized = initializeVision();
        if (!initialized) {
            throw new Error('AI Vision Service is not configured. Please provide a valid Gemini API key.');
        }
    }

    try {
        // Read image file and convert to base64
        const absolutePath = path.resolve(imagePath);
        if (!fs.existsSync(absolutePath)) {
            console.error('Image file not found:', absolutePath);
            throw new Error('Image file not found on server.');
        }

        const imageData = fs.readFileSync(absolutePath);
        const base64Image = imageData.toString('base64');

        // Determine MIME type
        const ext = path.extname(absolutePath).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        };
        const mimeType = mimeTypes[ext] || 'image/jpeg';

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

Respond in this JSON format:
{
    "color_patterns": "description",
    "texture_analysis": "description",
    "stress_indicators": ["indicator1", "indicator2"],
    "overall_assessment": "description",
    "confidence": 0.85,
    "recommendations": ["rec1", "rec2"]
}`;

        const result = await visionModel.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            }
        ]);

        const responseText = result.response.text();

        // Try to parse as JSON
        let parsed;
        try {
            // Extract JSON from response (may be wrapped in markdown code block)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (e) {
            parsed = null;
        }

        if (parsed) {
            return {
                analysis: {
                    color_patterns: parsed.color_patterns,
                    texture_analysis: parsed.texture_analysis,
                    stress_indicators: parsed.stress_indicators,
                    overall_assessment: parsed.overall_assessment,
                    recommendations: parsed.recommendations
                },
                confidence_score: parsed.confidence || 0.80,
                indicators: parsed.stress_indicators || []
            };
        }

        // Fallback: return raw text
        return {
            analysis: { raw_analysis: responseText },
            confidence_score: 0.75,
            indicators: []
        };
    } catch (error) {
        console.error('Image Analysis Error:', error.message);
        throw new Error('Image analysis temporarily unavailable.');
    }
};

// Removed mock analysis function.

module.exports = { analyzeImageWithAI };
