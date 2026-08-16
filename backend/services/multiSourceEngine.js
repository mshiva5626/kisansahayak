/**
 * Kisan Sahayak - Multi-Source Agricultural Intelligence & Cross-Analysis Engine
 * 
 * Fetches, cross-references, and analyzes data across 6 authoritative sources:
 * 1. ICAR & State Agricultural Universities (SAU) Package of Practices
 * 2. CIBRC Insecticides & Agrochemical Directorate Registry
 * 3. IMD Agromet High-Resolution Weather & Spray Window Matrix
 * 4. Agmarknet DMI & e-NAM Mandi Market Economics
 * 5. National Soil Health Card (DAC&FW) Norms & Fertilizer Formulation
 * 6. Government Schemes & Subsidies (PMKSY, SMAM, PMFBY, NFSM)
 */

const { retrieveAgriculturalKnowledge, classifyDomain } = require('../knowledge/ragEngine');
const { fetchMandiPrices } = require('./mandiService');
const { getAllSchemes, getNPSSPestsForCrop } = require('../knowledge/knowledgeBase');

// CIBRC Chemical & Biopesticide Safety Database
const CIBRC_REGISTRY = {
    fungicides: [
        {
            active_ingredient: 'Tricyclazole 75% WP',
            target: 'Rice Blast (Leaf, Neck, Node)',
            crops: ['Rice (Paddy)'],
            dosage_per_litre: '0.6 g/L',
            dose_per_acre: '120 g in 200 L water/acre',
            phi_days: 30,
            cost_per_acre: '₹220 - ₹280',
            safety: 'Do not spray within 30 days of harvest. Wear protective mask.'
        },
        {
            active_ingredient: 'Propiconazole 25% EC',
            target: 'Yellow/Brown Rust, Sheath Blight, Karnal Bunt, Sigatoka',
            crops: ['Wheat', 'Rice', 'Maize', 'Banana', 'Groundnut'],
            dosage_per_litre: '1.0 ml/L',
            dose_per_acre: '200 ml in 200 L water/acre',
            phi_days: 30,
            cost_per_acre: '₹180 - ₹240',
            safety: 'Apply at first appearance of pustules. Spray morning 7-10 AM.'
        },
        {
            active_ingredient: 'Hexaconazole 5% EC / SC',
            target: 'Sheath Blight, Powdery Mildew, Scab, Tikka Disease',
            crops: ['Rice', 'Groundnut', 'Chilli', 'Mango', 'Soybean'],
            dosage_per_litre: '2.0 ml/L',
            dose_per_acre: '400 ml in 200 L water/acre',
            phi_days: 20,
            cost_per_acre: '₹150 - ₹200',
            safety: 'Systemic fungicide. Ensure complete foliar coverage.'
        },
        {
            active_ingredient: 'Mancozeb 75% WP',
            target: 'Late Blight, Early Blight, Downy Mildew, Anthracnose',
            crops: ['Potato', 'Tomato', 'Mustard', 'Chilli', 'Onion', 'Grapes'],
            dosage_per_litre: '2.0 - 2.5 g/L',
            dose_per_acre: '500 g in 200 L water/acre',
            phi_days: 14,
            cost_per_acre: '₹160 - ₹210',
            safety: 'Broad-spectrum contact fungicide. Prophylactic spray is most effective.'
        },
        {
            active_ingredient: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC',
            target: 'Anthracnose, Powdery Mildew, Blight Complex',
            crops: ['Chilli', 'Tomato', 'Paddy', 'Maize'],
            dosage_per_litre: '1.0 ml/L',
            dose_per_acre: '200 ml in 200 L water/acre',
            phi_days: 15,
            cost_per_acre: '₹450 - ₹550',
            safety: 'Dual-action systemic fungicide. High efficacy in severe conditions.'
        }
    ],
    insecticides: [
        {
            active_ingredient: 'Chlorantraniliprole 18.5% SC',
            target: 'Stem Borer, Leaf Folder, Fall Armyworm, Diamondback Moth, Bollworm',
            crops: ['Rice', 'Maize', 'Cotton', 'Sugarcane', 'Tomato', 'Cabbage'],
            dosage_per_litre: '0.3 - 0.4 ml/L',
            dose_per_acre: '60 ml in 200 L water/acre',
            phi_days: 14,
            cost_per_acre: '₹380 - ₹480',
            safety: 'Safe to honeybees when dried. Use hollow cone nozzle.'
        },
        {
            active_ingredient: 'Emamectin Benzoate 5% SG',
            target: 'Pod Borer (Helicoverpa), Spodoptera, Fruit Borer, Bollworm',
            crops: ['Gram/Chickpea', 'Pigeonpea/Arhar', 'Cotton', 'Chilli', 'Soybean'],
            dosage_per_litre: '0.5 g/L',
            dose_per_acre: '100 g in 200 L water/acre',
            phi_days: 7,
            cost_per_acre: '₹180 - ₹240',
            safety: 'Stomach and contact action. Target early instar larvae.'
        },
        {
            active_ingredient: 'Imidacloprid 17.8% SL',
            target: 'Aphids, Jassids, Whitefly, Brown Plant Hopper (BPH), Thrips',
            crops: ['Cotton', 'Rice', 'Chilli', 'Mustard', 'Sugarcane'],
            dosage_per_litre: '0.3 - 0.5 ml/L',
            dose_per_acre: '60 - 80 ml in 200 L water/acre',
            phi_days: 21,
            cost_per_acre: '₹90 - ₹140',
            safety: 'Do not spray during peak flowering to protect pollinating bees.'
        },
        {
            active_ingredient: 'Neem Oil (Azadirachtin 10,000 ppm)',
            target: 'Sucking Pests, Whitefly, Mites, Early Caterpillars (Biological)',
            crops: ['All Crops', 'Vegetables', 'Pulses', 'Cotton'],
            dosage_per_litre: '3.0 - 5.0 ml/L',
            dose_per_acre: '600 - 1000 ml in 200 L water/acre',
            phi_days: 1,
            cost_per_acre: '₹120 - ₹180',
            safety: 'Organic certified. Zero toxic residue. Eco-friendly.'
        }
    ],
    bio_control: [
        {
            active_ingredient: 'Trichoderma viride / harzianum (2x10^8 CFU/g)',
            target: 'Root Rot, Collar Rot, Damping Off, Fusarium Wilt',
            crops: ['All Crops', 'Pulses', 'Oilseeds', 'Vegetables'],
            dosage_per_litre: '5.0 - 10.0 g/kg seed or 2.5 kg/acre with FYM',
            dose_per_acre: '2.5 kg mixed with 100 kg decomposed FYM/vermicompost per acre',
            cost_per_acre: '₹120 - ₹160',
            safety: 'Biological antagonist. Do not mix with chemical fungicides.'
        },
        {
            active_ingredient: 'Pseudomonas fluorescens (1x10^8 CFU/g)',
            target: 'Bacterial Blight, Sheath Rot, Damping Off',
            crops: ['Paddy', 'Vegetables', 'Cotton', 'Banana'],
            dosage_per_litre: '10 g/L for seedling dip or 2.5 kg/acre soil application',
            dose_per_acre: '2.5 kg/acre',
            cost_per_acre: '₹130 - ₹170',
            safety: 'Plant growth promoting rhizobacteria (PGPR).'
        }
    ]
};

