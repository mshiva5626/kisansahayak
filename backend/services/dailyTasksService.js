/**
 * Kisan Sahayak - AI-Powered Daily Tasks & Field Checkup Service
 * 
 * Analyzes crop type, variety, sowing age, soil type, irrigation method,
 * farm location, and live weather to generate:
 * 1. Adaptive AI Field Survey (diagnostic questions tailored to the farm)
 * 2. Evidence-grounded Daily Operations & Checks (with timing, priority, safety)
 * 3. Daily task status tracking (tick/cross persistence)
 */

const { generateAgriculturalCompletion } = require('../config/aiConfig');
const { getWeather } = require('./weatherService');
const { fetchAndAnalyzeMultiSources } = require('./multiSourceEngine');

// In-memory / persistent daily task cache: key = `${farmId}_${dateStr}`
const dailyTaskStore = {};

function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Calculates days after sowing (DAS) from sowing_date
 */
function calculateDAS(sowingDate) {
    if (!sowingDate) return null;
    try {
        const sowing = new Date(sowingDate);
        const now = new Date();
        const diffTime = Math.abs(now - sowing);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays < 365 ? diffDays : null;
    } catch {
        return null;
    }
}

/**
 * Generates an Adaptive AI Field Survey with diagnostic questions
 * tailored to the farm's crop, soil, irrigation, and current weather.
 */
async function generateFieldSurvey(farm, userProfile = {}, language = 'en') {
    const cropName = farm?.crop_type || 'General Crop';
    const cropVariety = farm?.crop_variety || 'Standard';
    const soilType = farm?.soil_type || 'Loamy Soil';
    const irrigation = farm?.water_source || 'Standard Irrigation';
    const landSize = farm?.area ? `${farm.area} ${farm.unit || 'Acres'}` : 'Smallholding';
    const state = farm?.state || userProfile?.state || 'India';
    const district = farm?.district || userProfile?.district || 'General';
    const das = calculateDAS(farm?.sowing_date);
    const dasText = das ? `${das} Days After Sowing (DAS)` : 'Active vegetative / vegetative stage';

    // Fetch live weather context
    let weatherInfo = 'Moderate seasonal weather';
    const lat = farm?.latitude || farm?.location?.lat;
    const lon = farm?.longitude || farm?.location?.lon;
    if (lat && lon) {
        try {
            const w = await getWeather(lat, lon);
            if (w) {
                weatherInfo = `Temperature: ${w.temperature || w.temp}°C, Humidity: ${w.humidity}%, Condition: ${w.condition}, Wind: ${w.wind_speed} km/h`;
            }
        } catch (e) {
            console.warn('Weather fetch warning for survey:', e.message);
        }
    }

    const prompt = `You are a Senior Agronomist and ICAR Field Scientist.
Create a customized 3 to 4 question DAILY FIELD DIAGNOSTIC SURVEY for this specific farmer's plot today.

FARM CONTEXT:
- Crop: ${cropName} (Variety: ${cropVariety})
- Growth Stage: ${dasText}
- Soil Type: ${soilType}
- Irrigation Method: ${irrigation}
- Plot Size: ${landSize}
- Region: ${district}, ${state}
- Current Weather: ${weatherInfo}
- Target Language: ${language}

CRITICAL RULES:
1. Questions MUST BE HIGHLY SPECIFIC to ${cropName} in ${soilType} under ${irrigation} with the current weather.
2. Even in the same district, questions differ based on crop (e.g. wheat needs CRI root check vs paddy needing water depth check) and irrigation (drip emitter check vs canal drainage).
3. Questions must be simple for a farmer to answer with 2-3 quick options.

Return ONLY a valid JSON object matching this schema:
{
  "survey_id": "survey_${Date.now()}",
  "crop": "${cropName}",
  "crop_stage_summary": "Short 1-sentence stage description (e.g. Crown Root Initiation & First Split Stage)",
  "weather_summary": "Brief 1-sentence weather impact note",
  "questions": [
    {
      "id": "q1",
      "question": "Clear, direct question in ${language === 'hi' ? 'Hindi' : 'English'}",
      "category": "Moisture" | "Pest/Disease" | "Nutrition" | "Field Operation",
      "options": [
        { "id": "opt_a", "label": "Option A (e.g. Dry soil, cracked surface)" },
        { "id": "opt_b", "label": "Option B (e.g. Adequate moisture)" },
        { "id": "opt_c", "label": "Option C (e.g. Waterlogged / Soggy)" }
      ]
    },
    {
      "id": "q2",
      "question": "Question 2 inspecting visual leaf/stem signs",
      "category": "Pest/Disease",
      "options": [
        { "id": "opt_a", "label": "No symptoms / Healthy foliage" },
        { "id": "opt_b", "label": "Yellowing leaf tips / Pale color" },
        { "id": "opt_c", "label": "Spots / Curling / Pest visible" }
      ]
    },
    {
      "id": "q3",
      "question": "Question 3 inspecting irrigation or fertilizer timing",
      "category": "Nutrition",
      "options": [
        { "id": "opt_a", "label": "Already applied within last 7 days" },
        { "id": "opt_b", "label": "Due for application today" },
        { "id": "opt_c", "label": "Not yet planned" }
      ]
    }
  ]
}`;

    try {
        const response = await generateAgriculturalCompletion({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            maxTokens: 2000
        });

        const cleaned = response.replace(/```json/gi, '').replace(/```/g, '').trim();
        const startIdx = cleaned.indexOf('{');
        const endIdx = cleaned.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
            const parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
            return parsed;
        }
        throw new Error("Invalid JSON structure from AI survey generator");
    } catch (err) {
        console.warn(`[Daily Tasks Service] Survey generation error: ${err.message}. Using calibrated fallback.`);
        return getFallbackSurvey(cropName, soilType, irrigation, language);
    }
}

