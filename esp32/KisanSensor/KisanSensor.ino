/*
 * ==============================================================================
 *  🌾 KisanSahayak - ESP32 Smart Agriculture IoT Soil Moisture Sensor Firmware
 * ==============================================================================
 *  Compatible with:
 *   - Arduino ESP32 Core v3.x (Latest)
 *   - NimBLE-Arduino v2.x (Latest Library Manager release)
 *
 *  Features:
 *   1. Web Bluetooth (BLE) live soil moisture & battery streaming via NimBLE.
 *   2. CP Plus-Style WiFi Provisioning:
 *      - App sends WiFi SSID & password via BLE characteristics.
 *      - ESP32 connects to 2.4GHz WiFi & persists credentials in NVS flash.
 *      - Auto-reconnects to saved WiFi on boot.
 *   3. Visual Pairing Mode & Status LED:
 *      - Blinking (2Hz): Device is in Pairing Mode (advertising, waiting for app).
 *      - Solid ON: Paired & connected to KisanSahayak app.
 *      - Fast Strobe: WiFi connecting in progress.
 *   4. High-Precision Soil Moisture Calibration:
 *      - 30-sample trimmed mean (rejects noise spikes from WiFi/BLE bursts).
 *      - Interactive Serial Calibration: Press 'd' for Dry Air, 'w' for Water.
 *      - Permanent NVS storage for calibration: Calibrate once, saved forever!
 *      - Proper ADC configuration: 12-bit, 11dB attenuation on ADC1 (GPIO 34).
 *
 *  Hardware Connections:
 *   - Capacitive Moisture Sensor VCC  -> ESP32 3.3V (or VIN/5V for clone sensors)
 *   - Capacitive Moisture Sensor GND  -> ESP32 GND
 *   - Capacitive Moisture Sensor AOUT -> ESP32 GPIO 34 (ADC1 Channel 6)
 *   - Built-in Status LED             -> ESP32 GPIO 2
 *   - Battery Divider (Optional)      -> ESP32 GPIO 35 (100k + 100k divider)
 * ==============================================================================
 */

#include <NimBLEDevice.h>
#include <WiFi.h>
#include <Preferences.h>

// ─── BLE UUIDs (Must match KisanSahayak IoTContext exactly) ───────────────────
#define DEVICE_NAME        "KisanSensor"
#define SERVICE_UUID       "12345678-1234-1234-1234-123456789abc"
#define MOISTURE_CHAR_UUID "12345678-1234-1234-1234-123456789ab1"
#define BATTERY_CHAR_UUID  "12345678-1234-1234-1234-123456789ab2"
#define DEVICE_NAME_UUID   "12345678-1234-1234-1234-123456789ab3"

// WiFi provisioning BLE characteristics
#define WIFI_SSID_CHAR_UUID   "12345678-1234-1234-1234-123456789ab4"
#define WIFI_PASS_CHAR_UUID   "12345678-1234-1234-1234-123456789ab5"
#define WIFI_STATUS_CHAR_UUID "12345678-1234-1234-1234-123456789ab6"

// WiFi status codes (sent to app via BLE notify)
#define WIFI_STATUS_IDLE         0
#define WIFI_STATUS_CONNECTING   1
#define WIFI_STATUS_CONNECTED    2
#define WIFI_STATUS_FAILED       3

// ─── Hardware Pins ───────────────────────────────────────────────────────────
#define MOISTURE_PIN       34    // ADC1_CH6 (Capacitive sensor AOUT pin)
#define LED_PIN             2    // Onboard Blue LED (indicates BLE pairing/status)
#define BATTERY_PIN        35    // ADC1_CH7 (Optional 100k+100k battery divider)

// ─── Calibration Defaults (Overridden by NVS if saved) ───────────────────────
#define DEFAULT_DRY_VAL  0    // Raw ADC reading in dry air (0% moisture)
#define DEFAULT_WET_VAL  1023   // Raw ADC reading submerged in water (100% moisture)

