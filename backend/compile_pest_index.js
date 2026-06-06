const fs = require('fs');
const readline = require('readline');
const path = require('path');

const csvFilePath = path.join(__dirname, '..', 'New folder', 'npss_pest_data.csv');
const outputPath = path.join(__dirname, 'data', 'npssPestIndex.json');

async function compileIndex() {
    const fileStream = fs.createReadStream(csvFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let totalRows = 0;
    const cropPests = {};       // crop -> Set of pests
    const regionalStats = {};   // state_district_crop -> { pest: count }
    const referenceImages = {}; // crop_pest -> Array of ImageUrls

    let header = null;

    for await (const line of rl) {
        if (!line.trim()) continue;
        
        // Match columns, accounting for quotes
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cleanMatches = matches.map(m => m.replace(/^"|"$/g, '').trim());
        
        if (!header) {
            header = cleanMatches;
            continue;
        }

        totalRows++;
        
        const [state, district, subdistrict, village, crop, pest, imageUrl] = cleanMatches;
        
        if (!crop || !pest) continue;

        // 1. Crop to Pests mapping
        if (!cropPests[crop]) {
            cropPests[crop] = new Set();
        }
        cropPests[crop].add(pest);

        // 2. Regional Stats mapping (State -> District -> Crop -> Pest -> count)
        const regionalKey = `${state}_${district}_${crop}`.toLowerCase();
        if (!regionalStats[regionalKey]) {
            regionalStats[regionalKey] = {};
        }
        regionalStats[regionalKey][pest] = (regionalStats[regionalKey][pest] || 0) + 1;

        // 3. Reference images for crop-pest combo (limit to 5 urls per combo)
        if (imageUrl && imageUrl.startsWith('http')) {
            const refKey = `${crop}_${pest}`.toLowerCase();
            if (!referenceImages[refKey]) {
                referenceImages[refKey] = [];
            }
            if (referenceImages[refKey].length < 5 && !referenceImages[refKey].includes(imageUrl)) {
                referenceImages[refKey].push(imageUrl);
            }
        }
    }

    // Convert Set to Array for JSON serialization
    const cropPestsArray = {};
    for (const [crop, pestsSet] of Object.entries(cropPests)) {
        cropPestsArray[crop] = Array.from(pestsSet);
    }

    const indexData = {
        totalRows,
        cropPests: cropPestsArray,
        regionalStats,
        referenceImages
    };

    fs.writeFileSync(outputPath, JSON.stringify(indexData, null, 2), 'utf8');
    
    // Check file size of compiled index
    const stats = fs.statSync(outputPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('\n✅ Compilation Successful!');
    console.log(`Processed: ${totalRows} rows`);
    console.log(`Saved index to: backend/data/npssPestIndex.json`);
    console.log(`Index file size: ${sizeInMB} MB (${stats.size} bytes)`);
}

compileIndex().catch(err => console.error('❌ Compilation failed:', err));
