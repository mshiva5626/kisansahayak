/**
 * Kisan Sahayak - Agricultural RAG Retrieval & Reasoning Engine
 * 
 * Implements semantic domain classification, metadata filtering,
 * 10-Level Source Hierarchy prioritization, and authentic citation tracking.
 */

const { getAllAdvisories, getAllSchemes, getNPSSPestsForCrop } = require('./knowledgeBase');

// 10-Level Source Hierarchy weights (Lower level number = Higher priority)
const SOURCE_LEVEL_WEIGHTS = {
    1: 1.00, // Level 1: Official Govt of India
    2: 0.95, // Level 2: ICAR & ICAR Institutes
    3: 0.90, // Level 3: State Agricultural Universities (SAUs)
    4: 0.85, // Level 4: Krishi Vigyan Kendras (KVKs)
    5: 0.80, // Level 5: IMD & Agromet Advisories
    6: 0.75, // Level 6: State Govt Agriculture Departments
    7: 0.70, // Level 7: Official Scheme & Market Portals
    8: 0.65, // Level 8: Peer-reviewed Scientific Research
    9: 0.60, // Level 9: Recognized Agricultural Research Orgs
    10: 0.55 // Level 10: Reputable Agricultural Publications
};

// Domain keywords for classification
const DOMAIN_PATTERNS = {
    plant_pathology: [
        'disease', 'blight', 'blast', 'rust', 'rot', 'spot', 'mildew', 'fungus', 'fungal',
        'bacterial', 'wilt', 'virus', 'mosaic', 'yellowing', 'lesion', 'pathogen', 'canker',
        'smut', 'damping off', 'leaf curl', 'anthracnose', 'scab', 'die back', 'infection'
    ],
    entomology: [
        'pest', 'thrips', 'borer', 'caterpillar', 'aphid', 'whitefly', 'jassid', 'mite',
        'bollworm', 'beetle', 'insect', 'larva', 'infestation', 'bug', 'hopper', 'fly',
        'grub', 'weevil', 'chewing', 'sucking'
    ],
    soil_science: [
        'soil', 'salinity', 'alkalinity', 'ph', 'nutrient', 'organic carbon', 'sodic',
        'fertility', 'ec', 'gypsum', 'liming', 'texture', 'npk', 'deficiency', 'micronutrient',
        'zinc', 'iron', 'boron'
    ],
    agronomy_fertilizer: [
        'fertilizer', 'urea', 'dap', 'mop', 'ssp', 'dose', 'basal', 'top dress', 'spray',
        'sowing', 'seed rate', 'spacing', 'variety', 'yield', 'transplanting', 'harvest',
        'crop stage', 'tillering', 'panicle', 'flowering'
    ],
    irrigation: [
        'irrigation', 'water', 'drip', 'sprinkler', 'fertigation', 'moisture', 'drainage',
        'rain', 'drought', 'waterlogging', 'flooding', 'watering'
    ],
    schemes: [
        'scheme', 'subsidy', 'pm-kisan', 'kcc', 'insurance', 'fasal bima', 'kalia', 'rythu',
        'grant', 'financial assistance', 'apply', 'eligibility', 'portal', 'dbt'
    ],
    mandi_market: [
        'price', 'mandi', 'market', 'rate', 'quintal', 'sell', 'bhav', 'wholesale', 'apmc',
        'msp', 'demand', 'arrival'
    ]
};

/**
 * Classify user intent into agricultural domains
 */
function classifyDomain(query) {
    if (!query) return ['general_agronomy'];
    const qLower = query.toLowerCase();
    const matchedDomains = [];
    
    for (const [domain, keywords] of Object.entries(DOMAIN_PATTERNS)) {
        if (keywords.some(kw => qLower.includes(kw))) {
            matchedDomains.push(domain);
        }
    }
    
    return matchedDomains.length > 0 ? matchedDomains : ['general_agronomy'];
}

/**
 * Retrieve verified knowledge documents based on query, farm context, and domain
 */
