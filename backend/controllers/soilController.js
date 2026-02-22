const { getSupabase } = require('../config/db');
const { analyzeSoilImage } = require('../services/soilAiService');

exports.analyzeSoil = async (req, res) => {
    try {
        const { farmId, image } = req.body;

        if (!image) {
            return res.status(400).json({ message: "Soil image is required." });
        }

        // Build farm context from available data
        let farmContext = {
            state: req.user?.state || 'Unknown',
            district: req.user?.district || 'Unknown',
            crop_type: 'General',
            land_type: 'Plain'
        };

        // Optionally enrich with farm-specific data
        if (farmId) {
            try {
                const supabase = getSupabase();
                const { data: farm, error } = await supabase
                    .from('farms')
                    .select('*')
                    .eq('id', farmId)
                    .single();

                if (!error && farm) {
                    farmContext.crop_type = farm.crop_type || farmContext.crop_type;
                    farmContext.land_type = farm.soil_type || farmContext.land_type;
                    if (farm.location?.state) farmContext.state = farm.location.state;
                    if (farm.location?.district) farmContext.district = farm.location.district;
                }
            } catch (dbErr) {
                console.warn("Could not fetch farm context:", dbErr.message);
            }
        }

        console.log("Analyzing soil with context:", JSON.stringify(farmContext));

        // analyzeSoilImage always returns a report (never throws)
        const report = await analyzeSoilImage(image, farmContext);

        return res.status(200).json({ message: "Soil analyzed successfully", report });

    } catch (error) {
        console.error("Soil Controller Error:", error.message, error.stack);
        return res.status(500).json({ message: "Failed to analyze soil image. Server error." });
    }
};
