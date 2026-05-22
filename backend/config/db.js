const MockSupabaseClient = require('./mockSupabase');

let supabase = null;
let isConnected = false;

const connectDB = async () => {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables');
        }

        const { createClient } = require('@supabase/supabase-js');
        supabase = createClient(supabaseUrl, supabaseKey);

        // Simple test query to verify connection
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) throw error;

        console.log(`✅ Supabase Connected Successfully`);
        isConnected = true;
    } catch (error) {
        console.warn(`\n⚠️ Supabase Unreachable: ${error.message}`);
        console.warn(`✨ Falling back to local offline Database (DEMO MODE)!`);
        console.warn(`💾 Using persistent store at backend/data/localDb.json\n`);
        
        supabase = new MockSupabaseClient();
        isConnected = false;
        process.env.DEMO_MODE = 'true';
    }
};

const getIsConnected = () => isConnected;
const getSupabase = () => supabase;

module.exports = connectDB;
module.exports.getIsConnected = getIsConnected;
module.exports.supabase = supabase; // Note: won't be initialized until connectDB is called, so best to use getSupabase
module.exports.getSupabase = getSupabase;

