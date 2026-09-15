import React, { useState, useEffect, useRef } from 'react';
import { useIoT } from '../context/IoTContext';
import { farmAPI } from '../api';
import WiFiConfiguration from './WiFiConfiguration';

// ─── Step IDs ─────────────────────────────────────────────────────────────────
const STEPS = { INTRO: 0, SCAN: 1, CONNECTING: 2, WIFI_CONFIG: 3, ASSIGN_FARM: 4, SUCCESS: 5 };

// ─── Radar SVG Animation Component ────────────────────────────────────────────
const RadarScan = ({ scanning }) => (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        {/* Outer static rings */}
        {[0, 1, 2].map(i => (
            <div
                key={i}
                className="absolute rounded-full border border-emerald-500/20"
                style={{
                    width: `${(i + 1) * 56}px`,
                    height: `${(i + 1) * 56}px`
                }}
            />
        ))}
        {/* Animated radar sweep rings */}
        {scanning && [0, 1, 2].map(i => (
            <div
                key={`sweep-${i}`}
                className="absolute rounded-full border-2 border-emerald-400/60 animate-ping"
                style={{
                    width: `${(i + 1) * 56}px`,
                    height: `${(i + 1) * 56}px`,
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: '2s'
                }}
            />
        ))}
        {/* Center icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${scanning ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/40' : 'bg-gradient-to-br from-slate-700 to-slate-800'}`}>
            <span className="material-symbols-outlined text-white text-3xl">bluetooth_searching</span>
        </div>
    </div>
);

// ─── Signal Strength Bars ──────────────────────────────────────────────────────
const SignalBars = ({ rssi }) => {
    // rssi: typically -40 (strong) to -90 (weak) — null = unknown
    const strength = rssi === null ? 2 : rssi > -60 ? 4 : rssi > -75 ? 3 : rssi > -85 ? 2 : 1;
    return (
        <div className="flex items-end gap-0.5">
            {[1, 2, 3, 4].map(bar => (
                <div
                    key={bar}
                    className={`w-1.5 rounded-sm transition-all ${bar <= strength ? 'bg-emerald-400' : 'bg-slate-600'}`}
                    style={{ height: `${bar * 4}px` }}
                />
            ))}
        </div>
    );
};

// ─── Moisture Level Badge ──────────────────────────────────────────────────────
const MoistureBadge = ({ value }) => {
    if (value === null || value === undefined) return null;
    const color = value < 20 ? 'text-red-400 bg-red-500/15' : value < 60 ? 'text-emerald-400 bg-emerald-500/15' : 'text-blue-400 bg-blue-500/15';
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
            💧 {value}%
        </span>
    );
};

// ─── Main Pairing Screen ───────────────────────────────────────────────────────
const IoTDevicePairing = ({ onBack, onNavigate, selectedFarmId }) => {
    const { scanAndPair, savePairedDevice, subscribeToDevice, isWebBluetoothSupported } = useIoT();

    const [step, setStep] = useState(STEPS.INTRO);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedDevice, setScannedDevice] = useState(null); // { deviceId, deviceName, initialMoisture, battery }
    const [farms, setFarms] = useState([]);
    const [selectedFarm, setSelectedFarm] = useState(null);
    const [isFarmsLoading, setIsFarmsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [connectionProgress, setConnectionProgress] = useState(0);
    const progressRef = useRef(null);

    const supported = isWebBluetoothSupported();

    // Pre-load farms for assignment step
    useEffect(() => {
        const loadFarms = async () => {
            setIsFarmsLoading(true);
            try {
                const { data } = await farmAPI.getFarms();
                setFarms(data.farms || []);
                // Pre-select if a farm is already active in the app
                if (selectedFarmId) {
                    const active = data.farms?.find(f => f._id === selectedFarmId);
                    if (active) setSelectedFarm(active);
                }
            } catch { /* ignore */ }
            finally { setIsFarmsLoading(false); }
        };
        loadFarms();
    }, [selectedFarmId]);

    // ─── Animated connection progress bar ─────────────────────────────────────
    const startProgressAnimation = () => {
        setConnectionProgress(0);
        let prog = 0;
        progressRef.current = setInterval(() => {
            prog += Math.random() * 12;
            if (prog >= 90) { clearInterval(progressRef.current); prog = 90; }
            setConnectionProgress(Math.min(90, prog));
        }, 200);
    };

    const finishProgress = () => {
        if (progressRef.current) clearInterval(progressRef.current);
        setConnectionProgress(100);
    };

    useEffect(() => () => { if (progressRef.current) clearInterval(progressRef.current); }, []);

    // ─── Trigger BLE scan & pairing ───────────────────────────────────────────
    const handleStartScan = async () => {
        setErrorMsg('');
        setIsScanning(true);
        setStep(STEPS.SCAN);
        try {
            // Small delay so UI animates before the OS picker appears
            await new Promise(r => setTimeout(r, 400));
            const result = await scanAndPair();
            setScannedDevice(result);
            // Move to connecting animation step
            setStep(STEPS.CONNECTING);
            startProgressAnimation();
            // Subscribe to live notifications
            await subscribeToDevice(result.deviceId);
            finishProgress();
            await new Promise(r => setTimeout(r, 600));
            setStep(STEPS.WIFI_CONFIG);
        } catch (err) {
            setIsScanning(false);
            if (err.message === 'WEB_BLUETOOTH_UNSUPPORTED') {
                setErrorMsg('Web Bluetooth is not supported in this browser. Please use Chrome or Edge on Android/Desktop.');
            } else if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
                setErrorMsg('No device selected. Tap "Start Scan" to try again.');
                setStep(STEPS.INTRO);
            } else {
                setErrorMsg(`Connection failed: ${err.message || 'Unknown error'}`);
                setStep(STEPS.INTRO);
            }
        } finally {
            setIsScanning(false);
        }
    };

    // ─── Save device with farm assignment ─────────────────────────────────────
    const handleAssignAndSave = () => {
        if (!scannedDevice || !selectedFarm) return;
        savePairedDevice({
            deviceId: scannedDevice.deviceId,
            deviceName: scannedDevice.deviceName,
            farmId: selectedFarm._id,
            farmName: selectedFarm.farm_name || selectedFarm.name || 'My Farm'
        });
        setStep(STEPS.SUCCESS);
    };

    // ─── Render helpers ────────────────────────────────────────────────────────
    const renderStepIndicator = () => {
        const totalSteps = 5; // Intro → Scan → Connect → WiFi → Assign
        const current = Math.min(step, totalSteps - 1);
        return (
            <div className="flex items-center gap-2 justify-center mb-8">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <React.Fragment key={i}>
                        <div className={`h-2 rounded-full transition-all duration-500 ${i <= current ? 'bg-emerald-400 w-6' : 'bg-white/20 w-2'}`} />
                    </React.Fragment>
                ))}
            </div>
        );
    };

    // ─── STEP 0: Intro ────────────────────────────────────────────────────────
    const renderIntro = () => (
        <div className="flex flex-col items-center text-center px-6 pt-4">
            {/* Animated device illustration */}
            <div className="relative mb-8">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                    <span className="material-symbols-outlined text-6xl text-emerald-400">sensors</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-bounce">
                    <span className="material-symbols-outlined text-white text-sm">bluetooth</span>
                </div>
            </div>

            <h2 className="text-2xl font-extrabold text-white mb-3 leading-tight">
                Add KisanSensor<br />
                <span className="text-emerald-400">Smart Soil Monitor</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-8 max-w-xs">
                Connect your ESP32 soil moisture sensor via Bluetooth to monitor field moisture levels in real-time directly from your farm dashboard.
            </p>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
                {['Real-time Moisture', 'Live Alerts', 'Farm Linked', 'Low Power BLE'].map(f => (
                    <span key={f} className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        ✓ {f}
                    </span>
                ))}
            </div>

            {!supported && (
                <div className="w-full mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-start gap-2">
                    <span className="material-symbols-outlined text-base shrink-0 mt-0.5">warning</span>
                    <span>Web Bluetooth requires Chrome or Edge on Android/Desktop. Safari and Firefox are not supported.</span>
                </div>
            )}

            {errorMsg && (
                <div className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
                    <span>{errorMsg}</span>
                </div>
            )}

            <button
                onClick={handleStartScan}
                disabled={!supported || isScanning}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-base shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-xl">bluetooth_searching</span>
                Start Bluetooth Scan
            </button>

            <p className="mt-4 text-[11px] text-slate-500">
                Make sure your ESP32 is powered on and in pairing mode
            </p>
        </div>
    );

    // ─── STEP 1: Scanning ─────────────────────────────────────────────────────
    const renderScan = () => (
        <div className="flex flex-col items-center text-center px-6 pt-4">
            <RadarScan scanning={true} />

            <h2 className="text-xl font-extrabold text-white mt-8 mb-2">Scanning for Devices...</h2>
            <p className="text-sm text-slate-400 mb-6">
                Your phone's Bluetooth picker should appear. Select <strong className="text-emerald-400">KisanSensor</strong> from the list.
            </p>

            {/* OS Picker Instructions */}
            <div className="w-full space-y-3 mb-8">
                {[
                    { icon: 'power_settings_new', text: 'Power on your ESP32 device' },
                    { icon: 'bluetooth', text: 'Select "KisanSensor" in the system picker' },
                    { icon: 'link', text: 'Tap "Pair" when prompted' }
                ].map(({ icon, text }, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-left">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-emerald-400 text-base">{icon}</span>
                        </div>
                        <span className="text-sm text-slate-300 font-medium">{text}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={() => { setStep(STEPS.INTRO); setIsScanning(false); }}
                className="text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-2"
            >
                Cancel
            </button>
        </div>
    );

    // ─── STEP 2: Connecting ───────────────────────────────────────────────────
    const renderConnecting = () => (
        <div className="flex flex-col items-center text-center px-6 pt-4">
            <div className="relative mb-8">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border-2 border-emerald-500/40 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                    <span className="material-symbols-outlined text-5xl text-emerald-400 animate-pulse">sensors</span>
                </div>
                {/* Orbiting dot */}
                <div
                    className="absolute w-4 h-4 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                    style={{
                        top: '50%', left: '50%',
                        transform: 'translateX(-50%) translateY(-50%)',
                        animation: 'orbit 1.5s linear infinite'
                    }}
                />
            </div>

            <h2 className="text-xl font-extrabold text-white mb-2">
                Connecting to <span className="text-emerald-400">{scannedDevice?.deviceName}</span>
            </h2>
            <p className="text-sm text-slate-400 mb-8">Establishing secure Bluetooth link and reading sensor...</p>

            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-2.5 mb-3 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                    style={{ width: `${connectionProgress}%` }}
                />
            </div>
            <p className="text-xs text-emerald-400 font-bold">{Math.round(connectionProgress)}%</p>
        </div>
    );

    // ─── STEP 3: Assign Farm ─────────────────────────────────────────────────
    const renderAssignFarm = () => (
        <div className="flex flex-col px-6 pt-4 pb-4">
            {/* Device confirmed */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-emerald-400 text-xl">sensors</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Device Connected</p>
                    <p className="text-sm font-extrabold text-white truncate">{scannedDevice?.deviceName}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <MoistureBadge value={scannedDevice?.initialMoisture} />
                    {scannedDevice?.battery !== null && (
                        <span className="text-[10px] text-slate-400 font-medium">🔋 {scannedDevice?.battery}%</span>
                    )}
                </div>
            </div>

            <h2 className="text-lg font-extrabold text-white mb-1">Assign to Farm</h2>
            <p className="text-sm text-slate-400 mb-5">
                Select which farm this sensor monitors. Moisture data will appear on that farm's dashboard.
            </p>

            {/* Farm List */}
            {isFarmsLoading ? (
                <div className="flex items-center justify-center py-8 gap-2">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-400">Loading farms...</span>
                </div>
            ) : farms.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl bg-white/5 border border-dashed border-white/10">
                    <span className="material-symbols-outlined text-3xl text-slate-500 mb-2 block">agriculture</span>
                    <p className="text-sm text-slate-400 font-medium">No farms found.</p>
                    <p className="text-xs text-slate-500 mt-1">Create a farm first, then pair your sensor.</p>
                    <button
                        onClick={() => onNavigate('farm-wizard')}
                        className="mt-3 text-xs font-bold text-emerald-400 underline"
                    >
                        Create a Farm →
                    </button>
                </div>
            ) : (
                <div className="space-y-2.5 mb-6 max-h-64 overflow-y-auto no-scrollbar">
                    {farms.map(farm => (
                        <button
                            key={farm._id}
                            onClick={() => setSelectedFarm(farm)}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                                selectedFarm?._id === farm._id
                                    ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selectedFarm?._id === farm._id ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                <span className={`material-symbols-outlined text-lg ${selectedFarm?._id === farm._id ? 'text-black' : 'text-slate-400'}`}>
                                    agriculture
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{farm.farm_name || farm.name || 'Unnamed Farm'}</p>
                                <p className="text-xs text-slate-400 truncate">{farm.crop_type || 'No crop'} · {farm.area ? `${farm.area} ${farm.unit || 'Acres'}` : 'Area not set'}</p>
                            </div>
                            {selectedFarm?._id === farm._id && (
                                <span className="material-symbols-outlined text-emerald-400 text-xl shrink-0">check_circle</span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            <button
                onClick={handleAssignAndSave}
                disabled={!selectedFarm}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-base shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined text-xl">link</span>
                Assign &amp; Activate Sensor
            </button>
        </div>
    );

    // ─── STEP 4: Success ──────────────────────────────────────────────────────
    const renderSuccess = () => (
        <div className="flex flex-col items-center text-center px-6 pt-6">
            {/* Success animation */}
            <div className="relative mb-8">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                    <span className="material-symbols-outlined text-6xl text-black">check_circle</span>
                </div>
                {/* Confetti-style rings */}
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping"
                        style={{ animationDelay: `${i * 0.3}s`, animationDuration: '2s' }}
                    />
                ))}
            </div>

            <h2 className="text-2xl font-extrabold text-white mb-2">
                Sensor Activated! 🎉
            </h2>
            <p className="text-sm text-slate-400 mb-2">
                <strong className="text-emerald-400">{scannedDevice?.deviceName}</strong> is now monitoring
            </p>
            <p className="text-base font-extrabold text-white mb-8">
                📍 {selectedFarm?.farm_name || selectedFarm?.name || 'Your Farm'}
            </p>

            {/* Live reading preview */}
            {scannedDevice?.initialMoisture !== null && (
                <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 mb-8">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-3">First Reading</p>
                    <div className="flex items-center justify-around">
                        <div className="text-center">
                            <p className="text-3xl font-black text-emerald-400">{scannedDevice.initialMoisture}%</p>
                            <p className="text-xs text-slate-400 mt-1">Soil Moisture</p>
                        </div>
                        {scannedDevice.battery !== null && (
                            <div className="text-center">
                                <p className="text-3xl font-black text-yellow-400">{scannedDevice.battery}%</p>
                                <p className="text-xs text-slate-400 mt-1">Battery</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="w-full space-y-3">
                <button
                    onClick={() => onNavigate('dashboard')}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-base shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-xl">dashboard</span>
                    View on Dashboard
                </button>
                <button
                    onClick={() => { setStep(STEPS.INTRO); setScannedDevice(null); setSelectedFarm(null); }}
                    className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm active:scale-95 transition-all"
                >
                    Add Another Sensor
                </button>
            </div>
        </div>
    );

    // ─── Root render ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#03140A] via-[#061c10] to-[#081d11] text-white font-sans relative overflow-x-hidden">
            {/* Background ambient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="flex items-center justify-between px-5 pt-12 pb-4 shrink-0 relative z-10">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center active:scale-90 transition-all border border-white/10"
                >
                    <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-base font-extrabold text-white">Add IoT Device</h1>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">KisanSensor Pairing</p>
                </div>
                <button
                    onClick={() => onNavigate('iot-settings')}
                    className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center active:scale-90 transition-all border border-white/10"
                >
                    <span className="material-symbols-outlined text-white text-xl">settings</span>
                </button>
            </header>

            {/* Step progress indicator */}
            <div className="px-5 relative z-10">
                {renderStepIndicator()}
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-8">
                {step === STEPS.INTRO      && renderIntro()}
                {step === STEPS.SCAN       && renderScan()}
                {step === STEPS.CONNECTING && renderConnecting()}
                {step === STEPS.WIFI_CONFIG && (
                    <WiFiConfiguration
                        deviceId={scannedDevice?.deviceId}
                        deviceName={scannedDevice?.deviceName}
                        onSuccess={() => setStep(STEPS.ASSIGN_FARM)}
                        onSkip={() => setStep(STEPS.ASSIGN_FARM)}
                    />
                )}
                {step === STEPS.ASSIGN_FARM && renderAssignFarm()}
                {step === STEPS.SUCCESS    && renderSuccess()}
            </div>

            {/* Orbit CSS */}
            <style>{`
                @keyframes orbit {
                    0%   { transform: translateX(calc(-50% + 56px)) translateY(-50%); }
                    25%  { transform: translateX(-50%) translateY(calc(-50% - 56px)); }
                    50%  { transform: translateX(calc(-50% - 56px)) translateY(-50%); }
                    75%  { transform: translateX(-50%) translateY(calc(-50% + 56px)); }
                    100% { transform: translateX(calc(-50% + 56px)) translateY(-50%); }
                }
            `}</style>
        </div>
    );
};

export default IoTDevicePairing;
