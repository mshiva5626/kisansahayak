const { getSupabase } = require('../config/db');
const { getAIAdvisory } = require('../services/aiService');
const { getWeather } = require('../services/weatherService');

// Helper: get schemes for state
async function getSchemesForState(state) {
    if (!state) return [];
    try {
        const supabase = getSupabase();
        const { data } = await supabase
            .from('schemes')
            .select('*')
            .or(`scheme_type.eq.central,state.ilike.%${state}%`)
            .limit(5);
        return data || [];
    } catch (e) {
        console.error('Error fetching schemes for AI config:', e);
        return [];
    }
}

// Helper: get farm by id + userId
async function getFarm(farmId, userId) {
    const supabase = getSupabase();
    const { data } = await supabase
        .from('farms')
        .select('*')
        .eq('id', farmId)
        .eq('user_id', userId)
        .maybeSingle();

    if (data) data._id = data.id;
    return data;
}

// Helper: get user
async function getUser(userId) {
    const supabase = getSupabase();
    const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (data) data._id = data.id;
    return data;
}

// Helper: save advisory
async function saveAdvisory(data) {
    const supabase = getSupabase();
    const { data: adv, error } = await supabase
        .from('advisories')
        .insert([data])
        .select()
        .single();

    if (error) throw error;
    if (adv) adv._id = adv.id;
    return adv;
}

// Get a full AI advisory for a farm
exports.getAdvisory = async (req, res) => {
    try {
        const { farm_id, query, image_analysis } = req.body;
        const userId = req.user._id || req.user.id;

        if (!farm_id || !query) {
            return res.status(400).json({ message: 'farm_id and query are required' });
        }

        const farm = await getFarm(farm_id, userId);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        // Conditional Feature Logic (Rule 2)
        const lat = farm.latitude || farm.location?.lat;
        const lon = farm.longitude || farm.location?.lon;

        console.log(`[DEBUG getAdvisory] Farm: ${farm.farm_name}, Crop: ${farm.crop_type}, Lat: ${lat}, Lon: ${lon}, Raw Farm Object:`, JSON.stringify(farm));

        if (!farm.crop_type || !lat || !lon) {
            return res.status(200).json({
                response: 'Insufficient farm setup. Please complete your farm configuration including crop type and location to receive specific advice.',
                weather: null,
                created_at: new Date()
            });
        }

        const farmer = await getUser(userId);

        // Fetch weather if coordinates available
        let weatherData = null;
        try {
            console.log(`\n--- WEATHER API REQUEST ---`);
            console.log(`Coordinates: Lat ${lat}, Lon ${lon}`);
            weatherData = await getWeather(lat, lon);
            console.log(`Weather Fetched: ${weatherData.temperature || weatherData.temp}°C, ${weatherData.condition}`);
        } catch (err) {
            console.error('\n❌ Weather fetch failed for advisory:', err.message);
            return res.status(200).json({
                response: 'Weather data temporarily unavailable for your location. Please try again later.',
                weather: null,
                created_at: new Date()
            });
        }

        // Fetch schemes for the AI context
        let schemesData = [];
        const stateForSchemes = farm.state || farmer?.state;
        if (stateForSchemes) {
            schemesData = await getSchemesForState(stateForSchemes);
        }

        const context = {
            farmer: {
                name: farmer?.name,
                state: farmer?.state,
                district: farmer?.district,
                farming_type: farmer?.farming_type,
                preferred_language: farmer?.preferred_language
            },
            farm: {
                farm_name: farm.farm_name,
                state: farm.state,
                area: farm.area,
                terrain_type: farm.terrain_type,
                water_source: farm.water_source,
                crop_type: farm.crop_type,
                sowing_date: farm.sowing_date,
                latitude: farm.latitude,
                longitude: farm.longitude
            },
            weather: weatherData,
            image_analysis: image_analysis || null,
            schemes: schemesData
        };

        const advisoryText = await getAIAdvisory(query, context);

        const advisory = await saveAdvisory({
            farm_id: farm._id || farm.id,
            advisory_text: advisoryText,
            weather_snapshot: weatherData,
            query: query
        });

        res.status(200).json({
            advisory_id: advisory._id,
            response: advisoryText,
            weather: weatherData,
            created_at: advisory.created_at || new Date()
        });
    } catch (error) {
        console.error('Advisory error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get advisory history for a farm
exports.getAdvisoryHistory = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const farmId = req.params.farmId;

        const farm = await getFarm(farmId, userId);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        const supabase = getSupabase();
        const { data: rawAdvisories, error } = await supabase
            .from('advisories')
            .select('*')
            .eq('farm_id', farmId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        const advisories = rawAdvisories.map(a => ({ ...a, _id: a.id }));

        res.status(200).json({ advisories });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.chat = async (req, res) => {
    try {
        const { messages, farm_id } = req.body;
        const userId = req.user._id || req.user.id;

        if (!messages || !Array.isArray(messages) || messages.length === 0 || !farm_id) {
            return res.status(400).json({ message: 'messages (array) and farm_id are required' });
        }

        const latestQuery = messages[messages.length - 1].content;

        // 2b) Fetch farm by farm_id from Supabase
        const farm = await getFarm(farm_id, userId);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        // 2c) Validate farm contains: crop, latitude, longitude
        const lat = farm.latitude || farm.location?.lat;
        const lon = farm.longitude || farm.location?.lon;

        console.log(`[DEBUG chat] Farm: ${farm.farm_name}, Crop: ${farm.crop_type}, Lat: ${lat}, Lon: ${lon}, Raw Farm Object:`, JSON.stringify(farm));

        if (!farm.crop_type || !lat || !lon) {
            return res.status(400).json({ message: 'Incomplete farm setup. Please complete configuration.' });
        }

        const farmer = await getUser(userId);

        // 3) Backend MUST fetch weather using farm coordinates
        let weatherData = null;
        try {
            console.log(`\n--- WEATHER API REQUEST (Chat) ---`);
            weatherData = await getWeather(lat, lon);
            console.log(`Weather Fetched: ${weatherData.temperature || weatherData.temp}°C, ${weatherData.condition}`);
        } catch (err) {
            console.error('\n❌ Weather fetch for chat failed:', err.message);
            return res.status(500).json({ message: 'Weather data unavailable. Aborting AI request.' });
        }

        const stateForSchemes = farm.state || farmer?.state;
        const schemesData = await getSchemesForState(stateForSchemes);

        // 4) Construct unified prompt
        const context = {
            farmer: { name: farmer?.name, state: farmer?.state, district: farmer?.district, farming_type: farmer?.farming_type },
            farm: farm,
            weather: weatherData,
            image_analysis: null,
            schemes: schemesData
        };

        // 5) Backend MUST call AI Service
        console.log(`Triggering AI Service for chat context...`);
        const responseText = await getAIAdvisory(messages, context);

        // 6) Backend MUST save advisory to Supabase
        await saveAdvisory({
            farm_id: farm._id || farm.id,
            advisory_text: responseText,
            weather_snapshot: weatherData,
            query: latestQuery
        });

        // 7) Backend MUST return advisory to frontend
        res.status(200).json({ response: responseText });
    } catch (error) {
        console.error('Chat error:', error.message);
        res.status(500).json({ message: error.message });
    }
};
