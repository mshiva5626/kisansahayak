/**
 * Kisan Sahayak - AI-Powered Daily Tasks & Field Checkup Service
 * 
 * Agronomically Grounded Growth Stage Engine:
 * Analyzes crop type, variety, exact Days After Sowing (DAS), soil type, 
 * irrigation method, farm location, and live weather to generate:
 * 1. Stage-Accurate AI Field Survey (diagnostic questions strictly matching crop age)
 * 2. Stage-Accurate Daily Operations & Checks (seedbed -> germination -> seedling -> vegetative -> flowering -> harvest)
 * 3. Daily task status tracking (tick/cross persistence)
 */

const { generateAgriculturalCompletion } = require('../config/aiConfig');
const { getWeather } = require('./weatherService');

// In-memory / persistent daily task cache: key = `${farmId}_${dateStr}`
const dailyTaskStore = {};

function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

function extractJSONFromAIResponse(rawText) {
    if (!rawText || typeof rawText !== 'string') return null;
    
    // 1. Strip out <think>...</think> reasoning tags from models like DeepSeek or Nemotron
    let text = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // 2. Try extracting from markdown code block ```json ... ```
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
        try {
            return JSON.parse(codeBlockMatch[1].trim());
        } catch {
            // fall through
        }
    }

    // 3. Try parsing from outermost { ... }
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        try {
            return JSON.parse(text.substring(startIdx, endIdx + 1));
        } catch {
            // fall through
        }
    }

    return null;
}

/**
 * Calculates exact Days After Sowing (DAS) and classifies agronomic growth stage
 */
function getAgronomicStageDetails(sowingDate, cropType = 'Crop') {
    let das = 0;
    if (sowingDate) {
        try {
            const sowing = new Date(sowingDate);
            sowing.setHours(0, 0, 0, 0);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const diffTime = now.getTime() - sowing.getTime();
            const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
            das = days >= 0 && days <= 365 ? days : 0;
        } catch {
            das = 0;
        }
    }

    let stageKey = 'sowing_day';
    let stageTitle = '';
    let stageDescription = '';
    let physicalPresence = '';

    if (das === 0) {
        stageKey = 'sowing_day';
        stageTitle = `Day 0: Sowing & Planting Day (0 DAS)`;
        stageDescription = `Seeds are freshly placed in the seedbed/furrow. ZERO above-ground foliage or leaves exist. Operations focus strictly on seed placement, soil moisture seal, pre-emergence barrier, and bird/rodent protection.`;
        physicalPresence = 'Seed in soil furrow underground, zero leaves or stems, bare seedbed';
    } else if (das >= 1 && das <= 4) {
        stageKey = 'germination';
        stageTitle = `Germination & Imbibition (${das} DAS)`;
        stageDescription = `Seeds are absorbing moisture underground to push out the embryonic root (radicle) and shoot (coleoptile). No true leaves visible yet. Focus on soil moisture at seed depth and crust prevention.`;
        physicalPresence = 'Underground germinating seeds, zero leaves, soil surface crust risk';
    } else if (das >= 5 && das <= 12) {
        stageKey = 'seedling';
        stageTitle = `Seedling Emergence & Sprouting (${das} DAS)`;
        stageDescription = `Tiny 1-2 leaf sprouts breaking through the soil surface (1-3 inches). Focus on germination percentage, soil crusting, damping-off prevention at the soil line, and gap-filling.`;
        physicalPresence = 'Tiny tender 1-2 leaf emergent sprouts (1-3 inches high)';
    } else if (das >= 13 && das <= 25) {
        stageKey = 'early_vegetative';
        stageTitle = `Early Vegetative & Root Establishment (${das} DAS)`;
        stageDescription = `Crown root initiation / primary root branching, 3-5 true leaves, initial tillering/branching onset. First weed emergence and split top-dressing window.`;
        physicalPresence = 'Young small crop plants (4-8 inches tall), developing root system';
    } else if (das >= 26 && das <= 55) {
        stageKey = 'active_vegetative';
        stageTitle = `Active Vegetative & Tillering/Branching (${das} DAS)`;
        stageDescription = `Rapid canopy expansion, active tillering/branching, stem elongation. Foliar pest and leaf spot monitoring is active.`;
        physicalPresence = 'Dense green vegetative canopy';
    } else if (das >= 56 && das <= 80) {
        stageKey = 'flowering';
        stageTitle = `Booting, Flowering & Squaring (${das} DAS)`;
        stageDescription = `Panicle emergence / flowering / square formation. Peak moisture sensitivity; protect blooms from pod borers and sucking pests.`;
        physicalPresence = 'Active flowers, panicles, tassels, or squares visible';
    } else if (das >= 81 && das <= 115) {
        stageKey = 'grain_filling';
        stageTitle = `Grain/Pod/Fruit Development (${das} DAS)`;
        stageDescription = `Milking, dough, and fruit enlargement stage. Maintain moderate moisture, prevent premature lodging and fruit rot.`;
        physicalPresence = 'Developing pods, cobs, bolls, or ripening fruit clusters';
    } else {
        stageKey = 'maturity';
        stageTitle = `Maturity & Ripening (${das} DAS)`;
        stageDescription = `Physiological maturity, grain hardening, foliage yellowing. Withhold irrigation for dry harvest.`;
        physicalPresence = 'Golden/yellow dry mature crop ready for harvesting';
    }

    return {
        das,
        stageKey,
        stageTitle,
        stageDescription,
        physicalPresence
    };
}

