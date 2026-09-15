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
#include <WiFi.h>
#include <Preferences.h>

// ── BLE UUIDs (Matches KisanSahayak IoTContext) ────
#define DEVICE_NAME        "KisanSensor"
#define SERVICE_UUID       "12345678-1234-1234-1234-123456789abc"
#define MOISTURE_CHAR_UUID "12345678-1234-1234-1234-123456789ab1"
#define BATTERY_CHAR_UUID  "12345678-1234-1234-1234-123456789ab2"
#define DEVICE_NAME_UUID   "12345678-1234-1234-1234-123456789ab3"
#define WIFI_SSID_CHAR_UUID   "12345678-1234-1234-1234-123456789ab4"
#define WIFI_PASS_CHAR_UUID   "12345678-1234-1234-1234-123456789ab5"
#define WIFI_STATUS_CHAR_UUID "12345678-1234-1234-1234-123456789ab6"

#define MOISTURE_PIN  34   // ADC1 Channel 6
#define LED_PIN        2   // Built-in Blue LED
#define BATTERY_PIN   35   // Optional 100k+100k divider

#define DEFAULT_DRY 3200
#define DEFAULT_WET 1100

NimBLEServer*          pServer         = nullptr;
NimBLECharacteristic*  pMoistureChar   = nullptr;
NimBLECharacteristic*  pBatteryChar    = nullptr;
NimBLECharacteristic*  pWifiStatusChar = nullptr;

bool          deviceConnected   = false;
unsigned long lastReadTime      = 0;
unsigned long lastLedToggle     = 0;
bool          ledState          = false;
Preferences   nvs;
int           dryVal = DEFAULT_DRY;
int           wetVal = DEFAULT_WET;

String        pendingSsid       = "";
String        pendingPass       = "";
bool          wifiRequested     = false;

uint8_t readFilteredMoisture(int &outRaw) {
    const int SAMPLES = 30;
    int buffer[SAMPLES];
    for (int i = 0; i < SAMPLES; i++) {
        buffer[i] = analogRead(MOISTURE_PIN);
        delay(3);
    }
    // Insertion sort
    for (int i = 1; i < SAMPLES; i++) {
        int key = buffer[i];
        int j = i - 1;
        while (j >= 0 && buffer[j] > key) { buffer[j + 1] = buffer[j]; j--; }
        buffer[j + 1] = key;
    }
    // Trimmed mean (reject top & bottom 5 outliers)
    long sum = 0;
    for (int i = 5; i < 25; i++) sum += buffer[i];
    outRaw = sum / 20;
    int percent = map(outRaw, dryVal, wetVal, 0, 100);
    return (uint8_t)constrain(percent, 0, 100);
}

class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pS) override {
        deviceConnected = true;
        digitalWrite(LED_PIN, HIGH);
        Serial.println("[BLE] App connected!");
    }
    void onDisconnect(NimBLEServer* pS) override {
        deviceConnected = false;
        digitalWrite(LED_PIN, LOW);
        Serial.println("[BLE] App disconnected. Pairing mode restarted.");
        NimBLEDevice::startAdvertising();
    }
};

class WifiSsidCb : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* p) override { pendingSsid = p->getValue().c_str(); }
};
class WifiPassCb : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* p) override {
        pendingPass = p->getValue().c_str();
        if (pendingSsid.length() > 0) wifiRequested = true;
    }
};

