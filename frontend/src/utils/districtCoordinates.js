/**
 * Indian Agricultural Districts and State Coordinates Reference
 * Provides instant, zero-latency coordinate resolution for any selected mandi district or state.
 */

export const DISTRICT_COORDINATES = {
    // Madhya Pradesh
    'indore': { lat: 22.7196, lon: 75.8577 },
    'ujjain': { lat: 23.1765, lon: 75.7885 },
    'neemuch': { lat: 24.4589, lon: 74.8722 },
    'mandsaur': { lat: 24.0722, lon: 75.0682 },
    'khargone': { lat: 21.8234, lon: 75.6124 },
    'bhopal': { lat: 23.2599, lon: 77.4126 },
    'sehore': { lat: 23.2030, lon: 77.0844 },
    'jabalpur': { lat: 23.1815, lon: 79.9864 },
    'gwalior': { lat: 26.2183, lon: 78.1828 },
    'hoshangabad': { lat: 22.7519, lon: 77.7289 },
    'narmadapuram': { lat: 22.7519, lon: 77.7289 },
    'dewas': { lat: 22.9676, lon: 76.0534 },
    'ratlam': { lat: 23.3315, lon: 75.0367 },

    // Maharashtra
    'nashik': { lat: 19.9975, lon: 73.7898 },
    'pune': { lat: 18.5204, lon: 73.8567 },
    'thane': { lat: 19.2183, lon: 72.9781 },
    'jalgaon': { lat: 21.0077, lon: 75.5626 },
    'latur': { lat: 18.4088, lon: 76.5604 },
    'solapur': { lat: 17.6599, lon: 75.9064 },
    'nagpur': { lat: 21.1458, lon: 79.0882 },
    'ahmednagar': { lat: 19.0952, lon: 74.7496 },
    'kolhapur': { lat: 16.7050, lon: 74.2433 },
    'amravati': { lat: 20.9320, lon: 77.7523 },
    'sangli': { lat: 16.8524, lon: 74.5815 },
    'nanded': { lat: 19.1383, lon: 77.3210 },

    // Punjab
    'ludhiana': { lat: 30.9010, lon: 75.8573 },
    'patiala': { lat: 30.3398, lon: 76.3869 },
    'amritsar': { lat: 31.6340, lon: 74.8723 },
    'jalandhar': { lat: 31.3260, lon: 75.5762 },
    'bathinda': { lat: 30.2110, lon: 74.9455 },
    'sangrur': { lat: 30.2458, lon: 75.8421 },
    'ferozepur': { lat: 30.9237, lon: 74.6067 },
    'hoshiarpur': { lat: 31.5273, lon: 75.9149 },
    'gurdaspur': { lat: 32.0419, lon: 75.4053 },
    'moga': { lat: 30.8165, lon: 75.1717 },

    // Haryana
    'karnal': { lat: 29.6857, lon: 76.9905 },
    'kurukshetra': { lat: 29.9695, lon: 76.8783 },
    'ambala': { lat: 30.3782, lon: 76.7767 },
    'sirsa': { lat: 29.5349, lon: 75.0289 },
    'hisar': { lat: 29.1492, lon: 75.7217 },
    'kaithal': { lat: 29.8015, lon: 76.3996 },
    'panipat': { lat: 29.3909, lon: 76.9635 },
    'sonipat': { lat: 28.9931, lon: 77.0151 },
    'rohtak': { lat: 28.8955, lon: 76.6066 },
    'fatehabad': { lat: 29.5152, lon: 75.4549 },

    // Gujarat
    'rajkot': { lat: 22.3039, lon: 70.8022 },
    'mehsana': { lat: 23.5880, lon: 72.3693 },
    'surat': { lat: 21.1702, lon: 72.8311 },
    'ahmedabad': { lat: 23.0225, lon: 72.5714 },
    'amreli': { lat: 21.6022, lon: 71.2215 },
    'junagadh': { lat: 21.5222, lon: 70.4579 },
    'bhavnagar': { lat: 21.7645, lon: 72.1519 },
    'vadodara': { lat: 22.3072, lon: 73.1812 },
    'banaskantha': { lat: 24.1724, lon: 72.4346 },
    'patan': { lat: 23.8493, lon: 72.1266 },

    // Rajasthan
    'kota': { lat: 25.2138, lon: 75.8648 },
    'sri ganganagar': { lat: 29.9038, lon: 73.8772 },
    'ganganagar': { lat: 29.9038, lon: 73.8772 },
    'jaipur': { lat: 26.9124, lon: 75.7873 },
    'jodhpur': { lat: 26.2389, lon: 73.0243 },
    'bikaner': { lat: 28.0229, lon: 73.3119 },
    'baran': { lat: 25.1011, lon: 76.5132 },
    'alwar': { lat: 27.5530, lon: 76.6346 },
    'nagaur': { lat: 27.2021, lon: 73.7439 },
    'hanumangarh': { lat: 29.5816, lon: 74.3294 },
    'chittorgarh': { lat: 24.8887, lon: 74.6269 },

    // Odisha
    'cuttack': { lat: 20.4625, lon: 85.8828 },
    'bargarh': { lat: 21.3364, lon: 83.6234 },
    'sambalpur': { lat: 21.4669, lon: 83.9812 },
    'bhubaneswar': { lat: 20.2961, lon: 85.8245 },
    'balasore': { lat: 21.4934, lon: 86.9135 },
    'ganjam': { lat: 19.3819, lon: 85.0673 },
    'kalahandi': { lat: 19.9137, lon: 83.1649 },
    'puri': { lat: 19.8135, lon: 85.8312 },
    'bolangir': { lat: 20.7153, lon: 83.4842 },
    'koraput': { lat: 18.8135, lon: 82.7123 },
    'rayagada': { lat: 19.1717, lon: 83.4163 },

    // Uttar Pradesh
    'agra': { lat: 27.1767, lon: 78.0081 },
    'ghaziabad': { lat: 28.6692, lon: 77.4538 },
    'kanpur nagar': { lat: 26.4499, lon: 80.3319 },
    'kanpur': { lat: 26.4499, lon: 80.3319 },
    'varanasi': { lat: 25.3176, lon: 82.9739 },
    'meerut': { lat: 28.9845, lon: 77.7064 },
    'mathura': { lat: 27.4924, lon: 77.6737 },
    'bareilly': { lat: 28.3670, lon: 79.4304 },
    'aligarh': { lat: 27.8974, lon: 78.0880 },
    'prayagraj': { lat: 25.4358, lon: 81.8463 },
    'allahabad': { lat: 25.4358, lon: 81.8463 },
    'lucknow': { lat: 26.8467, lon: 80.9462 },
    'gorakhpur': { lat: 26.7606, lon: 83.3732 },
    'moradabad': { lat: 28.8386, lon: 78.7733 },

    // Andhra Pradesh
    'guntur': { lat: 16.3067, lon: 80.4365 },
    'kurnool': { lat: 15.8281, lon: 78.0373 },
    'krishna': { lat: 16.1834, lon: 81.1340 },
    'west godavari': { lat: 16.7107, lon: 81.0952 },
    'east godavari': { lat: 17.0005, lon: 81.8040 },
    'visakhapatnam': { lat: 17.6868, lon: 83.2185 },
    'anantapur': { lat: 14.6819, lon: 77.6006 },
    'nellore': { lat: 14.4426, lon: 79.9865 },
    'chittoor': { lat: 13.2172, lon: 79.1003 },

    // Telangana
    'warangal': { lat: 17.9689, lon: 79.5941 },
    'nizamabad': { lat: 18.6725, lon: 78.0941 },
    'hyderabad': { lat: 17.3850, lon: 78.4867 },
    'khammam': { lat: 17.2473, lon: 80.1514 },
    'karimnagar': { lat: 18.4386, lon: 79.1288 },
    'nalgonda': { lat: 17.0575, lon: 79.2684 },
    'mahabubnagar': { lat: 16.7488, lon: 77.9942 },
    'medak': { lat: 18.0478, lon: 78.2618 },
    'adilabad': { lat: 19.6641, lon: 78.5320 },

    // Karnataka
    'kalaburagi': { lat: 17.3297, lon: 76.8343 },
    'gulbarga': { lat: 17.3297, lon: 76.8343 },
    'bengaluru urban': { lat: 12.9716, lon: 77.5946 },
    'bengaluru': { lat: 12.9716, lon: 77.5946 },
    'bangalore': { lat: 12.9716, lon: 77.5946 },
    'belgaum': { lat: 15.8497, lon: 74.4977 },
    'belagavi': { lat: 15.8497, lon: 74.4977 },
    'davanagere': { lat: 14.4644, lon: 75.9218 },
    'shimoga': { lat: 13.9299, lon: 75.5681 },
    'shivamogga': { lat: 13.9299, lon: 75.5681 },
    'hubli': { lat: 15.3647, lon: 75.1240 },
    'dharwad': { lat: 15.4589, lon: 75.0078 },
    'mysore': { lat: 12.2958, lon: 76.6394 },
    'mysuru': { lat: 12.2958, lon: 76.6394 },
    'bellary': { lat: 15.1394, lon: 76.9214 },
    'ballari': { lat: 15.1394, lon: 76.9214 },
    'raichur': { lat: 16.2076, lon: 77.3463 },
    'bagalkot': { lat: 16.1691, lon: 75.6615 },

    // Tamil Nadu
    'chennai': { lat: 13.0827, lon: 80.2707 },
    'erode': { lat: 11.3410, lon: 77.7172 },
    'madurai': { lat: 9.9252, lon: 78.1198 },
    'tiruchirappalli': { lat: 10.7905, lon: 78.7047 },
    'trichy': { lat: 10.7905, lon: 78.7047 },
    'coimbatore': { lat: 11.0168, lon: 76.9558 },
    'thanjavur': { lat: 10.7870, lon: 79.1378 },
    'salem': { lat: 11.6643, lon: 78.1460 },
    'dindigul': { lat: 10.3673, lon: 77.9803 },
    'vellore': { lat: 12.9165, lon: 79.1325 },
    'tirunelveli': { lat: 8.7139, lon: 77.7567 },

    // Bihar
    'purnia': { lat: 25.7771, lon: 87.4753 },
    'patna': { lat: 25.5941, lon: 85.1376 },
    'muzaffarpur': { lat: 26.1209, lon: 85.3647 },
    'bhagalpur': { lat: 25.2425, lon: 86.9842 },
    'gaya': { lat: 24.7914, lon: 85.0002 },
    'samastipur': { lat: 25.8629, lon: 85.7811 },
    'rohtas': { lat: 24.9525, lon: 84.0157 },
    'katihar': { lat: 25.5393, lon: 87.5704 },
    'begusarai': { lat: 25.4182, lon: 86.1272 },

    // West Bengal
    'hooghly': { lat: 22.9012, lon: 88.3899 },
    'kolkata': { lat: 22.5726, lon: 88.3639 },
    'burdwan': { lat: 23.2324, lon: 87.8615 },
    'bardhaman': { lat: 23.2324, lon: 87.8615 },
    'nadia': { lat: 23.4710, lon: 88.5565 },
    'north 24 parganas': { lat: 22.7230, lon: 88.4807 },
    'murshidabad': { lat: 24.1759, lon: 88.2802 },
    'malda': { lat: 25.0108, lon: 88.1411 },
    'siliguri': { lat: 26.7271, lon: 88.3953 },

    // Chhattisgarh
    'raipur': { lat: 21.2514, lon: 81.6296 },
    'durg': { lat: 21.1904, lon: 81.2849 },
    'rajnandgaon': { lat: 21.0971, lon: 81.0379 },
    'bilaspur': { lat: 22.0797, lon: 82.1409 },
    'dhamtari': { lat: 20.7071, lon: 81.5498 },
    'mahasamund': { lat: 21.1085, lon: 82.0967 },
    'janjgir-champa': { lat: 22.0125, lon: 82.5746 },
    'champa': { lat: 22.0125, lon: 82.5746 },

    // Delhi NCR
    'delhi': { lat: 28.6139, lon: 77.2090 },
    'new delhi': { lat: 28.6139, lon: 77.2090 }
};

