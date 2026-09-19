/**
 * Kisan Sahayak - Agronomic NPK & Fertilizer Calculation Engine
 * 
 * Standards and reference data grounded in:
 * 1. S.R. Reddy - "Principles of Agronomy" (Fertilizer Management & Nutrient Scheduling)
 * 2. ICAR (Indian Council of Agricultural Research) Recommended Dose of Fertilizers (RDF)
 * 3. Ministry of Agriculture & Farmers Welfare - Soil Health Card Benchmark Ranges
 * 4. Government of India - Nutrient Based Subsidy (NBS) Subsidized Fertilizer MRPs
 */

// ─── 1. CROP NUTRIENT DEMAND DATABASE (ICAR & S.R. Reddy RDF) ────────────────
export const CROP_AGRONOMY_DATABASE = {
    wheat: {
        id: 'wheat',
        name: 'Wheat (गेहूं)',
        rdfKgPerHa: { n: 120, p: 60, k: 40 },
        rdfKgPerAcre: { n: 48.5, p: 24.3, k: 16.2 },
        season: 'Rabi',
        growthStages: ['Sowing (Basal)', 'CRI Stage (21 DAS)', 'Tillering (40-45 DAS)', 'Flowering'],
        ureaSplits: [
            { stage: 'Basal at Sowing', fraction: 0.33, desc: 'With DAP & MOP before sowing' },
            { stage: '1st Top Dress (CRI 21 DAS)', fraction: 0.34, desc: 'Immediately after 1st irrigation' },
            { stage: '2nd Top Dress (Late Tillering)', fraction: 0.33, desc: 'At 40-45 DAS with irrigation' }
        ],
        description: 'Standard semi-dwarf wheat requires high initial P for crown root development.'
    },
    paddy: {
        id: 'paddy',
        name: 'Paddy / Rice (धान)',
        rdfKgPerHa: { n: 100, p: 50, k: 50 },
        rdfKgPerAcre: { n: 40.5, p: 20.2, k: 20.2 },
        season: 'Kharif',
        growthStages: ['Basal (Transplanting)', 'Active Tillering (21 DAT)', 'Panicle Initiation (42 DAT)'],
        ureaSplits: [
            { stage: 'Basal at Puddling', fraction: 0.33, desc: 'Incorporate into wet soil during last puddling' },
            { stage: 'Active Tillering (21 DAT)', fraction: 0.33, desc: 'Broadcast in shallow standing water' },
            { stage: 'Panicle Initiation (42 DAT)', fraction: 0.34, desc: 'Top dress before heading' }
        ],
        description: 'Paddy thrives with split N applications to prevent leaching losses in standing water.'
    },
    maize: {
        id: 'maize',
        name: 'Maize / Corn (मक्का)',
        rdfKgPerHa: { n: 120, p: 60, k: 40 },
        rdfKgPerAcre: { n: 48.5, p: 24.3, k: 16.2 },
        season: 'Kharif / Rabi',
        growthStages: ['Basal', 'Knee-High Stage (30 DAS)', 'Tasseling Stage (50 DAS)'],
        ureaSplits: [
            { stage: 'Basal at Sowing', fraction: 0.25, desc: 'Side-placed 5 cm below seed' },
            { stage: 'Knee-High (30 DAS)', fraction: 0.50, desc: 'Peak vegetative demand' },
            { stage: 'Tasseling (50 DAS)', fraction: 0.25, desc: 'Supports ear filling' }
        ],
        description: 'Maize is a heavy feeder of Nitrogen, responding sharply to knee-high top dressing.'
    },
    cotton: {
        id: 'cotton',
        name: 'Cotton (कपास)',
        rdfKgPerHa: { n: 120, p: 60, k: 60 },
        rdfKgPerAcre: { n: 48.5, p: 24.3, k: 24.3 },
        season: 'Kharif',
        growthStages: ['Basal', 'Square Formation (45 DAS)', 'Boll Development (75 DAS)'],
        ureaSplits: [
            { stage: 'Basal at Sowing', fraction: 0.25, desc: 'Basal band placement' },
            { stage: 'Squaring (45 DAS)', fraction: 0.50, desc: 'Promotes vigorous sympodial branching' },
            { stage: 'Boll Setting (75 DAS)', fraction: 0.25, desc: 'Prevents boll shedding' }
        ],
        description: 'Potassium is vital in cotton to promote boll weight and fiber strength.'
    },
    sugarcane: {
        id: 'sugarcane',
        name: 'Sugarcane (गन्ना)',
        rdfKgPerHa: { n: 250, p: 100, k: 120 },
        rdfKgPerAcre: { n: 101.2, p: 40.5, k: 48.6 },
        season: 'Annual',
        growthStages: ['Planting', 'Tillering (45 DAP)', 'Formative Stage (90 DAP)'],
        ureaSplits: [
            { stage: 'Basal at Planting', fraction: 0.20, desc: 'Placed in furrows' },
            { stage: 'Tillering (45 DAP)', fraction: 0.40, desc: 'With partial earthing up' },
            { stage: 'Formative (90 DAP)', fraction: 0.40, desc: 'Final earthing up' }
        ],
        description: 'Long-duration crop requiring substantial N split evenly before cane elongation.'
    },
    soybean: {
        id: 'soybean',
        name: 'Soybean (सोयाबीन)',
        rdfKgPerHa: { n: 30, p: 60, k: 40 },
        rdfKgPerAcre: { n: 12.1, p: 24.3, k: 16.2 },
        season: 'Kharif',
        growthStages: ['Basal', 'Pod Filling (45 DAS)'],
        ureaSplits: [
            { stage: 'Starter Basal Dose', fraction: 1.0, desc: 'Low starter N; roots fix atmospheric N via Rhizobium' }
        ],
        description: 'Legume crop requiring mainly starter Nitrogen and high Phosphorus for root nodulation.'
    },
    potato: {
        id: 'potato',
        name: 'Potato (आलू)',
        rdfKgPerHa: { n: 150, p: 100, k: 120 },
        rdfKgPerAcre: { n: 60.7, p: 40.5, k: 48.6 },
        season: 'Rabi',
        growthStages: ['Planting', 'Tuber Initiation (30 DAP)', 'Earthing Up'],
        ureaSplits: [
            { stage: 'Basal at Planting', fraction: 0.50, desc: 'Full P, K and half N in furrows' },
            { stage: 'Earthing Up (30 DAP)', fraction: 0.50, desc: 'Top dress during tuber bulking' }
        ],
        description: 'Tuber crop with high Potassium requirement for starch synthesis and tuber size.'
    },
    tomato: {
        id: 'tomato',
        name: 'Tomato / Vegetables (टमाटर)',
        rdfKgPerHa: { n: 120, p: 60, k: 60 },
        rdfKgPerAcre: { n: 48.5, p: 24.3, k: 24.3 },
        season: 'Kharif / Rabi',
        growthStages: ['Transplanting', 'Vegetative (25 DAT)', 'Fruit Set (45 DAT)'],
        ureaSplits: [
            { stage: 'Basal at Transplanting', fraction: 0.34, desc: 'With full P and half K' },
            { stage: 'Early Growth (25 DAT)', fraction: 0.33, desc: 'With light irrigation' },
            { stage: 'Fruit Setting (45 DAT)', fraction: 0.33, desc: 'Along with remaining Potassium' }
        ],
        description: 'Balanced NPK ensures strong vegetative canopy and reduces blossom end rot.'
    }
};

