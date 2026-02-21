require('dotenv').config();
const { analyzeImageWithAI } = require('./services/imageAnalysisService');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        console.log('Testing Image Analysis...');

        // Create a dummy image
        const imgPath = path.join(__dirname, 'dummy.jpg');
        fs.writeFileSync(imgPath, Buffer.from('dummy image data base64 here...'));

        // Test with dummy image
        const data = await analyzeImageWithAI(imgPath, 'leaf', { crop_type: 'wheat' });
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Test failed:', err.message);
    }
})();
