import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { soilIntelligenceAPI } from '../api';

// ─── KisanSahayak BLE Service & Characteristic UUIDs ─────────────────────────
// These MUST match exactly what is programmed into the ESP32 sketch
export const KISAN_SERVICE_UUID        = '12345678-1234-1234-1234-123456789abc';
export const MOISTURE_CHAR_UUID        = '12345678-1234-1234-1234-123456789ab1';
export const BATTERY_CHAR_UUID         = '12345678-1234-1234-1234-123456789ab2';
export const DEVICE_NAME_CHAR_UUID     = '12345678-1234-1234-1234-123456789ab3';

// WiFi provisioning BLE characteristics
export const WIFI_SSID_CHAR_UUID       = '12345678-1234-1234-1234-123456789ab4';
export const WIFI_PASS_CHAR_UUID       = '12345678-1234-1234-1234-123456789ab5';
export const WIFI_STATUS_CHAR_UUID     = '12345678-1234-1234-1234-123456789ab6';

// WiFi status codes (must match ESP32 firmware)
export const WIFI_STATUS = {
    IDLE: 0,
    CONNECTING: 1,
    CONNECTED: 2,
    FAILED: 3,
};

// ─── Context ─────────────────────────────────────────────────────────────────
const IoTContext = createContext(null);

export const useIoT = () => {
    const ctx = useContext(IoTContext);
    if (!ctx) throw new Error('useIoT must be used inside IoTProvider');
    return ctx;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'kisan_iot_devices';

const loadDevices = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
};

const saveDevices = (devices) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
    } catch { /* quota */ }
};