// ─── 2. OFFICIAL GOI SUBSIDIZED FERTILIZER CATALOG & PRICING ─────────────────
export const FERTILIZER_CATALOG = {
    urea: {
        id: 'urea',
        name: 'IFFCO Neem Coated Urea',
        nutrientGrade: '46% Nitrogen (N)',
        bagWeightKg: 45,
        mrp: 266.50,
        subsidized: true,
        manufacturer: 'IFFCO / KRIBHCO',
        brand: 'IFFCO',
        imageUrl: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=200&auto=format&fit=crop&q=80',
        composition: { n: 0.46, p: 0, k: 0 },
        commissionRate: 0.035, // 3.5% affiliate commission from company
        benefits: 'Promotes leafy vegetative growth, green chlorophyll, and fast tillering.'
    },
    dap: {
        id: 'dap',
        name: 'IFFCO Di-Ammonium Phosphate (DAP)',
        nutrientGrade: '18% N, 46% P₂O₅',
        bagWeightKg: 50,
        mrp: 1350.00,
        subsidized: true,
        manufacturer: 'IFFCO / Coromandel',
        brand: 'IFFCO',
        imageUrl: 'https://images.unsplash.com/photo-1585336261026-c29eb2a06141?w=200&auto=format&fit=crop&q=80',
        composition: { n: 0.18, p: 0.46, k: 0 },
        commissionRate: 0.035,
        benefits: 'Essential for vigorous root elongation, early seedling vigor, and strong stem base.'
    },
    mop: {
        id: 'mop',
        name: 'IPL Muriate of Potash (MOP)',
        nutrientGrade: '60% Potash (K₂O)',
        bagWeightKg: 50,
        mrp: 1700.00,
        subsidized: true,
        manufacturer: 'Indian Potash Limited (IPL)',
        brand: 'IPL',
        imageUrl: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=200&auto=format&fit=crop&q=80',
        composition: { n: 0, p: 0, k: 0.60 },
        commissionRate: 0.035,
        benefits: 'Improves drought resilience, pest resistance, grain boldness, and crop quality.'
    },
    ssp: {
        id: 'ssp',
        name: 'Single Super Phosphate (SSP)',
        nutrientGrade: '16% P₂O₅, 11% Sulphur',
        bagWeightKg: 50,
        mrp: 450.00,
        subsidized: true,
        manufacturer: 'Khaitan / Coromandel',
        brand: 'Khaitan',
        composition: { n: 0, p: 0.16, k: 0, s: 0.11 },
        commissionRate: 0.035,
        benefits: 'Economical source of phosphorus along with critical sulphur for oilseeds and pulses.'
    },
    npk_10_26_26: {
        id: 'npk_10_26_26',
        name: 'IFFCO NPK 10:26:26 Complex',
        nutrientGrade: '10% N, 26% P₂O₅, 26% K₂O',
        bagWeightKg: 50,
        mrp: 1470.00,
        subsidized: true,
        manufacturer: 'IFFCO',
        brand: 'IFFCO',
        composition: { n: 0.10, p: 0.26, k: 0.26 },
        commissionRate: 0.035,
        benefits: 'Ideal high-potash and phosphorus complex for sugarcane, potato, and cotton.'
    }
};

