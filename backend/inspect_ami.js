const fs = require('fs');
const readline = require('readline');
const path = require('path');

const csvFilePath = path.join(__dirname, '..', 'New folder', 'AMI.CSV');

async function inspectAmi() {
    const fileStream = fs.createReadStream(csvFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let count = 0;
    console.log('--- AMI.CSV INSPECTION ---');
    for await (const line of rl) {
        console.log(line);
        count++;
        if (count >= 15) break;
    }
}

inspectAmi().catch(err => console.error(err));
