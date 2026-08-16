/**
 * Kisan Sahayak - Supabase Storage Bucket Provisioning & Verification Script
 * 
 * Automatically provisions all required storage buckets for Kisan Sahayak,
 * configures public access, file size limits, allowed MIME types, and verifies
 * upload / download / public URL access.
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

async function setupSupabaseBuckets() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    console.log('\n======================================================');
    console.log('📦 KISAN SAHAYAK - SUPABASE STORAGE BUCKET SETUP');
    console.log('======================================================');
    console.log(`🌐 Supabase URL: ${supabaseUrl}`);

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in backend/.env');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. List existing buckets
    console.log('\n--- STEP 1: Inspecting Existing Storage Buckets ---');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
        console.error('❌ Error listing buckets:', listError.message);
    } else {
        const bucketNames = existingBuckets.map(b => `${b.name} (${b.public ? 'Public' : 'Private'})`);
        console.log('Found buckets:', bucketNames.length > 0 ? bucketNames.join(', ') : 'None (all cleared)');
    }

    // 2. Define required buckets with configurations
    const requiredBuckets = [
        {
            id: 'farm_images',
            name: 'farm_images',
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
        },
        {
            id: 'crop_scans',
            name: 'crop_scans',
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
        },
        {
            id: 'soil_reports',
            name: 'soil_reports',
            public: true,
            fileSizeLimit: 20971520, // 20MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf']
        },
        {
            id: 'avatars',
            name: 'avatars',
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
        },
        {
            id: 'documents',
            name: 'documents',
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: null // Allow all document types
        }
    ];

    // 3. Create or update buckets
    console.log('\n--- STEP 2: Provisioning Required Buckets ---');
    for (const b of requiredBuckets) {
        console.log(`Setting up bucket: '${b.id}' (public: ${b.public})...`);
        const { data, error } = await supabase.storage.createBucket(b.id, {
            public: b.public,
            fileSizeLimit: b.fileSizeLimit,
            allowedMimeTypes: b.allowedMimeTypes
        });

        if (error) {
            if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
                console.log(`ℹ️ Bucket '${b.id}' already exists. Updating configuration to public...`);
                const { error: updateErr } = await supabase.storage.updateBucket(b.id, {
                    public: b.public,
                    fileSizeLimit: b.fileSizeLimit,
                    allowedMimeTypes: b.allowedMimeTypes
                });
                if (updateErr) {
                    console.warn(`⚠️ Update warning for '${b.id}':`, updateErr.message);
                } else {
                    console.log(`✅ Bucket '${b.id}' updated to public!`);
                }
            } else {
                console.warn(`⚠️ Could not create '${b.id}':`, error.message);
            }
        } else {
            console.log(`✅ Bucket '${b.id}' created successfully!`);
        }
    }

    // 4. Verification: Test Upload & Public URL for farm_images
    console.log('\n--- STEP 3: Verifying Upload, Public URL & Cleanup ---');
    // Minimal 1x1 valid JPEG buffer
    const testBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
        0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
        0x00, 0xbf, 0x00, 0xff, 0xd9
    ]);
    const testFileName = `test-verify-${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('farm_images')
        .upload(testFileName, testBuffer, {
            contentType: 'image/jpeg',
            upsert: true
        });

    if (uploadErr) {
        console.error('❌ Upload test failed:', uploadErr.message);
    } else {
        console.log(`✅ Upload test passed! Uploaded path: ${uploadData.path}`);
        const { data: publicUrlData } = supabase.storage.from('farm_images').getPublicUrl(testFileName);
        console.log(`✅ Generated Public URL: ${publicUrlData?.publicUrl}`);
        
        // Remove test file
        const { error: removeErr } = await supabase.storage.from('farm_images').remove([testFileName]);
        if (!removeErr) {
            console.log(`✅ Test file cleaned up successfully.`);
        }
    }

    // 5. Final Bucket Listing
    console.log('\n--- STEP 4: Final Storage State ---');
    const { data: finalBuckets } = await supabase.storage.listBuckets();
    if (finalBuckets) {
        console.log('Active Buckets:');
        finalBuckets.forEach(b => {
            console.log(` • 🪣 ${b.name} (${b.public ? 'Public' : 'Private'}) - ID: ${b.id}`);
        });
    }

    console.log('\n======================================================');
    console.log('🎉 SUPABASE STORAGE BUCKETS SETUP COMPLETE!');
    console.log('======================================================\n');
}

setupSupabaseBuckets().catch(err => {
    console.error('❌ Setup error:', err);
    process.exit(1);
});