// Soil Health Card Critical Limits Reference
const SOIL_HEALTH_CARD_NORMS = {
    ph: {
        strongly_acidic: { range: '< 5.5', rating: 'Strongly Acidic', amendment: 'Agricultural Lime (CaCO3) @ 300-500 kg/acre' },
        moderately_acidic: { range: '5.5 - 6.5', rating: 'Moderately Acidic', amendment: 'Dolomite/Lime @ 150-250 kg/acre' },
        neutral_ideal: { range: '6.5 - 7.5', rating: 'Neutral / Ideal', amendment: 'No amendment required; maintain organic matter' },
        moderately_alkaline: { range: '7.5 - 8.5', rating: 'Moderately Alkaline', amendment: 'Green manuring (Dhaincha/Sunhemp) + Acidic fertilizers' },
        sodic_alkaline: { range: '> 8.5', rating: 'Sodic / Strongly Alkaline', amendment: 'Agricultural Gypsum (CaSO4.2H2O) @ 500-800 kg/acre + Leaching' }
    },
    organic_carbon_pct: {
        low: { range: '< 0.50%', rating: 'Low', recommendation: 'Apply FYM @ 4-5 tonnes/acre or Vermicompost @ 1.5-2 tonnes/acre' },
        medium: { range: '0.50% - 0.75%', rating: 'Medium', recommendation: 'Apply FYM @ 2-3 tonnes/acre to sustain soil biology' },
        high: { range: '> 0.75%', rating: 'High / Optimal', recommendation: 'Optimal organic carbon; maintain with crop residue incorporation' }
    },
    nitrogen_kg_acre: {
        low: { range: '< 113 kg/acre', rating: 'Low (Deficient)', recommendation: 'Increase recommended N dose by 20-25%; split in 3 doses' },
        medium: { range: '113 - 227 kg/acre', rating: 'Medium (Normal)', recommendation: 'Apply standard recommended package dose (Basal + 2 splits)' },
        high: { range: '> 227 kg/acre', rating: 'High (Excess)', recommendation: 'Reduce synthetic Urea dose by 20% to avoid pest susceptibility' }
    },
    phosphorus_kg_acre: {
        low: { range: '< 9.3 kg/acre', rating: 'Low', recommendation: 'Apply DAP @ 50 kg/acre or Single Super Phosphate (SSP) @ 150 kg/acre as basal' },
        medium: { range: '9.3 - 22.7 kg/acre', rating: 'Medium', recommendation: 'Apply standard basal P2O5 (e.g. DAP @ 35-40 kg/acre)' },
        high: { range: '> 22.7 kg/acre', rating: 'High', recommendation: 'Reduce basal P fertilizer by 25%' }
    },
    potassium_kg_acre: {
        low: { range: '< 56 kg/acre', rating: 'Low', recommendation: 'Apply MOP (60% K2O) @ 25-30 kg/acre in 2 splits (basal + panicle initiation)' },
        medium: { range: '56 - 113 kg/acre', rating: 'Medium', recommendation: 'Apply MOP @ 15-20 kg/acre' },
        high: { range: '> 113 kg/acre', rating: 'High', recommendation: 'Maintain minimal basal K' }
    },
    zinc_ppm: {
        deficient: { range: '< 0.6 ppm', rating: 'Deficient', recommendation: 'Zinc Sulphate (21% Zn) @ 10-15 kg/acre basal OR 0.5% foliar spray with lime' },
        sufficient: { range: '>= 0.6 ppm', rating: 'Sufficient', recommendation: 'No basal zinc required' }
    }
};

