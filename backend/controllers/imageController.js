const { getSupabase } = require('../config/db');
const { analyzeImageWithAI } = require('../services/imageAnalysisService');
const path = require('path');

// Helper
async function getFarm(farmId, userId) {
    const supabase = getSupabase();
    const { data } = await supabase
        .from('farms')
        .select('*')
        .eq('id', farmId)
        .eq('user_id', userId)
        .maybeSingle();

    if (data) data._id = data.id;
    return data;
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

        const farm = await getFarm(farm_id, userId);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        const fs = require('fs');
        const fileBuffer = fs.readFileSync(req.file.path);
        const fileName = req.file.filename;

        console.log(`\n--- STORAGE UPLOAD ---`);
        console.log(`Processing upload for: ${fileName}`);

        const supabase = getSupabase();
        let image_url = `/uploads/${fileName}`;

        // Attempt to upload to Supabase Storage with resilient fallback
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

        const { data: image, error } = await supabase
            .from('images')
            .insert([{
                farm_id,
                image_url,
                image_type: image_type || 'field'
            }])
            .select()
            .single();

        if (error) throw error;
        image._id = image.id;

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

        const farm = await getFarm(image.farm_id, userId);

        let imagePath = image.image_url;

        // If it's a local/relative URL, resolve to absolute filesystem path
        if (!imagePath.startsWith('http')) {
            const cleanPath = imagePath.replace(/^\/?uploads\//, '');
            imagePath = path.join(__dirname, '..', 'uploads', cleanPath);
        }

        console.log(`\n--- TRIGGERING AI VISION ANALYSIS ---`);
        console.log(`Analyzing image: ${imagePath}`);

        const analysisResult = await analyzeImageWithAI(imagePath, image.image_type, farm);

        // Save analysis result
        const { error: updateError } = await supabase
            .from('images')
            .update({
                analysis_result: analysisResult.analysis,
                confidence_score: analysisResult.confidence_score
            })
            .eq('id', image.id);

        if (updateError) throw updateError;

        res.status(200).json({
            image_id: image.id,
            image_type: image.image_type,
            analysis_result: analysisResult.analysis,
            confidence_score: analysisResult.confidence_score,
            indicators: analysisResult.indicators
        });
    } catch (error) {
        console.error('Analyze image error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all images for a farm
exports.getImagesByFarm = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const farm = await getFarm(req.params.farmId, userId);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

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
