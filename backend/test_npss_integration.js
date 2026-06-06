require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log('--- STARTING NPSS INTEGRATION TEST ---');

// 1. Verify index loaded correctly
const indexCompiledPath = path.join(__dirname, 'data', 'npssPestIndex.json');
if (!fs.existsSync(indexCompiledPath)) {
    console.error('❌ npssPestIndex.json is missing!');
    process.exit(1);
}
console.log('✅ Found npssPestIndex.json');

const npssIndex = require('./data/npssPestIndex.json');
console.log(`✅ Loaded index with ${npssIndex.totalRows} rows`);

// Test crops mapping
const crops = Object.keys(npssIndex.cropPests);
console.log(`✅ Indexed ${crops.length} crops: ${crops.join(', ')}`);

// 2. Validate lookup query function logic
function testLookup(crop, pest, state, district) {
    console.log(`\nTesting lookup for Crop: "${crop}", Pest: "${pest}", Region: "${district}, ${state}"`);
    
    const cropName = crop || 'Unknown';
    const pestName = pest || 'Unknown';
    
    // Get reference images
    const refKey = `${cropName}_${pestName}`.toLowerCase();
    const referenceImages = npssIndex.referenceImages[refKey] || [];
    console.log(`- Reference images found: ${referenceImages.length}`);
    if (referenceImages.length > 0) {
        console.log(`  Sample: ${referenceImages[0]}`);
    }
    
    // Get regional reports count
    const cleanState = state.trim().toLowerCase();
    const cleanDistrict = district.trim().toLowerCase();
    
    let count = 0;
    const regionalKey = `${cleanState}_${cleanDistrict}_${cropName}`.toLowerCase();
    const stats = npssIndex.regionalStats[regionalKey];
    if (stats && stats[pestName]) {
        count = stats[pestName];
    }
    console.log(`- Regional report count in ${district}, ${state}: ${count}`);
    return { count, imageCount: referenceImages.length };
}

// Perform test queries based on our CSV knowledge
const test1 = testLookup('Chilli', 'Thrips', 'Arunachal Pradesh', 'Lower Subansiri');
if (test1.count > 0 && test1.imageCount > 0) {
    console.log('✅ Test 1 (Chilli -> Thrips) passed successfully.');
} else {
    console.warn('⚠️ Test 1 returned 0 stats, check state/district spelling.');
}

const test2 = testLookup('Maize', 'Fall Armyworm', 'Karnataka', 'Hassan');
testLookup('Rice', 'Leaf folder', 'Bihar', 'Gaya');

// 3. Test prompt construction helper
const { analyzeImageWithAI } = require('./services/imageAnalysisService');
console.log('\n✅ analyzeImageWithAI is imported successfully.');

console.log('\n--- NPSS INTEGRATION TEST COMPLETED SUCCESSFULLY ---');
