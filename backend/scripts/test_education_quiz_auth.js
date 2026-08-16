const axios = require('axios');

async function testEducationAuth() {
    const baseUrl = 'http://localhost:5000/api/auth';
    const uniqueId = Date.now().toString().slice(-5);

    console.log('\n================================================================');
    console.log('🧪 TESTING EDUCATION QUIZ & VERIFICATION TIERS (ENTREPRENEUR VS FARMER)');
    console.log('================================================================\n');

    // 1. Register Educated Agri Entrepreneur
    console.log('--- 1. Registering Graduate Agri Entrepreneur ---');
    const gradEmail = `agri_ent_${uniqueId}@kisansahayak.com`;
    const gradMobile = `98711${uniqueId}`;
    const gradPayload = {
        name: 'Dr. Rajesh Patel',
        age: 32,
        mobile_number: gradMobile,
        email: gradEmail,
        password: 'Password@123',
        land_size: '5 - 10 Acres',
        experience_years: '5 - 10 Years',
        estimated_revenue: '₹7 - 15 Lakhs',
        has_degree: true,
        education_qualification: 'M.Sc Agriculture & Horticulture',
        preferred_language: 'hi',
        farming_type: 'Organic & Natural'
    };

    const res1 = await axios.post(`${baseUrl}/register`, gradPayload);
    console.log('✅ Registered Status:', res1.status);
    console.log('Farmer Profile:', {
        name: res1.data.user?.name,
        role: res1.data.user?.role,
        has_degree: res1.data.user?.has_degree,
        qualification: res1.data.user?.education_qualification
    });
    if (res1.data.user?.role !== 'verified_agri_entrepreneur') {
        throw new Error('Expected role to be verified_agri_entrepreneur');
    }
    console.log('🎖️ Verified Agri Entrepreneur Tier successfully awarded!');

    // 2. Register Non-Degree Farmer
    console.log('\n--- 2. Registering Progressive Farmer (Non-Degree) ---');
    const farmerEmail = `farmer_std_${uniqueId}@kisansahayak.com`;
    const farmerMobile = `98722${uniqueId}`;
    const farmerPayload = {
        name: 'Babu Rao',
        age: 48,
        mobile_number: farmerMobile,
        email: farmerEmail,
        password: 'Password@123',
        land_size: '2 - 5 Acres',
        experience_years: '10+ Years',
        estimated_revenue: '₹3 - 7 Lakhs',
        has_degree: false,
        preferred_language: 'or',
        farming_type: 'Conventional Crop'
    };

    const res2 = await axios.post(`${baseUrl}/register`, farmerPayload);
    console.log('✅ Registered Status:', res2.status);
    console.log('Farmer Profile:', {
        name: res2.data.user?.name,
        role: res2.data.user?.role,
        has_degree: res2.data.user?.has_degree
    });
    if (res2.data.user?.role !== 'verified_farmer') {
        throw new Error('Expected role to be verified_farmer');
    }
    console.log('👨‍🌾 Verified Farmer Tier successfully awarded!');

    // 3. Test Mobile Login for Agri Entrepreneur
    console.log('\n--- 3. Testing Mobile Login for Agri Entrepreneur ---');
    const logRes = await axios.post(`${baseUrl}/login`, {
        email: gradMobile,
        password: 'Password@123'
    });
    console.log('✅ Logged in successfully:', logRes.data.user?.name, 'Role:', logRes.data.user?.role);

    console.log('\n================================================================');
    console.log('🎉 ALL EDUCATION & VERIFICATION TIER TESTS PASSED (100%)!');
    console.log('================================================================\n');
}

testEducationAuth().catch(err => {
    console.error('❌ Test Failed:', err.response?.data || err.message);
    process.exit(1);
});