/**
 * Generates an Adaptive AI Field Survey with diagnostic questions
 * tailored strictly to the farm's crop growth stage, soil, irrigation, and current weather.
 */
async function generateFieldSurvey(farm, userProfile = {}, language = 'en') {
    const cropName = farm?.crop_type || 'General Crop';
    const cropVariety = farm?.crop_variety || 'Standard';
    const soilType = farm?.soil_type || 'Loamy Soil';
    const irrigation = farm?.water_source || 'Standard Irrigation';
    const landSize = farm?.area ? `${farm.area} ${farm.unit || 'Acres'}` : 'Smallholding';
    const state = farm?.state || userProfile?.state || 'India';
    const district = farm?.district || userProfile?.district || 'General';
    
    const stageInfo = getAgronomicStageDetails(farm?.sowing_date, cropName);

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
Create a customized 3-question DAILY FIELD DIAGNOSTIC SURVEY for this specific farmer's plot today.

FARM CONTEXT:
- Crop: ${cropName} (Variety: ${cropVariety})
- EXACT AGE: ${stageInfo.das} Days After Sowing (DAS)
- CROP GROWTH STAGE: ${stageInfo.stageTitle}
- STAGE SUMMARY: ${stageInfo.stageDescription}
- PHYSICAL REALITY IN FIELD: ${stageInfo.physicalPresence}
- Soil Type: ${soilType}
- Irrigation Method: ${irrigation}
- Plot Size: ${landSize}
- Region: ${district}, ${state}
- Weather Today: ${weatherInfo}
- Target Language: ${language}

STRICT AGRONOMIC RULES:
1. IF DAS == 0 (Planted Today) OR DAS <= 4 (Germination):
   - DO NOT ASK ABOUT LEAVES, CANOPY, LEAF SPOTS, OR SPRAYING PESTICIDES! (There are no leaves yet!).
   - Ask strictly about: seed placement depth, soil moisture at seed level, seed-soil contact, soil crusting, or bird/rodent scavenging.
2. IF DAS 5 to 12 (Seedling):
   - Ask strictly about seedling emergence count, crust breaking, damping-off at soil line, or gap filling.
3. IF DAS 13+ (Vegetative / Flowering / Fruiting):
   - Ask about root development, tillering, foliage vigor, sucking pests, or flower retention according to stage.
4. Questions must be simple for a farmer to answer with 2-3 quick choices.

Return ONLY a valid JSON object matching this schema:
{
  "survey_id": "survey_${Date.now()}",
  "crop": "${cropName}",
  "das": ${stageInfo.das},
  "crop_stage_summary": "${stageInfo.stageTitle} • ${stageInfo.physicalPresence}",
  "weather_summary": "1-sentence weather impact on current stage",
  "questions": [
    {
      "id": "q1",
      "question": "Question 1 tailored strictly to ${stageInfo.stageTitle}",
      "category": "Seedbed/Moisture" | "Germination" | "Nutrition" | "Protection",
      "options": [
        { "id": "opt_a", "label": "Option A" },
        { "id": "opt_b", "label": "Option B" },
        { "id": "opt_c", "label": "Option C" }
      ]
    },
    {
      "id": "q2",
      "question": "Question 2 tailored strictly to ${stageInfo.stageTitle}",
      "category": "Soil/Establishment",
      "options": [
        { "id": "opt_a", "label": "Option A" },
        { "id": "opt_b", "label": "Option B" },
        { "id": "opt_c", "label": "Option C" }
      ]
    },
    {
      "id": "q3",
      "question": "Question 3 tailored strictly to ${stageInfo.stageTitle}",
      "category": "Operation Timing",
      "options": [
        { "id": "opt_a", "label": "Option A" },
        { "id": "opt_b", "label": "Option B" },
        { "id": "opt_c", "label": "Option C" }
      ]
    }
  ]
}`;

    try {
        const response = await generateAgriculturalCompletion({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            maxTokens: 2000
        });

        const parsed = extractJSONFromAIResponse(response);
        if (parsed && Array.isArray(parsed.questions)) {
            return parsed;
        }
        throw new Error("Invalid JSON structure from AI survey generator");
    } catch (err) {
        console.warn(`[Daily Tasks Service] Survey generation error: ${err.message}. Using calibrated stage fallback.`);
        return getFallbackSurvey(cropName, soilType, irrigation, stageInfo, language);
    }
}

/**
 * Generates Daily Tasks & Checks based on Farm Profile + Stage + Weather + optional Survey Answers
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
    
    const stageInfo = getAgronomicStageDetails(farm?.sowing_date, cropName);

    let weatherText = 'Clear sky, moderate humidity';
    const lat = farm?.latitude || farm?.location?.lat;
    const lon = farm?.longitude || farm?.location?.lon;
    if (lat && lon) {
        try {
            const weatherObj = await getWeather(lat, lon);
            if (weatherObj) {
                weatherText = `${weatherObj.condition}, Temp: ${weatherObj.temperature || weatherObj.temp}°C, Humidity: ${weatherObj.humidity}%, Wind: ${weatherObj.wind_speed} km/h`;
            }
        } catch (e) {
            console.warn('Weather fetch warning for tasks:', e.message);
        }
    }

    const answersSummary = Array.isArray(surveyAnswers) && surveyAnswers.length > 0
        ? `FARMER'S RECENT FIELD SURVEY RESPONSES:\n${surveyAnswers.map((a, idx) => `Q${idx + 1}: ${a.question || ''} -> Answer: ${a.selectedOption || a.answer || 'N/A'}`).join('\n')}`
        : 'FARMER HAS NOT COMPLETED TODAY\'S SURVEY YET (Generate standard evidence-based daily operational checks for this exact stage & weather).';

    const prompt = `You are a Senior Agronomist and Extension Officer at Kissan Sahayak.
Generate today's (${dateStr}) customized DAILY OPERATIONS & FIELD CHECKS for this farm.

FARM METADATA:
- Crop: ${cropName} (${cropVariety})
- EXACT AGE: ${stageInfo.das} Days After Sowing (DAS)
- CROP GROWTH STAGE: ${stageInfo.stageTitle}
- STAGE SUMMARY: ${stageInfo.stageDescription}
- PHYSICAL REALITY IN FIELD: ${stageInfo.physicalPresence}
- Soil: ${soilType}
- Irrigation: ${irrigation}
- Area: ${landSize}
- Region: ${district}, ${state}
- Weather Forecast: ${weatherText}

${answersSummary}

CRITICAL AGRONOMIC REALITY RULES:
1. IF DAS == 0 (PLANTED TODAY):
   - There are ZERO leaves or stems above ground!
   - DO NOT suggest leaf scouting, canopy inspection, foliar spraying, pruning, or harvesting!
   - Suggest ONLY day-of-planting operations:
     a) Furrow seed depth & seed-to-soil contact verification (1.5-2 inches).
     b) Initial seedbed moisture seal / gentle soaking irrigation.
     c) Pre-emergence weed barrier application (e.g. Pendimethalin) before weeds emerge.
     d) Perimeter patrol to deter surface birds, ants, and rodents from carrying seeds.
2. IF DAS 1 to 4 (GERMINATION PHASE):
   - Focus on subterranean seed imbibition check, soil crust breaking, and seedbed moisture at 2 inches.
3. IF DAS 5 to 12 (SEEDLING EMERGENCE):
   - Focus on emergence rate count, soil line damping-off inspection, and gap filling.
4. IF DAS 13 to 25 (EARLY VEGETATIVE / CRI ROOT STAGE):
   - Focus on crown root initiation, first split Urea top-dressing, and shallow mechanical weeding.
5. IF DAS 26+ (ACTIVE CANOPY / FLOWERING / GRAIN):
   - Focus on canopy pest scouting, flowering nutrition, and grain filling protection.

Return ONLY a valid JSON object matching this schema:
{
  "date": "${dateStr}",
  "crop": "${cropName}",
  "das": ${stageInfo.das},
  "growth_stage": "${stageInfo.stageTitle}",
  "overall_field_status": "${stageInfo.das === 0 ? 'Sowing & Seedbed Establishment' : stageInfo.das < 5 ? 'Active Germination Phase' : 'Active Field Management'}",
  "weather_headline": "1-sentence actionable weather advice tailored to ${stageInfo.stageTitle}",
  "tasks": [
    {
      "id": "task_1",
      "title": "Clear action title strictly matching ${stageInfo.stageTitle}",
      "category": "Seedbed" | "Irrigation" | "Soil Health" | "Protection" | "Nutrition" | "Scouting",
      "priority": "High" | "Medium" | "Routine Check",
      "timing": "e.g. Early Morning (6:30 AM - 9:00 AM) or Before Noon",
      "description": "Detailed practical step-by-step guidance tailored to ${stageInfo.stageTitle}.",
      "safety_or_tip": "Specific agronomic tip or safety precaution for this stage.",
      "completed": false,
      "dismissed": false
    }
  ]
}`;

    try {
        const response = await generateAgriculturalCompletion({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            maxTokens: 2500
        });

        const parsed = extractJSONFromAIResponse(response);
        if (parsed && Array.isArray(parsed.tasks)) {
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
        console.warn(`[Daily Tasks Service] Task generation error: ${err.message}. Using calibrated stage fallback.`);
        const fallback = getFallbackTasks(cropName, soilType, irrigation, weatherText, dateStr, stageInfo);
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
        const stageInfo = getAgronomicStageDetails(null, 'Field Crop');
        dailyTaskStore[cacheKey] = getFallbackTasks('Field Crop', 'Loamy', 'Standard', 'Moderate', dateStr, stageInfo);
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

// =========================================================================
// STAGE-SPECIFIC DETERMINISTIC FALLBACKS (ZERO LEAF TALK FOR SOWING / SEED)
// =========================================================================

function getFallbackSurvey(crop, soil, irrigation, stageInfo, language) {
    const isHi = language === 'hi';
    const das = stageInfo.das;

    if (das === 0) {
        return {
            survey_id: `survey_sowing_${Date.now()}`,
            crop: crop,
            das: 0,
            crop_stage_summary: `Day 0: Sowing & Planting Day (0 DAS) • Seedbed Placement`,
            weather_summary: "Optimal day for seed sowing and moisture sealing.",
            questions: [
                {
                    id: "q1",
                    question: isHi ? `क्या बीजों की बुवाई सही गहराई (1.5 से 2 इंच) पर की गई है?` : `Is seed placement depth optimal (1.5 to 2 inches) across the furrow?`,
                    category: "Seedbed",
                    options: [
                        { id: "opt_a", label: isHi ? "हाँ, सही गहराई पर (1.5 - 2 इंच)" : "Yes, optimal depth (1.5 - 2 inches)" },
                        { id: "opt_b", label: isHi ? "उथली बुवाई (सतह पर दिख रहे हैं)" : "Too shallow (seeds visible on surface)" },
                        { id: "opt_c", label: isHi ? "अधिक गहराई पर (> 3 इंच)" : "Too deep (> 3 inches)" }
                    ]
                },
                {
                    id: "q2",
                    question: isHi ? `बुवाई के तुरंत बाद क्या क्यारी/खेत में पर्याप्त नमी है?` : `Is the seedbed adequately moist for immediate seed imbibition?`,
                    category: "Moisture",
                    options: [
                        { id: "opt_a", label: isHi ? "अच्छी नमी है (उचित अंकुरण हेतु)" : "Optimal moist seedbed" },
                        { id: "opt_b", label: isHi ? "ऊपरी मिट्टी सूखी है (हल्की सिंचाई चाहिए)" : "Dry topsoil (needs light wetting)" },
                        { id: "opt_c", label: isHi ? "अत्यधिक जलभराव या कीचड़" : "Excess wet / waterlogged" }
                    ]
                },
                {
                    id: "q3",
                    question: isHi ? `क्या बुवाई से पहले बीजोपचार (Seed Treatment) किया गया था?` : `Was seed treatment (Fungicide/Trichoderma) completed before sowing?`,
                    category: "Protection",
                    options: [
                        { id: "opt_a", label: isHi ? "हाँ, प्रमाणित फफूंदनाशक/जैव-उपचारित" : "Yes, certified treated seed sown" },
                        { id: "opt_b", label: isHi ? "नहीं, सीधे बिना उपचारित बीज बोया" : "Untreated direct seed" },
                        { id: "opt_c", label: isHi ? "आधार खाद (Basal NPK) के साथ मिलाया" : "Mixed with basal fertilizer" }
                    ]
                }
            ]
        };
    }

    if (das >= 1 && das <= 4) {
        return {
            survey_id: `survey_germ_${Date.now()}`,
            crop: crop,
            das: das,
            crop_stage_summary: `Germination & Imbibition (${das} DAS) • Underground Sprouting`,
            weather_summary: "Seeds absorbing soil moisture underground.",
            questions: [
                {
                    id: "q1",
                    question: isHi ? `क्या बीज गहराई (1-2 इंच) पर मिट्टी में नमी बरकरार है?` : `Is moisture retained at seed depth (1-2 inches) below surface?`,
                    category: "Moisture",
                    options: [
                        { id: "opt_a", label: isHi ? "नमी सही है" : "Adequate moisture at seed depth" },
                        { id: "opt_b", label: isHi ? "ऊपरी परत पर कड़ी पपड़ी (Crust) बन रही है" : "Hard topsoil crust forming" },
                        { id: "opt_c", label: isHi ? "मिट्टी बहुत सूखी है" : "Dry seed zone" }
                    ]
                },
                {
                    id: "q2",
                    question: isHi ? `क्या चिड़ियों या चींटियों द्वारा बीज खोदने के निशान हैं?` : `Any signs of surface birds, ants, or rodents disturbing seed rows?`,
                    category: "Protection",
                    options: [
                        { id: "opt_a", label: isHi ? "कोई नुकसान नहीं, क्यारियां सुरक्षित हैं" : "Undisturbed furrow rows" },
                        { id: "opt_b", label: isHi ? "पक्षी/कीट बीज खा रहे हैं" : "Surface birds or ants detected" }
                    ]
                },
                {
                    id: "q3",
                    question: isHi ? `आपकी ${irrigation} प्रणाली तैयार है?` : `Is your ${irrigation} ready for a light crust-breaking run?`,
                    category: "Irrigation",
                    options: [
                        { id: "opt_a", label: isHi ? "तैयार है" : "Ready for gentle mist/run" },
                        { id: "opt_b", label: isHi ? "अभी जरूरत नहीं" : "Not needed today" }
                    ]
                }
            ]
        };
    }

    // Vegetative / Foliar Default for DAS >= 5
    return {
        survey_id: `survey_veg_${Date.now()}`,
        crop: crop,
        das: das,
        crop_stage_summary: `${stageInfo.stageTitle}`,
        weather_summary: "Standard seasonal crop inspection conditions.",
        questions: [
            {
                id: "q1",
                question: isHi ? `क्या खेत में मिट्टी की नमी जड़ क्षेत्र में सही है?` : `Is root-zone soil moisture optimal in your ${crop} plot?`,
                category: "Moisture",
                options: [
                    { id: "opt_a", label: isHi ? "नमी सही है" : "Optimal moisture" },
                    { id: "opt_b", label: isHi ? "मिट्टी सूखी है" : "Dry soil (needs irrigation)" },
                    { id: "opt_c", label: isHi ? "जलभराव है" : "Waterlogged" }
                ]
            },
            {
                id: "q2",
                question: isHi ? `क्या पौधों पर कीट या धब्बे दिख रहे हैं?` : `Any insect pests, discoloration, or lesions observed?`,
                category: "Pest/Disease",
                options: [
                    { id: "opt_a", label: isHi ? "पौधे स्वस्थ हैं" : "Healthy uniform stand" },
                    { id: "opt_b", label: isHi ? "हल्के लक्षण दिख रहे हैं" : "Slight yellowing or spots" },
                    { id: "opt_c", label: isHi ? "कीट दिखाई दे रहे हैं" : "Active pests visible" }
                ]
            },
            {
                id: "q3",
                question: isHi ? `उर्वरक/खाद की क्या स्थिति है?` : `What is the fertilizer/nutrition plan for this week?`,
                category: "Nutrition",
                options: [
                    { id: "opt_a", label: isHi ? "हाल ही में डाला गया" : "Applied recently" },
                    { id: "opt_b", label: isHi ? "आज डालने की योजना है" : "Scheduled today" }
                ]
            }
        ]
    };
}

function getFallbackTasks(crop, soil, irrigation, weather, dateStr, stageInfo) {
    const das = stageInfo.das;

    if (das === 0) {
        return {
            date: dateStr,
            crop: crop,
            das: 0,
            growth_stage: "Day 0: Sowing & Planting Day (0 DAS)",
            overall_field_status: "Sowing Day • Seedbed Establishment",
            weather_headline: "Optimal day for direct planting. Ensure seed placement depth and seedbed moisture seal.",
            tasks: [
                {
                    id: "task_1",
                    title: `Verify ${crop} Seed Placement Depth & Soil Contact`,
                    category: "Seedbed",
                    priority: "High",
                    timing: "During Sowing / Immediate",
                    description: `Ensure seeds are placed at a uniform 1.5 to 2 inches depth into moist soil furrow. Firm the topsoil lightly over seeds to ensure direct seed-to-soil contact for moisture absorption.`,
                    safety_or_tip: "Do not bury seeds deeper than 2.5 inches as it delays emergence and weakens coleoptiles.",
                    completed: false,
                    dismissed: false
                },
                {
                    id: "task_2",
                    title: `Seedbed Moisture Seal & Gentle Initial Soaking`,
                    category: "Irrigation",
                    priority: "High",
                    timing: "Immediately after sowing",
                    description: `Provide a light, uniform initial wetting (via ${irrigation} or light furrow run) to thoroughly moisten the top 2-3 inches of the seedbed. Avoid heavy flooding that causes seed displacement.`,
                    safety_or_tip: "Avoid high-pressure flooding which washes away topsoil or uncovers planted seeds.",
                    completed: false,
                    dismissed: false
                },
                {
                    id: "task_3",
                    title: `Pre-Emergence Weed Barrier Application`,
                    category: "Protection",
                    priority: "Medium",
                    timing: "Within 24 to 48 hours of sowing",
                    description: `If practicing chemical weed control, apply recommended pre-emergence herbicide (e.g. Pendimethalin 30% EC @ 1.0 kg a.i./ha) onto moist seedbed before any weeds or crop seeds germinate.`,
                    safety_or_tip: "Wear protective rubber boots and mask. Spray backward to avoid stepping on the herbicide film.",
                    completed: false,
                    dismissed: false
                },
                {
                    id: "task_4",
                    title: `Field Perimeter Inspection & Bird/Rodent Protection`,
                    category: "Protection",
                    priority: "Routine Check",
                    timing: "Late Afternoon",
                    description: `Walk field borders and check that no loose seed spillage is attracting pigeons, crows, or rodents. Install reflective ribbon or bird-scaring flags along furrow lines.`,
                    safety_or_tip: "Keep field borders clean of weed seed heads that attract grain-feeding birds.",
                    completed: false,
                    dismissed: false
                }
            ]
        };
    }

    if (das >= 1 && das <= 4) {
        return {
            date: dateStr,
            crop: crop,
            das: das,
            growth_stage: `Germination & Imbibition (${das} DAS)`,
            overall_field_status: "Active Germination • Underground Sprouting",
            weather_headline: "Seeds absorbing soil moisture underground. Protect against topsoil crusting.",
            tasks: [
                {
                    id: "task_1",
                    title: `Seedbed Soil Moisture & Crust Formation Check`,
                    category: "Soil Health",
                    priority: "High",
                    timing: "Morning (7:00 AM - 9:00 AM)",
                    description: `Check the topsoil surface. If bright sun has created a hard, baked soil crust, give a very light sprinkle via ${irrigation} to soften the crust so emerging plumules can push through easily.`,
                    safety_or_tip: "A hard dry crust can cause emerging sprouts to bend and die underground.",
                    completed: false,
                    dismissed: false
                },
                {
                    id: "task_2",
                    title: `Underground Seed Imbibition Sample Check`,
                    category: "Seedbed",
                    priority: "Medium",
                    timing: "Morning hours",
                    description: `Carefully brush aside 1 inch of soil in 2 random furrow spots. Check that seeds have swollen and the tiny white rootlet (radicle) has begun emerging. Re-cover gently with loose soil.`,
                    safety_or_tip: "Do not break the fragile emerging radicle when checking.",
                    completed: false,
                    dismissed: false
                },
                {
                    id: "task_3",
                    title: `Drainage Channel & Water Stagnation Prevention`,
                    category: "Irrigation",
                    priority: "Medium",
                    timing: "Afternoon",
                    description: `Ensure field drains are clear. Germinating seeds require soil oxygen (aeration); standing water for more than 12 hours causes seed rot.`,
                    safety_or_tip: "Drain any standing water puddles in low-lying furrow corners.",
                    completed: false,
                    dismissed: false
                },
                {
                    id: "task_4",
                    title: `Bird & Rodent Scavenging Deterrence`,
                    category: "Protection",
                    priority: "Routine Check",
                    timing: "Early Morning & Sunset",
                    description: `Patrol the field to deter birds or squirrels from digging up swelling seeds.`,
                    safety_or_tip: "Ensure reflective ribbons and scarecrows remain upright.",
                    completed: false,
                    dismissed: false
                }
            ]
        };
    }

    if (das >= 5 && das <= 12) {
        return {
            date: dateStr,
            crop: crop,
            das: das,
            growth_stage: `Seedling Emergence & Sprouting (${das} DAS)`,
            overall_field_status: "Seedling Emergence • Stand Establishment",
            weather_headline: "Tiny sprouts emerging above ground. Monitor emergence uniformity.",
            tasks: [
                {
                    id: "task_1",
                    title: `Assess Germination & Emergence Uniformity`,
                    category: "Scouting",
                    priority: "High",
                    timing: "Morning (7:00 AM - 10:00 AM)",
                    description: `Walk rows to evaluate seedling stand. Count emerged 1-2 leaf sprouts per meter row length. Look for any patchy or missing spots exceeding 1 foot.`,
                    safety_or_tip: "Emergence above 80% ensures target plant population.",
                    completed: false,
                    dismissed: false
                },
                {
                    id: "task_2",
                    title: `Gap Filling / Re-sowing in Missing Patches`,
                    category: "Seedbed",
                    priority: "Medium",
                    timing: "Morning or Late Afternoon",
                    description: `In spots where seeds failed to emerge, dibble soaked replacement seeds immediately while the rest of the crop is still small.`,
                    safety_or_tip: "Perform gap filling within 10 DAS to keep harvest maturity uniform.",
                    completed: false,
                    dismissed: false
                },
                {
                    id: "task_3",
                    title: `Soil-Line Damping-Off & Collar Rot Inspection`,
                    category: "Protection",
                    priority: "High",
                    timing: "Morning hours",
                    description: `Inspect tiny seedling stems right at the soil surface line. Check for water-soaked brown lesions or seedlings toppling over (damping-off). Avoid over-irrigation.`,
                    safety_or_tip: "If damping-off is spotted, drench soil with Trichoderma viride @ 5g/L.",
                    completed: false,
                    dismissed: false
                },
                {
                    id: "task_4",
                    title: `Light Root-Zone Moisture Maintenance`,
                    category: "Irrigation",
                    priority: "Medium",
                    timing: "Before 11:00 AM",
                    description: `Maintain shallow root zone moisture with light ${irrigation}. Avoid saturating the soil to encourage deeper taproot growth.`,
                    safety_or_tip: "Light, frequent moisture is better than heavy flood soaking for seedlings.",
                    completed: false,
                    dismissed: false
                }
            ]
        };
    }

    // Vegetative / Foliar Default for DAS >= 13
    return {
        date: dateStr,
        crop: crop,
        das: das,
        growth_stage: stageInfo.stageTitle,
        overall_field_status: "Active Vegetative Care",
        weather_headline: "Conditions favorable for vegetative field inspection and root zone moisture management.",
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
                title: `Nutrient Status & Top-Dress Review`,
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
    getAgronomicStageDetails,
    generateFieldSurvey,
    generateDailyTasks,
    updateTaskStatus,
    getOrGenerateTodayTasks
};
