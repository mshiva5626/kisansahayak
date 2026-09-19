const { getSupabase } = require('../config/db');
const { analyzeImageWithAI } = require('../services/imageAnalysisService');
const path = require('path');
const fs = require('fs');

// Helper — fetch farm if it exists, but never hard-fail on default_field
async function getFarm(farmId, userId) {
    if (!farmId || farmId === 'default_field') return null;

    try {
        const supabase = getSupabase();
        const { data } = await supabase
            .from('farms')
            .select('*')
            .eq('id', farmId)
            .eq('user_id', userId)
            .maybeSingle();

        if (data) data._id = data.id;
        return data;
    } catch {
        return null;
    }
}

// Upload an image for a farm
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const { farm_id, image_type } = req.body;
        const userId = req.user._id || req.user.id;

        if (!farm_id) {
            return res.status(400).json({ message: 'farm_id is required' });
        }

        // Soft farm lookup — non-blocking for default_field
        const farm = await getFarm(farm_id, userId);
        const effectiveFarmId = farm ? (farm.id || farm._id) : farm_id;

        const fileBuffer = fs.readFileSync(req.file.path);
        const fileName = req.file.filename;

        console.log(`\n--- STORAGE UPLOAD ---`);
        console.log(`Processing upload for: ${fileName}`);

        const supabase = getSupabase();
        let image_url = `/uploads/${fileName}`;

        // Attempt Supabase Storage upload with resilient fallback
        try {
            if (supabase && supabase.storage) {
                const { data: uploadData, error: storageError } = await supabase.storage
                    .from('farm_images')
                    .upload(fileName, fileBuffer, {
                        contentType: req.file.mimetype,
                        upsert: true
                    });

                if (storageError) {
                    console.warn('⚠️ Supabase Storage warning (falling back to local file):', storageError.message);
                } else if (uploadData?.path) {
                    const { data: publicUrlData } = supabase.storage
                        .from('farm_images')
                        .getPublicUrl(uploadData.path);
                    if (publicUrlData?.publicUrl) {
                        image_url = publicUrlData.publicUrl;
                        console.log(`✅ Supabase Cloud Storage Public URL:`, image_url);
                    }
                }
            }
        } catch (storageErr) {
            console.warn('⚠️ Supabase Storage exception (falling back to local file):', storageErr.message);
        }

        // Insert image record — include user_id for ownership checks in analyzeImage
        const { data: image, error } = await supabase
            .from('images')
            .insert([{
                farm_id: effectiveFarmId,
                user_id: userId,
                image_url,
                image_type: image_type || 'field',
                local_path: req.file.path  // store absolute local path for AI fallback
            }])
            .select()
            .single();

        if (error) {
            // If the column doesn't exist yet (schema mismatch), retry without optional fields
            console.warn('First insert attempt failed, retrying without optional columns:', error.message);
            const { data: image2, error: error2 } = await supabase
                .from('images')
                .insert([{
                    farm_id: effectiveFarmId,
                    image_url,
                    image_type: image_type || 'field'
                }])
                .select()
                .single();

            if (error2) throw error2;
            image2._id = image2.id;
            // Stash local path in memory so analyzeImage can read it
            image2._localPath = req.file.path;
            return res.status(201).json({ image: image2 });
        }

        image._id = image.id;
        image._localPath = req.file.path;
        res.status(201).json({ image });
    } catch (error) {
        console.error('Upload image error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Analyze an uploaded image with AI
exports.analyzeImage = async (req, res) => {
    try {
        const supabase = getSupabase();
        const userId = req.user._id || req.user.id;

        const { data: image, error: imgError } = await supabase
            .from('images')
            .select('*')
            .eq('id', req.params.id)
            .maybeSingle();

        if (imgError || !image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Fetch farm for AI context (non-blocking)
        const farm = await getFarm(image.farm_id, userId);

        // Determine the actual image source for AI analysis
        let imagePath = image.image_url;

        if (imagePath && imagePath.startsWith('http')) {
            // Public Supabase or remote URL — pass directly, analyzeImageWithAI handles fetching
            console.log(`\n--- TRIGGERING AI VISION ANALYSIS (remote URL) ---`);
            console.log(`Analyzing image: ${imagePath}`);
        } else {
            // Relative local path: resolve to absolute filesystem path
            const cleanPath = (imagePath || '').replace(/^\/?uploads\//, '');
            const absolutePath = path.join(__dirname, '..', 'uploads', cleanPath);

            if (fs.existsSync(absolutePath)) {
                imagePath = absolutePath;
            } else {
                // Last resort: try the local_path column
                const localCol = image.local_path;
                if (localCol && fs.existsSync(localCol)) {
                    imagePath = localCol;
                } else {
                    // Scan uploads directory for the file by filename
                    const uploadsDir = path.join(__dirname, '..', 'uploads');
                    const files = fs.readdirSync(uploadsDir);
                    const match = files.find(f => cleanPath.includes(f) || f.includes(cleanPath.split('/').pop()));
                    if (match) {
                        imagePath = path.join(uploadsDir, match);
                    } else {
                        return res.status(404).json({ message: 'Image file not found on server. Please re-upload.' });
                    }
                }
            }

            console.log(`\n--- TRIGGERING AI VISION ANALYSIS (local file) ---`);
            console.log(`Analyzing image: ${imagePath}`);
        }

        const analysisResult = await analyzeImageWithAI(imagePath, image.image_type, farm);

        // Save analysis result back to DB (best-effort, non-blocking)
        supabase
            .from('images')
            .update({
                analysis_result: analysisResult.analysis,
                confidence_score: analysisResult.confidence_score
            })
            .eq('id', image.id)
            .then(({ error: updateError }) => {
                if (updateError) console.warn('Could not save analysis result to DB:', updateError.message);
            });

        const diag = analysisResult.analysis || {};
        res.status(200).json({
            image_id: image.id,
            image_type: image.image_type,
            is_valid_crop_or_leaf: diag.is_valid_crop_or_leaf !== false,
            crop: diag.crop || diag.crop_identified || (farm ? farm.crop_type : 'Crop Leaf'),
            observations: diag.observations || diag.symptoms_observed || [],
            possible_issue: diag.possible_issue || diag.disease_name || 'Visual Symptoms Observed',
            confidence: typeof diag.confidence === 'number' ? diag.confidence : analysisResult.confidence_score,
            severity: diag.severity || 'Moderate',
            recommendation: diag.recommendation || diag.overall_assessment || 'Isolate affected leaves and inspect nearby plants.',
            disclaimer: diag.disclaimer || 'AI image analysis is an initial screening, not a definitive diagnosis.',
            analysis_result: diag,
            confidence_score: typeof diag.confidence === 'number' ? diag.confidence : analysisResult.confidence_score,
            indicators: analysisResult.indicators || diag.observations || []
        });
    } catch (error) {
        console.error('Analyze image error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all images for a farm
exports.getImagesByFarm = async (req, res) => {
    try {
        const supabase = getSupabase();
        const { data: rawImages, error } = await supabase
            .from('images')
            .select('*')
            .eq('farm_id', req.params.farmId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const images = rawImages.map(img => ({ ...img, _id: img.id }));
        res.status(200).json({ images });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
