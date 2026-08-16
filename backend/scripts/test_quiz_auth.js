const axios = require('axios');

async function testQuizAuth() {
    const baseUrl = 'http://localhost:5000/api/auth';
    const uniqueId = Date.now().toString().slice(-6);
    const testEmail = `quizfarmer_${uniqueId}@kisansahayak.com`;
    const testMobile = `98765${uniqueId}`;
    const testPassword = 'FarmPassword@123';

    console.log('\n======================================================');
    console.log('🧪 TESTING 3-STEP REGISTRATION & DUAL LOGIN (EMAIL/PHONE)');
    console.log('======================================================\n');

    // 1. Test 3-Step Registration Payload
    console.log('--- 1. Registering Farmer with 3-Step Quiz Payload ---');
    const quizPayload = {
        name: 'Vikas Sharma',
        age: 38,
        mobile_number: testMobile,
        email: testEmail,
        password: testPassword,
        land_size: '2 - 5 Acres',
        experience_years: '5 - 10 Years',
        estimated_revenue: '₹3 - 7 Lakhs',
        preferred_language: 'hi',
        farming_type: 'Organic'
    };

    const regRes = await axios.post(`${baseUrl}/register`, quizPayload);
    console.log('✅ Registration Status:', regRes.status);
    console.log('Registered User:', {
        id: regRes.data.user?.id,
        name: regRes.data.user?.name,
        email: regRes.data.user?.email,
        mobile: regRes.data.user?.mobile_number,
        land_size: regRes.data.user?.land_size,
        farming_type: regRes.data.user?.farming_type,
        language: regRes.data.user?.preferred_language
    });
    console.log('JWT Token received:', !!regRes.data.token);

    // 2. Test Login with Email
    console.log('\n--- 2. Testing Login via Email ---');
    const emailLoginRes = await axios.post(`${baseUrl}/login`, {
        email: testEmail,
        password: testPassword
    });
    console.log('✅ Email Login Status:', emailLoginRes.status);
    console.log('Logged in as:', emailLoginRes.data.user?.name, `(${emailLoginRes.data.user?.email})`);

    // 3. Test Login with Mobile Number
    console.log('\n--- 3. Testing Login via Mobile Number ---');
    const mobileLoginRes = await axios.post(`${baseUrl}/login`, {
        email: testMobile, // passing mobile in email field
        password: testPassword
    });
    console.log('✅ Mobile Login Status:', mobileLoginRes.status);
    console.log('Logged in as:', mobileLoginRes.data.user?.name, `(${mobileLoginRes.data.user?.mobile_number || testMobile})`);

    // 4. Test Profile Retrieval
    console.log('\n--- 4. Testing Profile Retrieval with Token ---');
    const profRes = await axios.get(`${baseUrl}/profile`, {
        headers: { Authorization: `Bearer ${emailLoginRes.data.token}` }
    });
    console.log('✅ Profile Data verified:', {
        name: profRes.data.user?.name,
        land: profRes.data.user?.land_size,
        type: profRes.data.user?.farming_type
    });

    console.log('\n======================================================');
    console.log('🎉 ALL QUIZ REGISTRATION & DUAL LOGIN TESTS PASSED!');
    console.log('======================================================\n');
}

testQuizAuth().catch(err => {
    console.error('❌ Test Error:', err.response?.data || err.message);
    process.exit(1);
});
