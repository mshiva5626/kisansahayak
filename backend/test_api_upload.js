const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

async function testApi() {
    console.log('--- STARTING REST API INTEGRATION TEST ---');
    
    const email = `test_npss_${Date.now()}@example.com`;
    const password = 'Password123';
    const name = 'Test Farmer';
    
    // 1. Register User
    console.log('\n1. Registering user...');
    const regRes = await axios.post(`${API_URL}/auth/register`, { email, password, name });
    const token = regRes.data.token;
    console.log('✅ Registered successfully. Token retrieved.');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // 2. Create a Farm
    console.log('\n2. Creating a farm...');
    const farmRes = await axios.post(`${API_URL}/farms`, {
        farm_name: 'NPSS Chilli Farm',
        crop_type: 'Chilli',
        state: 'Arunachal Pradesh',
        area: '2 acres',
        terrain_type: 'plain',
        water_source: 'borewell',
        location: {
            lat: 27.5,
            lon: 93.8,
            state: 'Arunachal Pradesh',
            district: 'Lower Subansiri'
        }
    }, { headers });
    const farmId = farmRes.data.farm.id;
    console.log(`✅ Farm created with ID: ${farmId}`);
    
    // 3. Upload Image
    console.log('\n3. Uploading image...');
    const form = new FormData();
    const imagePath = path.join(__dirname, 'dummy.jpg');
    form.append('image', fs.createReadStream(imagePath));
    form.append('farm_id', farmId);
    form.append('image_type', 'leaf');
    
    const uploadRes = await axios.post(`${API_URL}/images/upload`, form, {
        headers: {
            ...headers,
            ...form.getHeaders()
        }
    });
    const imageId = uploadRes.data.image.id;
    console.log(`✅ Image uploaded successfully. Image ID: ${imageId}`);
    
    // 4. Analyze Image
    console.log('\n4. Running AI analysis (which pulls NPSS insights)...');
    const analyzeRes = await axios.post(`${API_URL}/images/analyze/${imageId}`, {}, { headers });
    
    console.log('\n--- ANALYSIS RESULTS ---');
    console.log(JSON.stringify(analyzeRes.data, null, 2));
    
    // 5. Verification Checks
    const analysis = analyzeRes.data.analysis_result;
    if (analysis && 'npss_reference_images' in analysis && 'npss_regional_reports' in analysis) {
        console.log('\n🎉 SUCCESS: npss_reference_images and npss_regional_reports are present in the response!');
        console.log(`- NPSS Reference Images count: ${analysis.npss_reference_images.length}`);
        console.log(`- Regional reports count: ${analysis.npss_regional_reports.count} (Location: ${analysis.npss_regional_reports.district}, ${analysis.npss_regional_reports.state})`);
    } else {
        console.error('\n❌ FAILURE: NPSS integration fields are missing from the analysis result.');
        process.exit(1);
    }
}

testApi().catch(err => {
    console.error('❌ Test failed with error:', err.response?.data || err.message);
    process.exit(1);
});
