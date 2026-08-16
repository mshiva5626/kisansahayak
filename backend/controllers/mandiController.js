const { fetchMandiPrices, getTrendingMandiRates, getMandiSources } = require('../services/mandiService');
const { getSupabase } = require('../config/db');

/**
 * Controller to fetch Mandi Prices for Dashboard & Live Market Prices screen
 */
exports.getMandiPrices = async (req, res) => {
    try {
        const user = req.user || {};
        const state = req.query.state || user.state || 'Madhya Pradesh';
        const district = req.query.district || user.district || 'Indore';
        const farmId = req.query.farm_id;
        const searchQuery = req.query.search || '';
        let crop = req.query.crop || '';

        // If farmId is provided and no crop was specified in query, fetch farm's crop
        if (farmId && !crop) {
            try {
                const supabase = getSupabase();
                const { data: farm } = await supabase
                    .from('farms')
                    .select('crop_type, state, district')
                    .eq('id', farmId)
                    .maybeSingle();

                if (farm?.crop_type) {
                    crop = farm.crop_type;
                }
            } catch (e) {
                console.warn('Farm lookup skipped:', e.message);
            }
        }

        // Fetch Verified Real-time Mandi Prices
        const prices = await fetchMandiPrices(state, district, crop, searchQuery);

        res.status(200).json({
            crop: crop || 'All Commodities',
            state: state,
            district: district,
            total_mandis: prices.length,
            verified_by: "Directorate of Marketing & Inspection (Agmarknet) & e-NAM (Govt of India)",
            prices: prices
        });

    } catch (error) {
        console.error('Mandi Controller Error:', error);
        res.status(500).json({
            message: error.message || "Mandi price data unavailable for your area."
        });
    }
};

/**
 * Controller to fetch Trending Mandi Rates
 */
exports.getTrendingPrices = async (req, res) => {
    try {
        const trending = await getTrendingMandiRates();
        res.status(200).json({
            count: trending.length,
            trending: trending
        });
    } catch (error) {
        console.error('Trending Mandi Error:', error);
        res.status(500).json({ message: "Failed to fetch trending mandi rates" });
    }
};

/**
 * Controller to fetch Authentic Mandi Sources
 */
exports.getSources = async (req, res) => {
    try {
        const sources = getMandiSources();
        res.status(200).json(sources);
    } catch (error) {
        console.error('Mandi Sources Error:', error);
        res.status(500).json({ message: "Failed to fetch mandi sources" });
    }
};