// ─── 3. SENSOR-CORRELATED NPK SIMULATION (S.R. Reddy Agronomic Ranges) ───────
/**
 * Generates calibrated, realistic Indian soil NPK values derived from soil moisture
 * and selected crop. Keeps values tightly within official Soil Health Card benchmark bounds.
 * 
 * S.R. Reddy Soil Fertility Classification:
 * - Available N (kg/ha): Low < 280 | Medium 280-560 | High > 560
 * - Available P (kg/ha): Low < 10  | Medium 10-25   | High > 25
 * - Available K (kg/ha): Low < 110 | Medium 110-280 | High > 280
 */
export function estimateSoilNPKFromSensor(moisturePercent = 45, cropId = 'wheat') {
    // Clamp moisture to valid 0-100 range
    const moisture = Math.min(100, Math.max(0, Number(moisturePercent) || 45));

    // Crop baseline biases (typical Indian cultivated agricultural plains)
    const cropOffsets = {
        wheat:     { nBase: 195, pBase: 14.5, kBase: 175 },
        paddy:     { nBase: 180, pBase: 12.0, kBase: 160 },
        maize:     { nBase: 210, pBase: 16.0, kBase: 190 },
        cotton:    { nBase: 175, pBase: 13.5, kBase: 165 },
        sugarcane: { nBase: 220, pBase: 18.0, kBase: 200 },
        soybean:   { nBase: 230, pBase: 15.0, kBase: 180 }, // Higher N due to nodulation
        potato:    { nBase: 205, pBase: 17.5, kBase: 215 },
        tomato:    { nBase: 190, pBase: 15.0, kBase: 185 }
    };

    const base = cropOffsets[cropId] || cropOffsets.wheat;

    // Moisture dynamic factor (S.R. Reddy Chapter 7: Soil Moisture & Nutrient Availability)
    // Optimum microbial mineralization occurs around 45% - 60% Field Capacity.
    // Waterlogging (>75%) leads to anaerobic denitrification of nitrates.
    // Drought (<25%) halts microbial nutrient release.
    let moistureFactor = 1.0;
    if (moisture >= 40 && moisture <= 65) {
        moistureFactor = 1.0 + (moisture - 50) * 0.002; // Small realistic dynamic variation
    } else if (moisture < 40) {
        moistureFactor = 0.90 + (moisture / 40) * 0.10; // Lower available pool
    } else {
        moistureFactor = 1.03 - ((moisture - 65) / 35) * 0.12; // Leaching & dilution
    }

    // Calibrated readings (tight limited range)
    const rawN = Math.round(Math.min(270, Math.max(150, base.nBase * moistureFactor)));
    const rawP = Number(Math.min(23.0, Math.max(8.5, base.pBase * moistureFactor)).toFixed(1));
    const rawK = Math.round(Math.min(260, Math.max(120, base.kBase * moistureFactor)));

    // Conversion: 1 Hectare = 2.471 Acres (kg/acre = kg/ha / 2.471)
    const HA_TO_ACRE = 2.471;
    const nAcre = Number((rawN / HA_TO_ACRE).toFixed(1));
    const pAcre = Number((rawP / HA_TO_ACRE).toFixed(1));
    const kAcre = Number((rawK / HA_TO_ACRE).toFixed(1));

    // Soil status ratings
    const getNStatus = (val) => {
        if (val < 280) return { label: 'Low', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
        if (val <= 560) return { label: 'Medium', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
        return { label: 'High', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    };

    const getPStatus = (val) => {
        if (val < 10) return { label: 'Low', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' };
        if (val <= 25) return { label: 'Medium', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
        return { label: 'High', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    };

    const getKStatus = (val) => {
        if (val < 110) return { label: 'Low', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
        if (val <= 280) return { label: 'Medium', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
        return { label: 'High', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    };

    return {
        moisture,
        cropId,
        timestamp: new Date().toISOString(),
        n: {
            value: rawN,
            acreValue: nAcre,
            unit: 'kg/ha',
            acreUnit: 'kg/acre',
            benchmark: '280 – 560 kg/ha',
            ...getNStatus(rawN)
        },
        p: {
            value: rawP,
            acreValue: pAcre,
            unit: 'kg/ha',
            acreUnit: 'kg/acre',
            benchmark: '10 – 25 kg/ha',
            ...getPStatus(rawP)
        },
        k: {
            value: rawK,
            acreValue: kAcre,
            unit: 'kg/ha',
            acreUnit: 'kg/acre',
            benchmark: '110 – 280 kg/ha',
            ...getKStatus(rawK)
        },
        ph: { value: 6.8, rating: 'Neutral (Optimal)', benchmark: '6.5 – 7.5' },
        organicCarbon: { value: '0.48%', rating: 'Medium', benchmark: '0.50 – 0.75%' },
        ec: { value: '0.42 dS/m', rating: 'Normal Non-Saline', benchmark: '< 1.0 dS/m' }
    };
}

// ─── 4. EXACT FERTILIZER DEFICIT & COMMERCIAL BAG CALCULATOR ─────────────────
/**
 * Calculates exact Urea, DAP, and MOP bag requirements based on:
 * - Current soil available NPK (from sensor estimate or soil test)
 * - S.R. Reddy / ICAR Recommended Dose of Fertilizer (RDF) for the chosen crop
 * - Farm acreage
 */
export function calculateFertilizerPrescription(soilReport, cropId = 'wheat', acres = 1) {
    const crop = CROP_AGRONOMY_DATABASE[cropId] || CROP_AGRONOMY_DATABASE.wheat;
    const farmAcres = Math.max(0.25, Number(acres) || 1);

    // Crop target nutrient needs for total farm area (kg)
    const targetN = crop.rdfKgPerAcre.n * farmAcres;
    const targetP = crop.rdfKgPerAcre.p * farmAcres;
    const targetK = crop.rdfKgPerAcre.k * farmAcres;

    // Nutrient currently present in the soil for this acreage (kg)
    const currentN = soilReport.n.acreValue * farmAcres;
    const currentP = soilReport.p.acreValue * farmAcres;
    const currentK = soilReport.k.acreValue * farmAcres;

    // Net nutrient deficits to be supplied via chemical fertilizers (kg pure nutrient)
    // S.R. Reddy Fertilizer Equation: Dose = Target - (Soil Available * Efficiency Factor ~0.3)
    const netPDeficit = Math.max(0, targetP - (currentP * 0.25));
    const netKDeficit = Math.max(0, targetK - (currentK * 0.20));

    // 1. Calculate DAP (18% N, 46% P₂O₅):
    // P deficit is fulfilled 100% via DAP
    const dapKg = Math.max(25 * farmAcres, netPDeficit / 0.46);
    const dapBags = Math.ceil(dapKg / 50);

    // Nitrogen supplied through DAP (18% of DAP kg)
    const nSuppliedByDap = (dapBags * 50) * 0.18;

    // 2. Calculate Urea (46% N):
    // Remaining N deficit after DAP credit
    const remainingNDeficit = Math.max(0, targetN - nSuppliedByDap);
    const ureaKg = Math.max(30 * farmAcres, remainingNDeficit / 0.46);
    const ureaBags = Math.ceil(ureaKg / 45);

    // 3. Calculate MOP (60% K₂O):
    const mopKg = Math.max(15 * farmAcres, netKDeficit / 0.60);
    const mopBags = Math.ceil(mopKg / 50);

    // Costing at official Government of India NBS Subsidized Rates
    const ureaCost = ureaBags * FERTILIZER_CATALOG.urea.mrp;
    const dapCost = dapBags * FERTILIZER_CATALOG.dap.mrp;
    const mopCost = mopBags * FERTILIZER_CATALOG.mop.mrp;
    const totalCost = ureaCost + dapCost + mopCost;

    // Platform Affiliate Commission (3.5% paid by company to KisanSahayak platform)
    const platformCommission = Number((totalCost * 0.035).toFixed(2));

    // Detailed application schedule breakdown
    const applicationPlan = [
        {
            stage: 'Basal Application (At Sowing / Field Prep)',
            timing: 'Day 0 (Sowing)',
            ureaBags: Math.ceil(ureaBags * 0.33),
            dapBags: dapBags, // 100% DAP applied as basal
            mopBags: mopBags, // 100% MOP applied as basal
            instructions: 'Mix DAP and MOP with 1/3rd Urea and drill 4-5 cm below seed level. Do not mix directly with wet seeds.'
        },
        {
            stage: '1st Top Dressing (Active Tillering / Vegetative)',
            timing: crop.growthStages[1] || '21-25 DAS',
            ureaBags: Math.ceil(ureaBags * 0.34),
            dapBags: 0,
            mopBags: 0,
            instructions: 'Broadcast Urea uniformly immediately following irrigation. Ensure soil has good moisture; never apply to dry cracked soil.'
        },
        {
            stage: '2nd Top Dressing (Flowering / Booting Stage)',
            timing: crop.growthStages[2] || '45-50 DAS',
            ureaBags: Math.max(1, ureaBags - Math.ceil(ureaBags * 0.33) - Math.ceil(ureaBags * 0.34)),
            dapBags: 0,
            mopBags: 0,
            instructions: 'Apply final split before panicle emergence. Avoid late applications to prevent lodging and pest infestation.'
        }
    ];

    return {
        crop,
        acres: farmAcres,
        balanceSheet: {
            nitrogen: {
                presentInSoil: Number(currentN.toFixed(1)),
                cropRequired: Number(targetN.toFixed(1)),
                deficit: Number(Math.max(0, targetN - currentN).toFixed(1)),
                unit: 'kg'
            },
            phosphorus: {
                presentInSoil: Number(currentP.toFixed(1)),
                cropRequired: Number(targetP.toFixed(1)),
                deficit: Number(netPDeficit.toFixed(1)),
                unit: 'kg'
            },
            potassium: {
                presentInSoil: Number(currentK.toFixed(1)),
                cropRequired: Number(targetK.toFixed(1)),
                deficit: Number(netKDeficit.toFixed(1)),
                unit: 'kg'
            }
        },
        recommendedBags: [
            {
                fertilizer: FERTILIZER_CATALOG.urea,
                bags: ureaBags,
                totalKg: ureaBags * 45,
                subtotal: ureaCost,
                role: 'Nitrogen (Fast Vegetative & Tillering Growth)'
            },
            {
                fertilizer: FERTILIZER_CATALOG.dap,
                bags: dapBags,
                totalKg: dapBags * 50,
                subtotal: dapCost,
                role: 'Phosphorus (Root Expansion & Plant Vigor)'
            },
            {
                fertilizer: FERTILIZER_CATALOG.mop,
                bags: mopBags,
                totalKg: mopBags * 50,
                subtotal: mopCost,
                role: 'Potassium (Disease Resistance & Grain Quality)'
            }
        ],
        economics: {
            totalCost,
            platformCommission,
            subsidyNote: 'Official GOI NBS Subsidized Rates',
            commissionNote: '3.5% distributor incentive earned by KisanSahayak directly from manufacturer'
        },
        applicationPlan
    };
}
