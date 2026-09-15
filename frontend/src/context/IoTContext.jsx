import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

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
    const isWebBluetoothSupported = () => {
        return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    };

    // ─── Scan & Pair a new device ────────────────────────────────────────────
    // Returns { deviceId, deviceName } on success, throws on failure
    const scanAndPair = useCallback(async () => {
        if (!isWebBluetoothSupported()) {
            throw new Error('WEB_BLUETOOTH_UNSUPPORTED');
        }

        // Prompt system BLE picker
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [KISAN_SERVICE_UUID] },
                { namePrefix: 'KisanSensor' }
            ],
            optionalServices: [KISAN_SERVICE_UUID]
        });

        const deviceId   = device.id;
        const deviceName = device.name || 'KisanSensor';

        // Connect GATT
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(KISAN_SERVICE_UUID);

        // Read initial moisture
        let initialMoisture = null;
        try {
            const moistChar = await service.getCharacteristic(MOISTURE_CHAR_UUID);
            const val = await moistChar.readValue();
            initialMoisture = val.getUint8(0); // 0-100 %
        } catch { /* characteristic may not be readable until first notify */ }

        // Read battery level
        let battery = null;
        try {
            const batChar = await service.getCharacteristic(BATTERY_CHAR_UUID);
            const val = await batChar.readValue();
            battery = val.getUint8(0);
        } catch { /* optional */ }

        // Store the raw device object ref for reconnection
        bleConnections.current[deviceId] = { device, server, service };

        // Handle unexpected disconnection
        device.addEventListener('gattserverdisconnected', () => {
            setSensorReadings(prev => ({
                ...prev,
                [deviceId]: { ...(prev[deviceId] || {}), connected: false }
            }));
        });

        // Return pairing metadata (farmId will be assigned separately)
        return {
            deviceId,
            deviceName,
            initialMoisture,
            battery
        };
    }, []);

    // ─── Subscribe to live notifications from a connected device ────────────
    const subscribeToDevice = useCallback(async (deviceId) => {
        const conn = bleConnections.current[deviceId];
        if (!conn) return;

        try {
            const moistChar = await conn.service.getCharacteristic(MOISTURE_CHAR_UUID);
            await moistChar.startNotifications();
            moistChar.addEventListener('characteristicvaluechanged', (e) => {
                const moisture = e.target.value.getUint8(0);
                setSensorReadings(prev => ({
                    ...prev,
                    [deviceId]: {
                        ...(prev[deviceId] || {}),
                        moisture,
                        connected: true,
                        lastUpdated: new Date().toISOString()
                    }
                }));
            });

            // Battery (poll every 30s — not notify)
            const pollBattery = async () => {
                try {
                    const batChar = await conn.service.getCharacteristic(BATTERY_CHAR_UUID);
                    const val = await batChar.readValue();
                    const battery = val.getUint8(0);
                    setSensorReadings(prev => ({
                        ...prev,
                        [deviceId]: { ...(prev[deviceId] || {}), battery }
                    }));
                } catch { /* ignore */ }
            };
            pollBattery();
            const batInterval = setInterval(pollBattery, 30000);
            // Store interval for cleanup
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
            } catch { /* WiFi status char may not exist on older firmware */ }
        } catch (err) {
            console.error('Subscribe failed:', err);
        }
    }, []);

    // ─── Connect to an already-paired device ────────────────────────────────
    const connectDevice = useCallback(async (deviceId) => {
        const conn = bleConnections.current[deviceId];
        if (conn?.device?.gatt?.connected) return; // already connected

        setConnectingId(deviceId);
        try {
            // If device object is cached (same browser session), reconnect
            if (conn?.device) {
                const server = await conn.device.gatt.connect();
                const service = await server.getPrimaryService(KISAN_SERVICE_UUID);
                bleConnections.current[deviceId] = { ...conn, server, service };
                await subscribeToDevice(deviceId);
            } else {
                // Need to re-scan (new browser session, no device ref)
                // This is a platform limitation of Web Bluetooth
                throw new Error('NEEDS_RESCAN');
            }
        } finally {
            setConnectingId(null);
        }
    }, [subscribeToDevice]);

    // ─── Disconnect device ───────────────────────────────────────────────────
    const disconnectDevice = useCallback((deviceId) => {
        const conn = bleConnections.current[deviceId];
        if (!conn) return;

        if (conn.batInterval) clearInterval(conn.batInterval);
        try { conn.device?.gatt?.disconnect(); } catch { /* ignore */ }

        delete bleConnections.current[deviceId];
        setSensorReadings(prev => ({
            ...prev,
            [deviceId]: { ...(prev[deviceId] || {}), connected: false }
        }));
    }, []);

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

    // ─── Update a sensor's name or farm assignment ───────────────────────────
    const updateDevice = useCallback(({ deviceId, deviceName, farmId, farmName }) => {
        setPairedDevices(prev =>
            prev.map(d =>
                d.deviceId === deviceId
                    ? { ...d, ...(deviceName !== undefined && { deviceName }), ...(farmId !== undefined && { farmId, farmName }) }
                    : d
            )
        );
    }, []);

    // ─── Remove a paired device ──────────────────────────────────────────────
    const removeDevice = useCallback((deviceId) => {
        disconnectDevice(deviceId);
        setPairedDevices(prev => prev.filter(d => d.deviceId !== deviceId));
        setSensorReadings(prev => {
            const copy = { ...prev };
            delete copy[deviceId];
            return copy;
        });
    }, [disconnectDevice]);

    // ─── Send WiFi credentials to a connected device over BLE ────────────────
    const sendWiFiCredentials = useCallback(async (deviceId, ssid, password) => {
        const conn = bleConnections.current[deviceId];
        if (!conn?.service) throw new Error('Device not connected');

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
                    // status === CONNECTING: keep waiting
                };

                statusChar.addEventListener('characteristicvaluechanged', handleStatusChange);
                statusChar.startNotifications().catch(() => {
                    // If notifications fail, poll instead
                    clearTimeout(timeoutId);
                    reject(new Error('Failed to subscribe to WiFi status notifications'));
                });

                // Timeout after 20 seconds
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

    // ─── Get sensor reading for a specific farm ──────────────────────────────
    const getSensorForFarm = useCallback((farmId) => {
        if (!farmId) return null;
        const device = pairedDevices.find(d => d.farmId === farmId);
        if (!device) return null;
        const reading = sensorReadings[device.deviceId] || {};
        return { ...device, ...reading };
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
