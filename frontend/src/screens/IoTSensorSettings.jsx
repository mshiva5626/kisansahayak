import React, { useState, useEffect } from 'react';
import { useIoT } from '../context/IoTContext';
import { farmAPI } from '../api';

// ─── Moisture color helpers ────────────────────────────────────────────────────
const getMoistureColor = (v) => {
    if (v === null || v === undefined) return { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'No Data', emoji: '—' };
    if (v < 20) return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Very Dry', emoji: '🔴' };
    if (v < 40) return { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Dry', emoji: '🟡' };
    if (v < 70) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Optimal', emoji: '🟢' };
    return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Wet', emoji: '🔵' };
};

// ─── Edit Device Bottom Sheet ──────────────────────────────────────────────────
const EditDeviceSheet = ({ device, farms, onSave, onDelete, onClose }) => {
    const [name, setName] = useState(device.deviceName || '');
    const [farmId, setFarmId] = useState(device.farmId || '');
    const selectedFarm = farms.find(f => f._id === farmId);

    return (
        <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Sheet */}
            <div
                className="relative w-full bg-[#061c10] border-t border-emerald-500/20 rounded-t-3xl px-5 pt-4 pb-10 z-10 animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Handle */}
                <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />

                <h3 className="text-lg font-extrabold text-white mb-5">Edit Sensor</h3>

                {/* Name field */}
                <label className="block mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Sensor Name</span>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500/60 text-white placeholder-slate-500 text-sm font-medium outline-none transition-colors"
                        placeholder="e.g. Field A Sensor"
                    />
                </label>

                {/* Farm assignment */}
                <label className="block mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Assigned Farm</span>
                    <div className="space-y-2 max-h-44 overflow-y-auto no-scrollbar">
                        {farms.map(farm => (
                            <button
                                key={farm._id}
                                onClick={() => setFarmId(farm._id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                    farmId === farm._id
                                        ? 'bg-emerald-500/15 border-emerald-500/50'
                                        : 'bg-white/5 border-white/10'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-lg ${farmId === farm._id ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    agriculture
                                </span>
                                <span className={`text-sm font-bold flex-1 truncate ${farmId === farm._id ? 'text-white' : 'text-slate-400'}`}>
                                    {farm.farm_name || farm.name}
                                </span>
                                {farmId === farm._id && (
                                    <span className="material-symbols-outlined text-emerald-400 text-base shrink-0">check_circle</span>
                                )}
                            </button>
                        ))}
                    </div>
                </label>

                <div className="flex gap-3">
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Remove
                    </button>
                    <button
                        onClick={() => onSave({ deviceId: device.deviceId, deviceName: name, farmId, farmName: selectedFarm?.farm_name || selectedFarm?.name })}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-sm active:scale-95 transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main IoT Settings Screen ──────────────────────────────────────────────────
const IoTSensorSettings = ({ onBack, onNavigate }) => {
    const { pairedDevices, sensorReadings, updateDevice, removeDevice, connectDevice, disconnectDevice, connectingId } = useIoT();
    const [farms, setFarms] = useState([]);
    const [editingDevice, setEditingDevice] = useState(null);

    useEffect(() => {
        farmAPI.getFarms()
            .then(({ data }) => setFarms(data.farms || []))
            .catch(() => {});
    }, []);

    const getFarmName = (farmId) => {
        const f = farms.find(f => f._id === farmId);
        return f?.farm_name || f?.name || 'Unassigned';
    };

    const handleSave = ({ deviceId, deviceName, farmId, farmName }) => {
        updateDevice({ deviceId, deviceName, farmId, farmName });
        setEditingDevice(null);
    };

    const handleDelete = (deviceId) => {
        removeDevice(deviceId);
        setEditingDevice(null);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#03140A] via-[#061c10] to-[#081d11] text-white font-sans relative overflow-x-hidden">
            {/* Ambients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="flex items-center justify-between px-5 pt-12 pb-6 shrink-0 relative z-10">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center active:scale-90 transition-all border border-white/10"
                >
                    <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-base font-extrabold text-white">IoT Sensors</h1>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Manage Devices</p>
                </div>
                <button
                    onClick={() => onNavigate('iot-pairing')}
                    className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center active:scale-90 transition-all"
                >
                    <span className="material-symbols-outlined text-emerald-400 text-xl">add</span>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8 relative z-10">
                {/* Info banner */}
                <div className="p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20 mb-6 flex items-start gap-3">
                    <span className="material-symbols-outlined text-emerald-400 text-xl shrink-0 mt-0.5">info</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Each sensor is assigned to a specific farm. When you select that farm on the dashboard, live moisture data appears automatically.
                    </p>
                </div>

                {pairedDevices.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-slate-500">sensors_off</span>
                        </div>
                        <h3 className="text-base font-extrabold text-white mb-2">No Sensors Paired</h3>
                        <p className="text-sm text-slate-400 mb-6 max-w-xs">
                            Pair your first ESP32 soil moisture sensor to start monitoring your fields.
                        </p>
                        <button
                            onClick={() => onNavigate('iot-pairing')}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Add Your First Sensor
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            {pairedDevices.length} Sensor{pairedDevices.length !== 1 ? 's' : ''} Paired
                        </h2>

                        <div className="space-y-3">
                            {pairedDevices.map(device => {
                                const reading = sensorReadings[device.deviceId] || {};
                                const isConnected = reading.connected === true;
                                const isConnecting = connectingId === device.deviceId;
                                const moisture = reading.moisture ?? null;
                                const { bg, text, label, emoji } = getMoistureColor(moisture);

                                return (
                                    <div
                                        key={device.deviceId}
                                        className="rounded-3xl overflow-hidden border border-white/10 bg-white/3"
                                    >
                                        {/* Card Header */}
                                        <div className="p-4 flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isConnected ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                                                <span className={`material-symbols-outlined text-xl ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                    sensors
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-sm font-extrabold text-white truncate">
                                                        {device.deviceName || 'KisanSensor'}
                                                    </p>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-500'}`}>
                                                        {isConnected ? '● LIVE' : '○ OFFLINE'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[13px] text-emerald-500">agriculture</span>
                                                    {device.farmName || getFarmName(device.farmId)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setEditingDevice(device)}
                                                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-slate-400 text-base">edit</span>
                                            </button>
                                        </div>

                                        {/* Live Data Row */}
                                        <div className={`mx-4 mb-4 p-3 rounded-2xl ${bg} border border-white/5`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-slate-400 font-medium mb-1">Soil Moisture</p>
                                                    <p className={`text-2xl font-black ${text}`}>
                                                        {moisture !== null ? `${moisture}%` : '— %'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">{emoji} {label}</p>
                                                </div>

                                                <div className="text-right flex flex-col gap-2">
                                                    {reading.battery !== undefined && (
                                                        <div>
                                                            <p className="text-xs text-slate-400">Battery</p>
                                                            <p className="text-sm font-bold text-yellow-400">🔋 {reading.battery}%</p>
                                                        </div>
                                                    )}
                                                    {reading.lastUpdated && (
                                                        <p className="text-[10px] text-slate-500">
                                                            {new Date(reading.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Connect/Disconnect footer */}
                                        <div className="px-4 pb-4 flex gap-2">
                                            {isConnected ? (
                                                <button
                                                    onClick={() => disconnectDevice(device.deviceId)}
                                                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-sm">bluetooth_disabled</span>
                                                    Disconnect
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => connectDevice(device.deviceId)}
                                                    disabled={isConnecting}
                                                    className="flex-1 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {isConnecting ? (
                                                        <><div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />Connecting...</>
                                                    ) : (
                                                        <><span className="material-symbols-outlined text-sm">bluetooth</span>Reconnect</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add more button */}
                        <button
                            onClick={() => onNavigate('iot-pairing')}
                            className="w-full mt-4 py-3.5 rounded-2xl border border-dashed border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-emerald-500/5"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Add Another Sensor
                        </button>
                    </>
                )}

                {/* ESP32 Guide card */}
                <div className="mt-6 p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-blue-400 text-lg">developer_board</span>
                        <h4 className="text-sm font-extrabold text-white">ESP32 Setup Guide</h4>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                        Need help setting up your ESP32? Flash the KisanSensor firmware via Arduino IDE.
                    </p>
                    <button
                        onClick={() => onNavigate('iot-guide')}
                        className="text-xs font-bold text-blue-400 flex items-center gap-1 hover:underline"
                    >
                        View Wiring &amp; Code Guide
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* Edit Sheet */}
            {editingDevice && (
                <EditDeviceSheet
                    device={editingDevice}
                    farms={farms}
                    onSave={handleSave}
                    onDelete={() => handleDelete(editingDevice.deviceId)}
                    onClose={() => setEditingDevice(null)}
                />
            )}

            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to   { transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
            `}</style>
        </div>
    );
};

export default IoTSensorSettings;
