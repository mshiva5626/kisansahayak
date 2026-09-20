/**
 * Kisan Sahayak — Unified Soil Intelligence Controller
 * 
 * Orchestrates: soil photo AI analysis + IoT sensor NPK estimation + fertilizer recommendation
 * Persists reports to database for deployment readiness.
 */

const { getSupabase } = require('../config/db');
const { analyzeSoilImage } = require('../services/soilAiService');
const { estimateNPK, recommendFertilizer, generateCombinedReport, validateWithAgriNet } = require('../services/npkEstimationService');
const crypto = require('crypto');
const uuidv4 = () => (crypto.randomUUID ? crypto.randomUUID() : ('id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)));

// ─── 1. Analyze Soil Photo (reuses existing soilAiService) ──────────────────
exports.analyzePhoto = async (req, res) => {
    try {
        const { farmId, image } = req.body;
        if (!image) {
            return res.status(400).json({ message: 'Soil image is required.' });
        }

        let farmContext = {
            state: req.user?.state || 'India',
            district: req.user?.district || 'General',
            crop_type: 'General',
            land_type: 'Plain'
        };

        if (farmId && farmId !== 'default_field' && farmId !== 'default') {
            try {
                const supabase = getSupabase();
                const { data: farm } = await supabase
                    .from('farms')
                    .select('*')
                    .eq('id', farmId)
                    .maybeSingle();

                if (farm) {
                    farmContext.crop_type = farm.crop_type || farmContext.crop_type;
                    farmContext.land_type = farm.soil_type || farmContext.land_type;
                    if (farm.state) farmContext.state = farm.state;
                    if (farm.district) farmContext.district = farm.district;
                }
            } catch (e) {
                console.warn('Farm context lookup skipped:', e.message);
            }
        }

        const report = await analyzeSoilImage(image, farmContext);
        
        return res.status(200).json({
            message: 'Soil photo analyzed successfully',
            report,
            farmContext
        });
    } catch (error) {
        console.error('Soil Photo Analysis Error:', error.message);
        return res.status(500).json({ message: 'Failed to analyze soil image.' });
    }
};

// ─── 2. Estimate NPK from IoT Sensor Data ──────────────────────────────────
exports.estimateNPKFromSensor = async (req, res) => {
    try {
        const moisture = req.body.moisture ?? req.body.soil_moisture;
        const temperature = req.body.temperature ?? req.body.temp ?? 28;
        const humidity = req.body.humidity ?? 65;
        const soilType = req.body.soilType ?? req.body.soil_type ?? '';
        const cropType = req.body.cropType ?? req.body.crop_type ?? '';
        const farmId = req.body.farmId ?? req.body.farm_id;

        if (moisture === undefined || moisture === null) {
            return res.status(400).json({ message: 'Soil moisture value is required.' });
        }

        // Enrich with farm data if available
        let enrichedSoilType = soilType;
        let enrichedCropType = cropType;

        if (farmId && farmId !== 'default_field' && farmId !== 'default') {
            try {
                const supabase = getSupabase();
                const { data: farm } = await supabase
                    .from('farms')
                    .select('crop_type, soil_type')
                    .eq('id', farmId)
                    .maybeSingle();

                if (farm) {
                    if (!enrichedSoilType && farm.soil_type) enrichedSoilType = farm.soil_type;
                    if (!enrichedCropType && farm.crop_type) enrichedCropType = farm.crop_type;
                }
            } catch (e) {
                console.warn('Farm lookup for NPK skipped:', e.message);
            }
        }

        const npk = estimateNPK({
            moisture: parseFloat(moisture),
            temperature: parseFloat(temperature),
            humidity: parseFloat(humidity),
            soilType: enrichedSoilType,
            cropType: enrichedCropType
        });

        return res.status(200).json({
            message: 'NPK estimated from sensor data',
            estimate: npk
        });
    } catch (error) {
        console.error('NPK Estimation Error:', error.message);
        return res.status(500).json({ message: 'Failed to estimate NPK from sensor data.' });
    }
};

// ─── 3. Recommend Fertilizer ────────────────────────────────────────────────
exports.recommendFertilizerAction = async (req, res) => {
    try {
        const nitrogen = req.body.nitrogen ?? req.body.n ?? req.body.N;
        const phosphorus = req.body.phosphorus ?? req.body.p ?? req.body.P;
        const potassium = req.body.potassium ?? req.body.k ?? req.body.K;
        const moisture = req.body.moisture ?? req.body.soil_moisture ?? 45;
        const temperature = req.body.temperature ?? req.body.temp ?? 28;
        const humidity = req.body.humidity ?? 65;
        const soilType = req.body.soilType ?? req.body.soil_type ?? '';
        const cropType = req.body.cropType ?? req.body.crop_type ?? '';

        if (nitrogen === undefined && phosphorus === undefined && potassium === undefined) {
            return res.status(400).json({ message: 'NPK values are required for fertilizer recommendation.' });
        }

        const rec = recommendFertilizer({
            nitrogen: parseFloat(nitrogen || 0),
            phosphorus: parseFloat(phosphorus || 0),
            potassium: parseFloat(potassium || 0),
            moisture: parseFloat(moisture || 45),
            temperature: parseFloat(temperature || 28),
            humidity: parseFloat(humidity || 65),
            soilType: soilType || '',
            cropType: cropType || ''
        });

        return res.status(200).json({
            message: 'Fertilizer recommendation generated',
            recommendation: rec
        });
    } catch (error) {
        console.error('Fertilizer Recommendation Error:', error.message);
        return res.status(500).json({ message: 'Failed to generate fertilizer recommendation.' });
    }
};

// ─── 4. Generate Combined Report & Persist ──────────────────────────────────
exports.generateReport = async (req, res) => {
    try {
        const { farmId, soilScanResults, iotData } = req.body;
        const userId = req.user?.id || req.user?._id || 'anonymous';

        // Build farm context
        let farmContext = { cropType: '', soilType: '' };
        if (farmId && farmId !== 'default_field' && farmId !== 'default') {
            try {
                const supabase = getSupabase();
                const { data: farm } = await supabase
                    .from('farms')
                    .select('*')
                    .eq('id', farmId)
                    .maybeSingle();

                if (farm) {
                    farmContext = {
                        cropType: farm.crop_type || '',
                        soilType: farm.soil_type || '',
                        state: farm.state || '',
                        district: farm.district || '',
                        farmName: farm.farm_name || farm.name || ''
                    };
                }
            } catch (e) {
                console.warn('Farm lookup for report skipped:', e.message);
            }
        }

        const report = generateCombinedReport({ soilScanResults, iotData, farmContext });

        // Persist to database
        const reportId = `sr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        try {
            const supabase = getSupabase();
            await supabase
                .from('soil_reports')
                .insert([{
                    id: reportId,
                    farm_id: farmId || null,
                    user_id: userId,
                    source: (soilScanResults ? 'photo' : '') + (iotData ? '+iot' : '') || 'manual',
                    report_data: report,
                    created_at: new Date().toISOString()
                }]);
        } catch (dbErr) {
            console.warn('Report persistence skipped:', dbErr.message);
        }

        return res.status(200).json({
            message: 'Combined soil intelligence report generated',
            reportId,
            report
        });
    } catch (error) {
        console.error('Report Generation Error:', error.message);
        return res.status(500).json({ message: 'Failed to generate combined report.' });
    }
};

// ─── 5. Get Report History for a Farm ───────────────────────────────────────
exports.getHistory = async (req, res) => {
    try {
        const farmId = req.params.farmId;
        const supabase = getSupabase();

        const { data: reports, error } = await supabase
            .from('soil_reports')
            .select('*')
            .eq('farm_id', farmId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        return res.status(200).json({
            count: (reports || []).length,
            reports: reports || []
        });
    } catch (error) {
        console.error('Report History Error:', error.message);
        return res.status(200).json({ count: 0, reports: [] });
    }
};

// ─── 6. Ingest IoT Sensor Reading (ESP32 WiFi POST) ────────────────────────
exports.ingestSensorData = async (req, res) => {
    try {
        const { deviceId, farmId, moisture, battery } = req.body;

        if (moisture === undefined) {
            return res.status(400).json({ message: 'Moisture value is required.' });
        }

        // Persist reading
        try {
            const supabase = getSupabase();
            await supabase
                .from('sensor_readings')
                .insert([{
                    id: `rd_${Date.now()}`,
                    device_id: deviceId || 'unknown',
                    farm_id: farmId || null,
                    moisture: parseFloat(moisture),
                    battery: battery !== undefined ? parseFloat(battery) : null,
                    created_at: new Date().toISOString()
                }]);
        } catch (dbErr) {
            console.warn('Sensor reading persistence skipped:', dbErr.message);
        }

        // Return quick NPK estimate
        const npk = estimateNPK({ moisture: parseFloat(moisture) });

        return res.status(200).json({
            message: 'Sensor data received',
            moisture: parseFloat(moisture),
            npkEstimate: npk
        });
    } catch (error) {
        console.error('Sensor Ingest Error:', error.message);
        return res.status(500).json({ message: 'Failed to process sensor data.' });
    }
};

// ─── 7. Get Sensor Reading History ──────────────────────────────────────────
exports.getSensorHistory = async (req, res) => {
    try {
        const farmId = req.params.farmId;
        const supabase = getSupabase();

        let query = supabase
            .from('sensor_readings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (farmId && farmId !== 'all' && farmId !== 'default' && farmId !== 'undefined' && farmId !== 'null') {
            query = query.eq('farm_id', farmId);
        }

        const { data: readings, error } = await query;

        if (error) throw error;

        return res.status(200).json({
            count: (readings || []).length,
            readings: readings || []
        });
    } catch (error) {
        console.error('Sensor History Error:', error.message);
        return res.status(200).json({ count: 0, readings: [] });
    }
};
