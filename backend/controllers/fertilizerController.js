const fertilizerService = require('../services/fertilizerService');

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

module.exports = {
    askMarketplace
};
