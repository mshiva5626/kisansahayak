/**
 * Supabase Table Setup Script
 * Run once to create all required tables in Supabase
 * Usage: node scripts/create_supabase_tables.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fcnvihbpuxhkwjvxdrim.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_KEY;
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];

const SQL = `
-- ============================================================
-- KISAN SAHAYAK - Complete Database Schema
-- ============================================================

-- Users table
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

-- Farms table
CREATE TABLE IF NOT EXISTS public.farms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Images table
CREATE TABLE IF NOT EXISTS public.images (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    farm_id TEXT REFERENCES public.farms(id) ON DELETE SET NULL,
    file_name TEXT,
    storage_url TEXT,
    public_url TEXT,
    analysis_result JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advisories / Chat Sessions table
CREATE TABLE IF NOT EXISTS public.advisories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    farm_id TEXT REFERENCES public.farms(id) ON DELETE SET NULL,
    session_id TEXT,
    query TEXT,
    response TEXT,
    language TEXT DEFAULT 'en',
    image_analysis TEXT,
    messages JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Soil Reports table
CREATE TABLE IF NOT EXISTS public.soil_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    farm_id TEXT REFERENCES public.farms(id) ON DELETE SET NULL,
    scan_type TEXT DEFAULT 'photo',
    soil_data JSONB,
    npk_estimate JSONB,
    recommendations JSONB,
    report_text TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensor Readings table (ESP32 IoT data)
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

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS) - Permissive for service key
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any, then create permissive ones for service role
-- (Service role bypasses RLS automatically, these are for anon/client usage)

DROP POLICY IF EXISTS "service_all_users" ON public.users;
DROP POLICY IF EXISTS "service_all_farms" ON public.farms;
DROP POLICY IF EXISTS "service_all_images" ON public.images;
DROP POLICY IF EXISTS "service_all_advisories" ON public.advisories;
DROP POLICY IF EXISTS "service_all_notifications" ON public.notifications;
DROP POLICY IF EXISTS "service_all_soil_reports" ON public.soil_reports;
DROP POLICY IF EXISTS "service_all_sensor_readings" ON public.sensor_readings;

CREATE POLICY "service_all_users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_farms" ON public.farms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_images" ON public.images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_advisories" ON public.advisories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_soil_reports" ON public.soil_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_sensor_readings" ON public.sensor_readings FOR ALL USING (true) WITH CHECK (true);

SELECT 'Tables created successfully!' as status;
`;

async function runSQL(sql) {
    const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
    
    console.log(`\n🚀 Creating tables in Supabase project: ${PROJECT_REF}`);
    console.log(`📡 URL: ${SUPABASE_URL}\n`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({ query: sql })
    });

    const text = await response.text();
    
    if (!response.ok) {
        console.error(`❌ Management API failed (${response.status}):`, text.substring(0, 500));
        console.log('\n⚠️  Trying direct SQL via pg connection string...\n');
        return false;
    }

    const result = JSON.parse(text);
    console.log('✅ SQL executed successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
    return true;
}

// Alternative: use the Supabase REST API with a raw SQL call via the postgres connection
async function tryAlternative() {
    // Try using the Supabase JDBC-like query endpoint
    const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
    
    console.log('\n🔄 Trying alternative RPC approach...');
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({ sql: SQL })
    });

    const text = await response.text();
    console.log(`Response (${response.status}):`, text.substring(0, 500));
}

runSQL(SQL).then(success => {
    if (!success) {
        return tryAlternative();
    }
}).catch(err => {
    console.error('Fatal error:', err.message);
});
