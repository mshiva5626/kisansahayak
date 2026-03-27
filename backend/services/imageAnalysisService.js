const fs = require('fs');
const path = require('path');

// Model fallback chain — best-to-worst for vision/disease tasks
const VISION_MODELS = [
    'google/gemma-3-27b-it:free',
    'qwen/qwen2.5-vl-32b-instruct:free',
    'moonshotai/kimi-vl-a3b-thinking:free',
    'nvidia/nemotron-nano-12b-v2-vl:free'
];

const buildDiseasePrompt = (imageType, farm) => {
    const cropName = farm?.crop_type || 'Unknown crop';
    return `System Role: You are a Senior Plant Pathologist and Agronomist with 25+ years of field experience specializing in Indian agriculture and tropical crop diseases.

Task: Perform a rigorous, multi-step diagnostic on the attached ${imageType} image of the ${cropName} plant.

FARM CONTEXT:
- Crop: ${cropName}
- Terrain: ${farm?.terrain_type || 'Flat'}
- Region: ${farm?.location?.state || 'India'}
- District: ${farm?.location?.district || 'Unknown'}

DIAGNOSTIC PROTOCOL — Execute each step with scientific precision:

═══════════════════════════════════════
STEP 1: VISUAL EVIDENCE (Symptom Identification)
═══════════════════════════════════════
Examine the image meticulously for ALL of the following. For each symptom found, describe:
- WHAT: The exact symptom (e.g., chlorosis, necrotic lesions with "bullseye" concentric rings, water-soaked spots, powdery white fungal spores, rust-colored pustules)
- WHERE: Location on the plant (lower leaves vs. upper canopy, margins vs. interveinal, abaxial vs. adaxial surface, stems, petioles, fruits)
- PATTERN: Distribution pattern (random, concentric, V-shaped, along veins, tip burn, marginal scorch)
- PROGRESSION: Early/mid/advanced stage indicators

Check systematically for:
• Leaf spots — shape (circular, angular, irregular), size (mm), color (tan, brown, black, purple), borders (defined/diffuse/halo)
• Chlorosis — uniform yellowing, interveinal chlorosis, mosaic patterns, vein banding
• Necrosis — dry/papery lesions, wet/mushy lesions, concentric rings ("bullseye"), shot-hole appearance
• Wilting — unilateral, whole plant, reversible (midday wilt) vs. permanent
• Fungal signs — powdery/downy mildew coating, rust pustules (uredinia), sclerotia, conidiophores, mycelial growth
• Bacterial signs — water-soaked halos, bacterial ooze/streaming, soft rot, angular spots limited by veins
• Viral signs — mosaic/mottle, ringspots, enations, leaf curl/roll, stunted growth, shoestring leaves
• Pest damage — chewing holes, mining trails (serpentine/blotch), stippling (mites), webbing, frass, galls, deformation
• Nutrient deficiency — N (uniform pale green/yellow, older leaves first), P (purple/reddish), K (marginal scorch, older leaves), Fe (interveinal chlorosis, young leaves), Mg (interveinal chlorosis, older leaves)
• Abiotic stress — sunscald, frost injury, chemical burn, herbicide drift patterns, salt damage

═══════════════════════════════════════
STEP 2: PRIMARY DIAGNOSIS
═══════════════════════════════════════
Based on visual evidence:
- Identify the MOST LIKELY disease, pest, or condition
- Provide the scientific/binomial name of the pathogen or pest
- Classify the causal agent type

═══════════════════════════════════════
STEP 3: CONFIDENCE SCORE & LOOK-ALIKES
═══════════════════════════════════════
- Rate your diagnostic confidence from 0 to 100 (as a decimal 0.0-1.0)
- List 1-3 "look-alike" diseases or conditions that produce similar symptoms but are NOT the primary diagnosis
- Explain briefly why each look-alike was ruled out

═══════════════════════════════════════
STEP 4: ENVIRONMENTAL CONTEXT
═══════════════════════════════════════
Explain what environmental conditions likely triggered or worsened this condition:
- Temperature range that favors this pathogen/pest
- Humidity / rainfall patterns
- Soil pH or drainage issues
- Season / growth stage vulnerability
- Cultural practices that may have contributed

═══════════════════════════════════════
STEP 5: INTEGRATED PEST MANAGEMENT (IPM) ACTION PLAN
═══════════════════════════════════════
Provide a structured 3-tier response:

TIER 1 — IMMEDIATE (do today):
- Emergency containment steps (e.g., prune and destroy infected parts, isolate affected plants, stop overhead irrigation)

TIER 2 — ORGANIC / BIOLOGICAL:
- Bio-control agents (e.g., Trichoderma viride, Pseudomonas fluorescens, Bacillus subtilis)
- Botanical treatments (e.g., Neem oil 3%, Panchagavya, garlic-chili extract)
- Cultural practices (crop rotation, trap crops, resistant varieties)

TIER 3 — CHEMICAL (if necessary, last resort):
- Use ACTIVE INGREDIENT names only (NOT brand names)
- Specify: active ingredient, concentration, dosage per acre/liter of water, application method, PHI (pre-harvest interval)
- Safety precautions

═══════════════════════════════════════
STEP 6: SEVERITY & YIELD IMPACT
═══════════════════════════════════════
- Severity rating: Healthy / Mild / Moderate / Severe / Critical
- Estimated % of plant area affected
- Expected yield loss if left untreated
- Spread risk to neighboring plants

Return ONLY a valid JSON object. No markdown, no code fences, no explanation text before or after the JSON.

{
  "disease_name": "Exact common disease name",
  "scientific_name": "Binomial name of pathogen (e.g., Phytophthora infestans)",
  "causal_agent": "Fungal" or "Bacterial" or "Viral" or "Pest" or "Nutrient Deficiency" or "Abiotic Stress" or "Healthy",
  "confidence": 0.85,
  "severity": "Healthy" or "Mild" or "Moderate" or "Severe" or "Critical",
  "severity_percentage": "estimated % of affected area, e.g. 25%",
  "symptoms_observed": [
    "Specific symptom 1 with location and appearance detail",
    "Specific symptom 2 with location and appearance detail",
    "Specific symptom 3 with location and appearance detail"
  ],
  "symptom_locations": "Where on the plant symptoms appear (e.g., lower leaves, leaf margins, stem base)",
  "color_patterns": "Precise color description — e.g., 'Irregular dark brown necrotic lesions (3-8mm) with yellow chlorotic halo on lower leaf surfaces, progressing upward'",
  "texture_analysis": "Surface texture — e.g., 'Raised pustules on abaxial surface with powdery orange urediniospores; adaxial surface shows corresponding yellow flecks'",
  "affected_parts": ["leaf", "stem", "fruit", "root"],
  "spread_risk": "Low" or "Medium" or "High",
  "overall_assessment": "2-3 sentence professional summary: disease name, current severity, urgency of treatment, and prognosis",
  "environmental_context": "What conditions triggered this — temperature, humidity, soil pH, season, cultural practices",
  "similar_diseases": [
    {
      "name": "Look-alike disease name",
      "scientific_name": "Pathogen binomial name",
      "why_ruled_out": "Brief reason this was excluded"
    }
  ],
  "ipm_immediate": "TIER 1 emergency steps — what to do TODAY (prune infected parts, stop irrigation, isolate plants)",
  "ipm_organic": "TIER 2 organic/biological treatment — specific bio-agents or botanical treatments with dosage",
  "ipm_chemical": {
    "active_ingredient": "Chemical active ingredient name (NOT brand name)",
    "concentration": "e.g., 25% WP or 45% EC",
    "dosage": "Amount per acre or per liter of water",
    "application_method": "Foliar spray / soil drench / seed treatment",
    "frequency": "How often and for how long",
    "phi_days": "Pre-harvest interval in days",
    "precaution": "Safety and environmental precaution"
  },
  "immediate_action": "Single most important thing farmer should do RIGHT NOW",
  "organic_treatment": "Organic treatment summary for quick reference",
  "chemical_treatment": {
    "product": "Active ingredient name",
    "dosage": "Amount per acre/liter",
    "frequency": "Application schedule",
    "precaution": "Safety note"
  },
  "prevention": [
    "Prevention measure 1 — specific cultural practice",
    "Prevention measure 2 — resistant variety or rotation advice",
    "Prevention measure 3 — environmental management"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ],
  "yield_impact": "Expected yield loss if untreated — e.g., '30-50% yield reduction expected within 2 weeks if untreated'"
}`;
};

