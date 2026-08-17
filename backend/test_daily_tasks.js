const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testDailyTasks() {
    console.log('--- TESTING AI DAILY TASKS & FIELD SURVEY API ---');

    // 1. Register test user
    const email = `test_tasks_${Date.now()}@example.com`;
    const regRes = await axios.post(`${API_URL}/auth/register`, {
        email,
        password: 'password123',
        name: 'Suresh Patel'
    });
    const token = regRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ User registered');

    // 2. Create Farm with Wheat, Alluvial Soil, Drip Irrigation
    const farmRes = await axios.post(`${API_URL}/farms`, {
        farm_name: 'Shree Krishna Farm - Sector 1',
        crop_type: 'Wheat',
        crop_variety: 'HD-2967',
        soil_type: 'Alluvial Loam',
        water_source: 'Drip Irrigation',
        area: 3,
        unit: 'Acres',
        sowing_date: '2026-07-20',
        state: 'Punjab',
        district: 'Ludhiana',
        latitude: 30.9010,
        longitude: 75.8573
    }, { headers });

    const farmId = farmRes.data.farm.id || farmRes.data.farm._id;
    console.log(`✅ Farm created: ID ${farmId}`);

    // 3. Test GET Daily Field Survey
    console.log('\n--- FETCHING AI FIELD SURVEY QUESTIONS ---');
    const surveyRes = await axios.get(`${API_URL}/ai/daily-survey/${farmId}`, { headers });
    console.log('Survey Output:', JSON.stringify(surveyRes.data, null, 2));

    // 4. Test GET Daily Tasks
    console.log('\n--- FETCHING AI DAILY TASKS & CHECKS ---');
    const tasksRes = await axios.get(`${API_URL}/ai/daily-tasks/${farmId}`, { headers });
    console.log('Daily Tasks Output:', JSON.stringify(tasksRes.data, null, 2));

    // 5. Test Update Task Status (Tick / Complete)
    if (tasksRes.data.data?.tasks?.length > 0) {
        const firstTaskId = tasksRes.data.data.tasks[0].id;
        console.log(`\n--- TICKING (COMPLETING) TASK: ${firstTaskId} ---`);
        const updateRes = await axios.put(`${API_URL}/ai/daily-tasks/${farmId}/task/${firstTaskId}`, {
            completed: true
        }, { headers });
        console.log('Update Result:', updateRes.data.task);
    }

    console.log('\n✅ ALL DAILY TASKS & FIELD SURVEY TESTS PASSED SUCCESSFULLY!');
}

testDailyTasks().catch(err => {
    console.error('❌ Daily Tasks test failed:', err.response?.data || err.message);
    process.exit(1);
});
