const path = require('path');
const fs = require('fs');

console.log('--- STARTING AMI SERVICE INTEGRATION TEST ---');

// 1. Check service exists
const amiServicePath = path.join(__dirname, 'services', 'amiService.js');
if (!fs.existsSync(amiServicePath)) {
    console.error('❌ amiService.js is missing!');
    process.exit(1);
}
console.log('✅ Found amiService.js');

const amiService = require('./services/amiService');

// Allow a brief moment for async load if initialization is triggered
setTimeout(() => {
    // 2. Validate summary stats
    const summary = amiService.getSummary();
    console.log('Summary output:', summary);
    
    if (summary && summary.totalProjects > 0) {
        console.log(`✅ Passed: Loaded ${summary.totalProjects} total projects.`);
        console.log(`✅ Passed: Found ${summary.uniqueBeneficiariesCount} unique beneficiaries.`);
        console.log(`✅ Passed: Found ${summary.warehousesCount} warehouses.`);
        console.log(`✅ Passed: Found ${summary.startupsCount} startups.`);
        console.log(`✅ Passed: Found ${summary.odishaCount} projects in Odisha.`);
    } else {
        console.error('❌ Failed: Summary statistics are empty or invalid!');
        process.exit(1);
    }

    // 3. Test Odisha projects retrieval
    const odishaProjects = amiService.getProjects({ state: 'ODISHA' });
    console.log(`- Retrieved ${odishaProjects.length} projects in Odisha`);
    if (odishaProjects.length === summary.odishaCount) {
        console.log('✅ Passed: Odisha project filter match.');
        if (odishaProjects.length > 0) {
            console.log(`  Sample: "${odishaProjects[0].projectName}" in ${odishaProjects[0].district}`);
        }
    } else {
        console.error(`❌ Failed: Odisha projects mismatch! Got ${odishaProjects.length}, expected ${summary.odishaCount}`);
        process.exit(1);
    }

    // 4. Test Startup projects retrieval
    const startupProjects = amiService.getProjects({ beneficiaryType: 'Startup' });
    console.log(`- Retrieved ${startupProjects.length} startup projects`);
    if (startupProjects.length === summary.startupsCount) {
        console.log('✅ Passed: Startup filter match.');
    } else {
        console.error(`❌ Failed: Startup projects mismatch! Got ${startupProjects.length}, expected ${summary.startupsCount}`);
        process.exit(1);
    }

    // 5. Test Warehouse projects retrieval
    const warehouseProjects = amiService.getProjects({ projectType: 'warehouse' });
    console.log(`- Retrieved ${warehouseProjects.length} warehouse projects`);
    if (warehouseProjects.length > 0) {
        console.log('✅ Passed: Warehouse project filter match.');
        console.log(`  Sample: "${warehouseProjects[0].projectName}" of type "${warehouseProjects[0].projectType}"`);
    } else {
        console.error('❌ Failed: No warehouse projects found!');
        process.exit(1);
    }

    // 6. Test states and districts mapped list
    const statesMap = amiService.getStatesAndDistricts();
    const statesList = Object.keys(statesMap);
    console.log(`- Indexed ${statesList.length} states`);
    if (statesList.includes('ODISHA') && statesMap['ODISHA'].length > 0) {
        console.log('✅ Passed: Mapped states and districts including Odisha.');
    } else {
        console.error('❌ Failed: Odisha is missing from states mapping!');
        process.exit(1);
    }

    // 7. Test Top Loan sorting
    const topLoans = amiService.getProjects({ limit: 5, sortBy: 'loan_desc' });
    console.log(`- Top loan: ${topLoans[0].approvedLoanAmount}`);
    if (topLoans.length === 5 && topLoans[0].approvedLoanAmount >= topLoans[1].approvedLoanAmount) {
        console.log('✅ Passed: Sort by loan amount descending verified.');
    } else {
        console.error('❌ Failed: Loan sorting sequence is incorrect!');
        process.exit(1);
    }

    console.log('\n--- AMI SERVICE INTEGRATION TEST COMPLETED SUCCESSFULLY ---');
    process.exit(0);
}, 2000);