const { GoogleGenAI } = require('@google/genai');

const API_KEY = process.env.CROP_ANALYSIS_API_KEY || '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';
// If the user's key starts with AIza, it's a direct Google Gemini key. If sk-or, it's an OpenRouter key.
const GEMINI_API_KEY = process.env.CROP_ANALYSIS_API_KEY || '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';

// Determine if we should use official Google SDK or OpenRouter fallback based on key prefix
const useOfficialGemini = GEMINI_API_KEY.startsWith('AIza');

const callGeminiDirect = async (prompt, base64Image, mimeType) => {
    // Initialize the new Google GenAI SDK (requires version ^0.1.2)
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    console.log(`[Crop AI] Sending request to gemini-2.0-flash via @google/genai...`);

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            }
        ],
        config: {
            temperature: 0.2,
            responseMimeType: "application/json"
        }
    });

    if (!response.text) {
        throw new Error("No response text returned from Gemini API.");
    }

    return response.text;
};

const callOpenRouter = async (model, prompt, base64Image, mimeType) => {
    const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GEMINI_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Kisan Sahayak Crop Disease Scanner"
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                    ]
                }
            ],
            stream: false,
            temperature: 0.2
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
    if (!parsed.disease_name && !parsed.overall_assessment) {
        throw new Error("Response missing required fields (disease_name or overall_assessment)");
    }

    return parsed;
};

