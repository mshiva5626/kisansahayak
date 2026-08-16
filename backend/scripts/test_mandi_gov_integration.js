const axios = require('axios');
const { fetchMandiPrices, getTrendingMandiRates, getMandiSources } = require('../services/mandiService');
const { orchestrateTools } = require('../services/toolOrchestrator');
const { buildAgriculturalSystemInstruction } = require('../services/promptEngine');

async function testMandiGovIntegration() {
    console.log('\n================================================================');
    console.log('🌾 TESTING AUTHENTIC GOVERNMENT MANDI PRICES & GROUNDING');
    console.log('================================================================\n');

    // 1. Direct Service Test for Indore, MP (Wheat & Soybean)
    console.log('--- 1. Testing fetchMandiPrices for Indore (Wheat) ---');
    const indorePrices = await fetchMandiPrices('Madhya Pradesh', 'Indore', 'Wheat');
    console.log(`Found ${indorePrices.length} APMC markets for Wheat in Indore:`);
    indorePrices.forEach(p => {
        console.log(`  • ${p.market_name}: Modal ₹${p.modal_price}/q (${p.trend === 'hike' ? '▲ Hike' : p.trend === 'lower' ? '▼ Lower' : '● Steady'} ${p.trend_pct}) | Source: ${p.verified_source}`);
    });
    if (indorePrices.length === 0 || !indorePrices[0].modal_price) {
        throw new Error('Failed to retrieve verified mandi prices for Indore');
    }

    // 2. Direct Service Test for Nashik, Maharashtra (Onion)
    console.log('\n--- 2. Testing fetchMandiPrices for Nashik (Onion) ---');
    const nashikPrices = await fetchMandiPrices('Maharashtra', 'Nashik', 'Onion');
    console.log(`Found ${nashikPrices.length} APMC markets for Onion in Nashik:`);
    nashikPrices.forEach(p => {
        console.log(`  • ${p.market_name}: Modal ₹${p.modal_price}/q (${p.trend === 'hike' ? '▲ Hike' : p.trend === 'lower' ? '▼ Lower' : '● Steady'} ${p.trend_pct}) | Source: ${p.verified_source}`);
    });

    // 3. Test Trending Rates & Sources
    console.log('\n--- 3. Testing Trending Mandi Rates & Government Sources ---');
    const trending = await getTrendingMandiRates();
    console.log(`✅ Retrieved ${trending.length} top trending agricultural commodities.`);
    const sources = getMandiSources();
    console.log(`✅ Loaded ${sources.sources.length} official government authorities (Agmarknet, e-NAM, CACP).`);

    // 4. Test Tool Orchestrator with Mandi Query
    console.log('\n--- 4. Testing AI Tool Orchestration for Mandi Query ---');
    const query = "What is the wheat mandi price in Indore today and is the rate hiking or lowering?";
    const toolResults = await orchestrateTools({
        query,
        userProfile: { state: 'Madhya Pradesh', district: 'Indore', name: 'Ramesh Patel' }
    });

    console.log('Tool Context Injected:');
    console.log(toolResults.toolContext.substring(0, 500) + '...\n');

    if (!toolResults.toolContext.includes('AGMARKNET') || !toolResults.toolContext.includes('Indore')) {
        throw new Error('Tool context did not contain authentic Agmarknet Mandi data!');
    }

    // 5. Build System Instruction and verify rules
    const systemInstruction = buildAgriculturalSystemInstruction({
        userProfile: { state: 'Madhya Pradesh', district: 'Indore', name: 'Ramesh Patel' },
        toolContext: toolResults.toolContext
    });

    if (!systemInstruction.includes('MANDI BHAV & MARKET PRICE RULES')) {
        throw new Error('System instruction is missing Mandi Bhav rules');
    }
    console.log('✅ AI System Prompt contains strict Government Mandi Bhav rules & Agmarknet citations.');

    console.log('\n================================================================');
    console.log('🎉 ALL GOVERNMENT MANDI INTEGRATION TESTS PASSED (100%)!');
    console.log('================================================================\n');
}

testMandiGovIntegration().catch(err => {
    console.error('❌ Test Failed:', err);
    process.exit(1);
});