// ─── Timing Settings ─────────────────────────────────────────────────────────
#define READ_INTERVAL_MS        2000   // Send moisture reading every 2s
#define WIFI_CONNECT_TIMEOUT_MS 15000  // 15s WiFi timeout

// ─── Global State & Pointers ─────────────────────────────────────────────────
NimBLEServer*          pServer         = nullptr;
NimBLECharacteristic*  pMoistureChar   = nullptr;
NimBLECharacteristic*  pBatteryChar    = nullptr;
NimBLECharacteristic*  pNameChar       = nullptr;
NimBLECharacteristic*  pWifiSsidChar   = nullptr;
NimBLECharacteristic*  pWifiPassChar   = nullptr;
NimBLECharacteristic*  pWifiStatusChar = nullptr;

bool                   deviceConnected  = false;
unsigned long          lastReadTime     = 0;
unsigned long          lastLedToggleTime = 0;
bool                   ledState         = false;

// Calibration variables (Loaded from NVS)
Preferences            nvs;
int                    dryValue         = DEFAULT_DRY_VAL;
int                    wetValue         = DEFAULT_WET_VAL;

// WiFi provisioning state
String                 pendingSsid      = "";
String                 pendingPass      = "";
bool                   wifiConnectRequested = false;
uint8_t                currentWifiStatus    = WIFI_STATUS_IDLE;

// ─── Forward Declarations ────────────────────────────────────────────────────
uint8_t readFilteredMoisture(int &outRaw);
uint8_t readBatteryPercent();
void setWifiStatus(uint8_t status);
void attemptWifiConnect(const String& ssid, const String& pass);
void autoConnectSavedWifi();
void loadCalibration();
void saveCalibration(int dry, int wet);
void handleSerialCommands();

// ─── Calibration NVS Helper ──────────────────────────────────────────────────
void loadCalibration() {
    nvs.begin("kisan_cal", true);
    dryValue = nvs.getInt("dry", DEFAULT_DRY_VAL);
    wetValue = nvs.getInt("wet", DEFAULT_WET_VAL);
    nvs.end();

    if (dryValue <= wetValue || dryValue > 4095 || wetValue < 0) {
        dryValue = DEFAULT_DRY_VAL;
        wetValue = DEFAULT_WET_VAL;
    }

    Serial.println("\n[CALIBRATION] Loaded from NVS Flash:");
    Serial.printf("  • Dry Air Value (0%%) : %4d\n", dryValue);
    Serial.printf("  • Water Value (100%%)  : %4d\n", wetValue);
    Serial.println("  (Type 'd' for Dry, 'w' for Wet in Serial Monitor to calibrate anytime)\n");
}

void saveCalibration(int dry, int wet) {
    nvs.begin("kisan_cal", false);
    nvs.putInt("dry", dry);
    nvs.putInt("wet", wet);
    nvs.end();
    dryValue = dry;
    wetValue = wet;
    Serial.printf("\n[CALIBRATION] ✅ Saved to NVS: DRY=%d, WET=%d\n\n", dry, wet);
}

// ─── WiFi Status Helper ──────────────────────────────────────────────────────
void setWifiStatus(uint8_t status) {
    currentWifiStatus = status;
    if (pWifiStatusChar) {
        pWifiStatusChar->setValue(&status, 1);
        if (deviceConnected) {
            pWifiStatusChar->notify();
        }
    }
    const char* statusStr = (status == WIFI_STATUS_IDLE) ? "IDLE" :
                            (status == WIFI_STATUS_CONNECTING) ? "CONNECTING" :
                            (status == WIFI_STATUS_CONNECTED) ? "CONNECTED" : "FAILED";
    Serial.printf("[WIFI] Status → %d (%s)\n", status, statusStr);
}

