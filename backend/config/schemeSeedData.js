const schemeSeedData = [
    {
        name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
        benefits: 'Direct income support of ₹6,000 per year in three equal installments of ₹2,000 each, transferred directly to bank accounts of eligible farmer families.',
        eligibility: 'All landholding farmer families with cultivable land. Excludes institutional landholders, farmer families with government service members, income tax payers.',
        application_guidance: 'Apply through local Common Service Centre (CSC), State nodal officer, or directly at pmkisan.gov.in. Requires Aadhaar card, bank account details, and land ownership documents.',
        state: 'Central',
        scheme_type: 'central',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        website_url: 'https://pmkisan.gov.in'
    },
    {
        name: 'PM Fasal Bima Yojana (PMFBY)',
        benefits: 'Crop insurance coverage at low premium rates — 2% for Kharif, 1.5% for Rabi food & oilseed crops, 5% for commercial/horticultural crops. Balance premium paid by the government.',
        eligibility: 'All farmers growing notified crops in notified areas, including sharecroppers and tenant farmers. Both loanee and non-loanee farmers eligible.',
        application_guidance: 'Enroll through your bank branch, authorized insurance company, or CSC. Required: crop sowing certificate, land records, bank passbook, Aadhaar card. Apply before cut-off dates for Kharif/Rabi seasons.',
        state: 'Central',
        scheme_type: 'central',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        website_url: 'https://pmfby.gov.in'
    },
    {
        name: 'Kisan Credit Card (KCC)',
        benefits: 'Short-term crop loans up to ₹3 lakh at 4% interest rate (with 3% interest subvention + 2% prompt repayment incentive). Also covers post-harvest expenses, produce marketing, and consumption needs.',
        eligibility: 'All farmers – individual/joint borrowers who are owner cultivators, tenant farmers, oral lessees, or sharecroppers. SHGs or Joint Liability Groups of farmers also eligible.',
        application_guidance: 'Apply at any scheduled commercial bank, cooperative bank, or regional rural bank. Documents needed: land records, identity proof, passport photos. Existing bank customers can apply directly to their branch.',
        state: 'Central',
        scheme_type: 'central',
        ministry: 'Ministry of Finance / NABARD',
        website_url: 'https://www.nabard.org'
    },
    {
        name: 'Soil Health Card Scheme',
        benefits: 'Free soil health card issued every 2 years with crop-wise nutrient recommendations. Helps farmers understand soil nutrient status and optimize fertilizer use for better yields.',
        eligibility: 'All farmers across India can get their soil tested free of charge through government soil testing labs.',
        application_guidance: 'Visit nearest Krishi Vigyan Kendra (KVK) or contact district agriculture office. Soil samples are collected by trained technicians. Results available on soilhealth.dac.gov.in portal.',
        state: 'Central',
        scheme_type: 'central',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        website_url: 'https://soilhealth.dac.gov.in'
    },
    {
        name: 'PM Krishi Sinchai Yojana (PMKSY)',
        benefits: 'Subsidies up to 55% for small/marginal farmers (45% for others) on micro-irrigation systems — drip and sprinkler irrigation. Aims for "Har Khet Ko Paani" and "Per Drop More Crop".',
        eligibility: 'All categories of farmers with own or leased land. Priority given to small and marginal farmers, SC/ST farmers, and water-scarce regions.',
        application_guidance: 'Apply through district agriculture/horticulture office. Contact your local agriculture officer or visit pmksy.gov.in. Requires land documents, bank account details, quotation from authorized drip/sprinkler dealer.',
        state: 'Central',
        scheme_type: 'central',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        website_url: 'https://pmksy.gov.in'
    },
    {
        name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
        benefits: 'Financial assistance of ₹50,000/hectare over 3 years for organic farming. Includes ₹31,000 towards organic inputs and ₹8,800 for value addition and marketing support.',
        eligibility: 'Groups of 50+ farmers with 50 acres cluster. Individual farmers can join through Farmer Producer Organizations (FPOs) or local farmer groups.',
        application_guidance: 'Contact District Agriculture Officer or apply through local organic farming mission. Register your cluster through state agriculture department. Organic certification support is provided.',
        state: 'Central',
        scheme_type: 'central',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        website_url: 'https://pgsindia-ncof.gov.in'
    },
    {
        name: 'Maharashtra: Mahatma Jyotirao Phule Shetkari Karj Mukti Yojana',
        benefits: 'Farm loan waiver up to ₹2 lakh per farmer. Direct credit to crop loan accounts for eligible farmers in Maharashtra state.',
        eligibility: 'Farmers in Maharashtra with short-term crop loans from nationalized, cooperative, or RRB banks taken between April 2015 and March 2019.',
        application_guidance: 'Apply through Aapale Sarkar portal or visit Tehsil office. Verify eligibility on the official website. Requires bank loan details, Aadhaar, 7/12 extract.',
        state: 'Maharashtra',
        scheme_type: 'state',
        ministry: 'Maharashtra Cooperation Department',
        website_url: 'https://karjmafi.maharashtra.gov.in'
    },
    {
        name: 'Karnataka: Raitha Siri',
        benefits: 'Free supply of seeds, fertilizers, and farm equipment rental at subsidized rates. Soil testing services and crop advisory for Karnataka farmers.',
        eligibility: 'All registered farmers in Karnataka state. Priority to small and marginal farmers with less than 5 acres.',
        application_guidance: 'Register through Karnataka Fruits/Agriculture portal or visit nearest Raitha Samparka Kendra. Aadhaar, RTC extract, and bank details required.',
        state: 'Karnataka',
        scheme_type: 'state',
        ministry: 'Department of Agriculture, Karnataka',
        website_url: 'https://raitamitra.karnataka.gov.in'
    },
    {
        name: 'Tamil Nadu: TNIAMP (TN Irrigated Agriculture Modernisation Project)',
        benefits: 'Sub-basin level water management, crop diversification support, and market linkage for irrigated agriculture. Financial support for micro-irrigation infrastructure.',
        eligibility: 'Farmers in selected sub-basin areas of Tamil Nadu. Both irrigated and partially irrigated farmers eligible.',
        application_guidance: 'Contact concerned district Joint Director of Agriculture or Project Director ATMA. Apply through Uzhavan App or district agriculture office.',
        state: 'Tamil Nadu',
        scheme_type: 'state',
        ministry: 'Department of Agriculture, Tamil Nadu',
        website_url: 'https://www.tn.gov.in/scheme/data_view/6542'
    },
    {
        name: 'Madhya Pradesh: Mukhyamantri Kisan Kalyan Yojana',
        benefits: 'Additional ₹4,000 per year (₹2,000 twice a year) to PM-KISAN beneficiaries in Madhya Pradesh. Total benefit: ₹10,000/year including PM-KISAN.',
        eligibility: 'All PM-KISAN beneficiary farmers registered in Madhya Pradesh state.',
        application_guidance: 'Auto-enrollment for existing PM-KISAN beneficiaries. Verify status on Samagra Portal. New farmers should first get PM-KISAN registration done.',
        state: 'Madhya Pradesh',
        scheme_type: 'state',
        ministry: 'Department of Farmer Welfare, MP',
        website_url: 'https://mpkrishi.mp.gov.in'
    },
    {
        name: 'Punjab: Paani Bachao Paisa Kamao',
        benefits: 'Financial incentive of ₹1000/acre/year for direct seeding of rice (DSR) adoption. Promotes water conservation through laser leveling and micro-irrigation subsidies.',
        eligibility: 'All rice-growing farmers in Punjab who adopt DSR technique for paddy cultivation.',
        application_guidance: 'Register through Agriculture Department Punjab. Contact Block Agriculture Officer. Submit land records and bank account details.',
        state: 'Punjab',
        scheme_type: 'state',
        ministry: 'Department of Agriculture, Punjab',
        website_url: 'https://agri.punjab.gov.in'
    },
    {
        name: 'Rajasthan: Mukhyamantri Krishak Sathi Yojana',
        benefits: 'Financial assistance from ₹5,000 to ₹2,00,000 in case of accidental death or disability during farming activities. Covers accidents in farm, mandis, or while transiting produce.',
        eligibility: 'All registered farmers in Rajasthan aged 5-70 years. Covers death and disabilities arising from farming-related accidents.',
        application_guidance: 'Apply through e-Mitra centers or district agriculture office within 6 months of the accident. Requires FIR, medical certificate, land records, and Aadhaar.',
        state: 'Rajasthan',
        scheme_type: 'state',
        ministry: 'Department of Agriculture, Rajasthan',
    },
    {
        name: 'Uttar Pradesh: Mukhyamantri Khet Suraksha Yojana',
        benefits: 'Provides a subsidy of ₹1.43 lakh per hectare to small and marginal farmers for installing solar fences to protect crops from stray animals.',
        eligibility: 'Small and marginal farmers of Uttar Pradesh facing crop damage due to stray animals.',
        application_guidance: 'Apply online through the UP Agriculture Department portal using Aadhaar, bank details, and land records.',
        state: 'Uttar Pradesh',
        scheme_type: 'state',
        ministry: 'Agriculture Department, UP',
        website_url: 'http://upagriculture.com'
    },
    {
        name: 'Andhra Pradesh: YSR Rythu Bharosa',
        benefits: 'Financial assistance of ₹13,500 per farmer family per year (₹6,000 from PM-KISAN + ₹7,500 from State Gov) to support cultivation expenses.',
        eligibility: 'All landholder farmer families, tenant farmers, and ROFR cultivators in Andhra Pradesh.',
        application_guidance: 'Auto-credited for existing PM-KISAN beneficiaries in the state. Register via Rythu Bharosa Kendras (RBKs) or the Navasakam portal.',
        state: 'Andhra Pradesh',
        scheme_type: 'state',
        ministry: 'Department of Agriculture, AP',
        website_url: 'https://ysrrythubharosa.ap.gov.in'
    },
    {
        name: 'Gujarat: Mukhyamantri Kisan Sahay Yojana',
        benefits: 'Free crop protection scheme against natural calamities (drought, heavy rain, unseasonal rain). Compensation up to ₹25,000 per hectare for 33%-60% loss, and ₹20,000 for >60% loss.',
        eligibility: 'All farmers of Gujarat are automatically covered without paying any premium. Replaces the premium-based crop insurance model.',
        application_guidance: 'Compensation is initiated post-assessment by district authorities after unseasonal rainfall or drought is declared. Details at the state portal.',
        state: 'Gujarat',
        scheme_type: 'state',
        ministry: 'Agriculture, Farmers Welfare & Co-operation Dept, Gujarat',
        website_url: 'https://agri.gujarat.gov.in'
    }
];

module.exports = schemeSeedData;