const analyzeImageWithAI = async (imagePath, imageType, farm) => {
    try {
        // Read image file and convert to base64
        let base64Image = '';
        let mimeType = 'image/jpeg';

        if (imagePath.startsWith('http')) {
            console.log(`[Crop AI] Fetching image from URL...`);
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
                console.error('[Crop AI] Image file not found:', absolutePath);
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

        const prompt = buildDiseasePrompt(imageType, farm);
        let responseText;
        let finalModelUsed;

        if (useOfficialGemini) {
            // Path A: Native Gemini 2.0 Flash via @google/genai
            finalModelUsed = 'gemini-2.0-flash';
            try {
                responseText = await callGeminiDirect(prompt, base64Image, mimeType);
                console.log(`[Crop AI] Raw response from Gemini:`, responseText.substring(0, 400));
            } catch (err) {
                console.error(`[Crop AI] ❌ Gemini direct call failed: ${err.message}`);
                throw err; // Fail fast so caller can handle
            }
        } else {
            // Path B: OpenRouter Fallback sequence
            const VISION_MODELS = [
                'google/gemma-3-27b-it:free',
                'qwen/qwen2.5-vl-32b-instruct:free',
                'moonshotai/kimi-vl-a3b-thinking:free',
                'nvidia/nemotron-nano-12b-v2-vl:free'
            ];

            for (let i = 0; i < VISION_MODELS.length; i++) {
                const model = VISION_MODELS[i];
                try {
                    console.log(`[Crop AI] Trying OpenRouter model ${i + 1}/${VISION_MODELS.length}: ${model}`);
                    responseText = await callOpenRouter(model, prompt, base64Image, mimeType);
                    console.log(`[Crop AI] Raw response from ${model}:`, responseText.substring(0, 400));
                    finalModelUsed = model;
                    break;
                } catch (err) {
                    console.warn(`[Crop AI] ❌ Model ${model} failed: ${err.message}`);
                    if (i === VISION_MODELS.length - 1) {
                        console.error("[Crop AI] All OpenRouter models failed.");
                    }
                }
            }
        }

        if (!responseText) {
            throw new Error("All vision models failed to return a response.");
        }

        const parsed = parseResponse(responseText);

        // Map to the response structure expected by the controller & frontend
        const isHealthy = (parsed.severity === 'Healthy' || parsed.causal_agent === 'Healthy');

        const result = {
            analysis: {
                disease_name: parsed.disease_name || 'Unknown',
                scientific_name: parsed.scientific_name || '',
                causal_agent: parsed.causal_agent || 'Unknown',
                severity: parsed.severity || 'Unknown',
                severity_percentage: parsed.severity_percentage || 'N/A',
                symptom_locations: parsed.symptom_locations || '',
                color_patterns: parsed.color_patterns || 'No specific color anomalies noted.',
                texture_analysis: parsed.texture_analysis || 'No specific texture anomalies noted.',
                overall_assessment: parsed.overall_assessment || parsed.disease_name || 'Analysis Complete',
                environmental_context: parsed.environmental_context || '',
                // IPM 3-tier action plan
                ipm_immediate: parsed.ipm_immediate || parsed.immediate_action || '',
                ipm_organic: parsed.ipm_organic || parsed.organic_treatment || '',
                ipm_chemical: parsed.ipm_chemical || null,
                // Legacy fields for backward compat
                immediate_action: parsed.immediate_action || parsed.ipm_immediate || '',
                chemical_treatment: parsed.chemical_treatment || null,
                organic_treatment: parsed.organic_treatment || parsed.ipm_organic || '',
                prevention: parsed.prevention || [],
                recommendations: parsed.recommendations || [],
                yield_impact: parsed.yield_impact || '',
                similar_diseases: parsed.similar_diseases || [],
                spread_risk: parsed.spread_risk || 'Unknown',
                affected_parts: parsed.affected_parts || []
            },
            confidence_score: parsed.confidence || 0.80,
            indicators: parsed.symptoms_observed || [],
            modelUsed: finalModelUsed
        };

        console.log(`[Crop AI] ✅ Success with ${finalModelUsed} — Disease: ${parsed.disease_name}, Severity: ${parsed.severity}`);
        return result;

    } catch (error) {
        console.error('[Crop AI] Fatal Error:', error.message);
        // Return a graceful fallback instead of throwing to the frontend
        return {
            analysis: {
                disease_name: 'Analysis Unavailable',
                scientific_name: '',
                causal_agent: 'Unknown',
                severity: 'Unknown',
                severity_percentage: 'N/A',
                symptom_locations: '',
                color_patterns: 'Could not analyze at this time.',
                texture_analysis: 'Could not analyze at this time.',
                overall_assessment: 'AI analysis is temporarily unavailable. Please try again in a moment or consult your local Krishi Vigyan Kendra for a physical diagnosis.',
                environmental_context: '',
                ipm_immediate: 'Consult your nearest agriculture extension officer.',
                ipm_organic: '',
                ipm_chemical: null,
                immediate_action: 'Consult your nearest agriculture extension officer.',
                chemical_treatment: null,
                organic_treatment: '',
                prevention: [],
                recommendations: ['Retry the scan with a clearer image', 'Visit your local Krishi Vigyan Kendra for expert diagnosis'],
                yield_impact: '',
                similar_diseases: [],
                spread_risk: 'Unknown',
                affected_parts: []
            },
            confidence_score: 0,
            indicators: [],
            modelUsed: 'Fallback'
        };
    }
};

module.exports = { analyzeImageWithAI };