/**
 * Generates Daily Tasks & Checks based on Farm Profile + Weather + optional Survey Answers
 */
async function generateDailyTasks(farm, surveyAnswers = [], userProfile = {}, language = 'en') {
    const farmId = farm?.id || farm?._id || 'default_farm';
    const dateStr = getTodayDateString();
    const cacheKey = `${farmId}_${dateStr}`;

    const cropName = farm?.crop_type || 'Field Crop';
    const cropVariety = farm?.crop_variety || 'Local';
    const soilType = farm?.soil_type || 'Alluvial / Loamy';
    const irrigation = farm?.water_source || 'Canal / Borewell';
    const landSize = farm?.area ? `${farm.area} ${farm.unit || 'Acres'}` : '1 Acre';
    const state = farm?.state || userProfile?.state || 'India';
    const district = farm?.district || userProfile?.district || 'General';
    const das = calculateDAS(farm?.sowing_date);
    const dasText = das ? `${das} Days After Sowing` : 'Active Vegetative Stage';

    let weatherObj = null;
    let weatherText = 'Clear sky, moderate humidity';
    const lat = farm?.latitude || farm?.location?.lat;
    const lon = farm?.longitude || farm?.location?.lon;
    if (lat && lon) {
        try {
            weatherObj = await getWeather(lat, lon);
            if (weatherObj) {
                weatherText = `${weatherObj.condition}, Temp: ${weatherObj.temperature || weatherObj.temp}°C, Humidity: ${weatherObj.humidity}%, Wind: ${weatherObj.wind_speed} km/h`;
            }
        } catch (e) {
            console.warn('Weather fetch warning for tasks:', e.message);
        }
    }

    const answersSummary = Array.isArray(surveyAnswers) && surveyAnswers.length > 0
        ? `FARMER'S RECENT FIELD SURVEY RESPONSES:\n${surveyAnswers.map((a, idx) => `Q${idx + 1}: ${a.question || ''} -> Answer: ${a.selectedOption || a.answer || 'N/A'}`).join('\n')}`
        : 'FARMER HAS NOT COMPLETED TODAY\'S SURVEY YET (Generate standard evidence-based daily operational checks for this crop & weather).';

    const prompt = `You are a Senior Agronomist and Extension Officer at Kisan Sahayak.
Generate today's (${dateStr}) customized DAILY OPERATIONS & FIELD CHECKS for this farm.

FARM METADATA:
- Crop: ${cropName} (${cropVariety})
- Stage: ${dasText}
- Soil: ${soilType}
- Irrigation: ${irrigation}
- Area: ${landSize}
- Region: ${district}, ${state}
- Weather Forecast: ${weatherText}

${answersSummary}

AGRONOMIC RULES:
1. Provide 4-5 high-priority, realistic daily tasks that the farmer should perform TODAY.
2. If weather has high humidity (>75%), prioritize fungal/pest scouting.
3. If weather is hot/dry, prioritize root zone moisture checks and early morning/evening irrigation.
4. Include exact timing windows (e.g. "Morning 6:00 AM - 9:00 AM", "Late Afternoon").
5. Include safety precautions and specific tool/chemical/fertilizer handling tips.
6. If no urgent hazards exist, provide standard regular preventative field checkups.

Return ONLY a valid JSON object matching this schema:
{
  "date": "${dateStr}",
  "crop": "${cropName}",
  "growth_stage": "${dasText}",
  "overall_field_status": "Brief status (e.g. Optimal Growth • Low Disease Risk)",
  "weather_headline": "1-sentence weather action tip (e.g. Favorable morning conditions for field inspection)",
  "tasks": [
    {
      "id": "task_1",
      "title": "Clear, concise action title",
      "category": "Irrigation" | "Scouting" | "Nutrition" | "Protection" | "Maintenance",
      "priority": "High" | "Medium" | "Routine Check",
      "timing": "e.g. 7:00 AM - 10:00 AM (Early Morning)",
      "description": "Detailed practical step-by-step guidance for the farmer.",
      "safety_or_tip": "Specific agronomic tip or safety precaution.",
      "completed": false,
      "dismissed": false
    }
  ]
}`;

    try {
        const response = await generateAgriculturalCompletion({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            maxTokens: 2500
        });

        const cleaned = response.replace(/```json/gi, '').replace(/```/g, '').trim();
        const startIdx = cleaned.indexOf('{');
        const endIdx = cleaned.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
            const parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
            
            // Preserve completed/dismissed states if cached previously today
            if (dailyTaskStore[cacheKey]?.tasks) {
                const existingMap = new Map(dailyTaskStore[cacheKey].tasks.map(t => [t.id, t]));
                parsed.tasks = parsed.tasks.map((newTask, idx) => {
                    const existing = existingMap.get(newTask.id) || existingMap.get(`task_${idx + 1}`);
                    if (existing) {
                        return {
                            ...newTask,
                            completed: existing.completed || false,
                            dismissed: existing.dismissed || false
                        };
                    }
                    return newTask;
                });
            }

            dailyTaskStore[cacheKey] = parsed;
            return parsed;
        }
        throw new Error("Invalid JSON structure from AI tasks generator");
    } catch (err) {
        console.warn(`[Daily Tasks Service] Task generation error: ${err.message}. Using calibrated fallback.`);
        const fallback = getFallbackTasks(cropName, soilType, irrigation, weatherText, dateStr);
        dailyTaskStore[cacheKey] = fallback;
        return fallback;
    }
}