// ─── WiFi Connect Routine ────────────────────────────────────────────────────
void attemptWifiConnect(const String& ssid, const String& pass) {
    if (ssid.length() == 0) return;

    Serial.printf("[WIFI] Attempting connection to SSID: '%s'...\n", ssid.c_str());
    setWifiStatus(WIFI_STATUS_CONNECTING);

    WiFi.disconnect(true);
    delay(10);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), pass.c_str());

    unsigned long startMs = millis();
    while (WiFi.status() != WL_CONNECTED && (millis() - startMs) < WIFI_CONNECT_TIMEOUT_MS) {
        delay(10);
        digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Fast strobe while connecting
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("[WIFI] ✅ Connected successfully!");
        Serial.printf("[WIFI] IP Address : %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("[WIFI] Signal RSSI: %d dBm\n", WiFi.RSSI());
        setWifiStatus(WIFI_STATUS_CONNECTED);

        nvs.begin("kisan_wifi", false);
        nvs.putString("ssid", ssid);
        nvs.putString("pass", pass);
        nvs.end();
        Serial.println("[WIFI] Saved credentials to permanent NVS storage.\n");

        digitalWrite(LED_PIN, deviceConnected ? HIGH : LOW);
    } else {
        Serial.printf("[WIFI] ❌ Connection failed (reason code: %d)\n", WiFi.status());
        setWifiStatus(WIFI_STATUS_FAILED);
        digitalWrite(LED_PIN, deviceConnected ? HIGH : LOW);
    }
}

// ─── Auto-connect Saved WiFi on Boot ─────────────────────────────────────────
void autoConnectSavedWifi() {
    nvs.begin("kisan_wifi", true);
    String savedSsid = nvs.getString("ssid", "");
    String savedPass = nvs.getString("pass", "");
    nvs.end();

    if (savedSsid.length() > 0) {
        Serial.printf("[WIFI] Found saved WiFi '%s' in memory. Connecting in background...\n", savedSsid.c_str());
        WiFi.mode(WIFI_STA);
        WiFi.begin(savedSsid.c_str(), savedPass.c_str());
        
        unsigned long startMs = millis();
        while (WiFi.status() != WL_CONNECTED && (millis() - startMs) < 5000) {
            delay(10);
            Serial.print(".");
        }
        Serial.println();

        if (WiFi.status() == WL_CONNECTED) {
            Serial.printf("[WIFI] ✅ Auto-connected! IP: %s\n\n", WiFi.localIP().toString().c_str());
            currentWifiStatus = WIFI_STATUS_CONNECTED;
        } else {
            Serial.println("[WIFI] Auto-connect timed out. Waiting for BLE provisioning.\n");
            currentWifiStatus = WIFI_STATUS_IDLE;
        }
    } else {
        Serial.println("[WIFI] No saved WiFi credentials. Device is ready for BLE provisioning.\n");
        currentWifiStatus = WIFI_STATUS_IDLE;
    }
}

// ─── BLE Callbacks (Compatible with NimBLE v1.x and v2.x) ─────────────────────
#if defined(NIMBLE_CPP_VERSION) || defined(NIMBLE_VERSION_MAJOR)
// NimBLE v2.x signature
class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override {
        deviceConnected = true;
        digitalWrite(LED_PIN, HIGH);
        Serial.println("\n[BLE] 🟢 App connected via Web Bluetooth!");
    }

    void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override {
        deviceConnected = false;
        digitalWrite(LED_PIN, LOW);
        Serial.println("\n[BLE] 🟠 App disconnected. Restarting Pairing Mode (Advertising)...");
        NimBLEDevice::startAdvertising();
    }
};

class WifiSsidCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& connInfo) override {
        pendingSsid = pChar->getValue().c_str();
        Serial.printf("[BLE-PROV] Received WiFi SSID: '%s'\n", pendingSsid.c_str());
    }
};

class WifiPassCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pChar, NimBLEConnInfo& connInfo) override {
        pendingPass = pChar->getValue().c_str();
        Serial.printf("[BLE-PROV] Received WiFi Password (%d chars). Starting connection...\n", pendingPass.length());
        if (pendingSsid.length() > 0) {
            wifiConnectRequested = true;
        }
    }
};
#else
// NimBLE v1.x fallback signature
class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer) {
        deviceConnected = true;
        digitalWrite(LED_PIN, HIGH);
        Serial.println("\n[BLE] 🟢 App connected via Web Bluetooth!");
    }

    void onDisconnect(NimBLEServer* pServer) {
        deviceConnected = false;
        digitalWrite(LED_PIN, LOW);
        Serial.println("\n[BLE] 🟠 App disconnected. Restarting Pairing Mode (Advertising)...");
        NimBLEDevice::startAdvertising();
    }
};

class WifiSsidCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pChar) {
        pendingSsid = pChar->getValue().c_str();
        Serial.printf("[BLE-PROV] Received WiFi SSID: '%s'\n", pendingSsid.c_str());
    }
};

class WifiPassCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pChar) {
        pendingPass = pChar->getValue().c_str();
        Serial.printf("[BLE-PROV] Received WiFi Password (%d chars). Starting connection...\n", pendingPass.length());
        if (pendingSsid.length() > 0) {
            wifiConnectRequested = true;
        }
    }
};
#endif

// ─── Accurate Soil Moisture Filtering (Trimmed Mean) ─────────────────────────
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
        while (j >= 0 && buffer[j] > key) {
            buffer[j + 1] = buffer[j];
            j--;
        }
        buffer[j + 1] = key;
    }

    // Trimmed mean: sum middle 20 samples (index 5 to 24)
    long sum = 0;
    const int TRIM = 5;
    for (int i = TRIM; i < SAMPLES - TRIM; i++) {
        sum += buffer[i];
    }
    outRaw = sum / (SAMPLES - (2 * TRIM));

    int percent = map(outRaw, dryValue, wetValue, 0, 100);
    percent = constrain(percent, 0, 100);

    return (uint8_t)percent;
}

// ─── Battery Level Estimation (%) ────────────────────────────────────────────
uint8_t readBatteryPercent() {
    int raw = analogRead(BATTERY_PIN);
    float pinVoltage = (raw / 4095.0f) * 3.3f;
    float batteryVoltage = pinVoltage * 2.0f;

    int percent = (int)((batteryVoltage - 3.2f) / (4.2f - 3.2f) * 100.0f);
    percent = constrain(percent, 0, 100);
    return (uint8_t)percent;
}

// ─── Interactive Serial Monitor Calibration Console ──────────────────────────
void handleSerialCommands() {
    if (!Serial.available()) return;
    char cmd = Serial.read();

    while (Serial.available()) {
        char next = Serial.peek();
        if (next == '\n' || next == '\r' || next == ' ') Serial.read();
        else break;
    }

    int currentRaw = 0;
    readFilteredMoisture(currentRaw);

    if (cmd == 'd' || cmd == 'D') {
        saveCalibration(currentRaw, wetValue);
        Serial.printf("[CALIBRATION] >> Set DRY Air (0%%) to: %d ADC\n", currentRaw);
    } 
    else if (cmd == 'w' || cmd == 'W') {
        saveCalibration(dryValue, currentRaw);
        Serial.printf("[CALIBRATION] >> Set WET Water (100%%) to: %d ADC\n", currentRaw);
    } 
    else if (cmd == 'c' || cmd == 'C') {
        Serial.println("\n╔════════════════════════════════════════════╗");
        Serial.println("║        🌾 KisanSensor Calibration          ║");
        Serial.println("╠════════════════════════════════════════════╣");
        Serial.printf ("║  Current Raw ADC : %4d                   ║\n", currentRaw);
        Serial.printf ("║  Calibrated DRY  : %4d (0%%)               ║\n", dryValue);
        Serial.printf ("║  Calibrated WET  : %4d (100%%)             ║\n", wetValue);
        Serial.printf ("║  Moisture Output : %3d%%                   ║\n", map(constrain(currentRaw, min(dryValue, wetValue), max(dryValue, wetValue)), dryValue, wetValue, 0, 100));
        Serial.println("╚════════════════════════════════════════════╝\n");
    }
    else if (cmd == 'r' || cmd == 'R') {
        saveCalibration(DEFAULT_DRY_VAL, DEFAULT_WET_VAL);
        Serial.println("[CALIBRATION] >> Reset calibration to factory defaults!\n");
    }
}

