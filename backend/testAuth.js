const axios = require('axios');

async function testAuth() {
    try {
        console.log('Testing Registration...');
        const regRes = await axios.post('http://localhost:5000/api/auth/register', {
            email: 'test_script@example.com',
            password: 'password123',
            name: 'Test Script'
        });
        console.log('Register Success:', regRes.data);
    } catch (e) {
        console.error('Register Failed:', e.response?.data || e.message);
    }

    try {
        console.log('Testing Login...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test_script@example.com',
            password: 'password123'
        });
        console.log('Login Success:', loginRes.data);
    } catch (e) {
        console.error('Login Failed:', e.response?.data || e.message);
    }
}

testAuth();