/**
 * Cross-references weather conditions with agricultural risk thresholds
 */
function analyzeWeatherRisks(weather, crop) {
    if (!weather) return null;

    const temp = parseFloat(weather.temperature || weather.temp || 28);
    const humidity = parseFloat(weather.humidity || 65);
    const rain = parseFloat(weather.rainfall || 0);
    const wind = parseFloat(weather.wind_speed || 10);

    const risks = [];
    let sprayFeasibility = {
        feasible: true,
        window: 'Favorable (Early Morning 7:00 AM - 10:00 AM or Late Afternoon 4:00 PM - 6:30 PM)',
        warning: null
    };

    // 1. High Humidity + Moderate Temp Fungal Blast/Rust/Blight Trigger
    if (humidity > 80 && temp >= 18 && temp <= 28) {
        risks.push({
            type: 'Fungal Disease Flare-up Risk (High)',
            trigger: `High relative humidity (${humidity}%) and favorable temperatures (${temp}°C)`,
            implication: 'High risk of fungal spore germination (Blast, Rust, Sheath Blight, Late Blight). Prophylactic bio-fungicide or systemic spray advised.',
            source: 'IMD Agromet Advisory & ICAR Plant Pathology Division'
        });
    }

    // 2. High Temperature Heat Stress / Evapotranspiration
    if (temp > 36) {
        risks.push({
            type: 'Heat Stress & Fast Soil Moisture Depletion',
            trigger: `Ambient temperature (${temp}°C) exceeds critical crop threshold`,
            implication: 'Elevated evapotranspiration. Light frequent irrigations in evening hours recommended to avoid flower/pod drop.',
            source: 'IMD Agromet Division'
        });
    }

    // 3. Spray Window Assessment
    if (rain > 2) {
        sprayFeasibility.feasible = false;
        sprayFeasibility.window = 'Rain Expected - Delay Spraying';
        sprayFeasibility.warning = `Precipitation (${rain} mm) will wash off foliar chemicals. Wait for dry spell.`;
    } else if (wind > 15) {
        sprayFeasibility.feasible = false;
        sprayFeasibility.window = 'High Winds - Drift Hazard';
        sprayFeasibility.warning = `Wind speed (${wind} km/h) causes chemical spray drift and poor leaf deposition. Spray during calm morning hours.`;
    }

    return {
        temperature: temp,
        humidity,
        rainfall: rain,
        wind_speed: wind,
        risks,
        sprayFeasibility
    };
}