/**
 * Updates a single task status (completed: true/false or dismissed: true/false)
 */
function updateTaskStatus(farmId, taskId, updates = {}) {
    const dateStr = getTodayDateString();
    const cacheKey = `${farmId}_${dateStr}`;

    if (!dailyTaskStore[cacheKey]) {
        dailyTaskStore[cacheKey] = getFallbackTasks('Field Crop', 'Loamy', 'Standard', 'Moderate', dateStr);
    }

    const taskList = dailyTaskStore[cacheKey].tasks || [];
    const task = taskList.find(t => t.id === taskId);
    if (task) {
        if (updates.completed !== undefined) task.completed = Boolean(updates.completed);
        if (updates.dismissed !== undefined) task.dismissed = Boolean(updates.dismissed);
        task.updated_at = new Date().toISOString();
        return { success: true, task, allTasks: dailyTaskStore[cacheKey] };
    }

    return { success: false, message: 'Task not found' };
}

/**
 * Returns today's tasks from cache or generates them
 */
async function getOrGenerateTodayTasks(farm, userProfile = {}, language = 'en') {
    const farmId = farm?.id || farm?._id || 'default_farm';
    const dateStr = getTodayDateString();
    const cacheKey = `${farmId}_${dateStr}`;

    if (dailyTaskStore[cacheKey]) {
        return dailyTaskStore[cacheKey];
    }

    return await generateDailyTasks(farm, [], userProfile, language);
}

// ==========================================
// FALLBACK GENERATORS (OFFLINE / API GRACE)
// ==========================================

