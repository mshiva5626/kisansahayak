/**
 * Kisan Sahayak - Agricultural Tool Orchestrator
 * 
 * Selects and executes relevant agricultural tools:
 * 1. Weather Intelligence (Open-Meteo High-Resolution)
 * 2. Authentic Government Mandi Prices (Agmarknet DMI & e-NAM Verified)
 * 3. RAG Knowledge Base Retrieval (ICAR & Agronomic Practices)
 * 4. Government Schemes & Subsidies (PM-Kisan, KCC, PMFBY, SMAM)
 * 5. Agriculture Infrastructure Fund (AMI/AIF Datasets)
 */

const { getWeather } = require('./weatherService');
const { fetchMandiPrices } = require('./mandiService');
const { buildRAGContextString, classifyDomain } = require('../knowledge/ragEngine');
const { getAllSchemes } = require('../knowledge/knowledgeBase');
const { getSummary } = require('./amiService');

/**
 * Orchestrates tools based on query intent and farm context
 */
async function orchestrateTools({ query, farm = null, userProfile = {}, skipWeather = false }) {
    const domains = classifyDomain(query);
    const qLower = (query || '').toLowerCase();
    
    const crop = farm?.crop_type || null;
    const state = farm?.state || userProfile.state || 'Madhya Pradesh';
    const district = farm?.district || userProfile.district || 'Indore';
    const lat = farm?.latitude || farm?.location?.lat;
    const lon = farm?.longitude || farm?.location?.lon;
    
    let weatherData = null;
    let toolContext = '';
    
    // 1. Weather Tool (if query relates to spraying, irrigation, weather, or advisory)
    const needsWeather = !skipWeather && lat && lon && (
        domains.includes('irrigation') ||
        domains.includes('plant_pathology') ||
        domains.includes('agronomy_fertilizer') ||
        qLower.includes('weather') ||
        qLower.includes('rain') ||
        qLower.includes('spray') ||
        qLower.includes('advisory')
    );
    
    if (needsWeather) {
        try {
            weatherData = await getWeather(lat, lon);
        } catch (err) {
            console.warn(`[Tool Orchestrator] Weather fetch skipped/failed: ${err.message}`);
        }
    }
    
    // 2. Authentic Mandi Price Tool (if query relates to market prices, mandi bhav, rates, selling, MSP)
    const isMandiQuery = qLower.includes('mandi') || 
                         qLower.includes('bhav') || 
                         qLower.includes('price') || 
                         qLower.includes('rate') || 
                         qLower.includes('selling') || 
                         qLower.includes('sell') || 
                         qLower.includes('market') || 
                         qLower.includes('msp') ||
                         qLower.includes('quintal') ||
                         qLower.includes('profit');

    if (isMandiQuery) {
        try {
            const detectedCrop = crop || extractCropFromQuery(qLower);
            const mandiPrices = await fetchMandiPrices(state, district, detectedCrop, query);
            
            if (mandiPrices && mandiPrices.length > 0) {
                toolContext += `\n═══════════════════════════════════════════════════════════════\n`;
                toolContext += `AUTHENTIC GOVERNMENT MANDI PRICES (AGMARKNET & e-NAM VERIFIED):\n`;
                toolContext += `═══════════════════════════════════════════════════════════════\n`;
                toolContext += `Authority Source: Directorate of Marketing & Inspection (DMI) & National Agriculture Market (e-NAM), Ministry of Agriculture and Farmers Welfare, Govt of India\n`;
                toolContext += `Location Scope: ${district}, ${state} | Target Commodity: ${detectedCrop || 'Regional APMC Commodities'}\n\n`;

                mandiPrices.slice(0, 5).forEach(m => {
                    const trendIcon = m.trend === 'hike' ? '▲ (Price Hiked)' : m.trend === 'lower' ? '▼ (Price Lowered)' : '● (Steady)';
                    const deltaStr = m.price_change !== 0 ? ` [${m.price_change > 0 ? '+' : ''}₹${m.price_change}/q, ${m.trend_pct}]` : ' [Unchanged]';
                    
                    toolContext += `• **${m.commodity}** (${m.variety || 'Standard Grade'})\n`;
                    toolContext += `  - APMC Market: **${m.market_name}** (${m.district}, ${m.state})\n`;
                    toolContext += `  - Modal Price (Average Traded): **₹${m.modal_price.toLocaleString('en-IN')} / Quintal** (₹${(m.modal_price/100).toFixed(2)}/kg)\n`;
                    toolContext += `  - Price Range: ₹${m.min_price.toLocaleString('en-IN')} - ₹${m.max_price.toLocaleString('en-IN')} / Quintal\n`;
                    toolContext += `  - Daily Price Movement: ${trendIcon}${deltaStr}\n`;
                    if (m.msp) {
                        const mspDiff = m.modal_price - m.msp;
                        toolContext += `  - Official Govt MSP Benchmark: ₹${m.msp.toLocaleString('en-IN')} / Quintal (${mspDiff >= 0 ? `+₹${mspDiff} above MSP` : `-₹${Math.abs(mspDiff)} below MSP`})\n`;
                    }
                    if (m.arrivals) {
                        toolContext += `  - Daily Market Arrivals: ${m.arrivals}\n`;
                    }
                    toolContext += `  - Data Verification: ${m.verified_source} (Date: ${m.date})\n\n`;
                });
            }
        } catch (mandiErr) {
            console.warn(`[Tool Orchestrator] Mandi price tool warning: ${mandiErr.message}`);
        }
    }

    // 3. RAG Knowledge Base Retrieval
    const ragResult = buildRAGContextString({
        query,
        crop,
        state,
        district
    });
    
    // 4. Government Schemes Tool (if query asks about schemes, subsidies, loans)
    if (domains.includes('schemes') || qLower.includes('scheme') || qLower.includes('subsidy') || qLower.includes('kcc') || qLower.includes('pm-kisan')) {
        const schemes = getAllSchemes(state);
        if (schemes.length > 0) {
            toolContext += `\n═══════════════════════════════════════════════════════════════\n`;
            toolContext += `MATCHING VERIFIED GOVERNMENT SCHEMES (${state || 'National'}):\n`;
            toolContext += `═══════════════════════════════════════════════════════════════\n`;
            schemes.slice(0, 4).forEach(s => {
                toolContext += `• **${s.name}** (${s.ministry})\n`;
                toolContext += `  Benefits: ${s.benefits}\n`;
                toolContext += `  Eligibility: ${s.eligibility}\n`;
                toolContext += `  Application Portal: ${s.website_url}\n\n`;
            });
        }
    }
    
    // 5. AMI Agriculture Infrastructure Fund Tool (if query mentions cold storage, warehouse, infrastructure loan)
    if (qLower.includes('warehouse') || qLower.includes('cold storage') || qLower.includes('infra') || qLower.includes('aif') || qLower.includes('loan')) {
        const summary = getSummary();
        toolContext += `\n═══════════════════════════════════════════════════════════════\n`;
        toolContext += `AGRICULTURE INFRASTRUCTURE FUND (AMI/AIF) OFFICIAL DATA:\n`;
        toolContext += `═══════════════════════════════════════════════════════════════\n`;
        toolContext += `- Total Approved Projects: ${summary.totalProjects}\n`;
        toolContext += `- Total Warehouses/Godowns Approved: ${summary.warehousesCount}\n`;
        toolContext += `- Interest Subvention: 3% per annum up to ₹2 Crore for up to 7 years\n`;
        toolContext += `- Official Portal: https://agriinfra.dac.gov.in\n\n`;
    }
    
    return {
        domains,
        weather: weatherData,
        ragContext: ragResult.contextString,
        retrievedDocsCount: ragResult.sourcesCount,
        toolContext
    };
}

/**
 * Extracts crop name from text query if available
 */
function extractCropFromQuery(q) {
    const crops = [
        'wheat', 'paddy', 'rice', 'soybean', 'mustard', 'cotton', 'chana', 'gram',
        'onion', 'potato', 'tomato', 'garlic', 'chilli', 'turmeric', 'cumin',
        'groundnut', 'maize', 'tur', 'arhar', 'moong', 'ginger', 'banana'
    ];
    for (const c of crops) {
        if (q.includes(c)) return c;
    }
    return '';
}

module.exports = {
    orchestrateTools
};
