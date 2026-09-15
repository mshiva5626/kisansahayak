# 🌾 KisanSahayak ESP32 Smart IoT Soil Moisture Sensor

This directory contains the production firmware for standard **ESP32** boards to integrate with the **KisanSahayak** web application.

---

## ⚡ Features

1. **Web Bluetooth (BLE) Streaming**:
   - Uses ultra-lightweight **NimBLE** stack.
   - Real-time soil moisture percentage (0-100%) and battery level notifications.
   - Long-range transmission (+9 dBm power level).

2. **Visual Pairing Mode**:
   - **Blinking LED (2 Hz)**: Device is actively advertising and in **Pairing Mode** (waiting for phone/laptop connection).
   - **Solid Blue LED**: Sensor is successfully paired and actively streaming data.
   - **Fast Strobe**: WiFi connection in progress.

3. **CP Plus-Style WiFi Provisioning**:
   - Insert WiFi SSID & password directly from the KisanSahayak web app over Bluetooth.
   - Connects to 2.4 GHz WiFi network and stores credentials in **NVS Flash**.
   - Auto-reconnects to WiFi on every boot.

4. **High-Precision Sensor Calibration**:
   - **30-sample trimmed-mean filter**: Discards top 5 and bottom 5 outliers to eliminate RF interference spikes from WiFi/BLE transmissions.
   - **Interactive Serial Calibration**: Calibrate dry air (0%) and submerged water (100%) by typing single letters (`'d'` and `'w'`) in the Serial Monitor.
   - **NVS Persistent Storage**: Calibration is saved to Flash memory. No need to re-compile or re-flash!

---

## 🔌 Hardware Wiring

```
Capacitive Soil Moisture Sensor         ESP32 Dev Board
───────────────────────────────         ───────────────
VCC  (Red wire)                 ───►    3.3V  (or VIN / 5V if clone sensor)
GND  (Black wire)               ───►    GND
AOUT (Yellow / Blue wire)       ───►    GPIO 34 (ADC1 Channel 6)

Status Indicator:
Onboard Blue LED                ───►    GPIO 2 (Built-in on ESP32)

Optional Battery Monitor:
100kΩ + 100kΩ divider from LiPo ───►    GPIO 35 (ADC1 Channel 7)
```

> ⚠️ **CRITICAL HARDWARE NOTES**:
> 1. **Always use ADC1 pins (GPIO 32 - 39)**. Never use ADC2 pins (GPIO 0, 2, 4, 12-15, 25-27) for analog sensors because ADC2 is disabled whenever WiFi or BLE is active! GPIO 34 is ADC1 and input-only, making it the ideal choice.
> 2. **Capacitive vs. Resistive**: Always use a capacitive sensor (corrosion-resistant white/black blade). Resistive two-prong sensors corrode within 48 hours in damp soil.
> 3. **Sensor Power**: If your sensor readings don't change between air and water when connected to 3.3V, move VCC to the ESP32 **VIN / 5V** pin (many v1.2 clones have a faulty 3.3V regulator that outputs < 2.5V even on 5V input, safe for ESP32 ADC).

---

## 🛠️ Arduino IDE Setup

1. **Install ESP32 Board Support**:
   - `File` → `Preferences` → `Additional Boards Manager URLs`:
     `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - `Tools` → `Board` → `Boards Manager` → search **esp32** → Install by **Espressif Systems**.

2. **Install NimBLE Library**:
   - `Sketch` → `Include Library` → `Manage Libraries...`
   - Search for **NimBLE-Arduino** by **h2zero** (Install version 1.4.x or later).

3. **Board Settings** (under `Tools` menu):
   - **Board**: `ESP32 Dev Module`
   - **Flash Frequency**: `80MHz`
   - **CPU Frequency**: `240MHz (WiFi/BT)`
   - **Upload Speed**: `115200` or `921600`
   - **Port**: Select your ESP32 COM port.

4. Open [`KisanSensor.ino`](./KisanSensor/KisanSensor.ino) and click **Upload**.

---

## 🎯 1-Minute Sensor Calibration (No Re-flashing Required!)

1. Connect the ESP32 to your computer and open **Serial Monitor** at **115200 baud**.
2. **Step 1 - Dry Air Calibration (0% Moisture)**:
   - Hold the sensor blade dry in the air.
   - Type **`d`** in the Serial Monitor input bar and press **Enter**.
   - Output: `[CALIBRATION] >> Set DRY Air (0%) to: 3250 ADC`
3. **Step 2 - Water Calibration (100% Moisture)**:
   - Dip the sensor blade into a glass of water up to the max line (keep top electronics dry!).
   - Type **`w`** in the Serial Monitor and press **Enter**.
   - Output: `[CALIBRATION] >> Set WET Water (100%) to: 1120 ADC`
4. **Step 3 - Verify**:
   - Type **`c`** to view your saved calibration summary.
   - Calibration is permanently saved to ESP32 Flash and persists across reboots!

---

## 📱 Pairing with KisanSahayak App

1. Power the ESP32 (LED will blink at 2Hz indicating **Pairing Mode**).
2. Open KisanSahayak in **Google Chrome** or **Microsoft Edge** on your phone or PC (Web Bluetooth required).
3. On the Dashboard, click **Pair Sensor** or tap the **Bluetooth (+)** icon in the header.
4. Click **Scan & Pair Sensor** and select **KisanSensor** from the popup.
5. In **Step 3 (WiFi Setup)**, enter your home/farm 2.4 GHz WiFi SSID & password to enable cloud connectivity.
6. Assign the sensor to your farm. The onboard LED will turn solid, and live moisture readings will stream continuously to your dashboard!