// ─── Setup ───────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n*************************************************************");
    Serial.println("    🌾 KisanSahayak Smart Agriculture IoT Soil Sensor       ");
    Serial.println("    📡 Dual Mode: Web Bluetooth (BLE) + WiFi Provisioning    ");
    Serial.println("*************************************************************\n");

    analogReadResolution(12);
    analogSetAttenuation(ADC_11db);
    pinMode(MOISTURE_PIN, INPUT);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, HIGH); delay(10);
        digitalWrite(LED_PIN, LOW);  delay(10);
    }

    loadCalibration();
    autoConnectSavedWifi();

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

    pNameChar = pService->createCharacteristic(
        DEVICE_NAME_UUID,
        NIMBLE_PROPERTY::READ
    );
    pNameChar->setValue(DEVICE_NAME);

    pWifiSsidChar = pService->createCharacteristic(
        WIFI_SSID_CHAR_UUID,
        NIMBLE_PROPERTY::WRITE
    );
    pWifiSsidChar->setCallbacks(new WifiSsidCallbacks());

    pWifiPassChar = pService->createCharacteristic(
        WIFI_PASS_CHAR_UUID,
        NIMBLE_PROPERTY::WRITE
    );
    pWifiPassChar->setCallbacks(new WifiPassCallbacks());

    pWifiStatusChar = pService->createCharacteristic(
        WIFI_STATUS_CHAR_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
    );
    pWifiStatusChar->setValue(&currentWifiStatus, 1);

    pService->start();

    NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->enableScanResponse(true);
    pAdvertising->setName(DEVICE_NAME);
    NimBLEDevice::startAdvertising();

    Serial.println("[PAIRING MODE] 🔵 BLE Advertising active as 'KisanSensor'");
    Serial.println("[PAIRING MODE] Blue LED is blinking (waiting for phone/app connection)");
    Serial.println("[PAIRING MODE] Open KisanSahayak Dashboard → Tap Bluetooth(+) to pair.\n");
}

// ─── Loop ────────────────────────────────────────────────────────────────────
void loop() {
    unsigned long currentMillis = millis();

    handleSerialCommands();

    // 2Hz Pairing Mode Blink
    if (!deviceConnected) {
        if (currentMillis - lastLedToggleTime >= 250) {
            lastLedToggleTime = currentMillis;
            ledState = !ledState;
            digitalWrite(LED_PIN, ledState ? HIGH : LOW);
        }
    }

    if (wifiConnectRequested) {
        wifiConnectRequested = false;
        attemptWifiConnect(pendingSsid, pendingPass);
    }

    if (currentMillis - lastReadTime >= READ_INTERVAL_MS) {
        lastReadTime = currentMillis;

        int rawADC = 0;
        uint8_t moisture = readFilteredMoisture(rawADC);
        uint8_t battery  = readBatteryPercent();

        pMoistureChar->setValue(&moisture, 1);
        pBatteryChar->setValue(&battery, 1);

        if (deviceConnected) {
            pMoistureChar->notify();
        }

        float voltage = (rawADC / 4095.0f) * 3.3f;
        Serial.printf("[SENSOR] Raw ADC: %4d (%4.2fV) | Moisture: %3d%% | BLE: %s | WiFi: %s\n",
            rawADC, 
            voltage, 
            moisture,
            deviceConnected ? "CONNECTED" : "PAIRING...",
            (WiFi.status() == WL_CONNECTED) ? WiFi.localIP().toString().c_str() : "DISCONNECTED"
        );
    }

    delay(10);
}
