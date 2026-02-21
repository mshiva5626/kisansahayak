const { getSupabase } = require('../config/db');
const schemeSeedData = require('../config/schemeSeedData');
const { getSchemeAdvice, generateRealtimeSchemes } = require('../services/schemeAiService');

// Get schemes, filtered by state
exports.getSchemes = async (req, res) => {
    try {
        const supabase = getSupabase();
        const state = req.query.state || req.user?.state;

        let query = supabase.from('schemes').select('*');

        if (state) {
            query = query.or(`scheme_type.eq.central,state.ilike.%${state}%`);
        }

        const { data: rawSchemes, error } = await query
            .order('scheme_type', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;

        // Map id to _id for frontend compatibility
        const schemes = rawSchemes.map(s => ({ ...s, _id: s.id }));

        res.status(200).json({ schemes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single scheme by ID
exports.getSchemeById = async (req, res) => {
    try {
        const supabase = getSupabase();

        const { data: scheme, error } = await supabase
            .from('schemes')
            .select('*')
            .eq('id', req.params.id)
            .maybeSingle();

        if (error || !scheme) return res.status(404).json({ message: 'Scheme not found' });

        scheme._id = scheme.id;
        res.status(200).json({ scheme });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Seed initial schemes data
exports.seedSchemes = async (req, res) => {
    try {
        const supabase = getSupabase();

        const { count, error: countError } = await supabase
            .from('schemes')
            .select('id', { count: 'exact', head: true });

        if (countError) throw countError;

        if (count > 0) {
            return res.status(200).json({ message: `Schemes already seeded (${count} found)` });
        }

        const { error: insertError } = await supabase
            .from('schemes')
            .insert(schemeSeedData);

        if (insertError) throw insertError;

        return res.status(201).json({ message: `${schemeSeedData.length} schemes seeded successfully` });
    } catch (error) {
        console.error('Seed schemes error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Handle AI Chat regarding Schemes
exports.chatSchemes = async (req, res) => {
    try {
        const { messages, schemesContext } = req.body;
        const userState = req.user?.state || '';

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ message: 'Valid messages array is required.' });
        }

        const responseText = await getSchemeAdvice(messages, schemesContext || [], userState);
        res.status(200).json({ response: responseText });
    } catch (error) {
        console.error('Scheme Chat Error:', error);
        res.status(500).json({ message: 'Failed to generate AI response for schemes.' });
    }
};

// Handle Realtime AI Scheme Generation
exports.realtimeSchemes = async (req, res) => {
    try {
        const state = req.query.state || req.user?.state || 'India';
        const schemes = await generateRealtimeSchemes(state);
        res.status(200).json({ schemes });
    } catch (error) {
        console.error('Realtime Schemes Error:', error);
        res.status(500).json({ message: 'Failed to generate real-time schemes from AI.' });
    }
};
