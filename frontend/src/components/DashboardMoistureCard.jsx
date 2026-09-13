import React, { useEffect, useState } from 'react';
import { useIoT } from '../context/IoTContext';

// ─── Circular gauge ───────────────────────────────────────────────────────────
const CircularGauge = ({ value, size = 80, strokeWidth = 6 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = value !== null ? Math.min(100, Math.max(0, value)) : 0;
    const dashOffset = circumference - (progress / 100) * circumference;

    const getColor = (v) => {
        if (v === null) return '#64748b';
        if (v < 20) return '#ef4444';
        if (v < 40) return '#f59e0b';
        if (v < 70) return '#10b981';
        return '#3b82f6';
    };

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle
                cx={size / 2} cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={strokeWidth}
            />
            {/* Progress */}
            <circle
                cx={size / 2} cy={size / 2}
                r={radius}
                fill="none"
                stroke={getColor(value)}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
            />
        </svg>
    );
};

// ─── Status label ──────────────────────────────────────────────────────────────
const getMoistureStatus = (v) => {
    if (v === null || v === undefined) return { label: 'No Data', color: 'text-slate-400', bg: 'bg-slate-400/10', tip: 'Connect sensor to view data', emoji: '📡' };
    if (v < 20)  return { label: 'Very Dry',  color: 'text-red-400',     bg: 'bg-red-400/10',     tip: 'Urgent: Irrigate immediately!',         emoji: '🔴' };
    if (v < 40)  return { label: 'Dry',       color: 'text-amber-400',   bg: 'bg-amber-400/10',   tip: 'Consider irrigating soon',             emoji: '🟡' };
    if (v < 70)  return { label: 'Optimal',   color: 'text-emerald-400', bg: 'bg-emerald-400/10', tip: 'Moisture level is perfect',            emoji: '🟢' };
    return              { label: 'Wet',       color: 'text-blue-400',    bg: 'bg-blue-400/10',    tip: 'Reduce irrigation, waterlogging risk', emoji: '🔵' };
};

// ─── Main Dashboard Moisture Card ─────────────────────────────────────────────
const DashboardMoistureCard = ({ selectedFarmId, onNavigate }) => {
    const { getSensorForFarm, connectDevice, connectingId } = useIoT();
    const [sensor, setSensor] = useState(null);
    const [pulse, setPulse] = useState(false);

    // Poll sensor data every 2 seconds
    useEffect(() => {
        const update = () => {
            const s = getSensorForFarm(selectedFarmId);
            setSensor(prev => {
                if (s?.moisture !== prev?.moisture) setPulse(true);
                return s;
            });
        };
        update();
        const id = setInterval(update, 2000);
        return () => clearInterval(id);
    }, [selectedFarmId, getSensorForFarm]);

    // Clear pulse after animation
    useEffect(() => {
        if (pulse) {
            const t = setTimeout(() => setPulse(false), 600);
            return () => clearTimeout(t);
        }
    }, [pulse]);

    const moisture = sensor?.moisture ?? null;
    const { label, color, bg, tip, emoji } = getMoistureStatus(moisture);
    const isConnected = sensor?.connected === true;
    const isConnecting = sensor ? connectingId === sensor.deviceId : false;
    const hasSensor = !!sensor;

    // ── No sensor paired for this farm ─────────────────────────────────────
    if (!hasSensor) {
        return (
            <div className="krishi-glass border border-white/10 dark:border-white/5 rounded-3xl p-4 mb-6 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-lg">sensors_off</span>
                        <h2 className="font-extrabold text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider">Soil Moisture</h2>
                    </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-dashed border-white/15 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-slate-500 text-2xl">bluetooth_searching</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">No IoT sensor linked</p>
                        <p className="text-xs text-gray-400 leading-snug">Pair an ESP32 soil sensor to monitor moisture for this farm.</p>
                    </div>
                </div>

                <button
                    onClick={() => onNavigate('iot-pairing')}
                    className="mt-3 w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Pair KisanSensor
                </button>
            </div>
        );
    }

    // ── Sensor paired but disconnected ─────────────────────────────────────
    if (!isConnected) {
        return (
            <div className="krishi-glass border border-white/10 dark:border-white/5 rounded-3xl p-4 mb-6 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <h2 className="font-extrabold text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider">Soil Moisture</h2>
                    </div>
                    <button
                        onClick={() => onNavigate('iot-settings')}
                        className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5"
                    >
                        Manage
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>

                <div className="flex items-center gap-4 py-1">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 relative">
                        <span className="material-symbols-outlined text-slate-400 text-2xl">sensors</span>
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-500 border-2 border-white/20" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{sensor.deviceName || 'KisanSensor'}</p>
                        <p className="text-xs text-slate-400">Disconnected — tap to reconnect</p>
                    </div>
                </div>

                <button
                    onClick={() => connectDevice(sensor.deviceId)}
                    disabled={isConnecting}
                    className="mt-3 w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-60"
                >
                    {isConnecting ? (
                        <><div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />Connecting...</>
                    ) : (
                        <><span className="material-symbols-outlined text-sm">bluetooth</span>Reconnect Sensor</>
                    )}
                </button>
            </div>
        );
    }

    // ── Connected — show live data ──────────────────────────────────────────
    return (
        <div className="krishi-glass border border-emerald-500/20 dark:border-emerald-500/15 rounded-3xl p-4 mb-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h2 className="font-extrabold text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider">Live Soil Moisture</h2>
                </div>
                <button
                    onClick={() => onNavigate('iot-settings')}
                    className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5"
                >
                    Sensors
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
            </div>

            {/* Main reading row */}
            <div className="flex items-center gap-4">
                {/* Circular Gauge */}
                <div className={`relative shrink-0 transition-transform duration-300 ${pulse ? 'scale-110' : 'scale-100'}`}>
                    <CircularGauge value={moisture} size={76} strokeWidth={6} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-lg font-black leading-none ${color}`}>
                            {moisture !== null ? `${moisture}` : '—'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">%</span>
                    </div>
                </div>

                {/* Data */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-base font-extrabold ${color}`}>{emoji} {label}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mb-2">{tip}</p>

                    {/* Device & battery row */}
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">sensors</span>
                            {sensor.deviceName || 'KisanSensor'}
                        </span>
                        {sensor.battery !== undefined && (
                            <span className="text-[10px] text-yellow-500 flex items-center gap-0.5 shrink-0">
                                🔋 {sensor.battery}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Moisture level bar */}
            <div className="mt-4">
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                            width: `${moisture ?? 0}%`,
                            background: moisture < 20
                                ? '#ef4444'
                                : moisture < 40
                                ? '#f59e0b'
                                : moisture < 70
                                ? '#10b981'
                                : '#3b82f6'
                        }}
                    />
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-slate-500">0% Dry</span>
                    <span className="text-[9px] text-slate-500">100% Wet</span>
                </div>
            </div>

            {/* Last updated */}
            {sensor.lastUpdated && (
                <p className="text-[9px] text-slate-500 text-right mt-1">
                    Updated {new Date(sensor.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
            )}
        </div>
    );
};

export default DashboardMoistureCard;
