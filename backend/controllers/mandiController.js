const { fetchMandiPrices } = require('../services/mandiService');
const { getSupabase } = require('../config/db');

/**
 * Controller to fetch Mandi Prices for Dashboard
 */
exports.getMandiPrices = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const state = req.query.state || req.user.state;
        const district = req.query.district || req.user.district;
        const farmId = req.query.farm_id;

        if (!farmId) {
            return res.status(400).json({ message: "Farm ID is required to determine the crop." });
        }
        if (!state || !district) {
            return res.status(400).json({ message: "Farmer State and District are required to locate nearby markets." });
        }

        // Fetch farm details to get the active crop
        const supabase = getSupabase();
        const { data: farm, error: farmError } = await supabase
            .from('farms')
            .select('crop_type')
            .eq('id', farmId)
            .single();

        if (farmError || !farm) {
            return res.status(404).json({ message: "Farm not found." });
        }

        const crop = farm.crop_type;
        if (!crop) {
            return res.status(400).json({ message: "No crop is set for this farm." });
        }

        // Fetch Real-time Prices
        const prices = await fetchMandiPrices(state, district, crop);

        res.status(200).json({
            crop: crop,
            state: state,
            district: district,
            prices: prices
        });

    } catch (error) {
        console.error('Mandi Controller Error:', error);
        res.status(500).json({
            message: error.message || "Mandi price data unavailable for your area."
        });
    }
};
