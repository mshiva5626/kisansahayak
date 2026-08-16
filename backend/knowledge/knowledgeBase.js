/**
 * Kisan Sahayak - Agricultural Knowledge Base Hub
 * 
 * Manages verified agronomic Package of Practices (PoP), pest/disease registers,
 * government schemes, and authoritative literature with full provenance metadata.
 */

const path = require('path');
const fs = require('fs');

let cropAdvisories = [];
let schemesRegistry = [];
let npssIndex = null;

try {
    const advisoriesPath = path.join(__dirname, 'data', 'cropAdvisories.json');
    if (fs.existsSync(advisoriesPath)) {
        cropAdvisories = JSON.parse(fs.readFileSync(advisoriesPath, 'utf8'));
    }
} catch (e) {
    console.error('Failed to load cropAdvisories.json:', e.message);
}

try {
    const schemesPath = path.join(__dirname, 'data', 'schemesRegistry.json');
    if (fs.existsSync(schemesPath)) {
        schemesRegistry = JSON.parse(fs.readFileSync(schemesPath, 'utf8'));
    }
} catch (e) {
    console.error('Failed to load schemesRegistry.json:', e.message);
}

try {
    const npssPath = path.join(__dirname, '..', 'data', 'npssPestIndex.json');
    if (fs.existsSync(npssPath)) {
        npssIndex = JSON.parse(fs.readFileSync(npssPath, 'utf8'));
    }
} catch (e) {
    console.error('Failed to load npssPestIndex.json:', e.message);
}

/**
 * Get all registered crop advisories
 */
function getAllAdvisories() {
    return cropAdvisories;
}

/**
 * Get all registered government schemes
 */
function getAllSchemes(state = null) {
    if (!state) return schemesRegistry;
    const sLower = state.toLowerCase();
    return schemesRegistry.filter(s => 
        s.scheme_type === 'central' || 
        (s.state && s.state.toLowerCase().includes(sLower)) ||
        s.state === 'All India'
    );
}

/**
 * Lookup NPSS registered pests and diseases for a specific crop
 */
function getNPSSPestsForCrop(cropName) {
    if (!npssIndex || !npssIndex.cropPests || !cropName) return [];
    
    // Exact or normalized match
    const keys = Object.keys(npssIndex.cropPests);
    const matchedKey = keys.find(k => k.toLowerCase() === cropName.toLowerCase() || k.toLowerCase().includes(cropName.toLowerCase()) || cropName.toLowerCase().includes(k.toLowerCase()));
    
    if (matchedKey) {
        return npssIndex.cropPests[matchedKey];
    }
    return [];
}

module.exports = {
    getAllAdvisories,
    getAllSchemes,
    getNPSSPestsForCrop
};