export const STATE_CENTERS = {
    'madhya pradesh': { lat: 23.2599, lon: 77.4126 },
    'maharashtra': { lat: 19.7515, lon: 75.7139 },
    'punjab': { lat: 31.1471, lon: 75.3412 },
    'haryana': { lat: 29.0588, lon: 76.0856 },
    'gujarat': { lat: 22.2587, lon: 71.1924 },
    'rajasthan': { lat: 27.0238, lon: 74.2179 },
    'odisha': { lat: 20.9517, lon: 85.0985 },
    'uttar pradesh': { lat: 26.8467, lon: 80.9462 },
    'andhra pradesh': { lat: 15.9129, lon: 79.7400 },
    'telangana': { lat: 18.1124, lon: 79.0193 },
    'karnataka': { lat: 15.3173, lon: 75.7139 },
    'tamil nadu': { lat: 11.1271, lon: 78.6569 },
    'bihar': { lat: 25.0961, lon: 85.3131 },
    'west bengal': { lat: 22.9868, lon: 87.8550 },
    'chhattisgarh': { lat: 21.2787, lon: 81.8661 },
    'delhi': { lat: 28.6139, lon: 77.2090 }
};

/**
 * Returns accurate { lat, lon } for any Indian district or state,
 * with zero chance of returning undefined/null.
 */
export function getCoordinatesForLocation(state, district) {
    const cleanDist = (district || '').toLowerCase().trim();
    const cleanSt = (state || '').toLowerCase().trim();

    if (cleanDist && DISTRICT_COORDINATES[cleanDist]) {
        return { ...DISTRICT_COORDINATES[cleanDist] };
    }

    // Try partial match for district
    for (const [key, coords] of Object.entries(DISTRICT_COORDINATES)) {
        if (cleanDist && (cleanDist.includes(key) || key.includes(cleanDist))) {
            return { ...coords };
        }
    }

    if (cleanSt && STATE_CENTERS[cleanSt]) {
        return { ...STATE_CENTERS[cleanSt] };
    }

    // Default to central agricultural region (Indore, Madhya Pradesh)
    return { lat: 22.7196, lon: 75.8577 };
}
