/**
 * Kisan Sahayak — NPK Estimation Engine
 * 
 * Loads 4 agricultural CSV datasets at startup and uses weighted
 * nearest-neighbor matching to estimate N, P, K, pH from IoT
 * sensor readings (moisture, temperature, humidity) + context
 * (soil type, crop type).
 * 
 * Datasets:
 *   1. sensor_Crop_Dataset.csv  (20K rows) — Main NPK/crop/environment model
 *   2. data_core.csv            (8K rows)  — Fertilizer recommendation model
 *   3. Crop_recommendationV2.csv (2.2K rows) — Irrigation + broader advisory
 *   4. AgriNet_Dataset.csv      — Soil-fertility reference/validation
 */

const fs = require('fs');
const path = require('path');

// ─── CSV Parser (lightweight, no external deps) ───────────────────────────────
function parseCSV(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const lines = raw.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length < headers.length) continue;
            const row = {};
            headers.forEach((h, idx) => {
                const val = (values[idx] || '').trim();
                const isNumeric = /^-?\d+(\.\d+)?$/.test(val);
                row[h] = isNumeric ? parseFloat(val) : val;
            });
            rows.push(row);
        }
        return rows;
    } catch (err) {
        console.warn(`[NPK Engine] Failed to load ${filePath}:`, err.message);
        return [];
    }
}

// ─── Load Datasets ───────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'data');

let sensorCropData = [];   // sensor_Crop_Dataset.csv
let dataCoreData = [];     // data_core.csv (fertilizer mapping)
let cropRecData = [];      // Crop_recommendationV2.csv
let agriNetData = [];      // AgriNet_Dataset.csv

function loadAllDatasets() {
    const t0 = Date.now();

    sensorCropData = parseCSV(path.join(DATA_DIR, 'sensor_Crop_Dataset.csv'));
    dataCoreData = parseCSV(path.join(DATA_DIR, 'data_core.csv'));
    cropRecData = parseCSV(path.join(DATA_DIR, 'Crop_recommendationV2.csv'));
    agriNetData = parseCSV(path.join(DATA_DIR, 'AgriNet_Dataset.csv'));

    const elapsed = Date.now() - t0;
    console.log(`\n🧪 NPK Estimation Engine Loaded:`);
    console.log(`   📊 sensor_Crop_Dataset: ${sensorCropData.length} rows`);
    console.log(`   📊 data_core:           ${dataCoreData.length} rows`);
    console.log(`   📊 Crop_recommendationV2: ${cropRecData.length} rows`);
    console.log(`   📊 AgriNet_Dataset:      ${agriNetData.length} rows`);
    console.log(`   ⏱️  Loaded in ${elapsed}ms\n`);
}

// Load immediately on require
loadAllDatasets();

