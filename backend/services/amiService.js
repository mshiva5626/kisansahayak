const fs = require('fs');
const path = require('path');
const readline = require('readline');

const csvFilePath = path.join(__dirname, '..', 'data', 'AMI.CSV');

let projectsCache = [];
let summaryCache = null;
let statesAndDistrictsCache = {};

// Safe CSV line parsing helper
function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Load and parse CSV
async function initAmiService() {
    try {
        if (!fs.existsSync(csvFilePath)) {
            console.error(`❌ AMI.CSV not found at: ${csvFilePath}`);
            return;
        }

        const fileStream = fs.createReadStream(csvFilePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let header = null;
        const tempProjects = [];
        const uniqueBeneficiaries = new Set();
        const statesMap = {};

        let totalLoanAmount = 0;
        let totalCost = 0;
        let warehousesCount = 0;
        let startupsCount = 0;
        let disbursedCount = 0;
        let odishaCount = 0;
        let totalTermMonths = 0;
        let termCount = 0;

        for await (const line of rl) {
            if (!line.trim()) continue;
            const columns = parseCsvLine(line);

            if (!header) {
                header = columns;
                continue;
            }

            const rawLoan = parseFloat(columns[7]) || 0;
            const rawCost = parseFloat(columns[12]) || 0;
            const termY = parseInt(columns[8], 10) || 0;
            const termM = parseInt(columns[9], 10) || 0;
            const stateName = columns[15] || '';
            const districtName = columns[17] || '';
            const beneficiaryType = columns[1] || '';
            const projectType = columns[13] || '';
            const statusName = columns[6] || '';
            const projectName = columns[5] || '';

            const record = {
                beneficiaryId: columns[0] || '',
                beneficiaryType,
                category: columns[2] || '',
                loanApplicationNumber: columns[3] || '',
                isIndividual: columns[4] || '',
                projectName,
                status: statusName,
                approvedLoanAmount: rawLoan,
                termYear: termY,
                termMonth: termM,
                gender: columns[10] || '',
                description: columns[11] || '',
                projectCost: rawCost,
                projectType,
                loanApplicationType: columns[14] || '',
                state: stateName,
                stateCode: columns[16] || '',
                district: districtName,
                districtCode: columns[18] || '',
                village: columns[19] || '',
                villageCode: columns[20] || '',
                latitude: parseFloat(columns[21]) || null,
                longitude: parseFloat(columns[22]) || null,
                geoFencing: columns[23] || '',
                geoFencingType: columns[24] || '',
                geoUpdateDate: columns[25] || '',
                schemeType: columns[26] || '',
                isGeoUpdated: columns[27] || ''
            };

            tempProjects.push(record);

            // Accumulate statistics
            if (projectName) uniqueBeneficiaries.add(projectName);
            totalLoanAmount += rawLoan;
            totalCost += rawCost;
            
            const typeLower = projectType.toLowerCase();
            if (typeLower.includes('warehouse') || typeLower.includes('godown')) {
                warehousesCount++;
            }
            if (beneficiaryType.toLowerCase().includes('startup')) {
                startupsCount++;
            }
            if (statusName.toLowerCase() === 'disbursed') {
                disbursedCount++;
            }
            if (stateName.toUpperCase() === 'ODISHA') {
                odishaCount++;
            }

            if (termY > 0 || termM > 0) {
                totalTermMonths += (termY * 12) + termM;
                termCount++;
            }

            // Map states and districts
            if (stateName) {
                const cleanState = stateName.trim();
                if (!statesMap[cleanState]) {
                    statesMap[cleanState] = new Set();
                }
                if (districtName) {
                    statesMap[cleanState].add(districtName.trim());
                }
            }
        }

        projectsCache = tempProjects;

        // Convert state/district sets to arrays
        const statesAndDistricts = {};
        for (const [state, districtsSet] of Object.entries(statesMap)) {
            statesAndDistricts[state] = Array.from(districtsSet).sort();
        }
        statesAndDistrictsCache = statesAndDistricts;

        summaryCache = {
            totalProjects: projectsCache.length,
            uniqueBeneficiariesCount: uniqueBeneficiaries.size,
            totalApprovedLoanAmount: totalLoanAmount,
            totalProjectCost: totalCost,
            warehousesCount,
            startupsCount,
            disbursedCount,
            odishaCount,
            averageTermMonths: termCount > 0 ? Math.round(totalTermMonths / termCount) : 0
        };

        console.log(`✅ AMI.CSV dataset initialized: ${projectsCache.length} rows cached.`);
    } catch (err) {
        console.error('❌ Failed to initialize AMI service:', err.message);
    }
}

// Perform initialization on load
initAmiService();

const getSummary = () => {
    return summaryCache || {
        totalProjects: 0,
        uniqueBeneficiariesCount: 0,
        totalApprovedLoanAmount: 0,
        totalProjectCost: 0,
        warehousesCount: 0,
        startupsCount: 0,
        disbursedCount: 0,
        odishaCount: 0,
        averageTermMonths: 0
    };
};

const getStatesAndDistricts = () => {
    return statesAndDistrictsCache;
};

const getProjects = (filters = {}) => {
    let results = [...projectsCache];

    const { state, district, beneficiaryType, projectType, status, search, limit, sortBy } = filters;

    if (state) {
        results = results.filter(p => p.state.toUpperCase() === state.toUpperCase());
    }
    if (district) {
        results = results.filter(p => p.district.toUpperCase() === district.toUpperCase());
    }
    if (beneficiaryType) {
        results = results.filter(p => p.beneficiaryType.toLowerCase() === beneficiaryType.toLowerCase());
    }
    if (projectType) {
        // Broad matched filtering e.g. 'warehouse'
        results = results.filter(p => p.projectType.toLowerCase().includes(projectType.toLowerCase()));
    }
    if (status) {
        results = results.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
        const query = search.toLowerCase();
        results = results.filter(p => 
            p.projectName.toLowerCase().includes(query) ||
            p.projectType.toLowerCase().includes(query) ||
            p.beneficiaryType.toLowerCase().includes(query) ||
            p.village.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        );
    }

    // Sort operations
    if (sortBy === 'loan_desc') {
        results.sort((a, b) => b.approvedLoanAmount - a.approvedLoanAmount);
    } else if (sortBy === 'cost_desc') {
        results.sort((a, b) => b.projectCost - a.projectCost);
    } else {
        // Default sort by approved loan amount descending
        results.sort((a, b) => b.approvedLoanAmount - a.approvedLoanAmount);
    }

    if (limit) {
        const parsedLimit = parseInt(limit, 10);
        if (!isNaN(parsedLimit)) {
            results = results.slice(0, parsedLimit);
        }
    }

    return results;
};

module.exports = {
    initAmiService,
    getSummary,
    getProjects,
    getStatesAndDistricts
};
