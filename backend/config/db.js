const { createClient } = require('@supabase/supabase-js');
const MockSupabaseClient = require('./mockSupabase');

let realSupabase = null;
let mockSupabase = new MockSupabaseClient();
let isConnected = false;

class HybridSupabaseClient {
    constructor(realClient, mockClient) {
        this.real = realClient;
        this.mock = mockClient;
        this.auth = realClient ? realClient.auth : null;
        this.storage = realClient ? realClient.storage : (mockClient ? mockClient.storage : null);
    }

    from(tableName) {
        // Use persistent mock store for tables while auth uses native Supabase Auth
        return this.mock.from(tableName);
    }
}

let hybridClient = null;

const connectDB = async () => {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables');
        }

        realSupabase = createClient(supabaseUrl, supabaseKey);

        // Verify Supabase Auth connectivity
        const { data, error } = await realSupabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (error) throw error;

        console.log(`✅ Supabase Auth Connected Successfully to ${supabaseUrl}`);
        isConnected = true;
        hybridClient = new HybridSupabaseClient(realSupabase, mockSupabase);
    } catch (error) {
        console.warn(`\n⚠️ Supabase Auth Unreachable: ${error.message}`);
        console.warn(`✨ Falling back to local offline Database (DEMO MODE)!`);
        console.warn(`💾 Using persistent store at backend/data/localDb.json\n`);
        
        isConnected = false;
        hybridClient = new HybridSupabaseClient(null, mockSupabase);
        process.env.DEMO_MODE = 'true';
    }
};

const getIsConnected = () => isConnected;
const getSupabase = () => hybridClient || (realSupabase ? new HybridSupabaseClient(realSupabase, mockSupabase) : mockSupabase);
const getRealSupabase = () => realSupabase;

module.exports = connectDB;
module.exports.getIsConnected = getIsConnected;
module.exports.getSupabase = getSupabase;
module.exports.getRealSupabase = getRealSupabase;


