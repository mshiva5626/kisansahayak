/**
 * Bootstrap Supabase Tables using the Supabase JS client
 * Creates all tables by attempting inserts/selects to detect missing tables,
 * then using the Supabase management API via their query endpoint
 * 
 * Usage: node scripts/bootstrap_supabase.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_KEY;
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Full SQL schema
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    age INTEGER,
    mobile_number TEXT,
    land_size TEXT,
    experience_years TEXT,
    estimated_revenue TEXT,
    has_degree BOOLEAN DEFAULT FALSE,
    education_qualification TEXT,
    role TEXT DEFAULT 'verified_farmer',
    preferred_language TEXT DEFAULT 'en',
    farming_type TEXT DEFAULT 'Conventional',
    state TEXT,
    district TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.farms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    farm_name TEXT,
    state TEXT,
    district TEXT,
    area TEXT,
    unit TEXT DEFAULT 'Acres',
    terrain_type TEXT,
    water_source TEXT,
    crop_type TEXT,
    crop_variety TEXT,
    soil_type TEXT,
    sowing_date TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.images (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    farm_id TEXT,
    file_name TEXT,
    storage_url TEXT,
    public_url TEXT,
    analysis_result JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.advisories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    farm_id TEXT,
    session_id TEXT,
    query TEXT,
    response TEXT,
    language TEXT DEFAULT 'en',
    image_analysis TEXT,
    messages JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    title TEXT,
    message TEXT,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.soil_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    farm_id TEXT,
    scan_type TEXT DEFAULT 'photo',
    soil_data JSONB,
    npk_estimate JSONB,
    recommendations JSONB,
    report_text TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    farm_id TEXT,
    user_id TEXT,
    moisture DOUBLE PRECISION,
    temperature DOUBLE PRECISION,
    humidity DOUBLE PRECISION,
    ph DOUBLE PRECISION,
    nitrogen DOUBLE PRECISION,
    phosphorus DOUBLE PRECISION,
    potassium DOUBLE PRECISION,
    conductivity DOUBLE PRECISION,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for service-role access (or make policies permissive)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings DISABLE ROW LEVEL SECURITY;
`;

async function createTablesViaAPI() {
    console.log('\n🚀 Kisan Sahayak - Supabase Bootstrap');
    console.log('=====================================');
    console.log(`Project: ${PROJECT_REF}`);
    console.log(`URL: ${SUPABASE_URL}\n`);

    // Try the Supabase /pg endpoint (available in some plans)
    const endpoints = [
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
        `${SUPABASE_URL}/pg`
    ];

    // Get a personal access token from env if available
    const PAT = process.env.SUPABASE_PAT;
    
    for (const endpoint of endpoints) {
        console.log(`Trying endpoint: ${endpoint}`);
        
        const headers = { 'Content-Type': 'application/json' };
        if (PAT) {
            headers['Authorization'] = `Bearer ${PAT}`;
        } else {
            headers['Authorization'] = `Bearer ${SERVICE_KEY}`;
            headers['apikey'] = SERVICE_KEY;
        }
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query: SCHEMA_SQL })
        });
        
        const text = await response.text();
        if (response.ok) {
            console.log('✅ Tables created via management API!');
            return true;
        }
        console.log(`  Failed (${response.status}): ${text.substring(0, 200)}`);
    }
    return false;
}

async function testTablesExist() {
    const tables = ['users', 'farms', 'images', 'advisories', 'notifications', 'soil_reports', 'sensor_readings'];
    const results = {};
    
    for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(0);
        results[table] = error ? `❌ ${error.message}` : '✅ exists';
    }
    return results;
}

async function main() {
    // First check what currently exists
    console.log('\n📊 Checking existing tables...');
    const before = await testTablesExist();
    console.log(before);
    
    const allExist = Object.values(before).every(v => v.startsWith('✅'));
    
    if (allExist) {
        console.log('\n✅ All tables already exist! Database is ready.');
        return;
    }
    
    // Try management API
    const success = await createTablesViaAPI();
    
    if (!success) {
        console.log('\n============================================');
        console.log('⚠️  MANUAL ACTION REQUIRED');
        console.log('============================================');
        console.log('The automated table creation could not complete.');
        console.log('Please follow these steps:\n');
        console.log('1. Go to: https://supabase.com/dashboard/project/fcnvihbpuxhkwjvxdrim/sql/new');
        console.log('2. Copy and run the SQL from: backend/scripts/schema.sql');
        console.log('\nThe schema.sql file has been created for you.\n');
        
        // Write the SQL to a file for manual use
        const fs = require('fs');
        const path = require('path');
        fs.writeFileSync(path.join(__dirname, 'schema.sql'), SCHEMA_SQL, 'utf8');
        console.log('✅ schema.sql written to backend/scripts/schema.sql');
    }
    
    // Check again
    console.log('\n📊 Checking tables after setup attempt...');
    const after = await testTablesExist();
    console.log(after);
}

main().catch(console.error);