// ─── Normalization Helpers ───────────────────────────────────────────────────
function norm(str) {
    return (str || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

// Weighted distance calculation (lower = closer match)
function weightedDistance(query, row, weights) {
    let dist = 0;
    for (const [key, weight] of Object.entries(weights)) {
        const qVal = query[key];
        const rVal = row[key];
        if (qVal === undefined || rVal === undefined || qVal === null || rVal === null) continue;

        if (typeof qVal === 'number' && typeof rVal === 'number') {
            // Normalize numeric distance by typical range
            const range = weight.range || 100;
            dist += weight.w * Math.pow((qVal - rVal) / range, 2);
        } else {
            // String matching — 0 if match, 1 if not
            dist += weight.w * (norm(String(qVal)) === norm(String(rVal)) ? 0 : 1);
        }
    }
    return dist;
}

// ─── 1. Estimate NPK from IoT Sensor Data ──────────────────────────────────
/**
 * Given IoT sensor readings + context, estimate N, P, K, pH
 * Uses nearest-neighbor matching across sensor_Crop_Dataset and Crop_recommendationV2
 * 
 * @param {Object} params
 * @param {number} params.moisture - Soil moisture 0-100%
 * @param {number} [params.temperature] - Temperature °C (default 28)
 * @param {number} [params.humidity] - Air humidity % (default 65)
 * @param {string} [params.soilType] - Soil type (Clay, Sandy, Loamy, etc.)
 * @param {string} [params.cropType] - Crop name (Wheat, Rice, etc.)
 * @returns {Object} { nitrogen, phosphorus, potassium, pH, confidence, matchedCrop, sources }
 */
function estimateNPK({ moisture, temperature = 28, humidity = 65, soilType = '', cropType = '' }) {
    const query = {
        Moisture: moisture,
        Temperature: temperature,
        Humidity: humidity,
        Soil_Type: soilType,
        Crop: cropType
    };

    // ── Search sensor_Crop_Dataset (N, P, K, Temperature, Humidity, pH_Value, Crop, Soil_Type) ──
    const sensorWeights = {
        Temperature: { w: 1.0, range: 40 },
        Humidity:    { w: 1.2, range: 100 },
        Soil_Type:   { w: 2.0 },
        Crop:        { w: 2.5 }
    };

    let sensorMatches = sensorCropData.map(row => ({
        ...row,
        _dist: weightedDistance(
            { Temperature: temperature, Humidity: humidity, Soil_Type: soilType, Crop: cropType },
            { Temperature: row.Temperature, Humidity: row.Humidity, Soil_Type: row.Soil_Type || row.SoilType, Crop: row.Crop },
            sensorWeights
        )
    }));
    sensorMatches.sort((a, b) => a._dist - b._dist);
    const topSensor = sensorMatches.slice(0, 10);

    // ── Search Crop_recommendationV2 (N, P, K, temperature, humidity, ph, soil_moisture, label) ──
    const cropRecWeights = {
        soil_moisture: { w: 2.0, range: 100 },
        temperature:   { w: 1.0, range: 40 },
        humidity:      { w: 1.0, range: 100 },
        label:         { w: 2.5 }
    };

    let cropRecMatches = cropRecData.map(row => ({
        ...row,
        _dist: weightedDistance(
            { soil_moisture: moisture, temperature, humidity, label: cropType },
            row,
            cropRecWeights
        )
    }));
    cropRecMatches.sort((a, b) => a._dist - b._dist);
    const topCropRec = cropRecMatches.slice(0, 10);

    // ── Aggregate: weighted average of top matches ──
    function weightedAvg(items, key, distKey = '_dist') {
        let sum = 0, wSum = 0;
        items.forEach(item => {
            const val = parseFloat(item[key]);
            if (isNaN(val)) return;
            const w = 1 / (item[distKey] + 0.001); // inverse distance weighting
            sum += val * w;
            wSum += w;
        });
        return wSum > 0 ? Math.round(sum / wSum * 10) / 10 : null;
    }

    // Sensor dataset uses: Nitrogen, Phosphorus, Potassium, pH_Value
    const sensorN = weightedAvg(topSensor, 'Nitrogen');
    const sensorP = weightedAvg(topSensor, 'Phosphorus');
    const sensorK = weightedAvg(topSensor, 'Potassium');
    const sensorPH = weightedAvg(topSensor, 'pH_Value');

    // CropRec dataset uses: N, P, K, ph
    const cropN = weightedAvg(topCropRec, 'N');
    const cropP = weightedAvg(topCropRec, 'P');
    const cropK = weightedAvg(topCropRec, 'K');
    const cropPH = weightedAvg(topCropRec, 'ph');

    // Blend both sources (sensor dataset has more rows, weight it higher)
    const blend = (a, b, wA = 0.6, wB = 0.4) => {
        if (a !== null && b !== null) return Math.round((a * wA + b * wB) * 10) / 10;
        return a || b || 0;
    };

    const nitrogen = blend(sensorN, cropN);
    const phosphorus = blend(sensorP, cropP);
    const potassium = blend(sensorK, cropK);
    const pH = blend(sensorPH, cropPH);

    // Confidence based on distance of best match
    const bestDist = Math.min(
        topSensor[0]?._dist ?? 999,
        topCropRec[0]?._dist ?? 999
    );
    const confidence = Math.max(0.3, Math.min(0.95, 1 - bestDist / 5));

    // Determine level labels
    const nLevel = nitrogen < 150 ? 'Low' : nitrogen < 300 ? 'Medium' : 'High';
    const pLevel = phosphorus < 20 ? 'Low' : phosphorus < 50 ? 'Medium' : 'High';
    const kLevel = potassium < 150 ? 'Low' : potassium < 300 ? 'Medium' : 'High';
    const phLevel = pH < 6.0 ? 'Acidic' : pH < 7.5 ? 'Neutral' : 'Alkaline';

    return {
        nitrogen: { value: nitrogen, unit: 'kg/ha', level: nLevel },
        phosphorus: { value: phosphorus, unit: 'kg/ha', level: pLevel },
        potassium: { value: potassium, unit: 'kg/ha', level: kLevel },
        pH: { value: pH, level: phLevel },
        confidence: Math.round(confidence * 100) / 100,
        matchedCrop: topSensor[0]?.Crop || topCropRec[0]?.label || cropType || 'General',
        matchedSoilType: topSensor[0]?.Soil_Type || soilType || 'Loamy',
        irrigationAdvice: getIrrigationAdvice(moisture, topCropRec[0]),
        sources: {
            sensor_dataset_matches: topSensor.length,
            crop_rec_matches: topCropRec.length
        }
    };
}

// ─── Irrigation Advice from Moisture ────────────────────────────────────────
function getIrrigationAdvice(moisture, cropMatch) {
    if (moisture < 15) return { status: 'Critical', action: 'Irrigate immediately! Crop is under severe water stress.', icon: '🔴' };
    if (moisture < 25) return { status: 'Very Dry', action: 'Urgent irrigation needed within 4-6 hours to prevent yield loss.', icon: '🟠' };
    if (moisture < 40) return { status: 'Dry', action: 'Schedule irrigation today. Apply 2-3 cm water depth.', icon: '🟡' };
    if (moisture < 65) return { status: 'Optimal', action: 'Moisture is ideal. No immediate irrigation needed.', icon: '🟢' };
    if (moisture < 80) return { status: 'Moist', action: 'Adequate moisture. Monitor drainage to prevent waterlogging.', icon: '🔵' };
    return { status: 'Waterlogged', action: 'Stop irrigation! Ensure drainage channels are clear to prevent root rot.', icon: '⚠️' };
}

// ─── 2. Recommend Fertilizer from data_core.csv ─────────────────────────────
/**
 * Given NPK values + context, find the best matching fertilizer from data_core.csv
 * 
 * data_core.csv columns: Temparature, Humidity, Moisture, Soil Type, Crop Type, 
 *                         Nitrogen, Potassium, Phosphorous, Fertilizer Name
 */
function recommendFertilizer({ nitrogen, phosphorus, potassium, moisture, temperature = 28, humidity = 65, soilType = '', cropType = '' }) {
    if (dataCoreData.length === 0) {
        return { fertilizer: 'DAP + Urea (General)', confidence: 0.5, alternatives: [] };
    }

    const weights = {
        Nitrogen:    { w: 2.0, range: 200 },
        Phosphorous: { w: 2.0, range: 100 },
        Potassium:   { w: 2.0, range: 300 },
        Moisture:    { w: 1.5, range: 100 },
        Temparature: { w: 0.8, range: 40 },
        Humidity:    { w: 0.8, range: 100 },
        'Soil Type': { w: 1.5 },
        'Crop Type': { w: 2.5 }
    };

    const query = {
        Nitrogen: nitrogen,
        Phosphorous: phosphorus,
        Potassium: potassium,
        Moisture: moisture,
        Temparature: temperature,
        Humidity: humidity,
        'Soil Type': soilType,
        'Crop Type': cropType
    };

    let matches = dataCoreData.map(row => ({
        ...row,
        _dist: weightedDistance(query, row, weights)
    }));
    matches.sort((a, b) => a._dist - b._dist);

    const top5 = matches.slice(0, 5);
    const primaryFertilizer = top5[0]?.['Fertilizer Name'] || 'DAP + Urea';

    // Collect unique alternatives
    const alternatives = [...new Set(top5.map(m => m['Fertilizer Name']).filter(f => f && f !== primaryFertilizer))].slice(0, 3);

    const conf = Math.max(0.4, Math.min(0.95, 1 - (top5[0]?._dist || 2) / 4));

    // ICAR dosage calculations
    const dosage = calculateICARDosage(nitrogen, phosphorus, potassium, cropType);

    return {
        fertilizer: primaryFertilizer,
        confidence: Math.round(conf * 100) / 100,
        alternatives,
        dosage,
        matchedCrop: top5[0]?.['Crop Type'] || cropType,
        matchedSoilType: top5[0]?.['Soil Type'] || soilType
    };
}

// ─── ICAR-Grounded Dosage Calculation ───────────────────────────────────────
function calculateICARDosage(N, P, K, cropType) {
    // Standard subsidized prices (NBS 2025-26)
    const prices = {
        urea: { perBag: 266, bagKg: 45, nContent: 0.46 },     // 46% N
        dap:  { perBag: 1350, bagKg: 50, nContent: 0.18, pContent: 0.46 }, // 18% N + 46% P2O5
        mop:  { perBag: 1700, bagKg: 50, kContent: 0.60 },     // 60% K2O
        ssp:  { perBag: 450, bagKg: 50, pContent: 0.16 },      // 16% P2O5
    };

    // Convert nutrient requirement to commercial bags (per acre)
    const nReqPerAcre = Math.round(N * 0.4); // kg/ha → approx kg/acre
    const pReqPerAcre = Math.round(P * 0.4);
    const kReqPerAcre = Math.round(K * 0.4);

    // DAP bags needed (supplies both N and P)
    const dapBags = Math.max(0, Math.ceil(pReqPerAcre / (prices.dap.bagKg * prices.dap.pContent)));
    const nFromDAP = dapBags * prices.dap.bagKg * prices.dap.nContent;
    const remainingN = Math.max(0, nReqPerAcre - nFromDAP);
    const ureaBags = Math.max(0, Math.ceil(remainingN / (prices.urea.bagKg * prices.urea.nContent)));
    const mopBags = Math.max(0, Math.ceil(kReqPerAcre / (prices.mop.bagKg * prices.mop.kContent)));

    const totalCost = (dapBags * prices.dap.perBag) + (ureaBags * prices.urea.perBag) + (mopBags * prices.mop.perBag);

    return {
        perAcre: {
            dap: { bags: dapBags, kg: dapBags * prices.dap.bagKg, cost: dapBags * prices.dap.perBag },
            urea: { bags: ureaBags, kg: ureaBags * prices.urea.bagKg, cost: ureaBags * prices.urea.perBag },
            mop: { bags: mopBags, kg: mopBags * prices.mop.bagKg, cost: mopBags * prices.mop.perBag },
        },
        totalCostPerAcre: totalCost,
        schedule: [
            { stage: 'Basal (At Sowing)', items: `${dapBags > 0 ? dapBags + ' bag DAP' : ''} + ${mopBags > 0 ? mopBags + ' bag MOP' : ''} + ${Math.ceil(ureaBags / 2)} bag Urea` },
            { stage: '1st Top Dress (21 DAS)', items: `${Math.floor(ureaBags / 2)} bag Urea` },
            { stage: '2nd Top Dress (45 DAS)', items: 'Remaining Urea if any' }
        ]
    };
}

// ─── 3. Validate Against AgriNet (Soil Fertility Reference) ──────────────────
/**
 * Cross-reference estimated NPK against AgriNet dataset for fertility classification
 */
function validateWithAgriNet(N, P, K, pH) {
    if (agriNetData.length === 0) {
        return { fertilityClass: 'Medium', validated: false };
    }

    // Find closest match in AgriNet by NPK+pH
    let matches = agriNetData.map(row => {
        const dist = Math.pow((N - (row.N || 0)) / 200, 2) +
                     Math.pow((P - (row.P || 0)) / 50, 2) +
                     Math.pow((K - (row.K || 0)) / 300, 2) +
                     Math.pow(((pH || 7) - (row.pH || 7)) / 3, 2);
        return { ...row, _dist: dist };
    });
    matches.sort((a, b) => a._dist - b._dist);
    const top = matches.slice(0, 5);

    // Classify based on AgriNet reference ranges
    const avgOC = top.reduce((s, r) => s + (r.OC || 0.5), 0) / top.length;
    const avgEC = top.reduce((s, r) => s + (r.EC || 0.25), 0) / top.length;

    let fertilityClass = 'Medium';
    if (N > 280 && P > 25 && K > 250 && avgOC > 0.5) fertilityClass = 'High';
    else if (N < 150 || P < 10 || K < 120 || avgOC < 0.3) fertilityClass = 'Low';

    return {
        fertilityClass,
        validated: true,
        referenceOC: Math.round(avgOC * 100) / 100,
        referenceEC: Math.round(avgEC * 100) / 100,
        micronutrients: {
            zinc: { value: Math.round((top[0]?.Zn || 1.0) * 100) / 100, unit: 'ppm' },
            boron: { value: Math.round((top[0]?.B || 0.5) * 100) / 100, unit: 'ppm' },
            iron: { value: Math.round((top[0]?.Fe || 8.0) * 100) / 100, unit: 'ppm' },
            manganese: { value: Math.round((top[0]?.Mn || 2.0) * 100) / 100, unit: 'ppm' },
            copper: { value: Math.round((top[0]?.Cu || 0.4) * 100) / 100, unit: 'ppm' },
            sulphur: { value: Math.round((top[0]?.S || 13.0) * 100) / 100, unit: 'ppm' }
        }
    };
}

// ─── 4. Generate Comprehensive Combined Report ─────────────────────────────
function generateCombinedReport({ soilScanResults, iotData, farmContext }) {
    const moisture = iotData?.moisture ?? 45;
    const temperature = iotData?.temperature ?? farmContext?.temperature ?? 28;
    const humidity = iotData?.humidity ?? farmContext?.humidity ?? 65;
    const soilType = soilScanResults?.soilType || farmContext?.soilType || 'Loamy';
    const cropType = farmContext?.cropType || farmContext?.crop_type || 'Wheat';

    // 1. NPK Estimation from IoT data
    const npkEstimate = estimateNPK({ moisture, temperature, humidity, soilType, cropType });

    // 2. If soil scan also provided NPK, blend them
    let finalN = npkEstimate.nitrogen.value;
    let finalP = npkEstimate.phosphorus.value;
    let finalK = npkEstimate.potassium.value;
    let finalPH = npkEstimate.pH.value;

    if (soilScanResults?.nutrients) {
        const scanN = parseNutrientValue(soilScanResults.nutrients.nitrogen?.value);
        const scanP = parseNutrientValue(soilScanResults.nutrients.phosphorus?.value);
        const scanK = parseNutrientValue(soilScanResults.nutrients.potassium?.value);
        const scanPH = parseNutrientValue(soilScanResults.nutrients.pH?.value);

        if (scanN) finalN = Math.round((finalN * 0.4 + scanN * 0.6) * 10) / 10;
        if (scanP) finalP = Math.round((finalP * 0.4 + scanP * 0.6) * 10) / 10;
        if (scanK) finalK = Math.round((finalK * 0.4 + scanK * 0.6) * 10) / 10;
        if (scanPH) finalPH = Math.round((finalPH * 0.4 + scanPH * 0.6) * 10) / 10;
    }

    // 3. Fertilizer recommendation
    const fertRec = recommendFertilizer({
        nitrogen: finalN, phosphorus: finalP, potassium: finalK,
        moisture, temperature, humidity, soilType, cropType
    });

    // 4. AgriNet validation
    const agriValidation = validateWithAgriNet(finalN, finalP, finalK, finalPH);

    // 5. Overall status
    let overallStatus = 'Fair';
    let overallBadge = 'OK';
    if (agriValidation.fertilityClass === 'High') { overallStatus = 'Healthy'; overallBadge = 'GOOD'; }
    else if (agriValidation.fertilityClass === 'Low') { overallStatus = 'Needs Attention'; overallBadge = 'BAD'; }

    return {
        timestamp: new Date().toISOString(),
        overallStatus,
        overallBadge,
        soilType,
        cropType,

        // Sensor Data
        sensorData: {
            moisture,
            temperature,
            humidity,
            irrigationAdvice: npkEstimate.irrigationAdvice
        },

        // NPK Analysis (blended from IoT + soil scan)
        nutrients: {
            nitrogen: { value: finalN, unit: 'kg/ha', level: finalN < 150 ? 'Low' : finalN < 300 ? 'Medium' : 'High' },
            phosphorus: { value: finalP, unit: 'kg/ha', level: finalP < 20 ? 'Low' : finalP < 50 ? 'Medium' : 'High' },
            potassium: { value: finalK, unit: 'kg/ha', level: finalK < 150 ? 'Low' : finalK < 300 ? 'Medium' : 'High' },
            pH: { value: finalPH, level: finalPH < 6.0 ? 'Acidic' : finalPH < 7.5 ? 'Neutral' : 'Alkaline' },
            organicCarbon: { value: agriValidation.referenceOC || '—', unit: '%', level: (agriValidation.referenceOC || 0) < 0.4 ? 'Low' : 'Medium' }
        },

        // Micronutrients from AgriNet
        micronutrients: agriValidation.micronutrients,
        fertilityClass: agriValidation.fertilityClass,

        // Fertilizer Recommendation
        fertilizer: fertRec,

        // Confidence
        confidence: npkEstimate.confidence,

        // Data sources
        dataSources: {
            soilScan: !!soilScanResults,
            iotSensor: !!iotData,
            sensorDatasetMatches: npkEstimate.sources.sensor_dataset_matches,
            cropRecMatches: npkEstimate.sources.crop_rec_matches,
            agriNetValidated: agriValidation.validated
        }
    };
}

// Helper: parse "estimated 200-280 kg/ha" → midpoint 240
function parseNutrientValue(str) {
    if (!str || str === '—') return null;
    const nums = String(str).match(/[\d.]+/g);
    if (!nums || nums.length === 0) return null;
    const values = nums.map(Number).filter(n => !isNaN(n));
    return values.reduce((a, b) => a + b, 0) / values.length;
}

module.exports = {
    estimateNPK,
    recommendFertilizer,
    validateWithAgriNet,
    generateCombinedReport,
    loadAllDatasets
};
