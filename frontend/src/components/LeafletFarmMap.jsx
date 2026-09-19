import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getAccurateLocationDetails, detectAndResolveCurrentLocation } from '../utils/geolocation';

/**
 * LeafletFarmMap - Ultra-fast loading interactive map using Leaflet + Google Earth tiles.
 * 
 * Performance optimizations:
 * 1. Leaflet CSS is preloaded in index.html (zero CSS delay)
 * 2. Leaflet JS is eagerly loaded at app startup via warmup()
 * 3. DNS preconnect to mt0-3.google.com (zero DNS lookup delay)
 * 4. Aggressive tile buffer (keepBuffer: 6) — caches 6 screens of tiles around viewport
 * 5. updateWhenZooming: true for smooth zoom transitions
 * 6. Tile fadeAnimation disabled for instant paint
 * 7. Low initial zoom (14) for fast first-paint, then animate to 16 after load
 */

// ── Eagerly load Leaflet JS at import time (not at mount time) ──
let leafletReadyPromise = null;

function warmupLeaflet() {
    if (leafletReadyPromise) return leafletReadyPromise;

    if (window.L) {
        leafletReadyPromise = Promise.resolve(window.L);
        return leafletReadyPromise;
    }

    leafletReadyPromise = new Promise((resolve, reject) => {
        // Check if script tag already exists
        const existing = document.querySelector('script[src*="leaflet@1.9.4"]');
        if (existing) {
            if (window.L) return resolve(window.L);
            existing.addEventListener('load', () => resolve(window.L));
            existing.addEventListener('error', reject);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => resolve(window.L);
        script.onerror = reject;
        document.head.appendChild(script);
    });

    return leafletReadyPromise;
}

// Start loading Leaflet immediately when this module is imported (not when component mounts)
warmupLeaflet();

const LeafletFarmMap = ({
    initialLat = 20.5937,
    initialLon = 78.9629,
    zoom = 16,
    onLocationSelect,
    selectedLocation,
    height = '400px',
    showSearch = true,
    showControls = true
}) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const baseLayers = useRef({});
    const [mapType, setMapType] = useState('satellite');
    const [isLocating, setIsLocating] = useState(false);
    const [locatingStatus, setLocatingStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [currentCoords, setCurrentCoords] = useState({
        lat: selectedLocation?.latitude || initialLat,
        lon: selectedLocation?.longitude || initialLon
    });
    const [resolvedInfo, setResolvedInfo] = useState(null);
    const [mapReady, setMapReady] = useState(false);

    // Update location and trigger reverse geocode
    const handleCoordinateChange = useCallback(async (lat, lon, pan = false) => {
        setCurrentCoords({ lat, lon });

        if (pan && mapRef.current) {
            mapRef.current.flyTo([lat, lon], mapRef.current.getZoom(), { duration: 0.8 });
        }

        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lon]);
        }

        try {
            const locDetails = await getAccurateLocationDetails(lat, lon);
            setResolvedInfo(locDetails);
            if (onLocationSelect) onLocationSelect(locDetails);
        } catch (e) {
            if (onLocationSelect) {
                onLocationSelect({
                    latitude: lat,
                    longitude: lon,
                    state: 'India',
                    district: 'Farm Coordinates',
                    formattedAddress: `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`,
                    source: 'Map Pin'
                });
            }
        }
    }, [onLocationSelect]);

    // Initialize Leaflet map
    useEffect(() => {
        let cancelled = false;

        warmupLeaflet().then((L) => {
            if (cancelled || !L || !mapContainerRef.current || mapRef.current) return;

            const startLat = selectedLocation?.latitude || initialLat;
            const startLon = selectedLocation?.longitude || initialLon;

            // ── Create map with performance-tuned options ──
            const map = L.map(mapContainerRef.current, {
                center: [startLat, startLon],
                zoom: 14,              // Start at zoom 14 for fast first-paint (fewer tiles)
                maxZoom: 22,
                zoomControl: false,
                fadeAnimation: false,   // No fade = instant tile paint
                zoomAnimation: true,
                markerZoomAnimation: true,
                preferCanvas: true      // Canvas renderer is faster than SVG
            });
            mapRef.current = map;

            // Zoom control top-right
            L.control.zoom({ position: 'topright' }).addTo(map);

            // ── High-perf tile layer config ──
            const tileOpts = (extra = {}) => ({
                subdomains: ['0', '1', '2', '3'],
                maxZoom: 22,
                maxNativeZoom: 20,
                keepBuffer: 6,            // Cache 6 screens of tiles around viewport
                updateWhenIdle: false,     // Load tiles during pan (don't wait for idle)
                updateWhenZooming: true,   // Load tiles during zoom animation
                tileSize: 256,
                crossOrigin: 'anonymous',
                ...extra
            });

            baseLayers.current['satellite'] = L.tileLayer(
                'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                { ...tileOpts(), attribution: '© Google Earth' }
            );

            baseLayers.current['hybrid'] = L.tileLayer(
                'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                { ...tileOpts(), attribution: '© Google Earth' }
            );

            baseLayers.current['terrain'] = L.tileLayer(
                'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
                { ...tileOpts({ maxNativeZoom: 18 }), attribution: '© Google Terrain' }
            );

            // Add satellite as default
            const defaultLayer = baseLayers.current['satellite'];
            defaultLayer.addTo(map);

            // Once first batch of tiles loaded → zoom to target level
            defaultLayer.once('load', () => {
                if (!cancelled && mapRef.current) {
                    setTimeout(() => {
                        mapRef.current.flyTo([startLat, startLon], zoom, { duration: 0.6 });
                    }, 100);
                }
            });

            // ── Draggable Marker with pulsing green dot ──
            const markerIcon = L.divIcon({
                className: 'leaflet-farm-pin-custom',
                html: `
                    <div style="position:relative;width:40px;height:40px;">
                        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(19,236,19,0.35);animation:fpp 2s infinite ease-out;"></div>
                        <div style="position:absolute;top:10px;left:10px;width:20px;height:20px;border-radius:50%;background:#13ec13;border:3px solid #fff;box-shadow:0 0 14px #13ec13,0 2px 8px rgba(0,0,0,0.4);"></div>
                    </div>
                    <style>@keyframes fpp{0%{transform:scale(.7);opacity:1}100%{transform:scale(2.6);opacity:0}}</style>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            const marker = L.marker([startLat, startLon], {
                icon: markerIcon,
                draggable: true,
                autoPan: true
            }).addTo(map);
            markerRef.current = marker;

            marker.bindPopup('<strong style="color:#059669;">📍 Your Farm Pin</strong><br><span style="font-size:11px;">Drag to fine-tune position</span>');

            // Map Click -> Move Pin
            map.on('click', (e) => {
                handleCoordinateChange(e.latlng.lat, e.latlng.lng);
            });

            // Marker Drag End -> Update Coordinates
            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                handleCoordinateChange(pos.lat, pos.lng);
            });

            setMapReady(true);

            // Initial reverse geocode
            handleCoordinateChange(Number(startLat), Number(startLon));

            // ── Preload adjacent tiles for hybrid/terrain layers in background ──
            setTimeout(() => {
                if (!cancelled) {
                    // Silently create tile layers so browser caches DNS + TCP connections
                    const preloadImg = new Image();
                    preloadImg.src = `https://mt0.google.com/vt/lyrs=y&x=0&y=0&z=1`;
                    const preloadImg2 = new Image();
                    preloadImg2.src = `https://mt1.google.com/vt/lyrs=p&x=0&y=0&z=1`;
                }
            }, 2000);
        });

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Switch Map Type
    const handleMapTypeSwitch = (type) => {
        setMapType(type);
        if (!mapRef.current || !baseLayers.current[type]) return;

        Object.values(baseLayers.current).forEach(layer => {
            if (mapRef.current.hasLayer(layer)) mapRef.current.removeLayer(layer);
        });

        baseLayers.current[type].addTo(mapRef.current);
    };

    // 1-Click GPS Auto Detect
    const handleGPSDetect = async () => {
        setIsLocating(true);
        setLocatingStatus('Acquiring GPS Satellite Lock...');

        try {
            const loc = await detectAndResolveCurrentLocation((p) => setLocatingStatus(p.message));
            if (loc?.latitude && loc?.longitude) {
                handleCoordinateChange(loc.latitude, loc.longitude, true);
                if (mapRef.current) mapRef.current.setZoom(18);
            }
        } catch (err) {
            console.error('GPS error:', err);
        } finally {
            setIsLocating(false);
            setLocatingStatus('');
        }
    };

    // Search Location Handler
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', India')}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                handleCoordinateChange(parseFloat(data[0].lat), parseFloat(data[0].lon), true);
                if (mapRef.current) mapRef.current.setZoom(16);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-[#13ec13]/25 bg-[#050e08] font-display flex flex-col" style={{ height }}>
            {/* Top Toolbar: Search & Map Type Switcher */}
            {showControls && (
                <div className="absolute top-3 left-3 right-3 z-[500] flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
                    {showSearch && (
                        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-sm">
                            <div className="relative flex items-center">
                                <span className="material-symbols-outlined text-slate-400 absolute left-3 text-lg pointer-events-none">search</span>
                                <input
                                    type="text"
                                    placeholder="Search village, tehsil or district..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#071a0d]/95 border border-[#13ec13]/30 text-white placeholder-slate-400 text-xs rounded-2xl pl-9 pr-8 py-2.5 backdrop-blur-md focus:outline-none focus:border-[#13ec13] shadow-lg"
                                />
                                {isSearching ? (
                                    <span className="material-icons animate-spin text-sm text-[#13ec13] absolute right-3">sync</span>
                                ) : (
                                    searchQuery && (
                                        <button type="button" onClick={() => setSearchQuery('')} className="material-icons text-sm text-slate-400 hover:text-white absolute right-2.5 cursor-pointer">close</button>
                                    )
                                )}
                            </div>
                        </form>
                    )}

                    <div className="flex items-center bg-[#071a0d]/95 border border-[#13ec13]/30 rounded-2xl p-1 backdrop-blur-md shadow-lg">
                        {[
                            { key: 'satellite', icon: 'satellite_alt', label: 'Satellite' },
                            { key: 'hybrid', icon: 'layers', label: 'Hybrid' },
                            { key: 'terrain', icon: 'terrain', label: 'Terrain' }
                        ].map(({ key, icon, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleMapTypeSwitch(key)}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                    mapType === key
                                        ? 'bg-gradient-to-r from-[#13ec13] to-[#0db80d] text-[#050e08] shadow-md shadow-[#13ec13]/30'
                                        : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">{icon}</span>
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Map Container */}
            <div ref={mapContainerRef} className="w-full h-full relative z-0" />

            {/* Loading Skeleton — only shown before Leaflet is ready */}
            {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#050e08] z-10">
                    <div className="text-center space-y-3">
                        <div className="w-10 h-10 mx-auto border-2 border-[#13ec13]/30 border-t-[#13ec13] rounded-full animate-spin"></div>
                        <p className="text-xs text-slate-400 font-semibold">Loading satellite map...</p>
                    </div>
                </div>
            )}

            {/* Floating "Locate My Field" Button */}
            <button
                type="button"
                onClick={handleGPSDetect}
                disabled={isLocating}
                className="absolute bottom-24 right-3 z-[500] p-3 rounded-2xl bg-gradient-to-tr from-[#13ec13] to-[#0db80d] text-[#050e08] font-bold shadow-xl shadow-[#13ec13]/30 border border-white/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 disabled:opacity-50"
                title="Detect & Lock Current GPS Coordinates"
            >
                <span className={`material-symbols-outlined text-xl ${isLocating ? 'animate-spin' : ''}`}>
                    {isLocating ? 'sync' : 'my_location'}
                </span>
                <span className="text-xs font-extrabold hidden sm:inline">{isLocating ? 'Locking GPS...' : 'Locate Field'}</span>
            </button>

            {/* Bottom HUD */}
            <div className="absolute bottom-3 left-3 right-3 z-[500] p-3 rounded-2xl bg-[#071a0d]/95 border border-[#13ec13]/30 text-white backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-[#13ec13]/15 text-[#13ec13] flex items-center justify-center shrink-0 border border-[#13ec13]/30">
                        <span className="material-symbols-outlined text-lg">pin_drop</span>
                    </div>
                    <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#13ec13]/15 text-[#13ec13] border border-[#13ec13]/30">
                                SATELLITE PIN
                            </span>
                            <span className="text-xs font-mono font-bold text-[#13ec13]">
                                {Number(currentCoords.lat).toFixed(5)}° N, {Number(currentCoords.lon).toFixed(5)}° E
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-200 truncate mt-0.5 font-medium">
                            {locatingStatus || resolvedInfo?.formattedAddress || resolvedInfo?.district || 'Drag marker or tap map to pin precise farm boundary'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-[#13ec13]/70 font-bold hidden md:inline">🎯 Drag pin to fine-tune</span>
                </div>
            </div>
        </div>
    );
};

export default LeafletFarmMap;
