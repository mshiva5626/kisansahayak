import React, { useState } from 'react';

const CODE_SECTIONS = [
    {
        id: 'wiring',
        label: 'Wiring (FC-28 + 30-Pin)',
        icon: 'cable',
        content: `ESP32 NodeMCU 30-Pin & FC-28 Soil Hygrometer Wiring:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sensor Module: FC-28 / YL-69 Probe + LM393 Comparator Board
Microcontroller: ESP32 NodeMCU CP2102 (30-Pin Board)

1. Probe to LM393 Comparator:
   • Connect the 2 pins from the fork probe to the 2-pin
     header on the LM393 comparator board using jumper wires.

2. LM393 Comparator Module to ESP32 NodeMCU 30-Pin:
   • VCC  ───► ESP32 3V3 (or VIN if using 5V USB)
   • GND  ───► ESP32 GND
   • A0   ───► ESP32 GPIO 34 (D34 - ADC1, WiFi-safe)
   • D0   ───► ESP32 GPIO 35 (Optional digital threshold)

3. Sensitivity Potentiometer (Blue Trimpot on LM393):
   • Rotate the screw with a small screwdriver to calibrate
     the threshold LED if using digital output (D0).

Why GPIO 34?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• GPIO 34 belongs to ADC1. ADC1 is completely safe to use
  when WiFi and Bluetooth are active. (ADC2 pins conflict with WiFi).
• GPIO 34 is an input-only pin, making it ideal for analog sensors.`
    },
    {
        id: 'libraries',
        label: 'Arduino Setup',
        icon: 'library_books',
        content: `Arduino IDE Setup for ESP32 CP2102:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Install CP2102 USB Driver (if board is not detected):
   • Download "CP210x USB to UART Bridge VCP Drivers" from Silicon Labs.

2. ESP32 Board Support:
   • File → Preferences → Additional Boards Manager URLs:
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   • Tools → Board → Boards Manager → Search "esp32" → Install by Espressif.

3. Required Libraries (Tools → Manage Libraries):
   • "NimBLE-Arduino" by h2zero (for Mode 1: BLE)
   • "ArduinoJson" by Benoît Blanchon (for Mode 2: WiFi JSON POST)

4. Board Settings in Arduino IDE:
   • Board:        "DOIT ESP32 DEVKIT V1" (or "ESP32 Dev Module")
   • Upload Speed: "115200" (or 921600)
   • Port:         Select the COM port of CP2102`
    },
    {
        id: 'ble_sketch',
        label: 'Mode 1: BLE Firmware',
        icon: 'bluetooth',
        content: `/**
 * Mode 1: KisanSahayak Web Bluetooth Firmware
 * Board: ESP32 NodeMCU 30-Pin + FC-28 LM393
 * Connects directly to Google Chrome / Edge without WiFi!
 */
#include <NimBLEDevice.h>

#define DEVICE_NAME        "KisanSensor"
#define SERVICE_UUID       "12345678-1234-1234-1234-123456789abc"
#define MOISTURE_CHAR_UUID "12345678-1234-1234-1234-123456789ab1"
#define BATTERY_CHAR_UUID  "12345678-1234-1234-1234-123456789ab2"

#define MOISTURE_PIN       34   // FC-28 Analog A0 connected to GPIO 34
#define STATUS_LED          2   // Built-in Blue LED

// Calibration values for FC-28 (Adjust based on your dry/wet readings)
int DRY_VALUE = 3400;   // Sensor in dry air
int WET_VALUE = 1300;   // Sensor in cup of water

NimBLEServer*         pServer       = nullptr;
NimBLECharacteristic* pMoistureChar = nullptr;
NimBLECharacteristic* pBatteryChar  = nullptr;
bool deviceConnected = false;

class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer) override {
        deviceConnected = true;
        digitalWrite(STATUS_LED, HIGH);
        Serial.println("KisanSahayak Web App Connected via BLE!");
    }
    void onDisconnect(NimBLEServer* pServer) override {
        deviceConnected = false;
        digitalWrite(STATUS_LED, LOW);
        Serial.println("Disconnected. Restarting Advertising...");
        NimBLEDevice::startAdvertising();
    }
};

void setup() {
    Serial.begin(115200);
    pinMode(STATUS_LED, OUTPUT);
    analogReadResolution(12); // 0-4095

    NimBLEDevice::init(DEVICE_NAME);
    NimBLEDevice::setPower(ESP_PWR_LVL_P9);

    pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(new ServerCallbacks());

    NimBLEService* pService = pServer->createService(SERVICE_UUID);

    pMoistureChar = pService->createCharacteristic(
        MOISTURE_CHAR_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
    );

    pBatteryChar = pService->createCharacteristic(
        BATTERY_CHAR_UUID,
        NIMBLE_PROPERTY::READ
    );

    uint8_t dummyBat = 95;
    pBatteryChar->setValue(&dummyBat, 1);

    pService->start();

    NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setName(DEVICE_NAME);
    pAdvertising->start();

    Serial.println("KisanSensor BLE Ready! Connect from Soil Hub.");
}

void loop() {
    // Read FC-28 Analog
    int raw = analogRead(MOISTURE_PIN);

    // Map raw ADC (3400 dry -> 0%, 1300 wet -> 100%)
    int moisturePercent = map(raw, DRY_VALUE, WET_VALUE, 0, 100);
    moisturePercent = constrain(moisturePercent, 0, 100);

    Serial.printf("Raw ADC: %d | Moisture: %d%%\n", raw, moisturePercent);

    if (deviceConnected && pMoistureChar) {
        uint8_t val = (uint8_t)moisturePercent;
        pMoistureChar->setValue(&val, 1);
        pMoistureChar->notify();
    }

    delay(2000); // Send reading every 2 seconds
}`
    },
    {
        id: 'wifi_sketch',
        label: 'Mode 2: WiFi HTTP POST',
        icon: 'wifi',
        content: `/**
 * Mode 2: Field Deployment — Direct WiFi HTTP POST
 * Sends moisture readings directly to the KisanSahayak backend!
 * Database persistence: Automatically saves to sensor_readings
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ── WiFi Credentials ──────────────────────────────────────────────
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ── Backend API URL (Replace with your local IP or backend URL) ──
// For local PC testing: http://192.168.1.X:5000/api/soil-intelligence/sensor-data
const char* serverUrl = "http://192.168.1.100:5000/api/soil-intelligence/sensor-data";

#define MOISTURE_PIN 34
#define STATUS_LED    2

int DRY_VALUE = 3400;
int WET_VALUE = 1300;

void setup() {
    Serial.begin(115200);
    pinMode(STATUS_LED, OUTPUT);
    analogReadResolution(12);

    Serial.print("Connecting to WiFi: ");
    Serial.println(ssid);
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
    }

    digitalWrite(STATUS_LED, HIGH);
    Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
}

void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        int raw = analogRead(MOISTURE_PIN);
        int moisture = constrain(map(raw, DRY_VALUE, WET_VALUE, 0, 100), 0, 100);

        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");

        // Prepare JSON payload
        StaticJsonDocument<200> doc;
        doc["deviceId"] = "ESP32_FC28_01";
        doc["farmId"]   = "default";
        doc["moisture"] = moisture;
        doc["battery"]  = 95;

        String requestBody;
        serializeJson(doc, requestBody);

        int httpResponseCode = http.POST(requestBody);
        Serial.printf("Posted Moisture %d%% | HTTP Code: %d\n", moisture, httpResponseCode);

        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println("Response: " + response);
        }

        http.end();
    }

    delay(10000); // Send data every 10 seconds (or deep sleep for field use)
}`
    },
    {
        id: 'calibration',
        label: 'Calibration',
        icon: 'tune',
        content: `Calibrating your FC-28 Moisture Sensor:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: Dry Reading (Air)
  1. Hold the FC-28 probe in dry air (completely dry).
  2. Open Arduino Serial Monitor (115200 baud).
  3. Note the Raw ADC number (typically ~3200 - 3600).
  4. Set this as DRY_VALUE in your Arduino sketch.

Step 2: Wet Reading (Water)
  1. Submerge the metal prongs into a glass of water
     (do NOT submerge the blue LM393 module).
  2. Note the Raw ADC number (typically ~1100 - 1500).
  3. Set this as WET_VALUE in your Arduino sketch.

Step 3: Soil Test
  1. Insert probe 2-3 inches into field soil.
  2. The map() function will now accurately report 0% to 100% moisture!
  3. Clean and dry the probe prongs after testing to extend longevity.`
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
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased pb-12">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-4 py-3 shadow-sm">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                        title="Back"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-base font-extrabold text-slate-900">ESP32 & FC-28 Hardware Guide</h1>
                        <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">NodeMCU 30-Pin + LM393 Probe</p>
                    </div>
                    <div className="w-9" />
                </div>

                {/* Section Tabs */}
                <div className="max-w-2xl mx-auto mt-3 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {CODE_SECTIONS.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeSection === section.id
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">{section.icon}</span>
                            <span>{section.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
                {/* Hardware Banner */}
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-2xl">memory</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-extrabold text-emerald-950">ESP32 NodeMCU 30-Pin CP2102 + FC-28</h2>
                        <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                            Complete reference wiring and firmware code tailored to your exact hardware setup.
                        </p>
                    </div>
                </div>

                {/* Code Container */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
                        <div className="flex items-center gap-2 text-slate-200">
                            <span className="material-symbols-outlined text-emerald-400 text-base">{current.icon}</span>
                            <span className="text-xs font-extrabold">{current.label}</span>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">
                                {copied ? 'check' : 'content_copy'}
                            </span>
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>

                    <pre className="p-4 text-xs text-emerald-300 font-mono leading-relaxed overflow-x-auto max-h-[55vh] whitespace-pre bg-slate-900">
                        {current.content}
                    </pre>
                </div>
            </main>
        </div>
    );
};

export default IoTESP32Guide;
