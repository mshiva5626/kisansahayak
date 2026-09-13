import React, { useState } from 'react';

const CODE_SECTIONS = [
    {
        id: 'wiring',
        label: 'Wiring',
        icon: 'cable',
        content: `ESP32 Pin Connections:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Capacitive Moisture Sensor:
  VCC (3.3V) → ESP32 3.3V pin
  GND        → ESP32 GND
  AOUT       → ESP32 GPIO 34 (ADC)

Status LED (optional):
  (+) Anode  → GPIO 2 (built-in LED)
  (-) Cathode → GND (via 330Ω resistor)

Power Options:
  A) USB-C   → Any 5V USB charger
  B) Battery → 3.7V LiPo + TP4056 charger
  C) Solar   → 5V solar panel + TP4056

Notes:
  • GPIO 34 is input-only on ESP32 (perfect for ADC)
  • Use a capacitive sensor (not resistive) for longevity
  • Sensor VCC can use 3.3V — no 5V needed
  • Keep wires short (< 30cm) to reduce noise`
    },
    {
        id: 'libraries',
        label: 'Libraries',
        icon: 'library_books',
        content: `Arduino IDE Library Setup:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Open Arduino IDE
2. Go to: Tools → Manage Libraries

Install these libraries:
  ✓ NimBLE-Arduino  (by h2zero)
    Version: 1.4.x or later
    → Lightweight BLE for ESP32

  ✓ ESP32 Board Support
    File → Preferences → Additional URLs:
    https://raw.githubusercontent.com/espressif/
    arduino-esp32/gh-pages/package_esp32_index.json

    Then: Tools → Board → Boards Manager
    Search "esp32" → Install by Espressif Systems

Board Settings:
  Board:        "ESP32 Dev Module"
  Flash Size:   "4MB (32Mb)"
  CPU Freq:     "240MHz"
  Upload Speed: "115200"
  Port:         Your COM port (check Device Manager)`
    },
    {
        id: 'sketch',
        label: 'Arduino Code',
        icon: 'code',
        content: `#include <NimBLEDevice.h>

// ── KisanSahayak BLE Configuration ──────────────
#define DEVICE_NAME        "KisanSensor"
#define SERVICE_UUID       "12345678-1234-1234-1234-123456789abc"
#define MOISTURE_CHAR_UUID "12345678-1234-1234-1234-123456789ab1"
#define BATTERY_CHAR_UUID  "12345678-1234-1234-1234-123456789ab2"
#define DEVICE_NAME_UUID   "12345678-1234-1234-1234-123456789ab3"

// ── Sensor Pins ───────────────────────────────────
#define MOISTURE_PIN  34       // ADC1 Channel 6
#define LED_PIN        2       // Built-in LED

// ── Moisture Calibration ──────────────────────────
// Measure these values with your specific sensor:
// DRY_VALUE  = ADC reading when sensor is in dry air
// WET_VALUE  = ADC reading when sensor is in water
#define DRY_VALUE   3500
#define WET_VALUE    800

// ── Read interval (ms) ────────────────────────────
#define READ_INTERVAL 2000

NimBLEServer*          pServer     = nullptr;
NimBLECharacteristic*  pMoisture   = nullptr;
NimBLECharacteristic*  pBattery    = nullptr;
bool                   deviceConnected = false;
unsigned long          lastReadTime    = 0;

// ── Server Callbacks ──────────────────────────────
class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pS) {
        deviceConnected = true;
        digitalWrite(LED_PIN, HIGH);  // LED on = paired
        Serial.println("[BLE] Client connected!");
    }
    void onDisconnect(NimBLEServer* pS) {
        deviceConnected = false;
        digitalWrite(LED_PIN, LOW);
        Serial.println("[BLE] Client disconnected, restarting advertising...");
        NimBLEDevice::startAdvertising();
    }
};

// ── Read & map moisture ───────────────────────────
uint8_t readMoisture() {
    int raw = analogRead(MOISTURE_PIN);
    // Average 5 readings to reduce noise
    for (int i = 1; i < 5; i++) {
        delay(10);
        raw = (raw + analogRead(MOISTURE_PIN)) / 2;
    }
    int percent = map(raw, DRY_VALUE, WET_VALUE, 0, 100);
    percent = constrain(percent, 0, 100);
    Serial.printf("[SENSOR] Raw ADC: %d → Moisture: %d%%\\n", raw, percent);
    return (uint8_t)percent;
}

// ── Read battery (via voltage divider on GPIO 35) ─
uint8_t readBattery() {
    // Simple approximation — connect battery + via
    // 100kΩ + 100kΩ voltage divider to GPIO 35
    // Returns 0-100%
    int raw = analogRead(35);
    float voltage = (raw / 4095.0) * 3.3 * 2.0;  // ×2 for divider
    int percent = (int)((voltage - 3.2) / (4.2 - 3.2) * 100);
    return (uint8_t)constrain(percent, 0, 100);
}

void setup() {
    Serial.begin(115200);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    
    // Startup blink
    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, HIGH); delay(150);
        digitalWrite(LED_PIN, LOW);  delay(150);
    }

    Serial.println("[INIT] KisanSensor BLE starting...");

    // ── Init BLE ────────────────────────────────────
    NimBLEDevice::init(DEVICE_NAME);
    NimBLEDevice::setPower(ESP_PWR_LVL_P9);  // Max TX power

    pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(new ServerCallbacks());

    // ── Create Service ───────────────────────────────
    NimBLEService* pService = pServer->createService(SERVICE_UUID);

    // Moisture Characteristic (Notify)
    pMoisture = pService->createCharacteristic(
        MOISTURE_CHAR_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
    );

    // Battery Characteristic (Read only)
    pBattery = pService->createCharacteristic(
        BATTERY_CHAR_UUID,
        NIMBLE_PROPERTY::READ
    );

    // Device Name Characteristic (Read only)
    NimBLECharacteristic* pName = pService->createCharacteristic(
        DEVICE_NAME_UUID,
        NIMBLE_PROPERTY::READ
    );
    pName->setValue(DEVICE_NAME);

    pService->start();

    // ── Advertise ────────────────────────────────────
    NimBLEAdvertising* pAdv = NimBLEDevice::getAdvertising();
    pAdv->addServiceUUID(SERVICE_UUID);
    pAdv->setScanResponse(true);
    pAdv->setName(DEVICE_NAME);
    NimBLEDevice::startAdvertising();

    Serial.println("[INIT] Advertising as 'KisanSensor' ✓");
    Serial.println("[INIT] Waiting for app connection...");
}

void loop() {
    unsigned long now = millis();
    if (now - lastReadTime >= READ_INTERVAL) {
        lastReadTime = now;

        uint8_t moisture = readMoisture();
        uint8_t battery  = readBattery();

        // Update characteristics
        pMoisture->setValue(&moisture, 1);
        pBattery->setValue(&battery, 1);

        if (deviceConnected) {
            pMoisture->notify();  // Push to app
        }
    }
    delay(10);
}`
    },
    {
        id: 'calibration',
        label: 'Calibration',
        icon: 'tune',
        content: `Moisture Sensor Calibration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: Open Arduino IDE Serial Monitor
  Baud Rate: 115200

Step 2: DRY calibration
  • Hold sensor in dry air (or soil sample)
  • Note the "Raw ADC" value printed
  • Set DRY_VALUE = that number
  Example: DRY_VALUE 3500

Step 3: WET calibration
  • Dip sensor in a glass of water
    (sensor tip only — not electronics!)
  • Note the "Raw ADC" value
  • Set WET_VALUE = that number
  Example: WET_VALUE 800

Step 4: Update your sketch
  #define DRY_VALUE  3500
  #define WET_VALUE   800

Step 5: Upload & verify
  • Dry soil → should read ~10-25%
  • Moist soil → should read ~40-70%
  • Saturated soil → should read ~80-100%

Tips:
  • Capacitive sensors are more accurate than resistive
  • Re-calibrate if you change soil type or temperature
  • Keep sensor inserted at consistent depth (5-10cm)`
    },
    {
        id: 'troubleshoot',
        label: 'Troubleshoot',
        icon: 'build',
        content: `Common Issues & Fixes:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Device not found in scan:
  ✓ Power cycle the ESP32
  ✓ Check Serial Monitor for "[INIT] Advertising..."
  ✓ Ensure you're using Chrome/Edge (not Safari/Firefox)
  ✓ Enable phone Bluetooth in system settings
  ✓ Re-upload the sketch

"Web Bluetooth not supported":
  ✓ Use Google Chrome on Android
  ✓ Desktop Chrome with BT hardware
  ✓ Enable: chrome://flags/#enable-web-bluetooth

Moisture reads always 0% or 100%:
  ✓ Re-calibrate DRY_VALUE and WET_VALUE
  ✓ Ensure AOUT → GPIO 34 is connected
  ✓ Check 3.3V power to sensor

Connection drops:
  ✓ Move phone closer to ESP32
  ✓ Avoid WiFi interference (different channels)
  ✓ Reduce READ_INTERVAL if overloading

Battery drains fast:
  ✓ Increase READ_INTERVAL to 10000 (10s)
  ✓ Add deep sleep between readings
  ✓ Use 3.7V LiPo > 2000mAh

LED behavior:
  OFF  = Advertising, waiting for app
  FAST blink = Error state
  SOLID ON   = App connected, streaming data`
    }
];