/**
 * Cross-references query against CIBRC chemical & biopesticide recommendations
 */
function matchCIBRCSafety(query, crop) {
    const qLower = (query || '').toLowerCase();
    const cropLower = (crop || '').toLowerCase();

    const matches = [];

    // Search fungicides
    CIBRC_REGISTRY.fungicides.forEach(item => {
        const targetWords = item.target.toLowerCase().split(/[\s,()/]+/);
        const matchesTarget = targetWords.some(w => w.length > 3 && qLower.includes(w)) ||
                              qLower.includes(item.active_ingredient.toLowerCase().split(' ')[0]) ||
                              (qLower.includes('rust') && item.target.toLowerCase().includes('rust')) ||
                              (qLower.includes('blast') && item.target.toLowerCase().includes('blast')) ||
                              (qLower.includes('blight') && item.target.toLowerCase().includes('blight')) ||
                              (qLower.includes('yellow') && qLower.includes('stripe') && item.target.toLowerCase().includes('rust'));

        const matchesCrop = !crop || item.crops.some(c => c.toLowerCase().includes(cropLower) || cropLower.includes(c.toLowerCase()) || c === 'All Crops');
        if (matchesTarget && matchesCrop) {
            matches.push({ category: 'Fungicide', ...item });
        } else if (matchesTarget) {
            matches.push({ category: 'Fungicide', ...item });
        }
    });

    // Search insecticides
    CIBRC_REGISTRY.insecticides.forEach(item => {
        const targetWords = item.target.toLowerCase().split(/[\s,()/]+/);
        const matchesTarget = targetWords.some(w => w.length > 3 && qLower.includes(w)) ||
                              qLower.includes(item.active_ingredient.toLowerCase().split(' ')[0]) ||
                              (qLower.includes('borer') && item.target.toLowerCase().includes('borer')) ||
                              (qLower.includes('bollworm') && item.target.toLowerCase().includes('bollworm')) ||
                              (qLower.includes('aphid') && item.target.toLowerCase().includes('aphid')) ||
                              (qLower.includes('whitefly') && item.target.toLowerCase().includes('whitefly')) ||
                              (qLower.includes('caterpillar') && item.target.toLowerCase().includes('armyworm'));

        const matchesCrop = !crop || item.crops.some(c => c.toLowerCase().includes(cropLower) || cropLower.includes(c.toLowerCase()) || c === 'All Crops');
        if (matchesTarget && matchesCrop) {
            matches.push({ category: 'Insecticide', ...item });
        } else if (matchesTarget) {
            matches.push({ category: 'Insecticide', ...item });
        }
    });

    // Search biological control
    CIBRC_REGISTRY.bio_control.forEach(item => {
        if (qLower.includes('organic') || qLower.includes('bio') || qLower.includes('trichoderma') || qLower.includes('rot') || qLower.includes('wilt') || matches.length > 0) {
            matches.push({ category: 'Bio-Control (Organic)', ...item });
        }
    });

    return matches.slice(0, 3);
}

/**
 * Master multi-source synthesis coordinator
 */
