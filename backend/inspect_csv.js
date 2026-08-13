const fs = require('fs');
const readline = require('readline');
const path = require('path');

const csvFilePath = path.join(__dirname, '..', 'New folder', 'npss_pest_data.csv');
const reportPath = path.join(__dirname, 'csv_report.txt');

async function analyzeCsv() {
    const fileStream = fs.createReadStream(csvFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let totalRows = 0;
    const cropCounts = {};
    const pestCounts = {};
    const cropPestRelations = {};
    const sampleImages = {};

    let header = null;

    for await (const line of rl) {
        if (!line.trim()) continue;
        
        // Very basic CSV parsing (taking care of optional quotes)
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cleanMatches = matches.map(m => m.replace(/^"|"$/g, '').trim());
        
        if (!header) {
            header = cleanMatches;
            continue;
        }

        totalRows++;
        
        const [state, district, subdistrict, village, crop, pest, imageUrl] = cleanMatches;
        
        if (crop) {
            cropCounts[crop] = (cropCounts[crop] || 0) + 1;
        }
        if (pest) {
            pestCounts[pest] = (pestCounts[pest] || 0) + 1;
        }
        if (crop && pest) {
            const key = `${crop} -> ${pest}`;
            cropPestRelations[key] = (cropPestRelations[key] || 0) + 1;
            
            if (imageUrl && !sampleImages[key] && imageUrl.startsWith('http')) {
                sampleImages[key] = imageUrl;
            }
        }
    }

    const sortedRelations = Object.entries(cropPestRelations)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30);

    const reportContent = `--- CSV DATASET REPORT ---
Total rows: ${totalRows}

Crop Counts:
${JSON.stringify(cropCounts, null, 2)}

Pest Counts (Top 30):
${JSON.stringify(Object.entries(pestCounts).sort((a,b)=>b[1]-a[1]).slice(0, 30), null, 2)}

Crop-Pest Relationships (Top 30):
${JSON.stringify(sortedRelations, null, 2)}

Sample Images:
${JSON.stringify(sampleImages, null, 2)}
`;

    fs.writeFileSync(reportPath, reportContent, 'utf8');
    console.log('Report written to csv_report.txt');
}

analyzeCsv().catch(err => console.error(err));
