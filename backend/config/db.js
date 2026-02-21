const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let isConnected = false;

const connectDB = async () => {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables');
        }

        supabase = createClient(supabaseUrl, supabaseKey);

        // Simple test query to verify connection
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) throw error;

        console.log(`✅ Supabase Connected Successfully`);
        isConnected = true;
    } catch (error) {
        console.error(`\n❌ Supabase Connection Error: ${error.message}`);
        console.error('This application REQUIRES a real Database connection to function properly.');
        console.error('Exiting process to prevent mock fallback behavior.\n');
        process.exit(1);
    }
};

const getIsConnected = () => isConnected;
const getSupabase = () => supabase;

module.exports = connectDB;
module.exports.getIsConnected = getIsConnected;
module.exports.supabase = supabase; // Note: won't be initialized until connectDB is called, so best to use getSupabase
module.exports.getSupabase = getSupabase;