// ─── Provider ────────────────────────────────────────────────────────────────
export const IoTProvider = ({ children }) => {
    // All paired device metadata (persisted to localStorage)
    const [pairedDevices, setPairedDevices] = useState(() => loadDevices());

    // Live sensor readings keyed by deviceId
    const [sensorReadings, setSensorReadings] = useState({});

    // WiFi status keyed by deviceId
    const [wifiStatus, setWifiStatus] = useState({});

    // Active BLE connections keyed by deviceId
    const bleConnections = useRef({});

    // Which deviceId is currently being connected (used for loading states)
    const [connectingId, setConnectingId] = useState(null);

    // Persist whenever pairedDevices changes
    useEffect(() => {
        saveDevices(pairedDevices);
    }, [pairedDevices]);

    // ─── Check Web Bluetooth availability ───────────────────────────────────
    const isWebBluetoothSupported = useCallback(() => {
        return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    }, []);

    // ─── Subscribe to live notifications from a connected device ────────────
    const subscribeToDevice = useCallback(async (deviceId) => {
        const conn = bleConnections.current[deviceId];
        if (!conn) return;

        try {
            const moistureChar = await conn.service.getCharacteristic(MOISTURE_CHAR_UUID);

            // 1. Immediately read initial moisture value with zero delay
            try {
                const initialVal = await moistureChar.readValue();
                const m = initialVal.getUint8(0);
                setSensorReadings(prev => ({
                    ...prev,
                    [deviceId]: {
                        ...(prev[deviceId] || {}),
                        moisture: m,
                        connected: true,
                        lastUpdated: new Date().toISOString()
                    }
                }));
            } catch (rErr) {
                console.warn('[BLE] Immediate readValue:', rErr.message);
            }

            // 2. Start Notifications for instantaneous streaming updates
            await moistureChar.startNotifications();
            let lastServerPush = 0;

            const onMoistureNotify = (e) => {
                const val = e.target.value.getUint8(0);
                const nowIso = new Date().toISOString();
                setSensorReadings(prev => ({
                    ...prev,
                    [deviceId]: {
                        ...(prev[deviceId] || {}),
                        moisture: val,
                        connected: true,
                        lastUpdated: nowIso
                    }
                }));

                // Auto-push to backend server if at least 10s elapsed
                const now = Date.now();
                if (now - lastServerPush > 10000) {
                    lastServerPush = now;
                    try {
                        const dev = (loadDevices() || []).find(d => d.deviceId === deviceId);
                        soilIntelligenceAPI.pushSensorReading({
                            deviceId,
                            farmId: dev?.farmId || null,
                            moisture: val
                        }).catch(() => {});
                    } catch (e) {}
                }
            };

            moistureChar.addEventListener('characteristicvaluechanged', onMoistureNotify);

            // 3. Robust polling fallback (every 1.5s) to guarantee real-time updates even if notify drops
            const moistInterval = setInterval(async () => {
                try {
                    if (!conn.device?.gatt?.connected) {
                        clearInterval(moistInterval);
                        return;
                    }
                    const val = await moistureChar.readValue();
                    const m = val.getUint8(0);
                    setSensorReadings(prev => ({
                        ...prev,
                        [deviceId]: {
                            ...(prev[deviceId] || {}),
                            moisture: m,
                            connected: true,
                            lastUpdated: new Date().toISOString()
                        }
                    }));
                } catch { /* notification handles it */ }
            }, 1500);

            bleConnections.current[deviceId].moistInterval = moistInterval;

            // 4. Battery (poll every 20s)
            const pollBattery = async () => {
                try {
                    const batChar = await conn.service.getCharacteristic(BATTERY_CHAR_UUID);
                    const val = await batChar.readValue();
                    const battery = val.getUint8(0);
                    setSensorReadings(prev => ({
                        ...prev,
                        [deviceId]: { ...(prev[deviceId] || {}), battery }
                    }));
                } catch { /* optional */ }
            };
            pollBattery();
            const batInterval = setInterval(pollBattery, 20000);
            bleConnections.current[deviceId].batInterval = batInterval;

            setSensorReadings(prev => ({
                ...prev,
                [deviceId]: { ...(prev[deviceId] || {}), connected: true }
            }));

            // Read initial WiFi status
            try {
                const wifiStatChar = await conn.service.getCharacteristic(WIFI_STATUS_CHAR_UUID);
                const wifiVal = await wifiStatChar.readValue();
                const wStatus = wifiVal.getUint8(0);
                setWifiStatus(prev => ({ ...prev, [deviceId]: wStatus }));
            } catch { /* optional */ }
        } catch (err) {
            console.error('[BLE] Subscribe failed:', err);
        }
    }, []);

    // ─── Scan & Pair a new device ────────────────────────────────────────────
    const scanAndPair = useCallback(async (farmIdToAssign = null, farmNameToAssign = null) => {
        if (!isWebBluetoothSupported()) {
            throw new Error('WEB_BLUETOOTH_UNSUPPORTED');
        }

        // Prompt native system BLE picker with broad, robust filters
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [KISAN_SERVICE_UUID] },
                { namePrefix: 'Kisan' },
                { namePrefix: 'ESP32' }
            ],
            optionalServices: [KISAN_SERVICE_UUID]
        });

        const deviceId   = device.id;
        const deviceName = device.name || 'KisanSensor';

        // Connect GATT (with retry if stack was briefly busy)
        let server;
        try {
            server = await device.gatt.connect();
        } catch (firstErr) {
            console.warn('[BLE] Initial GATT connect attempt failed, retrying in 400ms...', firstErr.message);
            await new Promise(r => setTimeout(r, 400));
            server = await device.gatt.connect();
        }

        const service = await server.getPrimaryService(KISAN_SERVICE_UUID);
        bleConnections.current[deviceId] = { device, server, service };

        // Handle unexpected disconnection
        device.addEventListener('gattserverdisconnected', () => {
            const conn = bleConnections.current[deviceId];
            if (conn?.moistInterval) clearInterval(conn.moistInterval);
            if (conn?.batInterval) clearInterval(conn.batInterval);
            setSensorReadings(prev => ({
                ...prev,
                [deviceId]: { ...(prev[deviceId] || {}), connected: false }
            }));
        });

        // AUTO-SAVE to pairedDevices immediately so device is NEVER LOST
        setPairedDevices(prev => {
            const exists = prev.find(d => d.deviceId === deviceId);
            if (exists) {
                return prev.map(d =>
                    d.deviceId === deviceId
                        ? { ...d, deviceName, farmId: farmIdToAssign || d.farmId || 'all', farmName: farmNameToAssign || d.farmName || 'My Farm', pairedAt: new Date().toISOString() }
                        : d
                );
            }
            return [...prev, {
                deviceId,
                deviceName,
                farmId: farmIdToAssign || 'all',
                farmName: farmNameToAssign || 'My Farm',
                pairedAt: new Date().toISOString()
            }];
        });

        // Register immediate connected state
        setSensorReadings(prev => ({
            ...prev,
            [deviceId]: {
                ...(prev[deviceId] || {}),
                connected: true,
                lastUpdated: new Date().toISOString()
            }
        }));

        // Subscribe to live notifications immediately
        await subscribeToDevice(deviceId);

        return {
            deviceId,
            deviceName
        };
    }, [isWebBluetoothSupported, subscribeToDevice]);

    // ─── Connect to an already-paired device (or Reconnect) ──────────────────
    const connectDevice = useCallback(async (deviceId, farmIdToAssign = null, farmNameToAssign = null) => {
        let conn = bleConnections.current[deviceId];
        if (conn?.device?.gatt?.connected) {
            setSensorReadings(prev => ({
                ...prev,
                [deviceId]: { ...(prev[deviceId] || {}), connected: true }
            }));
            await subscribeToDevice(deviceId);
            return { deviceId, success: true };
        }

        setConnectingId(deviceId || 'active');
        try {
            // 1. If device object is cached in memory (same session), attempt direct reconnect
            if (conn?.device) {
                try {
                    console.log('[BLE] Attempting direct reconnect to cached device:', deviceId);
                    const server = await conn.device.gatt.connect();
                    const service = await server.getPrimaryService(KISAN_SERVICE_UUID);
                    bleConnections.current[deviceId] = { ...conn, server, service };
                    await subscribeToDevice(deviceId);
                    return { deviceId, success: true };
                } catch (directErr) {
                    console.warn('[BLE] Direct GATT connect failed, falling back to getDevices/scan:', directErr.message);
                    delete bleConnections.current[deviceId];
                }
            }

            // 2. Check navigator.bluetooth.getDevices() for previously granted devices
            if (typeof navigator !== 'undefined' && 'bluetooth' in navigator && navigator.bluetooth.getDevices) {
                try {
                    const devices = await navigator.bluetooth.getDevices();
                    const match = devices.find(d => d.id === deviceId || d.name?.startsWith('Kisan') || d.name?.startsWith('ESP32'));
                    if (match) {
                        console.log('[BLE] Found permitted device in getDevices(), connecting:', match.name);
                        const server = await match.gatt.connect();
                        const service = await server.getPrimaryService(KISAN_SERVICE_UUID);
                        bleConnections.current[match.id] = { device: match, server, service };
                        match.addEventListener('gattserverdisconnected', () => {
                            const c = bleConnections.current[match.id];
                            if (c?.moistInterval) clearInterval(c.moistInterval);
                            if (c?.batInterval) clearInterval(c.batInterval);
                            setSensorReadings(prev => ({
                                ...prev,
                                [match.id]: { ...(prev[match.id] || {}), connected: false }
                            }));
                        });
                        await subscribeToDevice(match.id);
                        return { deviceId: match.id, success: true };
                    }
                } catch (getDevErr) {
                    console.warn('[BLE] getDevices auto-reconnect fallback:', getDevErr.message);
                }
            }

            // 3. If direct reconnection is not possible, prompt the user with system BLE picker
            console.log('[BLE] Prompting BLE picker to reconnect/pair device...');
            return await scanAndPair(farmIdToAssign, farmNameToAssign);
        } finally {
            setConnectingId(null);
        }
    }, [subscribeToDevice, scanAndPair]);

    // ─── Disconnect device ───────────────────────────────────────────────────
    const disconnectDevice = useCallback((deviceId) => {
        const conn = bleConnections.current[deviceId];
        if (!conn) return;

        if (conn.moistInterval) clearInterval(conn.moistInterval);
        if (conn.batInterval) clearInterval(conn.batInterval);
        try { conn.device?.gatt?.disconnect(); } catch { /* ignore */ }

        delete bleConnections.current[deviceId];
        setSensorReadings(prev => ({
            ...prev,
            [deviceId]: { ...(prev[deviceId] || {}), connected: false }
        }));
    }, []);

    // ─── Auto-reconnect previously permitted Bluetooth devices on mount ─────
    useEffect(() => {
        let isMounted = true;
        const autoReconnect = async () => {
            if (typeof navigator === 'undefined' || !navigator.bluetooth || !navigator.bluetooth.getDevices) return;
            try {
                const devices = await navigator.bluetooth.getDevices();
                if (devices && devices.length > 0 && isMounted) {
                    const target = devices.find(d => d.name?.startsWith('Kisan') || d.name?.startsWith('ESP32')) || devices[0];
                    if (target && target.gatt && !target.gatt.connected) {
                        try {
                            const server = await target.gatt.connect();
                            const service = await server.getPrimaryService(KISAN_SERVICE_UUID);
                            bleConnections.current[target.id] = { device: target, server, service };
                            target.addEventListener('gattserverdisconnected', () => {
                                const c = bleConnections.current[target.id];
                                if (c?.moistInterval) clearInterval(c.moistInterval);
                                if (c?.batInterval) clearInterval(c.batInterval);
                                setSensorReadings(prev => ({
                                    ...prev,
                                    [target.id]: { ...(prev[target.id] || {}), connected: false }
                                }));
                            });
                            await subscribeToDevice(target.id);
                        } catch (connErr) {
                            // Non-critical auto-reconnect attempt
                        }
                    }
                }
            } catch (e) {
                // Ignore silent auto-connect failure
            }
        };
        autoReconnect();
        return () => { isMounted = false; };
    }, [subscribeToDevice]);

    // ─── Background WiFi sensor polling if BLE is not active ────────────────
    useEffect(() => {
        let isMounted = true;
        const checkBackendTelemetry = async () => {
            // Only poll if no BLE device is actively connected
            const hasBleConnected = Object.values(sensorReadings).some(r => r.connected && !r.isWiFi);
            if (hasBleConnected) return;

            try {
                const { data } = await soilIntelligenceAPI.getSensorHistory('all');
                if (isMounted && data?.readings && data.readings.length > 0) {
                    const latest = data.readings[0];
                    const readingTime = new Date(latest.created_at).getTime();
                    // If reading arrived within the last 15 minutes, consider it active
                    if (Date.now() - readingTime < 15 * 60 * 1000) {
                        setSensorReadings(prev => ({
                            ...prev,
                            [latest.device_id || 'kisan_wifi']: {
                                deviceId: latest.device_id || 'kisan_wifi',
                                deviceName: 'KisanSensor (WiFi)',
                                moisture: latest.moisture,
                                battery: latest.battery ?? 90,
                                connected: true,
                                isWiFi: true,
                                lastUpdated: latest.created_at
                            }
                        }));
                    }
                }
            } catch (err) {
                // Backend endpoint silent catch
            }
        };

        checkBackendTelemetry();
        const pollId = setInterval(checkBackendTelemetry, 4000);
        return () => {
            isMounted = false;
            clearInterval(pollId);
        };
    }, [sensorReadings]);

    // ─── Save a newly paired device (after farm selection) ──────────────────
    const savePairedDevice = useCallback(({ deviceId, deviceName, farmId, farmName }) => {
        setPairedDevices(prev => {
            const exists = prev.find(d => d.deviceId === deviceId);
            if (exists) {
                return prev.map(d =>
                    d.deviceId === deviceId
                        ? { ...d, deviceName, farmId, farmName, pairedAt: new Date().toISOString() }
                        : d
                );
            }
            return [...prev, {
                deviceId,
                deviceName,
                farmId,
                farmName,
                pairedAt: new Date().toISOString()
            }];
        });
    }, []);

    // ─── Update device metadata ──────────────────────────────────────────────
    const updateDevice = useCallback((deviceId, updates) => {
        setPairedDevices(prev =>
            prev.map(d => (d.deviceId === deviceId ? { ...d, ...updates } : d))
        );
    }, []);

    // ─── Remove device ───────────────────────────────────────────────────────
    const removeDevice = useCallback((deviceId) => {
        disconnectDevice(deviceId);
        setPairedDevices(prev => prev.filter(d => d.deviceId !== deviceId));
        setSensorReadings(prev => {
            const copy = { ...prev };
            delete copy[deviceId];
            return copy;
        });
    }, [disconnectDevice]);

    // ─── Send WiFi credentials to ESP32 via BLE ──────────────────────────────
    const sendWiFiCredentials = useCallback(async (deviceId, ssid, password) => {
        const conn = bleConnections.current[deviceId];
        if (!conn?.service) {
            throw new Error('DEVICE_NOT_CONNECTED');
        }

        setWifiStatus(prev => ({ ...prev, [deviceId]: WIFI_STATUS.CONNECTING }));

        try {
            // Write SSID
            const ssidChar = await conn.service.getCharacteristic(WIFI_SSID_CHAR_UUID);
            const ssidEncoder = new TextEncoder();
            await ssidChar.writeValue(ssidEncoder.encode(ssid));

            // Write password (triggers WiFi connection on ESP32)
            const passChar = await conn.service.getCharacteristic(WIFI_PASS_CHAR_UUID);
            const passEncoder = new TextEncoder();
            await passChar.writeValue(passEncoder.encode(password));

            // Subscribe to WiFi status notifications
            const statusChar = await conn.service.getCharacteristic(WIFI_STATUS_CHAR_UUID);

            return new Promise((resolve, reject) => {
                let timeoutId;

                const handleStatusChange = (e) => {
                    const status = e.target.value.getUint8(0);
                    setWifiStatus(prev => ({ ...prev, [deviceId]: status }));

                    if (status === WIFI_STATUS.CONNECTED) {
                        clearTimeout(timeoutId);
                        statusChar.removeEventListener('characteristicvaluechanged', handleStatusChange);
                        resolve({ success: true, status });
                    } else if (status === WIFI_STATUS.FAILED) {
                        clearTimeout(timeoutId);
                        statusChar.removeEventListener('characteristicvaluechanged', handleStatusChange);
                        reject(new Error('WIFI_CONNECTION_FAILED'));
                    }
                };

                statusChar.addEventListener('characteristicvaluechanged', handleStatusChange);
                statusChar.startNotifications().catch(() => {
                    clearTimeout(timeoutId);
                    reject(new Error('Failed to subscribe to WiFi status notifications'));
                });

                timeoutId = setTimeout(() => {
                    statusChar.removeEventListener('characteristicvaluechanged', handleStatusChange);
                    setWifiStatus(prev => ({ ...prev, [deviceId]: WIFI_STATUS.FAILED }));
                    reject(new Error('WIFI_CONNECTION_TIMEOUT'));
                }, 20000);
            });
        } catch (err) {
            setWifiStatus(prev => ({ ...prev, [deviceId]: WIFI_STATUS.FAILED }));
            throw err;
        }
    }, []);

    // ─── Get sensor reading for a specific farm (ROBUST REAL-TIME RESOLUTION) ─
    const getSensorForFarm = useCallback((farmId) => {
        // 1. PRIORITY: Check for any actively connected BLE/WiFi sensor in sensorReadings
        const connectedEntry = Object.entries(sensorReadings).find(([_, r]) => r.connected === true);
        if (connectedEntry) {
            const [devId, reading] = connectedEntry;
            const pairedMeta = pairedDevices.find(d => d.deviceId === devId);
            return {
                deviceId: devId,
                deviceName: pairedMeta?.deviceName || reading.deviceName || 'KisanSensor',
                farmId: pairedMeta?.farmId || farmId || 'active',
                ...pairedMeta,
                ...reading,
                connected: true
            };
        }

        // 2. Look for device explicitly assigned to this farm
        if (farmId) {
            const device = pairedDevices.find(d => d.farmId === farmId);
            if (device) {
                const reading = sensorReadings[device.deviceId] || {};
                return { ...device, ...reading };
            }
        }

        // 3. Fallback to any paired device
        if (pairedDevices.length > 0) {
            const device = pairedDevices[0];
            const reading = sensorReadings[device.deviceId] || {};
            return { ...device, ...reading };
        }

        // 4. Any reading entry cached in state
        const anyEntry = Object.entries(sensorReadings)[0];
        if (anyEntry) {
            const [devId, reading] = anyEntry;
            return {
                deviceId: devId,
                deviceName: reading.deviceName || 'KisanSensor',
                ...reading
            };
        }

        return null;
    }, [pairedDevices, sensorReadings]);

    // ─── Get all devices for a farm ──────────────────────────────────────────
    const getDevicesForFarm = useCallback((farmId) => {
        return pairedDevices.filter(d => d.farmId === farmId);
    }, [pairedDevices]);

    const value = {
        pairedDevices,
        sensorReadings,
        wifiStatus,
        connectingId,
        isWebBluetoothSupported,
        scanAndPair,
        subscribeToDevice,
        connectDevice,
        disconnectDevice,
        savePairedDevice,
        updateDevice,
        removeDevice,
        getSensorForFarm,
        getDevicesForFarm,
        sendWiFiCredentials,
    };

    return <IoTContext.Provider value={value}>{children}</IoTContext.Provider>;
};

export default IoTContext;