function retrieveAgriculturalKnowledge({ query, crop = null, state = null, district = null, maxResults = 3 }) {
    const queryLower = (query || '').toLowerCase();
    const cropLower = (crop || '').toLowerCase();
    const stateLower = (state || '').toLowerCase();
    
    const domains = classifyDomain(query);
    const advisories = getAllAdvisories();
    
    const scoredDocs = advisories.map(doc => {
        let score = 0;
        const contentLower = doc.content.toLowerCase();
        const titleLower = doc.title.toLowerCase();
        const docCropLower = (doc.crop || '').toLowerCase();
        const docStateLower = (doc.state || '').toLowerCase();
        const docTopicLower = (doc.topic || '').toLowerCase();
        
        // 1. Crop Match Bonus (High weight)
        if (cropLower && (docCropLower.includes(cropLower) || cropLower.includes(docCropLower) || docCropLower.includes('all crops'))) {
            score += 30;
        }
        
        // 2. Query mentions crop
        if (docCropLower && docCropLower !== 'all crops' && queryLower.includes(docCropLower)) {
            score += 25;
        }
        
        // 3. State / Regional Match Bonus
        if (stateLower && (docStateLower.includes(stateLower) || docStateLower.includes('all india'))) {
            score += 15;
        }
        
        // 4. Domain & Topic Match
        domains.forEach(d => {
            if (docTopicLower.includes(d.replace('_', ' '))) {
                score += 12;
            }
        });
        
        // 5. Keyword Matching in Title and Content
        const queryTerms = queryLower.split(/\s+/).filter(w => w.length > 2);
        queryTerms.forEach(term => {
            if (titleLower.includes(term)) score += 8;
            if (contentLower.includes(term)) score += 3;
        });
        
        // 6. Source Hierarchy Multiplier (Prioritize ICAR / SAU / Official GoI)
        const hierarchyWeight = SOURCE_LEVEL_WEIGHTS[doc.level] || 0.50;
        const finalScore = score * hierarchyWeight;
        
        return {
            doc,
            score: finalScore,
            matchedDomains: domains
        };
    });
    
    // Sort by score descending and take top results with score > 5
    const filteredResults = scoredDocs
        .filter(item => item.score > 5)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(item => item.doc);
        
    return filteredResults;
}

/**
 * Format retrieved knowledge chunks into prompt-ready context with strict citations
 */
function buildRAGContextString({ query, crop, state, district }) {
    const docs = retrieveAgriculturalKnowledge({ query, crop, state, district, maxResults: 3 });
    const npssPests = crop ? getNPSSPestsForCrop(crop) : [];
    
    let contextStr = '';
    
    if (docs.length > 0) {
        contextStr += `\n═══════════════════════════════════════════════════════════════\n`;
        contextStr += `VERIFIED AGRICULTURAL KNOWLEDGE & ADVISORIES (RETRIEVED EVIDENCE):\n`;
        contextStr += `═══════════════════════════════════════════════════════════════\n`;
        
        docs.forEach((doc, idx) => {
            contextStr += `[Source ${idx + 1} | Level ${doc.level} - ${doc.organization}]\n`;
            contextStr += `Title: ${doc.title}\n`;
            contextStr += `Applicability: ${doc.crop} (${doc.state})\n`;
            contextStr += `Published Date: ${doc.published_date}\n`;
            contextStr += `Official Reference: ${doc.source_url}\n`;
            contextStr += `Content: ${doc.content}\n\n`;
        });
    }
    
    if (npssPests.length > 0) {
        contextStr += `OFFICIAL NPSS REGISTERED PESTS/DISEASES FOR ${crop.toUpperCase()}:\n`;
        contextStr += `${npssPests.slice(0, 15).map(p => `• ${p}`).join('\n')}\n\n`;
    }
    
    return {
        contextString: contextStr,
        sourcesCount: docs.length,
        retrievedDocs: docs
    };
}

module.exports = {
    classifyDomain,
    retrieveAgriculturalKnowledge,
    buildRAGContextString,
    SOURCE_LEVEL_WEIGHTS
};
