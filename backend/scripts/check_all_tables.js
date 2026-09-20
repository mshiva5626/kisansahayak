const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat && stat.isDirectory() && file !== 'node_modules' && file !== '.git' && file !== 'scripts') {
            results = results.concat(walk(full));
        } else if (file.endsWith('.js')) {
            results.push(full);
        }
    });
    return results;
}

const files = walk('.');
const tables = new Set();
const regex = /\.from\(['"]([a-zA-Z0-9_]+)['"]\)/g;
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = regex.exec(content)) !== null) {
        tables.add(m[1]);
    }
});

console.log('Tables referenced in backend code:');
const tableList = Array.from(tables).filter(t => t !== 'farm_images'); // farm_images is storage bucket
console.log(tableList);

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function check() {
    for (const t of tableList) {
        const { error } = await sb.from(t).select('id').limit(1);
        if (error) {
            console.log(`❌ Table '${t}': ${error.message}`);
        } else {
            console.log(`✅ Table '${t}': exists`);
        }
    }
}
check();
