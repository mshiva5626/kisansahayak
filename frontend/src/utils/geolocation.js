/**
 * Kisan Sahayak - High-Accuracy Geolocation & Multi-Tier Reverse Geocoding Utility
 * 
 * Provides fail-safe GPS satellite acquisition and cascading reverse geocoding.
 */

import { locationAPI } from '../api';

/**
 * Normalizes district names by stripping administrative terms
 */
export function cleanDistrictName(name) {
    if (!name) return '';
    return name
        .replace(/\b(district|dist|zilla|mandal|taluk|taluka|tehsil)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Acquires high-accuracy GPS coordinates with smart hardware timeout fallback
 */
export function getHighAccuracyCoordinates() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error('Geolocation is not supported by your device or browser.'));
        }

        // Primary High-Accuracy GPS Attempt (Satellite Lock)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    source: 'GPS Hardware Lock'
                });
            },
            (err) => {
                console.warn('High accuracy GPS timed out or failed, trying standard cellular/WiFi geo...', err.message);
                
                // Secondary Standard Geo Attempt (Cellular / WiFi Network Triangulation)
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        resolve({
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                            accuracy: pos.coords.accuracy,
                            source: 'Network Triangulation'
                        });
                    },
                    (finalErr) => {
                        let errorMsg = 'Could not access GPS location.';
                        if (finalErr.code === 1) {
                            errorMsg = 'Location permission was denied. Please allow location access in your browser settings.';
                        } else if (finalErr.code === 2) {
                            errorMsg = 'Location position is currently unavailable. Please check your GPS/internet connection.';
                        } else if (finalErr.code === 3) {
                            errorMsg = 'Location request timed out. Please try again or select your district manually.';
                        }
                        reject(new Error(errorMsg));
                    },
                    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
                );
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    });
}

/**
 * Resolves precise State, District, SubDistrict, and Village/City from coordinates
 */
export async function getAccurateLocationDetails(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
        throw new Error('Valid coordinates are required.');
    }

    // ------------------------------------------------------------------------
    // TIER 1: Server-Side Reverse Geocoding API
    // ------------------------------------------------------------------------
    try {
        const { data } = await locationAPI.reverseGeocode(lat, lon);
        if (data?.success && data?.location && data.location.district && data.location.state !== 'India') {
            return {
                ...data.location,
                latitude: lat,
                longitude: lon,
                source: 'GPS Verified'
            };
        }
    } catch (e) {
        console.warn('Backend reverse geocode tier skipped:', e.message);
    }

    // ------------------------------------------------------------------------
    // TIER 2: Direct BigDataCloud Client API (Ultra-fast, High Resolution)
    // ------------------------------------------------------------------------
    try {
        const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        const data = await res.json();
        
        if (data && (data.principalSubdivision || data.locality || data.city)) {
            const state = data.principalSubdivision || 'India';
            const admins = data.localityInfo?.administrative || [];
            
            const districtObj = admins.find(a => 
                (a.adminLevel === 5 || a.adminLevel === 6) || 
                (a.description && a.description.toLowerCase().includes('district')) ||
                (a.name && a.name.toLowerCase().includes('district'))
            );

            const subDistrictObj = admins.find(a => 
                a.adminLevel === 7 || 
                (a.description && /taluk|tehsil|mandal|block/i.test(a.description))
            );

            const rawDistrict = districtObj?.name || data.locality || data.city || '';
            const district = cleanDistrictName(rawDistrict);
            const subDistrict = cleanDistrictName(subDistrictObj?.name || '');
            const locality = data.locality || data.city || subDistrict || district;

            return {
                state,
                district: district || locality,
                subDistrict,
                city: data.city || locality || district,
                locality,
                postcode: data.postcode || '',
                formattedAddress: `${locality ? `${locality}, ` : ''}${district}, ${state}`,
                latitude: lat,
                longitude: lon,
                source: 'GPS Verified'
            };
        }
    } catch (e) {
        console.warn('Client BigDataCloud geocode tier skipped:', e.message);
    }

    // ------------------------------------------------------------------------
    // TIER 3: Direct Nominatim Client API (Fallback)
    // ------------------------------------------------------------------------
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1&accept-language=en`
        );
        const data = await res.json();
        if (data && data.address) {
            const addr = data.address;
            const state = addr.state || 'India';
            const rawDistrict = addr.state_district || addr.county || addr.district || addr.city || addr.town || '';
            const district = cleanDistrictName(rawDistrict);
            const subDistrict = cleanDistrictName(addr.subdistrict || addr.taluk || addr.tehsil || '');
            const locality = addr.village || addr.suburb || addr.town || addr.city || subDistrict || district;

            return {
                state,
                district: district || locality,
                subDistrict,
                city: addr.city || addr.town || locality,
                locality,
                postcode: addr.postcode || '',
                formattedAddress: data.display_name || `${locality}, ${district}, ${state}`,
                latitude: lat,
                longitude: lon,
                source: 'GPS Verified'
            };
        }
    } catch (e) {
        console.warn('Nominatim client fallback error:', e.message);
    }

    // ------------------------------------------------------------------------
    // TIER 4: Coordinate Raw Pin
    // ------------------------------------------------------------------------
    return {
        state: 'India',
        district: `GPS (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
        subDistrict: '',
        city: 'Current Field',
        locality: 'Field Coordinates',
        postcode: '',
        formattedAddress: `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
        latitude: lat,
        longitude: lon,
        source: 'GPS Coordinates'
    };
}

/**
 * 1-Click Detect & Resolve Location Orchestrator
 */
export async function detectAndResolveCurrentLocation(onProgress) {
    if (onProgress) onProgress({ status: 'acquiring', message: '📡 Locking high-precision GPS satellites...' });
    
    const coords = await getHighAccuracyCoordinates();
    
    if (onProgress) onProgress({ status: 'resolving', message: '📍 Resolving district and state boundaries...' });
    
    const location = await getAccurateLocationDetails(coords.latitude, coords.longitude);
    
    if (onProgress) onProgress({ status: 'completed', message: `✅ Located in ${location.district}, ${location.state}`, location });
    
    return location;
}