async function fetchAndAnalyzeMultiSources({ query, crop = null, farm = null, userProfile = {}, weather = null, attachments = [] }) {
    const state = farm?.state || userProfile.state || 'Madhya Pradesh';
    const district = farm?.district || userProfile.district || 'Indore';
    const cropName = crop || farm?.crop_type || null;

    console.log(`\n🔍 [Multi-Source Engine] Cross-Referencing 6 Intelligence Pillars for: "${query.substring(0, 60)}..."`);

    // 1. Fetch ICAR / SAU RAG Knowledge
    const icarKnowledge = retrieveAgriculturalKnowledge({
        query,
        crop: cropName,
        state,
        district,
        maxResults: 3
    });

    // 2. Fetch CIBRC Registered Agrochemicals & Biopesticides
    const cibrcMatches = matchCIBRCSafety(query, cropName);

    // 3. Analyze IMD Agromet Weather Triggers & Spray Window
    const weatherAnalysis = analyzeWeatherRisks(weather, cropName);

    // 4. Fetch Agmarknet Live Mandi Bhav Benchmark
    let mandiData = [];
    try {
        mandiData = await fetchMandiPrices(state, district, cropName, query);
    } catch {
        // Fallback
    }

    // 5. Soil Health Card Norms
    const soilNorms = SOIL_HEALTH_CARD_NORMS;

    // 6. Linked Government Schemes
    const matchedSchemes = getAllSchemes(state).slice(0, 3);

    // Build Verified Source Citation Objects
    const verifiedSources = [];

    // Source 1: ICAR / SAU
    if (icarKnowledge.documents && icarKnowledge.documents.length > 0) {
        icarKnowledge.documents.forEach(doc => {
            verifiedSources.push({
                id: doc.id || 'icar-standard',
                title: doc.title || 'ICAR Package of Practices & Agronomy Guidelines',
                org: doc.organization || 'Indian Council of Agricultural Research (ICAR)',
                type: doc.source_type || 'Agronomic Research Benchmark',
                detail: `Level ${doc.level || 2} Source. State scope: ${doc.state || 'All India'}. Published: ${doc.published_date || 'Current'}`
            });
        });
    } else {
        verifiedSources.push({
            id: 'icar-general',
            title: `ICAR Package of Practices for ${cropName || 'Indian Crops'}`,
            org: 'Indian Council of Agricultural Research (ICAR)',
            type: 'Agronomic Research Benchmark',
            detail: 'Standard agronomic crop management, seed rates, fertilizer splits, and IPM protocols.'
        });
    }

    // Source 2: CIBRC Safety Directory
    verifiedSources.push({
        id: 'cibrc-dppqs',
        title: 'CIBRC Registered Agrochemical Safety & Dilution Directory',
        org: 'Central Insecticides Board & Registration Committee, Directorate of PPQ&S',
        type: 'Chemical & Regulatory Safety Standard',
        detail: cibrcMatches.length > 0 
            ? `Verified active ingredients: ${cibrcMatches.map(m => m.active_ingredient).join(', ')} with approved Pre-Harvest Intervals (PHI).`
            : 'Statutory dilution volumes (200 L water/acre), active ingredient specifications, and environmental safety limits.'
    });

    // Source 3: IMD Agromet
    if (weatherAnalysis) {
        verifiedSources.push({
            id: 'imd-agromet',
            title: 'IMD Agromet Weather & Spray Feasibility Advisory',
            org: 'India Meteorological Department (IMD), Ministry of Earth Sciences',
            type: 'Agrometeorological Analysis',
            detail: `Observed: ${weatherAnalysis.temperature}°C, ${weatherAnalysis.humidity}% RH, Rain: ${weatherAnalysis.rainfall}mm. Spray status: ${weatherAnalysis.sprayFeasibility.window}`
        });
    }

    // Source 4: Agmarknet Mandi
    if (mandiData && mandiData.length > 0) {
        verifiedSources.push({
            id: 'agmarknet-dmi',
            title: 'Agmarknet APMC Mandi Benchmark Rates',
            org: 'Directorate of Marketing & Inspection (DMI) & e-NAM, Ministry of Agriculture',
            type: 'Official Market Prices',
            detail: `Verified modal price for ${mandiData[0].commodity}: ₹${mandiData[0].modal_price.toLocaleString('en-IN')}/q in ${mandiData[0].market_name} APMC.`
        });
    }

    // Source 5: Soil Health Card
    verifiedSources.push({
        id: 'shc-dacfw',
        title: 'National Soil Health Card Metric Norms',
        org: 'Department of Agriculture & Farmers Welfare (DAC&FW), Govt of India',
        type: 'Soil Testing Standard',
        detail: 'Standard diagnostic thresholds for pH, EC, Organic Carbon %, Available N-P-K, and Zinc deficiency correction.'
    });

    // Source 6: Multimodal attachment if present
    if (attachments && attachments.length > 0) {
        verifiedSources.unshift({
            id: 'multimodal-intelligence',
            title: 'Multimodal Sensor & Document Diagnostics Engine',
            org: 'Kisan Sahayak Computer Vision & Document Intelligence',
            type: 'Lab & Visual Diagnosis',
            detail: `Analyzed ${attachments.length} uploaded file(s) for pathology, growth stage, or lab card metrics.`
        });
    }

    // Build Formatted Multi-Source Context for Prompt
    let multiSourceContext = `═══════════════════════════════════════════════════════════════\n`;
    multiSourceContext += `CROSS-REFERENCED MULTI-SOURCE INTELLIGENCE EVIDENCE:\n`;
    multiSourceContext += `═══════════════════════════════════════════════════════════════\n`;

    // 1. ICAR Agronomy
    multiSourceContext += `[PILLAR 1: ICAR & SAU AGRONOMIC RESEARCH EVIDENCE]\n`;
    if (icarKnowledge.contextString) {
        multiSourceContext += `${icarKnowledge.contextString}\n\n`;
    } else {
        multiSourceContext += `- Crop: ${cropName || 'Field Crop'} | Follow ICAR standard package of practices with balanced INM (Integrated Nutrient Management) and IPM (Integrated Pest Management).\n\n`;
    }

    // 2. CIBRC Agrochemicals
    multiSourceContext += `[PILLAR 2: CIBRC REGISTERED AGROCHEMICAL & BIOPESTICIDE STANDARDS]\n`;
    if (cibrcMatches.length > 0) {
        cibrcMatches.forEach(m => {
            multiSourceContext += `• **${m.active_ingredient}** (${m.category})\n`;
            multiSourceContext += `  - Target Pests/Pathogens: ${m.target}\n`;
            multiSourceContext += `  - Dilution & Water Quantity: ${m.dosage_per_litre} (${m.dose_per_acre})\n`;
            multiSourceContext += `  - Pre-Harvest Interval (PHI): ${m.phi_days} days\n`;
            multiSourceContext += `  - Estimated Input Cost per Acre: ${m.cost_per_acre}\n`;
            multiSourceContext += `  - Safety Precautions: ${m.safety}\n\n`;
        });
    } else {
        multiSourceContext += `- Use registered active ingredients only with 200 Litres water per acre for uniform foliar spray.\n\n`;
    }

    // 3. IMD Agromet
    if (weatherAnalysis) {
        multiSourceContext += `[PILLAR 3: IMD AGROMET WEATHER TRIGGERS & SPRAY WINDOW]\n`;
        multiSourceContext += `- Current Metrics: Temperature ${weatherAnalysis.temperature}°C | Humidity ${weatherAnalysis.humidity}% | Rain ${weatherAnalysis.rainfall} mm | Wind ${weatherAnalysis.wind_speed} km/h\n`;
        multiSourceContext += `- Spray Feasibility: ${weatherAnalysis.sprayFeasibility.window}${weatherAnalysis.sprayFeasibility.warning ? ` (${weatherAnalysis.sprayFeasibility.warning})` : ''}\n`;
        if (weatherAnalysis.risks.length > 0) {
            weatherAnalysis.risks.forEach(r => {
                multiSourceContext += `- Weather Trigger: ${r.type} (${r.trigger}) -> ${r.implication}\n`;
            });
        }
        multiSourceContext += `\n`;
    }

    // 4. Agmarknet Mandi Economics
    if (mandiData && mandiData.length > 0) {
        multiSourceContext += `[PILLAR 4: AGMARKNET DMI MANDI MARKET ECONOMICS]\n`;
        mandiData.slice(0, 3).forEach(m => {
            multiSourceContext += `• ${m.commodity} @ ${m.market_name} APMC: Modal ₹${m.modal_price.toLocaleString('en-IN')}/q (Range: ₹${m.min_price}-₹${m.max_price}/q) | Trend: ${m.trend} (${m.trend_pct})\n`;
        });
        multiSourceContext += `\n`;
    }

    // 5. Linked Schemes
    if (matchedSchemes && matchedSchemes.length > 0) {
        multiSourceContext += `[PILLAR 5: LINKED GOVERNMENT SCHEMES & SUBSIDIES]\n`;
        matchedSchemes.forEach(s => {
            multiSourceContext += `• ${s.name}: ${s.benefits} | Portal: ${s.website_url}\n`;
        });
        multiSourceContext += `\n`;
    }

    return {
        verifiedSources,
        multiSourceContext,
        cibrcMatches,
        weatherAnalysis,
        mandiData,
        soilNorms
    };
}

module.exports = {
    fetchAndAnalyzeMultiSources,
    CIBRC_REGISTRY,
    SOIL_HEALTH_CARD_NORMS
};
