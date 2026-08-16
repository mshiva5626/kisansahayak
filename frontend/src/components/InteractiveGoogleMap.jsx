import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMapsScript } from '../utils/googleMapsLoader';
import { detectAndResolveCurrentLocation, getAccurateLocationDetails } from '../utils/geolocation';

const InteractiveGoogleMap = ({
    initialLat = 20.5937,
    initialLon = 78.9629,
    zoom = 15,
    onLocationSelect,
    selectedLocation,
    height = '400px',
    showSearch = true,
    showControls = true
}) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [mapType, setMapType] = useState('terrain'); // 'terrain' | 'satellite' | 'hybrid' | 'roadmap'
    const [isLocating, setIsLocating] = useState(false);
    const [locatingStatus, setLocatingStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [currentCoords, setCurrentCoords] = useState({
        lat: selectedLocation?.latitude || initialLat,
        lon: selectedLocation?.longitude || initialLon
    });
    const [resolvedInfo, setResolvedInfo] = useState(null);

    // Update location and trigger reverse geocode
    const handleCoordinateChange = useCallback(async (lat, lon, pan = false) => {
        setCurrentCoords({ lat, lon });

        if (pan && mapInstanceRef.current) {
            mapInstanceRef.current.panTo({ lat, lng: lon });
        }

        if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng: lon });
        }

        try {
            const locDetails = await getAccurateLocationDetails(lat, lon);
            setResolvedInfo(locDetails);
            if (onLocationSelect) {
                onLocationSelect(locDetails);
            }
        } catch (e) {
            console.warn('Reverse geocode error:', e);
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

    // Initialize Google Map
    useEffect(() => {
        let isMounted = true;

        loadGoogleMapsScript()
            .then((googleMaps) => {
                if (!isMounted || !mapContainerRef.current) return;

                const startLat = selectedLocation?.latitude || initialLat;
                const startLon = selectedLocation?.longitude || initialLon;

                const mapOptions = {
                    center: { lat: Number(startLat), lng: Number(startLon) },
                    zoom: zoom,
                    mapTypeId: googleMaps.MapTypeId.TERRAIN, // Default to Terrain Map for Agriculture
                    disableDefaultUI: true,
                    zoomControl: true,
                    fullscreenControl: false,
                    streetViewControl: false,
                    mapTypeControl: false,
                    gestureHandling: 'greedy'
                };

                const map = new googleMaps.Map(mapContainerRef.current, mapOptions);
                mapInstanceRef.current = map;

                // Draggable Marker
                const marker = new googleMaps.Marker({
                    position: { lat: Number(startLat), lng: Number(startLon) },
                    map: map,
                    draggable: true,
                    animation: googleMaps.Animation.DROP,
                    title: 'Your Farm Plot Pin (Drag to fine-tune)'
                });
                markerRef.current = marker;

                // Map Click -> Move Pin
                map.addListener('click', (e) => {
                    const clickedLat = e.latLng.lat();
                    const clickedLon = e.latLng.lng();
                    handleCoordinateChange(clickedLat, clickedLon);
                });

                // Marker Drag End -> Update Coordinates
                marker.addListener('dragend', (e) => {
                    const draggedLat = e.latLng.lat();
                    const draggedLon = e.latLng.lng();
                    handleCoordinateChange(draggedLat, draggedLon);
                });

                // Initial reverse geocode
                handleCoordinateChange(Number(startLat), Number(startLon));
            })
            .catch((err) => {
                console.warn('Google Maps failed to load, switching to interactive fallback mode:', err);
                setMapError('Google Maps API restricted on current domain. Using fallback interactive terrain map.');
            });

        return () => {
            isMounted = false;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Switch Map Type (Terrain, Satellite, Hybrid, Roadmap)
    const handleMapTypeSwitch = (type) => {
        setMapType(type);
        if (!mapInstanceRef.current || !window.google?.maps) return;

        const typeMap = {
            terrain: window.google.maps.MapTypeId.TERRAIN,
            satellite: window.google.maps.MapTypeId.SATELLITE,
            hybrid: window.google.maps.MapTypeId.HYBRID,
            roadmap: window.google.maps.MapTypeId.ROADMAP
        };

        mapInstanceRef.current.setMapTypeId(typeMap[type] || window.google.maps.MapTypeId.TERRAIN);
    };

    // 1-Click GPS Auto Detect
    const handleGPSDetect = async () => {
        setIsLocating(true);
        setLocatingStatus('Acquiring GPS Satellite Lock...');

        try {
            const loc = await detectAndResolveCurrentLocation((p) => setLocatingStatus(p.message));
            if (loc?.latitude && loc?.longitude) {
                handleCoordinateChange(loc.latitude, loc.longitude, true);
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setZoom(17); // Zoom to high-res field level
                }
            }
            setIsLocating(false);
            setLocatingStatus('');
        } catch (err) {
            console.error('GPS error:', err);
            setLocatingStatus('');
            setIsLocating(false);
            alert(err.message || 'Could not acquire GPS coordinates.');
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
                const searchLat = parseFloat(data[0].lat);
                const searchLon = parseFloat(data[0].lon);
                handleCoordinateChange(searchLat, searchLon, true);
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setZoom(15);
                }
            } else {
                alert('Location not found. Please try searching with state or district name.');
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-emerald-500/20 bg-slate-950 font-display flex flex-col" style={{ height }}>
            {/* Top Toolbar: Search & Map Type Switcher */}
            {showControls && (
                <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
                    {/* Search Bar */}
                    {showSearch && (
                        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-sm">
                            <div className="relative flex items-center">
                                <span className="material-symbols-outlined text-slate-400 absolute left-3 text-lg pointer-events-none">search</span>
                                <input
                                    type="text"
                                    placeholder="Search village, tehsil or district..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#0c2415]/90 border border-emerald-500/30 text-white placeholder-slate-400 text-xs rounded-2xl pl-9 pr-8 py-2.5 backdrop-blur-md focus:outline-none focus:border-[#0ED054] shadow-lg"
                                />
                                {isSearching ? (
                                    <span className="material-icons animate-spin text-sm text-primary absolute right-3">sync</span>
                                ) : (
                                    searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="material-icons text-sm text-slate-400 hover:text-white absolute right-2.5 cursor-pointer"
                                        >
                                            close
                                        </button>
                                    )
                                )}
                            </div>
                        </form>
                    )}

                    {/* Map Layers (Terrain, Satellite, Hybrid) */}
                    <div className="flex items-center bg-[#0c2415]/90 border border-emerald-500/30 rounded-2xl p-1 backdrop-blur-md shadow-lg">
                        <button
                            type="button"
                            onClick={() => handleMapTypeSwitch('terrain')}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                mapType === 'terrain'
                                    ? 'bg-gradient-to-r from-[#0ED054] to-[#0a9e3e] text-white shadow-md'
                                    : 'text-slate-300 hover:text-white'
                            }`}
                            title="Terrain Topography & Elevation View"
                        >
                            <span className="material-symbols-outlined text-sm">terrain</span>
                            <span>Terrain</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleMapTypeSwitch('satellite')}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                mapType === 'satellite'
                                    ? 'bg-gradient-to-r from-[#0ED054] to-[#0a9e3e] text-white shadow-md'
                                    : 'text-slate-300 hover:text-white'
                            }`}
                            title="Satellite Field & Canopy View"
                        >
                            <span className="material-symbols-outlined text-sm">satellite_alt</span>
                            <span>Satellite</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleMapTypeSwitch('hybrid')}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                mapType === 'hybrid'
                                    ? 'bg-gradient-to-r from-[#0ED054] to-[#0a9e3e] text-white shadow-md'
                                    : 'text-slate-300 hover:text-white'
                            }`}
                            title="Hybrid Satellite with Roads & Villages"
                        >
                            <span className="material-symbols-outlined text-sm">layers</span>
                            <span>Hybrid</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Google Map Container Canvas */}
            <div ref={mapContainerRef} className="w-full h-full relative z-0" />

            {/* Fallback View if Google Maps Restricted */}
            {mapError && (
                <div className="absolute inset-0 bg-[#07130c]/90 flex flex-col items-center justify-center p-6 text-center z-20 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-3xl">terrain</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">High-Precision Terrain Mapping</h4>
                    <p className="text-xs text-slate-300 max-w-sm mb-4">
                        GPS Coordinates Locked: <strong className="text-emerald-400">{currentCoords.lat.toFixed(5)}° N, {currentCoords.lon.toFixed(5)}° E</strong>
                    </p>
                    <button
                        type="button"
                        onClick={handleGPSDetect}
                        className="py-2.5 px-4 rounded-xl bg-[#0ED054] text-slate-950 font-bold text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-base">my_location</span>
                        <span>Re-Sync High Accuracy GPS</span>
                    </button>
                </div>
            )}

            {/* Floating "Locate My Field" Button */}
            <button
                type="button"
                onClick={handleGPSDetect}
                disabled={isLocating}
                className="absolute bottom-24 right-3 z-10 p-3 rounded-2xl bg-gradient-to-tr from-[#0ED054] to-[#0a9e3e] text-white font-bold shadow-xl border border-white/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 disabled:opacity-50"
                title="Detect & Lock Current GPS Coordinates"
            >
                <span className={`material-symbols-outlined text-xl ${isLocating ? 'animate-spin' : ''}`}>
                    {isLocating ? 'sync' : 'my_location'}
                </span>
                <span className="text-xs hidden sm:inline">{isLocating ? 'Locking GPS...' : 'Locate Field'}</span>
            </button>

            {/* Bottom HUD: Live Coordinates & Address Confirmation */}
            <div className="absolute bottom-3 left-3 right-3 z-10 p-3 rounded-2xl bg-[#0c2415]/95 border border-emerald-500/30 text-white backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-[#0ED054]/20 text-[#0ED054] flex items-center justify-center shrink-0 border border-[#0ED054]/30">
                        <span className="material-symbols-outlined text-lg">pin_drop</span>
                    </div>
                    <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {mapType.toUpperCase()} PIN
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-400">
                                {Number(currentCoords.lat).toFixed(5)}° N, {Number(currentCoords.lon).toFixed(5)}° E
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-200 truncate mt-0.5 font-medium">
                            {locatingStatus || resolvedInfo?.formattedAddress || resolvedInfo?.district || 'Drag marker or tap map to pin precise farm boundary'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-emerald-300/80 font-bold hidden md:inline">
                        🎯 Drag pin to fine-tune
                    </span>
                </div>
            </div>
        </div>
    );
};

export default InteractiveGoogleMap;
