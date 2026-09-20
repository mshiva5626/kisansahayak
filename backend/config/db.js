const { createClient } = require('@supabase/supabase-js');

let realSupabase = null;
let isConnected = false;

/**
 * Kisan Sahayak - Database Connection
 * Uses REAL Supabase for all operations (no mock fallback in production)
 * The service role key bypasses RLS completely, enabling full CRUD access
 */
const connectDB = async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ FATAL: Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
        throw new Error('Missing Supabase environment variables');
    }

    // Create Supabase client with service role key (bypasses RLS)
    realSupabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // Verify auth connectivity
        const { error } = await realSupabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (error) throw error;
        console.log(`✅ Supabase Connected: ${supabaseUrl}`);
    } catch (authError) {
        console.warn(`⚠️ Supabase auth.admin check failed: ${authError.message}`);
        // Still proceed — auth.admin may not work with all key formats
        // but from('table') queries will still work with service key
    }

    // Verify table access
    const { error: tableError } = await realSupabase.from('users').select('id').limit(0);
    if (tableError && tableError.code === 'PGRST205') {
        console.error('\n============================================================');
        console.error('❌ CRITICAL: Supabase database tables DO NOT EXIST');
        console.error('============================================================');
        console.error('Tables are missing in your Supabase project.');
        console.error('\n📋 ACTION REQUIRED — Run this SQL in your Supabase Dashboard:');
        console.error('👉 Go to: https://supabase.com/dashboard/project/fcnvihbpuxhkwjvxdrim/sql/new');
        console.error('👉 Paste and run the contents of: backend/scripts/schema.sql');
        console.error('\n🔗 Or visit Render logs for this message and run the SQL manually.');
        console.error('============================================================\n');
        // Continue running in degraded mode so the server stays alive on Render
    } else if (!tableError) {
        console.log('✅ Supabase database tables verified');
        isConnected = true;
    }
};

const getIsConnected = () => isConnected;

/**
 * Returns the real Supabase client (service role key — bypasses RLS)
 * All controllers call this for database operations
 */
const getSupabase = () => {
    if (!realSupabase) {
        // Fallback: create client on-demand if connectDB wasn't called yet
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        if (supabaseUrl && supabaseKey) {
            realSupabase = createClient(supabaseUrl, supabaseKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });
        }
    }
    return realSupabase;
};

const getRealSupabase = () => realSupabase;

module.exports = connectDB;
module.exports.getIsConnected = getIsConnected;
module.exports.getSupabase = getSupabase;
module.exports.getRealSupabase = getRealSupabase;