function getFallbackSurvey(crop, soil, irrigation, language) {
    return {
        survey_id: `survey_fallback_${Date.now()}`,
        crop: crop,
        crop_stage_summary: `Active vegetative and growth monitoring for ${crop}`,
        weather_summary: "Standard seasonal conditions. Inspect soil and leaf surfaces.",
        questions: [
            {
                id: "q1",
                question: language === 'hi' ? `क्या आपके ${crop} के खेत में मिट्टी की नमी पर्याप्त है?` : `Is there adequate root-zone moisture in your ${crop} plot?`,
                category: "Moisture",
                options: [
                    { id: "opt_a", label: language === 'hi' ? "मिट्टी सूखी है (सिंचाई की जरूरत)" : "Dry topsoil (needs irrigation)" },
                    { id: "opt_b", label: language === 'hi' ? "नमी सही है (अनुकूल)" : "Optimal moisture" },
                    { id: "opt_c", label: language === 'hi' ? "जलभराव / अधिक गीली मिट्टी" : "Waterlogged / Excess wet" }
                ]
            },
            {
                id: "q2",
                question: language === 'hi' ? `क्या पत्तियों पर कोई कीट या पीले धब्बे दिखाई दे रहे हैं?` : `Did you observe any pest chewing or yellow/brown leaf spots?`,
                category: "Pest/Disease",
                options: [
                    { id: "opt_a", label: language === 'hi' ? "पत्तियां पूरी तरह हरी और स्वस्थ हैं" : "Leaves are green and healthy" },
                    { id: "opt_b", label: language === 'hi' ? "कुछ पत्तियों पर हल्के पीले धब्बे हैं" : "Slight yellowing / pale foliage" },
                    { id: "opt_c", label: language === 'hi' ? "कीट या गंभीर लक्षण दिख रहे हैं" : "Active insect pests or lesions visible" }
                ]
            },
            {
                id: "q3",
                question: language === 'hi' ? `आपकी ${irrigation} प्रणाली की स्थिति कैसी है?` : `What is the operational status of your ${irrigation} system?`,
                category: "Maintenance",
                options: [
                    { id: "opt_a", label: language === 'hi' ? "सुचारू रूप से चल रही है" : "Running smoothly with clean filters" },
                    { id: "opt_b", label: language === 'hi' ? "प्रेशर कम / लीकेज या रुकावट है" : "Low pressure / clogged nozzles" },
                    { id: "opt_c", label: language === 'hi' ? "आज चलाने की योजना है" : "Scheduled to run today" }
                ]
            }
        ]
    };
}

function getFallbackTasks(crop, soil, irrigation, weather, dateStr) {
    return {
        date: dateStr,
        crop: crop,
        growth_stage: "Active Growth & Vegetative Maintenance",
        overall_field_status: "Routine Field Checks Active",
        weather_headline: "Clear morning conditions recommended for field scouting and irrigation checks.",
        tasks: [
            {
                id: "task_1",
                title: `Inspect ${crop} Canopy for Sucking Pests & Spots`,
                category: "Scouting",
                priority: "High",
                timing: "6:30 AM - 9:00 AM (Early Morning)",
                description: `Walk in a zig-zag pattern across the field. Turn over lower leaves to inspect for aphid, whitefly, or fungal spore colonies.`,
                safety_or_tip: "Check undersides of leaves where pests shelter from sun.",
                completed: false,
                dismissed: false
            },
            {
                id: "task_2",
                title: `Root-Zone Soil Moisture & ${irrigation} Check`,
                category: "Irrigation",
                priority: "Medium",
                timing: "Before 11:00 AM",
                description: `Dig 4-6 inches deep in the active root zone. Soil should form a loose ball when squeezed without dripping water.`,
                safety_or_tip: "Ensure irrigation is applied early to minimize midday evaporation losses.",
                completed: false,
                dismissed: false
            },
            {
                id: "task_3",
                title: `Weed Sanitation & Inter-Row Aeration`,
                category: "Maintenance",
                priority: "Routine Check",
                timing: "Late Afternoon (4:00 PM - 6:00 PM)",
                description: `Remove competing broadleaf weeds along bunds and field borders to reduce pest host reservoirs.`,
                safety_or_tip: "Stack removed weeds outside the cropped perimeter to dry.",
                completed: false,
                dismissed: false
            },
            {
                id: "task_4",
                title: `Nutrient Status & Basal / Top-Dress Review`,
                category: "Nutrition",
                priority: "Medium",
                timing: "Anytime today",
                description: `Verify whether crop is due for scheduled split urea top-dressing or micronutrient foliar spray based on growth stage.`,
                safety_or_tip: "Apply urea only on moist soil; avoid applying on dry soil.",
                completed: false,
                dismissed: false
            }
        ]
    };
}

module.exports = {
    generateFieldSurvey,
    generateDailyTasks,
    updateTaskStatus,
    getOrGenerateTodayTasks
};