const IoTESP32Guide = ({ onBack }) => {
    const [activeSection, setActiveSection] = useState('wiring');
    const [copied, setCopied] = useState(false);

    const current = CODE_SECTIONS.find(s => s.id === activeSection);

    const handleCopy = () => {
        navigator.clipboard.writeText(current.content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#03140A] via-[#061c10] to-[#081d11] text-white font-sans overflow-x-hidden">
            {/* Ambient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="flex items-center justify-between px-5 pt-12 pb-5 shrink-0 relative z-10">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center active:scale-90 transition-all border border-white/10"
                >
                    <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-base font-extrabold text-white">ESP32 Setup Guide</h1>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">KisanSensor Firmware</p>
                </div>
                <div className="w-10 h-10" />
            </header>

            {/* Intro banner */}
            <div className="px-5 mb-5 relative z-10">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-400 text-2xl shrink-0">developer_board</span>
                    <div>
                        <p className="text-sm font-extrabold text-white">ESP32 + Capacitive Moisture Sensor</p>
                        <p className="text-xs text-slate-400 mt-0.5">Follow these steps in order: Wire → Install Libraries → Upload Code → Calibrate</p>
                    </div>
                </div>
            </div>

            {/* Section tabs */}
            <div className="px-5 mb-4 relative z-10">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {CODE_SECTIONS.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeSection === section.id
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                    : 'bg-white/5 text-slate-400 border border-white/10'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">{section.icon}</span>
                            {section.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Code block */}
            <div className="flex-1 px-5 pb-10 relative z-10">
                <div className="rounded-3xl bg-[#050f08] border border-white/10 overflow-hidden">
                    {/* Code header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/3">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-400 text-base">{current.icon}</span>
                            <span className="text-sm font-bold text-white">{current.label}</span>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors active:scale-95"
                        >
                            <span className="material-symbols-outlined text-base">
                                {copied ? 'check_circle' : 'content_copy'}
                            </span>
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    {/* Scrollable code */}
                    <pre className="p-4 text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto overflow-y-auto max-h-[52vh] whitespace-pre">
                        {current.content}
                    </pre>
                </div>

                {/* Helpful links */}
                <div className="mt-4 p-4 rounded-2xl bg-white/3 border border-white/8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Helpful Resources</p>
                    <div className="space-y-2">
                        {[
                            { label: 'NimBLE-Arduino GitHub', url: 'https://github.com/h2zero/NimBLE-Arduino' },
                            { label: 'ESP32 Arduino Docs', url: 'https://docs.espressif.com/projects/arduino-esp32' },
                            { label: 'Web Bluetooth API', url: 'https://developer.chrome.com/docs/capabilities/bluetooth' }
                        ].map(({ label, url }) => (
                            <a
                                key={label}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                {label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IoTESP32Guide;
