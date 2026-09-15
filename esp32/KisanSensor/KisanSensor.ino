/*
 * ==============================================================================
 *  KisanSahayak - ESP32 Smart Agriculture IoT Soil Moisture Sensor
 * ==============================================================================
 *  Description:
 *    Streams real-time soil moisture (0-100%) and battery level over Bluetooth Low
 *    Energy (BLE) to the KisanSahayak web app via Web Bluetooth API.
 *    Also supports WiFi provisioning over BLE — the app sends WiFi SSID & password
 *    via writable BLE characteristics and the ESP32 connects to WiFi and persists
 *    credentials in NVS (Non-Volatile Storage) for automatic reconnect on reboot.
 * 
 *  Required Library (Install via Arduino IDE Library Manager):
 *    - "NimBLE-Arduino" by h2zero (v1.4.x or higher)
 * 
 *  Board: "ESP32 Dev Module" (or any standard ESP32 board)
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
#define LED_PIN             2    // Onboard Blue LED (indicates BLE connection)
#define BATTERY_PIN        35    // Optional ADC for battery voltage divider

// ─── Sensor Calibration Values ───────────────────────────────────────────────
// Step 1: Open Serial Monitor at 115200 baud.
// Step 2: Read raw ADC in dry air → set DRY_VALUE.
// Step 3: Read raw ADC dipped in water → set WET_VALUE.
#define DRY_VALUE        3500    // Raw ADC reading in dry air (0% moisture)
#define WET_VALUE         900    // Raw ADC reading in water (100% moisture)

// ─── Settings ────────────────────────────────────────────────────────────────
#define READ_INTERVAL_MS 2000    // Read & stream interval (2 seconds)
#define WIFI_CONNECT_TIMEOUT_MS 15000  // 15 second WiFi connection timeout

// ─── Global State ────────────────────────────────────────────────────────────
NimBLEServer*          pServer         = nullptr;
NimBLECharacteristic*  pMoistureChar   = nullptr;
NimBLECharacteristic*  pBatteryChar    = nullptr;
NimBLECharacteristic*  pNameChar       = nullptr;
NimBLECharacteristic*  pWifiSsidChar   = nullptr;
NimBLECharacteristic*  pWifiPassChar   = nullptr;
NimBLECharacteristic*  pWifiStatusChar = nullptr;
bool                   deviceConnected = false;
unsigned long          lastReadTime    = 0;

// WiFi provisioning state
Preferences            preferences;
String                 pendingSsid     = "";
String                 pendingPass     = "";
bool                   wifiConnectRequested = false;
uint8_t                currentWifiStatus    = WIFI_STATUS_IDLE;

// ─── WiFi Helper: Update status and notify app ──────────────────────────────
void setWifiStatus(uint8_t status) {
    currentWifiStatus = status;
    pWifiStatusChar->setValue(&status, 1);
    if (deviceConnected) {
        pWifiStatusChar->notify();
    }
    Serial.printf("[WIFI] Status changed → %d (%s)\n", status,
        status == 0 ? "IDLE" :
        status == 1 ? "CONNECTING" :
        status == 2 ? "CONNECTED" : "FAILED");
}

// ─── WiFi Helper: Attempt connection with timeout ───────────────────────────
void attemptWifiConnect(const String& ssid, const String& pass) {
    Serial.printf("[WIFI] Connecting to SSID: '%s'...\n", ssid.c_str());
    setWifiStatus(WIFI_STATUS_CONNECTING);

    WiFi.disconnect(true);
    delay(100);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), pass.c_str());

    unsigned long startMs = millis();
    while (WiFi.status() != WL_CONNECTED && (millis() - startMs) < WIFI_CONNECT_TIMEOUT_MS) {
        delay(250);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("[WIFI] ✅ Connected! IP: %s\n", WiFi.localIP().toString().c_str());
        setWifiStatus(WIFI_STATUS_CONNECTED);

        // Persist credentials to NVS for auto-reconnect on reboot
        preferences.begin("wifi", false);
        preferences.putString("ssid", ssid);
        preferences.putString("pass", pass);
        preferences.end();
        Serial.println("[WIFI] Credentials saved to NVS.");
    } else {
        Serial.printf("[WIFI] ❌ Connection failed (status: %d)\n", WiFi.status());
        setWifiStatus(WIFI_STATUS_FAILED);
    }
}

// ─── WiFi Helper: Load saved credentials and auto-connect on boot ───────────
void autoConnectSavedWifi() {
    preferences.begin("wifi", true); // read-only
    String savedSsid = preferences.getString("ssid", "");
    String savedPass = preferences.getString("pass", "");
    preferences.end();

    if (savedSsid.length() > 0) {
        Serial.printf("[WIFI] Found saved SSID: '%s'. Auto-connecting...\n", savedSsid.c_str());
        attemptWifiConnect(savedSsid, savedPass);
    } else {
        Serial.println("[WIFI] No saved WiFi credentials. Waiting for provisioning via BLE.");
    }
}

// ─── BLE Connection Callbacks ────────────────────────────────────────────────
class ServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pS) override {
        deviceConnected = true;
        digitalWrite(LED_PIN, HIGH);  // Solid LED when app connects
        Serial.println("\n[BLE] ✅ Smartphone/Browser paired and connected!");
    }

    void onDisconnect(NimBLEServer* pS) override {
        deviceConnected = false;
        digitalWrite(LED_PIN, LOW);   // LED off when disconnected
        Serial.println("\n[BLE] ⚠️ Client disconnected. Restarting BLE advertising...");
        NimBLEDevice::startAdvertising();
    }
};

// ─── BLE Write Callbacks for WiFi Provisioning ──────────────────────────────
class WifiSsidCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pChar) override {
        pendingSsid = pChar->getValue().c_str();
        Serial.printf("[BLE] Received WiFi SSID: '%s'\n", pendingSsid.c_str());
    }
};

class WifiPassCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pChar) override {
        pendingPass = pChar->getValue().c_str();
        Serial.printf("[BLE] Received WiFi Password (length: %d)\n", pendingPass.length());
        // When password is written, trigger WiFi connection
        if (pendingSsid.length() > 0) {
            wifiConnectRequested = true;
        }
    }
};

// ─── Read Filtered Soil Moisture (%) ─────────────────────────────────────────
uint8_t readMoisturePercent() {
    long rawSum = 0;
    const int numSamples = 10;
    
    // Multi-sample smoothing to eliminate analog noise
    for (int i = 0; i < numSamples; i++) {
        rawSum += analogRead(MOISTURE_PIN);
        delay(5);
    }
    int rawAvg = rawSum / numSamples;

    // Map calibrated dry/wet ADC to percentage
    int percent = map(rawAvg, DRY_VALUE, WET_VALUE, 0, 100);
    percent = constrain(percent, 0, 100);

    Serial.printf("[SENSOR] Raw ADC: %4d | Moisture: %3d%%\n", rawAvg, percent);
    return (uint8_t)percent;
}

// ─── Read Battery Level (%) ──────────────────────────────────────────────────
uint8_t readBatteryPercent() {
    // Optional: Voltage divider (two 100k resistors between LiPo + and GND)
    int raw = analogRead(BATTERY_PIN);
    float pinVoltage = (raw / 4095.0f) * 3.3f;
    float batteryVoltage = pinVoltage * 2.0f; // Multiplied by divider factor

    // Estimate 3.2V (empty) to 4.2V (full LiPo)
    int percent = (int)((batteryVoltage - 3.2f) / (4.2f - 3.2f) * 100.0f);
    percent = constrain(percent, 0, 100);
    return (uint8_t)percent;
}

// ─── Setup ───────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n=============================================");
    Serial.println("   🌾 KisanSahayak ESP32 IoT Soil Sensor     ");
    Serial.println("   📡 BLE + WiFi Provisioning Enabled         ");
    Serial.println("=============================================");

    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    pinMode(MOISTURE_PIN, INPUT);

    // Initial LED Blink sequence
    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, HIGH); delay(120);
        digitalWrite(LED_PIN, LOW);  delay(120);
    }

    // Try auto-connecting to saved WiFi first (non-blocking to BLE init)
    autoConnectSavedWifi();

    // 1. Initialize NimBLE
    NimBLEDevice::init(DEVICE_NAME);
    NimBLEDevice::setPower(ESP_PWR_LVL_P9); // Maximum +9dBm transmission range

    // 2. Create Server & Hook Callbacks
    pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(new ServerCallbacks());

    // 3. Create Custom KisanSahayak Service
    NimBLEService* pService = pServer->createService(SERVICE_UUID);

    // Characteristic: Moisture (Read + Notify)
    pMoistureChar = pService->createCharacteristic(
        MOISTURE_CHAR_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
    );

    // Characteristic: Battery (Read)
    pBatteryChar = pService->createCharacteristic(
        BATTERY_CHAR_UUID,
        NIMBLE_PROPERTY::READ
    );

    // Characteristic: Device Name
    pNameChar = pService->createCharacteristic(
        DEVICE_NAME_UUID,
        NIMBLE_PROPERTY::READ
    );
    pNameChar->setValue(DEVICE_NAME);

    // Characteristic: WiFi SSID (Write — app sends SSID here)
    pWifiSsidChar = pService->createCharacteristic(
        WIFI_SSID_CHAR_UUID,
        NIMBLE_PROPERTY::WRITE
    );
    pWifiSsidChar->setCallbacks(new WifiSsidCallbacks());

    // Characteristic: WiFi Password (Write — app sends password here)
    pWifiPassChar = pService->createCharacteristic(
        WIFI_PASS_CHAR_UUID,
        NIMBLE_PROPERTY::WRITE
    );
    pWifiPassChar->setCallbacks(new WifiPassCallbacks());

    // Characteristic: WiFi Status (Read + Notify — ESP32 reports status to app)
    pWifiStatusChar = pService->createCharacteristic(
        WIFI_STATUS_CHAR_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
    );
    uint8_t initStatus = (WiFi.status() == WL_CONNECTED) ? WIFI_STATUS_CONNECTED : WIFI_STATUS_IDLE;
    pWifiStatusChar->setValue(&initStatus, 1);

    // 4. Start Service
    pService->start();

    // 5. Start Advertising
    NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setName(DEVICE_NAME);
    NimBLEDevice::startAdvertising();

    Serial.println("[INIT] BLE advertising started successfully.");
    Serial.printf("[INIT] Broadcast Name: '%s'\n", DEVICE_NAME);
    Serial.println("[INIT] Ready to pair in KisanSahayak Dashboard / IoT Pairing screen.\n");
}

// ─── Loop ────────────────────────────────────────────────────────────────────
void loop() {
    unsigned long currentMillis = millis();

    // Handle WiFi connection request from BLE write
    if (wifiConnectRequested) {
        wifiConnectRequested = false;
        attemptWifiConnect(pendingSsid, pendingPass);
    }

    if (currentMillis - lastReadTime >= READ_INTERVAL_MS) {
        lastReadTime = currentMillis;

        uint8_t moisture = readMoisturePercent();
        uint8_t battery  = readBatteryPercent();

        // Update BLE characteristic values
        pMoistureChar->setValue(&moisture, 1);
        pBatteryChar->setValue(&battery, 1);

        // Push real-time notification to web browser if connected
        if (deviceConnected) {
            pMoistureChar->notify();
        }
    }

    delay(10); // Yield to FreeRTOS scheduler
}
