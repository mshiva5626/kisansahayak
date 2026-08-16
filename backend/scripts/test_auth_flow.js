const axios = require('axios');

async function testAuth() {
    const baseUrl = 'http://localhost:5000/api/auth';
    const testEmail = `testfarmer_${Date.now()}@kisansahayak.com`;
    const testPassword = 'Password@123';
    const testName = 'Ramesh Patel';

    console.log('\n--- 1. Testing Registration ---');
    console.log(`Registering: ${testEmail}`);
    try {
        const regRes = await axios.post(`${baseUrl}/register`, {
            email: testEmail,
            password: testPassword,
            name: testName
        });
        console.log('✅ Registration Status:', regRes.status);
        console.log('User created:', regRes.data.user?.email, 'ID:', regRes.data.user?.id);
        console.log('Token received:', regRes.data.token ? 'YES' : 'NO');
    } catch (err) {
        console.error('❌ Registration Error:', err.response?.data || err.message);
    }

    console.log('\n--- 2. Testing Login with correct credentials ---');
    try {
        const loginRes = await axios.post(`${baseUrl}/login`, {
            email: testEmail,
            password: testPassword
        });
        console.log('✅ Login Status:', loginRes.status);
        console.log('User logged in:', loginRes.data.user?.name, loginRes.data.user?.email);
        console.log('Token received:', loginRes.data.token ? 'YES' : 'NO');

        const token = loginRes.data.token;

        console.log('\n--- 3. Testing Protected Profile Route with Token ---');
        const profRes = await axios.get(`${baseUrl}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Profile Status:', profRes.status);
        console.log('Profile data:', profRes.data.user?.name);
    } catch (err) {
        console.error('❌ Login/Profile Error:', err.response?.data || err.message);
    }

    console.log('\n--- 4. Testing Login with wrong password ---');
    try {
        await axios.post(`${baseUrl}/login`, {
            email: testEmail,
            password: 'WrongPassword'
        });
        console.error('❌ Should not succeed with wrong password');
    } catch (err) {
        console.log('✅ Correctly rejected wrong password:', err.response?.data?.message || err.message);
    }

    console.log('\n--- 5. Testing Google Auth URL endpoint ---');
    try {
        const gRes = await axios.get(`${baseUrl}/google-url?redirectTo=http://localhost:5173`);
        console.log('✅ Google Auth URL:', gRes.data?.url);
    } catch (err) {
        console.error('❌ Google URL Error:', err.response?.data || err.message);
    }
}

testAuth().catch(console.error);