void setup() {
    Serial.begin(115200);
    analogReadResolution(12);
    analogSetAttenuation(ADC_11db);
    pinMode(MOISTURE_PIN, INPUT);
    pinMode(LED_PIN, OUTPUT);

    nvs.begin("kisan_cal", true);
    dryVal = nvs.getInt("dry", DEFAULT_DRY);
    wetVal = nvs.getInt("wet", DEFAULT_WET);
    nvs.end();

    NimBLEDevice::init(DEVICE_NAME);
    NimBLEDevice::setPower(ESP_PWR_LVL_P9);
    pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(new ServerCallbacks());

    NimBLEService* pService = pServer->createService(SERVICE_UUID);
    pMoistureChar = pService->createCharacteristic(MOISTURE_CHAR_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
    pBatteryChar  = pService->createCharacteristic(BATTERY_CHAR_UUID, NIMBLE_PROPERTY::READ);
    
    auto* pSsid = pService->createCharacteristic(WIFI_SSID_CHAR_UUID, NIMBLE_PROPERTY::WRITE);
    pSsid->setCallbacks(new WifiSsidCb());
    auto* pPass = pService->createCharacteristic(WIFI_PASS_CHAR_UUID, NIMBLE_PROPERTY::WRITE);
    pPass->setCallbacks(new WifiPassCb());
    pWifiStatusChar = pService->createCharacteristic(WIFI_STATUS_CHAR_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);

    pService->start();
    NimBLEAdvertising* pAdv = NimBLEDevice::getAdvertising();
    pAdv->addServiceUUID(SERVICE_UUID);
    pAdv->setName(DEVICE_NAME);
    NimBLEDevice::startAdvertising();
}

void loop() {
    unsigned long now = millis();
    // 2Hz blink when waiting in pairing mode
    if (!deviceConnected && now - lastLedToggle >= 250) {
        lastLedToggle = now;
        ledState = !ledState;
        digitalWrite(LED_PIN, ledState ? HIGH : LOW);
    }
    // Read sensor every 2 seconds
    if (now - lastReadTime >= 2000) {
        lastReadTime = now;
        int raw = 0;
        uint8_t m = readFilteredMoisture(raw);
        pMoistureChar->setValue(&m, 1);
        if (deviceConnected) pMoistureChar->notify();
    }
    delay(10);
}`
    },
    {
        id: 'calibration',
        label: 'Calibration',
        icon: 'tune',
        content: `Instant 1-Click Calibration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No re-compiling needed! Calibration saves to Flash.

Step 1: Open Arduino IDE Serial Monitor
  Baud Rate: 115200

Step 2: DRY Calibration (0% Moisture)
  • Hold sensor in open dry air
  • Type 'd' in the Serial input and press Enter
  • ESP32 will permanently save DRY value to NVS

Step 3: WET Calibration (100% Moisture)
  • Dip sensor blade in a glass of water
    (only the lower blade — keep circuit dry!)
  • Type 'w' in the Serial input and press Enter
  • ESP32 will permanently save WET value to NVS

Step 4: Check Calibration Status
  • Type 'c' to view your current calibration table
  • Type 'r' anytime to reset to factory defaults

Soil Accuracy Reference:
  • Dry Soil:       10% - 25% (Needs irrigation)
  • Optimal Soil:   45% - 70% (Healthy root zone)
  • Saturated Soil: 80% - 100% (Just watered / rain)`
    },
    {
        id: 'troubleshoot',
        label: 'Troubleshoot',
        icon: 'build',
        content: `Common Issues & Fixes:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Blue LED Behavior:
  • BLINKING (2Hz) = Pairing Mode (advertising, ready to pair)
  • SOLID ON       = App connected and streaming live data
  • FAST STROBE    = WiFi connecting in progress

Device not appearing in Bluetooth list:
  ✓ Use Google Chrome or Microsoft Edge (Web Bluetooth)
  ✓ Turn on Phone/PC Bluetooth
  ✓ In Chrome address bar, ensure site has Bluetooth permission
  ✓ Verify Serial Monitor says "BLE Advertising active"

Moisture reading stuck at 0% or 100%:
  ✓ Calibrate with 'd' (in air) and 'w' (in water) via Serial Monitor
  ✓ Ensure sensor AOUT connects to GPIO 34 (ADC1)
  ✓ If sensor voltage does not change, try powering VCC from 5V/VIN
    (many clone v1.2 sensors need 5V to run properly)

WiFi connection failed:
  ✓ ESP32 only supports 2.4GHz WiFi (not 5GHz)
  ✓ Double-check your WiFi password`
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
