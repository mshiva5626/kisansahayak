const { getSupabase } = require('../config/db');

// Create a new farm
exports.createFarm = async (req, res) => {
    try {
        const supabase = getSupabase();
        const userId = req.user._id || req.user.id;

        const farmData = {
            user_id: userId,
            farm_name: req.body.farm_name || req.body.name,
            state: req.body.state || '',
            area: req.body.area || '',
            terrain_type: (req.body.terrain_type || req.body.terrain || '').toLowerCase(),
            water_source: (req.body.water_source || req.body.waterSource || '').toLowerCase(),
            crop_type: req.body.crop_type || req.body.crop || '',
            sowing_date: req.body.sowing_date || req.body.sowingDate || null,
            latitude: req.body.latitude || (req.body.location && req.body.location.lat) || null,
            longitude: req.body.longitude || (req.body.location && req.body.location.lon) || null
        };

        const { data: farm, error } = await supabase
            .from('farms')
            .insert([farmData])
            .select()
            .single();

        if (error) throw error;

        farm._id = farm.id;

        res.status(201).json({ farm });
    } catch (error) {
        console.error('Create farm error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all farms for a user
exports.getFarms = async (req, res) => {
    try {
        const supabase = getSupabase();
        const userId = req.user._id || req.user.id;

        const { data: rawFarms, error } = await supabase
            .from('farms')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const farms = rawFarms.map(f => ({ ...f, _id: f.id }));
        res.status(200).json({ farms });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single farm by ID
exports.getFarmById = async (req, res) => {
    try {
        const supabase = getSupabase();
        const userId = req.user._id || req.user.id;

        const { data: farm, error } = await supabase
            .from('farms')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', userId)
            .maybeSingle();

        if (error || !farm) return res.status(404).json({ message: 'Farm not found' });

        farm._id = farm.id;
        res.status(200).json({ farm });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a farm
exports.updateFarm = async (req, res) => {
    try {
        const supabase = getSupabase();
        const userId = req.user._id || req.user.id;

        const fields = ['farm_name', 'state', 'area', 'terrain_type', 'water_source', 'crop_type', 'sowing_date', 'latitude', 'longitude'];
        const updates = {};

        fields.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });
        updates.updated_at = new Date().toISOString();

        const { data: farm, error } = await supabase
            .from('farms')
            .update(updates)
            .eq('id', req.params.id)
            .eq('user_id', userId)
            .select()
            .maybeSingle();

        if (error || !farm) return res.status(404).json({ message: 'Farm not found' });

        farm._id = farm.id;
        res.status(200).json({ farm });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a farm
exports.deleteFarm = async (req, res) => {
    try {
        const supabase = getSupabase();
        const userId = req.user._id || req.user.id;

        const { error, count } = await supabase
            .from('farms')
            .delete({ count: 'exact' })
            .eq('id', req.params.id)
            .eq('user_id', userId);

        if (error || count === 0) return res.status(404).json({ message: 'Farm not found' });

        res.status(200).json({ message: 'Farm deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
