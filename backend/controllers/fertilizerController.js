const fertilizerService = require('../services/fertilizerService');

// Official GOI NBS Subsidy Rates (₹)
const FERTILIZER_CATALOG = {
    urea: { id: 'urea', name: 'IFFCO Neem Coated Urea', bagWeight: 45, mrp: 266.50, commissionRate: 0.035 },
    dap: { id: 'dap', name: 'IFFCO Di-Ammonium Phosphate (DAP)', bagWeight: 50, mrp: 1350.00, commissionRate: 0.035 },
    mop: { id: 'mop', name: 'IPL Muriate of Potash (MOP)', bagWeight: 50, mrp: 1700.00, commissionRate: 0.035 },
    ssp: { id: 'ssp', name: 'Single Super Phosphate (SSP)', bagWeight: 50, mrp: 450.00, commissionRate: 0.035 },
    npk_10_26_26: { id: 'npk_10_26_26', name: 'IFFCO NPK 10:26:26', bagWeight: 50, mrp: 1470.00, commissionRate: 0.035 }
};

// S.R. Reddy & ICAR Recommended Doses (kg/acre)
const CROP_RDF = {
    wheat: { n: 48.5, p: 24.3, k: 16.2 },
    paddy: { n: 40.5, p: 20.2, k: 20.2 },
    maize: { n: 48.5, p: 24.3, k: 16.2 },
    cotton: { n: 48.5, p: 24.3, k: 24.3 },
    sugarcane: { n: 101.2, p: 40.5, k: 48.6 },
    soybean: { n: 12.1, p: 24.3, k: 16.2 },
    potato: { n: 60.7, p: 40.5, k: 48.6 },
    tomato: { n: 48.5, p: 24.3, k: 24.3 }
};

const askMarketplace = async (req, res) => {
    try {
        const { messages, context } = req.body;
        if (!messages) {
            return res.status(400).json({ error: 'Messages payload is required' });
        }
        
        const response = await fertilizerService.callLiquidModel(messages, context);
        res.status(200).json({ response });
    } catch (error) {
        console.error('Fertilizer Controller Error:', error);
        res.status(500).json({ error: 'Failed to access the Fertilizer Marketplace AI' });
    }
};

const getNPKEstimate = (req, res) => {
    try {
        const moisture = Math.min(100, Math.max(0, Number(req.query.moisture) || 45));
        const crop = (req.query.crop || 'wheat').toLowerCase();
        const acres = Math.max(0.25, Number(req.query.acres) || 1);

        // Moisture dynamic factor (S.R. Reddy Chapter 7)
        let factor = 1.0;
        if (moisture >= 40 && moisture <= 65) factor = 1.0 + (moisture - 50) * 0.002;
        else if (moisture < 40) factor = 0.90 + (moisture / 40) * 0.10;
        else factor = 1.03 - ((moisture - 65) / 35) * 0.12;

        const baseN = 195 * factor;
        const baseP = 14.5 * factor;
        const baseK = 175 * factor;

        const soilN = Number((baseN / 2.471).toFixed(1));
        const soilP = Number((baseP / 2.471).toFixed(1));
        const soilK = Number((baseK / 2.471).toFixed(1));

        const target = CROP_RDF[crop] || CROP_RDF.wheat;
        const netPDeficit = Math.max(0, target.p * acres - (soilP * acres * 0.25));
        const netKDeficit = Math.max(0, target.k * acres - (soilK * acres * 0.20));

        const dapBags = Math.ceil(Math.max(25 * acres, netPDeficit / 0.46) / 50);
        const nSuppliedByDap = (dapBags * 50) * 0.18;
        const remainingN = Math.max(0, (target.n * acres) - nSuppliedByDap);
        const ureaBags = Math.ceil(Math.max(30 * acres, remainingN / 0.46) / 45);
        const mopBags = Math.ceil(Math.max(15 * acres, netKDeficit / 0.60) / 50);

        const totalCost = (ureaBags * FERTILIZER_CATALOG.urea.mrp) +
                          (dapBags * FERTILIZER_CATALOG.dap.mrp) +
                          (mopBags * FERTILIZER_CATALOG.mop.mrp);

        const platformCommission = Number((totalCost * 0.035).toFixed(2));

        res.status(200).json({
            crop,
            acres,
            moisture,
            estimatedSoilNPK: {
                nitrogen: { value: Math.round(baseN), unit: 'kg/ha', acreValue: soilN, status: baseN < 280 ? 'Low' : 'Medium' },
                phosphorus: { value: Number(baseP.toFixed(1)), unit: 'kg/ha', acreValue: soilP, status: baseP < 25 ? 'Medium' : 'High' },
                potassium: { value: Math.round(baseK), unit: 'kg/ha', acreValue: soilK, status: 'Medium' }
            },
            prescriptionBags: {
                urea: { bags: ureaBags, kg: ureaBags * 45, cost: ureaBags * FERTILIZER_CATALOG.urea.mrp },
                dap: { bags: dapBags, kg: dapBags * 50, cost: dapBags * FERTILIZER_CATALOG.dap.mrp },
                mop: { bags: mopBags, kg: mopBags * 50, cost: mopBags * FERTILIZER_CATALOG.mop.mrp }
            },
            totalSubsidizedCost: totalCost,
            platformAffiliateCommission: platformCommission,
            agronomyReference: 'S.R. Reddy Principles of Agronomy & ICAR Package of Practices'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createOrder = (req, res) => {
    try {
        const { items, deliveryType, address, farmerName } = req.body;
        if (!items || !items.length) {
            return res.status(400).json({ error: 'No fertilizer items in order' });
        }

        const total = items.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
        const commission = Number((total * 0.035).toFixed(2));

        const order = {
            orderId: 'KS-FERT-' + Math.floor(100000 + Math.random() * 900000),
            date: new Date().toISOString(),
            items,
            totalAmount: total,
            platformCommission: commission,
            deliveryType: deliveryType || 'PACS Society Pickup (Free)',
            address: address || 'Local PACS Center',
            farmerName: farmerName || 'Verified Farmer',
            status: 'Confirmed'
        };

        res.status(201).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    askMarketplace,
    getNPKEstimate,
    createOrder
};
