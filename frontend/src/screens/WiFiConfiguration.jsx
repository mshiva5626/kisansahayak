import React, { useState, useEffect, useRef } from 'react';
import { useIoT, WIFI_STATUS } from '../context/IoTContext';

// ─── WiFi Signal Animation ────────────────────────────────────────────────────
const WifiSignalAnim = ({ status }) => {
    const isConnecting = status === WIFI_STATUS.CONNECTING;
    const isConnected = status === WIFI_STATUS.CONNECTED;
    const isFailed = status === WIFI_STATUS.FAILED;

    const activeColor = isFailed ? 'border-red-500/40' : 'border-emerald-500/40';
    const glowColor = isFailed ? 'shadow-red-500/30' : 'shadow-emerald-500/30';

    return (
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            {/* Animated arcs */}
            {[0, 1, 2].map(i => (
                <div
                    key={i}
                    className={`absolute rounded-full border-2 transition-all duration-500 ${
                        (isConnecting || isConnected) ? activeColor : 'border-white/10'
                    }`}
                    style={{
                        width: `${(i + 1) * 42}px`,
                        height: `${(i + 1) * 42}px`,
                        opacity: isConnecting ? (0.3 + i * 0.2) : isConnected ? 1 : 0.3,
                        ...(isConnecting && {
                            animation: `pulse 1.5s ease-in-out infinite`,
                            animationDelay: `${i * 0.3}s`
                        })
                    }}
                />
            ))}
            {/* Center icon */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
                isConnected ? `bg-emerald-500 ${glowColor}` :
                isFailed ? `bg-red-500 ${glowColor}` :
                isConnecting ? `bg-gradient-to-br from-emerald-500 to-teal-600 ${glowColor}` :
                'bg-gradient-to-br from-slate-700 to-slate-800'
            }`}>
                <span className={`material-symbols-outlined text-white text-3xl ${isConnecting ? 'animate-pulse' : ''}`}>
                    {isConnected ? 'wifi' : isFailed ? 'wifi_off' : 'wifi'}
                </span>
            </div>
        </div>
    );
};

// ─── Main WiFi Configuration Component ─────────────────────────────────────────
// Props:
//   deviceId, deviceName - the BLE device to configure
//   onSuccess - callback when WiFi connects successfully
//   onSkip - callback to skip WiFi setup
//   standalone - if true, renders with its own header/back button
//   onBack - back navigation for standalone mode
const WiFiConfiguration = ({ deviceId, deviceName, onSuccess, onSkip, standalone = false, onBack }) => {
    const { sendWiFiCredentials, wifiStatus: contextWifiStatus } = useIoT();

    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [phase, setPhase] = useState('form'); // 'form' | 'sending' | 'success' | 'failed'
    const [errorMsg, setErrorMsg] = useState('');
    const ssidInputRef = useRef(null);

    const currentWifiStatus = contextWifiStatus[deviceId] ?? WIFI_STATUS.IDLE;

    // Auto-focus SSID input on mount
    useEffect(() => {
        if (phase === 'form' && ssidInputRef.current) {
            setTimeout(() => ssidInputRef.current?.focus(), 300);
        }
    }, [phase]);

    // Watch WiFi status from context to update phase
    useEffect(() => {
        if (phase === 'sending') {
            if (currentWifiStatus === WIFI_STATUS.CONNECTED) {
                setPhase('success');
            } else if (currentWifiStatus === WIFI_STATUS.FAILED) {
                setPhase('failed');
                setErrorMsg('WiFi connection failed. Please check the password and try again.');
            }
        }
    }, [currentWifiStatus, phase]);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!ssid.trim()) {
            setErrorMsg('Please enter the WiFi network name (SSID)');
            return;
        }
        if (!password.trim()) {
            setErrorMsg('Please enter the WiFi password');
            return;
        }

        setErrorMsg('');
        setPhase('sending');

        try {
            await sendWiFiCredentials(deviceId, ssid.trim(), password.trim());
            setPhase('success');
            setTimeout(() => {
                onSuccess?.();
            }, 1500);
        } catch (err) {
            setPhase('failed');
            if (err.message === 'WIFI_CONNECTION_FAILED') {
                setErrorMsg('Wrong WiFi password or the network is out of range. Please try again.');
            } else if (err.message === 'WIFI_CONNECTION_TIMEOUT') {
                setErrorMsg('Connection timed out. Make sure the WiFi router is nearby and the credentials are correct.');
            } else {
                setErrorMsg(`Connection error: ${err.message}`);
            }
        }
    };

    const handleRetry = () => {
        setPhase('form');
        setErrorMsg('');
        setPassword('');
    };

    // ─── Form Phase ─────────────────────────────────────────────────────────
    const renderForm = () => (
        <div className="flex flex-col items-center px-6 pt-2">
            {/* WiFi icon */}
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center shadow-2xl shadow-blue-500/10">
                    <span className="material-symbols-outlined text-5xl text-blue-400">wifi</span>
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
                    <span className="material-symbols-outlined text-white text-sm">settings</span>
                </div>
            </div>

            <h2 className="text-xl font-extrabold text-white mb-1 text-center">Configure WiFi</h2>
            <p className="text-sm text-slate-400 text-center mb-6 max-w-xs leading-relaxed">
                Enter the WiFi credentials for <strong className="text-blue-400">{deviceName || 'KisanSensor'}</strong> to connect to the internet.
            </p>

            {/* Info banner */}
            <div className="w-full p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 mb-5 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-blue-400 text-base shrink-0 mt-0.5">info</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                    Enter the WiFi name (SSID) and password of the network you want your sensor to connect to. This is typically your home/farm WiFi.
                </p>
            </div>

            {errorMsg && (
                <div className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
                    <span>{errorMsg}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                {/* SSID Field */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        WiFi Network Name (SSID)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">wifi</span>
                        <input
                            ref={ssidInputRef}
                            type="text"
                            value={ssid}
                            onChange={e => setSsid(e.target.value)}
                            placeholder="e.g. MyHomeWiFi"
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-white placeholder-slate-500 text-sm font-medium outline-none transition-all"
                            autoComplete="off"
                            autoCapitalize="off"
                        />
                    </div>
                </div>

                {/* Password Field */}
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        WiFi Password
                    </label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">lock</span>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter WiFi password"
                            className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 text-white placeholder-slate-500 text-sm font-medium outline-none transition-all"
                            autoComplete="off"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!ssid.trim() || !password.trim()}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-extrabold text-base shadow-2xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-xl">send</span>
                    Send to Device
                </button>
            </form>

            {/* Skip option */}
            {onSkip && (
                <button
                    onClick={onSkip}
                    className="mt-5 text-sm text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2 font-medium"
                >
                    Skip WiFi Setup →
                </button>
            )}
        </div>
    );

    // ─── Sending Phase ──────────────────────────────────────────────────────
    const renderSending = () => (
        <div className="flex flex-col items-center text-center px-6 pt-8">
            <WifiSignalAnim status={WIFI_STATUS.CONNECTING} />

            <h2 className="text-xl font-extrabold text-white mt-8 mb-2">
                Connecting to WiFi...
            </h2>
            <p className="text-sm text-slate-400 mb-6">
                Sending credentials to <strong className="text-blue-400">{deviceName}</strong> and waiting for connection.
            </p>

            {/* Steps progress */}
            <div className="w-full space-y-3 mb-6">
                {[
                    { icon: 'upload', text: 'Sending WiFi name (SSID)', done: true },
                    { icon: 'lock', text: 'Sending WiFi password', done: true },
                    { icon: 'wifi', text: 'Waiting for ESP32 to connect...', done: false, active: true }
                ].map(({ icon, text, done, active }, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        done ? 'bg-emerald-500/10 border-emerald-500/30' :
                        active ? 'bg-blue-500/10 border-blue-500/30' :
                        'bg-white/5 border-white/10'
                    }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            done ? 'bg-emerald-500/20' : active ? 'bg-blue-500/20' : 'bg-white/10'
                        }`}>
                            {done ? (
                                <span className="material-symbols-outlined text-emerald-400 text-base">check</span>
                            ) : active ? (
                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined text-slate-500 text-base">{icon}</span>
                            )}
                        </div>
                        <span className={`text-sm font-medium ${
                            done ? 'text-emerald-300' : active ? 'text-blue-300' : 'text-slate-500'
                        }`}>{text}</span>
                    </div>
                ))}
            </div>

            <p className="text-[11px] text-slate-500">This may take up to 15 seconds...</p>
        </div>
    );

    // ─── Success Phase ──────────────────────────────────────────────────────
    const renderSuccess = () => (
        <div className="flex flex-col items-center text-center px-6 pt-8">
            <WifiSignalAnim status={WIFI_STATUS.CONNECTED} />

            <h2 className="text-2xl font-extrabold text-white mt-8 mb-2">
                WiFi Connected! ✅
            </h2>
            <p className="text-sm text-slate-400 mb-2">
                <strong className="text-emerald-400">{deviceName}</strong> is now connected to
            </p>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-8">
                <span className="material-symbols-outlined text-emerald-400 text-lg">wifi</span>
                <span className="text-base font-extrabold text-emerald-400">{ssid}</span>
            </div>

            <div className="w-full space-y-2 mb-6">
                {[
                    { icon: 'cloud_sync', text: 'Data will sync to cloud automatically' },
                    { icon: 'update', text: 'Firmware updates over-the-air enabled' },
                    { icon: 'save', text: 'Credentials saved — auto-reconnects on reboot' }
                ].map(({ icon, text }, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg">
                        <span className="material-symbols-outlined text-emerald-500/60 text-base">{icon}</span>
                        <span className="text-xs text-slate-400 font-medium">{text}</span>
                    </div>
                ))}
            </div>

            {standalone && onBack && (
                <button
                    onClick={onBack}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-base shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                    Back to Settings
                </button>
            )}
        </div>
    );

    // ─── Failed Phase ───────────────────────────────────────────────────────
    const renderFailed = () => (
        <div className="flex flex-col items-center text-center px-6 pt-8">
            <WifiSignalAnim status={WIFI_STATUS.FAILED} />

            <h2 className="text-xl font-extrabold text-white mt-8 mb-2">
                Connection Failed
            </h2>

            {errorMsg && (
                <div className="w-full mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Troubleshooting tips */}
            <div className="w-full space-y-2 mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">Troubleshooting</p>
                {[
                    'Check if the WiFi password is correct',
                    'Make sure the router is powered on and in range',
                    'The ESP32 only supports 2.4GHz WiFi (not 5GHz)',
                    'Try moving the sensor closer to the router'
                ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-left">
                        <span className="text-amber-400 text-xs mt-0.5">•</span>
                        <span className="text-xs text-slate-400">{tip}</span>
                    </div>
                ))}
            </div>

            <div className="w-full space-y-3">
                <button
                    onClick={handleRetry}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-extrabold text-base shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-xl">refresh</span>
                    Try Again
                </button>
                {onSkip && (
                    <button
                        onClick={onSkip}
                        className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm active:scale-95 transition-all"
                    >
                        Skip WiFi Setup
                    </button>
                )}
            </div>
        </div>
    );

    // ─── Standalone wrapper ──────────────────────────────────────────────────
    const content = (
        <>
            {phase === 'form' && renderForm()}
            {phase === 'sending' && renderSending()}
            {phase === 'success' && renderSuccess()}
            {phase === 'failed' && renderFailed()}
        </>
    );

    if (standalone) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#03140A] via-[#061c10] to-[#081d11] text-white font-sans relative overflow-x-hidden">
                {/* Background ambient */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <header className="flex items-center justify-between px-5 pt-12 pb-4 shrink-0 relative z-10">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center active:scale-90 transition-all border border-white/10"
                    >
                        <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-base font-extrabold text-white">WiFi Setup</h1>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Configure Network</p>
                    </div>
                    <div className="w-10" /> {/* Spacer for centering */}
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-8">
                    {content}
                </div>
            </div>
        );
    }

    // Inline mode — used inside IoTDevicePairing flow
    return content;
};

export default WiFiConfiguration;
