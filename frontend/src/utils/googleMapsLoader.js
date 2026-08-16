/**
 * Kisan Sahayak - Google Maps JavaScript API Loader with Fallback Protection
 */

// Reads API Key securely from Vite environment variables (VITE_GOOGLE_MAPS_API_KEY)
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

let loadPromise = null;

export function loadGoogleMapsScript(apiKey = GOOGLE_MAPS_API_KEY) {
    if (window.google && window.google.maps) {
        return Promise.resolve(window.google.maps);
    }

    if (!apiKey) {
        return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured.'));
    }

    if (loadPromise) {
        return loadPromise;
    }

    loadPromise = new Promise((resolve, reject) => {
        const existingScript = document.getElementById('google-maps-script');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.google?.maps));
            existingScript.addEventListener('error', (e) => reject(e));
            return;
        }

        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.type = 'text/javascript';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            if (window.google && window.google.maps) {
                resolve(window.google.maps);
            } else {
                reject(new Error('Google Maps script loaded but window.google.maps is undefined.'));
            }
        };

        script.onerror = (err) => {
            console.warn('Google Maps Script loading failed:', err);
            reject(new Error('Failed to load Google Maps script. Check network or API key restrictions.'));
        };

        document.head.appendChild(script);
    });

    return loadPromise;
}

export { GOOGLE_MAPS_API_KEY };
