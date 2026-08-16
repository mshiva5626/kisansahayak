-- ==============================================================================
-- KISAN SAHAYAK - SUPABASE STORAGE BUCKETS & RLS POLICIES
-- ==============================================================================
-- Run this SQL in your Supabase SQL Editor if you wish to enforce Row Level Security
-- and public access policies on the storage buckets.
-- ==============================================================================

-- 1. Create Storage Buckets (if not already created via API)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('farm_images', 'farm_images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']),
    ('crop_scans', 'crop_scans', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
    ('soil_reports', 'soil_reports', true, 20971520, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('documents', 'documents', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Enable Public Read Access for farm_images
CREATE POLICY "Public Access farm_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'farm_images');

-- 3. Allow Authenticated & Public Uploads for farm_images
CREATE POLICY "Allow Uploads farm_images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'farm_images');

-- 4. Allow Updates & Deletions for farm_images
CREATE POLICY "Allow Updates farm_images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'farm_images');

CREATE POLICY "Allow Deletes farm_images"
ON storage.objects FOR DELETE
USING (bucket_id = 'farm_images');

-- 5. Policies for crop_scans
CREATE POLICY "Public Access crop_scans"
ON storage.objects FOR SELECT
USING (bucket_id = 'crop_scans');

CREATE POLICY "Allow Uploads crop_scans"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'crop_scans');

-- 6. Policies for soil_reports
CREATE POLICY "Public Access soil_reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'soil_reports');

CREATE POLICY "Allow Uploads soil_reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'soil_reports');

-- 7. Policies for avatars
CREATE POLICY "Public Access avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Allow Uploads avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');
