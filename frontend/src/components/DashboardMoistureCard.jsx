import React, { useEffect, useState, useMemo } from 'react';
import { useIoT } from '../context/IoTContext';
import { estimateSoilNPKFromSensor } from '../utils/npkAgronomyModel';

// ─── High-Fidelity Animated Circular Gauge ───────────────────────────────────
const CircularGauge = ({ value, size = 88, strokeWidth = 7 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const hasValue = value !== null && value !== undefined && !isNaN(Number(value));
    const clamped = hasValue ? Math.min(100, Math.max(0, Number(value))) : 0;
    const dashOffset = hasValue ? circumference - (clamped / 100) * circumference : circumference;

    const getColor = (v) => {
        if (!hasValue) return { stroke: '#94a3b8', glow: 'transparent' };
        if (v < 20) return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.35)' };
        if (v < 40) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)' };
        if (v < 70) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.35)' };
        return { stroke: '#0284c7', glow: 'rgba(2, 132, 199, 0.35)' };
    };

    const { stroke, glow } = getColor(clamped);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background track */}
                <circle
                    cx={size / 2} cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-white/10"
                    strokeWidth={strokeWidth}
                />
                {/* Colored Progress when valid reading exists */}
                {hasValue && (
                    <circle
                        cx={size / 2} cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        style={{
                            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
                            filter: `drop-shadow(0 0 6px ${glow})`
                        }}
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-xl font-black tracking-tight leading-none ${hasValue ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                    {hasValue ? `${clamped}%` : '—'}
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                    {hasValue ? 'Moisture' : 'No Data'}
                </span>
            </div>
        </div>
    );
};

// ─── Status Classification ───────────────────────────────────────────────────
const getMoistureStatus = (v, isConnected, hasDevice) => {
    if (v === null || v === undefined || isNaN(Number(v))) {
        if (!hasDevice) {
            return {
                label: 'No Sensor Paired',
                badgeBg: 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400',
                dotBg: 'bg-slate-400',
                emoji: '📡',
                advice: 'No soil moisture sensor is linked to this farm. Connect an ESP32 KisanSensor via Bluetooth to view live moisture.',
                waterStress: 'Unknown',
                capacityPct: null
            };
        }
        if (!isConnected) {
            return {
                label: 'Sensor Disconnected',
                badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400',
                dotBg: 'bg-amber-500',
                emoji: '⚠️',
                advice: 'Your paired sensor is offline. Tap Reconnect below to resume live Bluetooth telemetry.',
                waterStress: 'Offline',
                capacityPct: null
            };
        }
        return {
            label: 'Waiting for Reading...',
            badgeBg: 'bg-teal-500/15 border-teal-500/30 text-teal-700 dark:text-teal-400',
            dotBg: 'bg-teal-500',
            emoji: '⏳',
            advice: 'Sensor connected. Waiting for first moisture telemetry packet from ESP32.',
            waterStress: 'Connecting',
            capacityPct: null
        };
    }

    const val = Number(v);
    if (val < 20) {
        return {
            label: 'Very Dry',
            badgeBg: 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-400',
            dotBg: 'bg-red-500',
            emoji: '🔴',
            advice: 'Critical root dehydration! Immediate drip / sprinkler irrigation required.',
            waterStress: 'Severe Stress',
            capacityPct: Math.round(val * 1.5)
        };
    }
    if (val < 40) {
        return {
            label: 'Dry (Needs Water)',
            badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400',
            dotBg: 'bg-amber-500',
            emoji: '🟡',
            advice: 'Soil moisture is dipping below threshold. Plan irrigation within 24 hours.',
            waterStress: 'Mild Stress',
            capacityPct: Math.round(val * 1.6)
        };
    }
    if (val < 70) {
        return {
            label: 'Optimal Hydration',
            badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
            dotBg: 'bg-emerald-500',
            emoji: '🟢',
            advice: 'Moisture in root zone is well-balanced. Next irrigation cycle in 3-4 days.',
            waterStress: 'None (Ideal)',
            capacityPct: Math.min(95, Math.round(val * 1.35))
        };
    }
    return {
        label: 'Saturated (Wet)',
        badgeBg: 'bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-400',
        dotBg: 'bg-sky-500',
        emoji: '🔵',
        advice: 'Soil is saturated. Halt watering and ensure proper drainage to prevent root rot.',
        waterStress: 'Waterlogging Risk',
        capacityPct: 98
    };
};

// ─── Main Dashboard Moisture Card ─────────────────────────────────────────────
const DashboardMoistureCard = ({ selectedFarmId, onNavigate, farm, onIoTPairClick }) => {
    const { getSensorForFarm, connectDevice, connectingId } = useIoT();
    const [sensor, setSensor] = useState(null);
    const [pulse, setPulse] = useState(false);
    const [demoMode, setDemoMode] = useState(false);

    // Poll sensor data from IoTContext
    useEffect(() => {
        const update = () => {
            const s = getSensorForFarm(selectedFarmId);
            setSensor(prev => {
                if (s?.moisture && prev?.moisture && s.moisture !== prev.moisture) {
                    setPulse(true);
                }
                return s;
            });
        };
        update();
        const id = setInterval(update, 2000);
        return () => clearInterval(id);
    }, [selectedFarmId, getSensorForFarm]);

    // Reset pulse animation
    useEffect(() => {
        if (pulse) {
            const t = setTimeout(() => setPulse(false), 800);
            return () => clearTimeout(t);
        }
    }, [pulse]);

    const isConnected = sensor?.connected === true;
    const hasHardwareDevice = !!sensor;
    const isConnecting = sensor ? connectingId === sensor.deviceId : false;

    // True live sensor reading — strictly null if no active sensor is reporting (NO fake default 48%)
    const rawMoisture = (isConnected && sensor?.moisture !== undefined && sensor?.moisture !== null)
        ? sensor.moisture
        : null;

    // If user explicitly enables demo mode for UI testing, use 54%; otherwise strictly use real sensor
    const moisture = demoMode ? 54 : rawMoisture;
    const hasReading = moisture !== null;

    const soilTemp = demoMode ? 24.2 : ((isConnected && sensor?.temperature) ? sensor.temperature : null);
    const batteryLevel = demoMode ? 92 : ((isConnected && sensor?.battery !== undefined) ? sensor.battery : null);
    const deviceTitle = demoMode 
        ? 'Simulator Mode (Test)' 
        : (sensor?.deviceName || (hasHardwareDevice ? 'KisanSensor (Offline)' : 'No Hardware Sensor'));

    const status = getMoistureStatus(moisture, isConnected, hasHardwareDevice);
    const cropName = farm?.crop_type || 'Wheat';

    const soilNPK = useMemo(() => {
        return estimateSoilNPKFromSensor(moisture, cropName.toLowerCase());
    }, [moisture, cropName]);

    return (
        <div className="krishi-glass border border-emerald-500/25 dark:border-emerald-500/20 rounded-3xl p-5 mb-6 shadow-xl relative overflow-hidden font-display antialiased transition-all duration-300">
            {/* Ambient Background Glows */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* ── Top Header ── */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-md transition-all ${
                        hasReading
                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/20'
                            : 'bg-slate-400 dark:bg-slate-700 shadow-slate-500/10'
                    }`}>
                        <span className="material-symbols-outlined text-[20px]">
                            {hasReading ? 'water_drop' : 'sensors_off'}
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h2 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                                Soil Moisture Sensor
                            </h2>
                            {hasReading ? (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                            ) : (
                                <span className="inline-flex h-2 w-2 rounded-full bg-slate-400" />
                            )}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            {demoMode
                                ? 'Interactive Demo Mode • Active'
                                : (isConnected ? 'ESP32 BLE Live Stream Active' : 'Live Hardware Telemetry')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onNavigate && (
                        <button
                            onClick={() => onNavigate('soil-intelligence')}
                            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                            Soil Hub
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ── Main Hero Row: Gauge + Status Breakdown ── */}
            <div className="flex items-center gap-4 bg-white/50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 rounded-2xl p-3.5 mb-3.5 relative z-10">
                {/* Circular Gauge */}
                <div className={`shrink-0 transition-transform duration-300 ${pulse ? 'scale-105' : 'scale-100'}`}>
                    <CircularGauge value={moisture} size={84} strokeWidth={7} />
                </div>

                {/* Status & Highlights */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border shadow-xs ${status.badgeBg}`}>
                            <span>{status.emoji}</span>
                            <span>{status.label}</span>
                        </span>
                        {demoMode && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                Demo
                            </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                            {cropName}
                        </span>
                    </div>

                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed mb-2 line-clamp-2">
                        {status.advice}
                    </p>

                    {/* Sensor Device Identifier and Battery */}
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1 font-semibold truncate">
                            <span className={`material-symbols-outlined text-[12px] ${isConnected ? 'text-emerald-500' : 'text-slate-400'}`}>
                                sensors
                            </span>
                            {deviceTitle}
                        </span>
                        {batteryLevel !== null && (
                            <span className="flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                <span className="material-symbols-outlined text-[13px]">battery_5_bar</span>
                                {batteryLevel}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Multi-Sensor Diagnostic Metrics Grid ── */}
            <div className="grid grid-cols-3 gap-2 mb-3.5 relative z-10">
                <div className="bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-xl p-2 text-center shadow-xs">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Soil Temp</span>
                    <span className={`text-xs font-black mt-0.5 block ${soilTemp ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                        {soilTemp !== null ? `${soilTemp}°C` : '—'}
                    </span>
                    <span className="text-[8px] font-semibold text-slate-400 block">
                        {soilTemp !== null ? 'Root Temp' : 'No Signal'}
                    </span>
                </div>

                <div className="bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-xl p-2 text-center shadow-xs">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Field Cap.</span>
                    <span className={`text-xs font-black mt-0.5 block ${status.capacityPct ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                        {status.capacityPct !== null ? `${status.capacityPct}%` : '—'}
                    </span>
                    <span className="text-[8px] font-semibold text-slate-400 block">
                        {status.capacityPct !== null ? 'Retention' : 'Offline'}
                    </span>
                </div>

                <div className="bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-xl p-2 text-center shadow-xs">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Soil NPK</span>
                    <span className={`text-xs font-black mt-0.5 block ${hasReading ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                        {hasReading ? `${soilNPK.n.value}-${soilNPK.p.value}-${soilNPK.k.value}` : '—'}
                    </span>
                    <span className="text-[8px] font-semibold text-slate-400 block">
                        {hasReading ? 'kg/ha Ratio' : 'Requires Sensor'}
                    </span>
                </div>
            </div>

            {/* ── Moisture Spectrum Range Bar ── */}
            <div className="mb-3 relative z-10">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1">
                    <span>Wilting Pt (0%)</span>
                    <span className={hasReading ? 'text-emerald-500' : 'text-slate-400'}>Optimal (40-70%)</span>
                    <span>Saturation (100%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 relative overflow-hidden">
                    {hasReading && (
                        <div
                            className="h-full rounded-full transition-all duration-700 relative"
                            style={{
                                width: `${moisture}%`,
                                background: moisture < 20 
                                    ? '#ef4444' 
                                    : moisture < 40 
                                    ? '#f59e0b' 
                                    : moisture < 70 
                                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' 
                                    : '#0284c7'
                            }}
                        />
                    )}
                </div>
            </div>

            {/* ── Bottom Hardware Bar & Actions ── */}
            <div className="pt-2.5 border-t border-emerald-500/15 flex items-center justify-between relative z-10 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className={`material-symbols-outlined text-[13px] ${hasReading ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {hasReading ? 'wifi_tethering' : 'bluetooth_searching'}
                    </span>
                    <span>
                        {hasReading
                            ? (demoMode ? 'Demo Telemetry active' : 'BLE Synced • Streaming')
                            : (hasHardwareDevice ? 'Sensor Offline' : 'Hardware Not Connected')}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle to test telemetry without hardware */}
                    <button
                        onClick={() => setDemoMode(prev => !prev)}
                        className={`px-2 py-0.5 rounded-lg border font-bold text-[9px] transition-all cursor-pointer ${
                            demoMode
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                        title={demoMode ? 'Switch back to real sensor' : 'Simulate sensor telemetry for testing'}
                    >
                        {demoMode ? 'Exit Demo' : 'Simulate'}
                    </button>

                    {!isConnected && !hasHardwareDevice && (
                        <button
                            onClick={onIoTPairClick || (() => onNavigate?.('iot-pairing'))}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[12px]">add</span>
                            Pair ESP32
                        </button>
                    )}

                    {!isConnected && hasHardwareDevice && (
                        <button
                            onClick={() => connectDevice(sensor.deviceId)}
                            disabled={isConnecting}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isConnecting ? (
                                <><div className="w-2.5 h-2.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />Connecting...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[12px]">bluetooth</span>Reconnect</>
                            )}
                        </button>
                    )}

                    {isConnected && (
                        <button
                            onClick={() => onNavigate?.('iot-settings')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[12px]">tune</span>
                            Settings
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardMoistureCard;
