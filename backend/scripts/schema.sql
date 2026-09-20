
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
