# KisanSahayak ESP32 IoT Soil Moisture Sensor

This folder contains the complete Arduino firmware to turn any standard **ESP32** board into a **KisanSensor** smart soil moisture sensor that pairs directly with the KisanSahayak web app over **Web Bluetooth (BLE)**.

---

## 1. Hardware Requirements

| Component | Recommended Model | Approx Cost |
|---|---|---|
| **Microcontroller** | ESP32 Dev Module (ESP-WROOM-32, 30 or 38 pin) | ~₹250 - ₹350 |
| **Soil Sensor** | Capacitive Soil Moisture Sensor v1.2 or v2.0 | ~₹80 - ₹120 |
| **Power Source** | Micro-USB / USB-C 5V power adapter or 3.7V Li-ion battery | ~₹100 |
| **Jumper Wires** | Female-to-Female jumper wires (3 wires) | ~₹20 |

> ⚠️ **Important**: Use a **Capacitive** soil moisture sensor (corrosion resistant), not the cheap resistive two-pronged probe sensors which corrode in moist soil within days.

---

## 2. Wiring Diagram

```
Capacitive Soil Sensor          ESP32 Pin
─────────────────────          ─────────
VCC  (Red wire)         ───►    3.3V
GND  (Black wire)       ───►    GND
AOUT (Yellow/Blue wire) ───►    GPIO 34 (ADC1 Channel 6)
```

- **LED indicator**: Built-in Blue LED on **GPIO 2** automatically turns ON when the web app connects, and blinks on boot.

---

## 3. Arduino IDE Setup

1. **Install ESP32 Board Support** in Arduino IDE:
   - Go to `File` → `Preferences` → `Additional Boards Manager URLs`.
   - Add: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Go to `Tools` → `Board` → `Boards Manager`, search for **esp32**, and click **Install** (by Espressif Systems).

2. **Install Required BLE Library**:
   - Go to `Sketch` → `Include Library` → `Manage Libraries...`
   - Search for **NimBLE-Arduino** by **h2zero**
   - Click **Install** (Version 1.4.x or later).

3. **Board Settings** (under `Tools` menu):
   - **Board**: `ESP32 Dev Module`
   - **Upload Speed**: `115200`
   - **CPU Frequency**: `240MHz (WiFi/BT)`
   - **Flash Frequency**: `80MHz`
   - **Port**: Select your ESP32 COM port.

---

## 4. Calibration

Different sensors and soils vary. Calibrate once before deployment:

1. Connect the ESP32 to your PC and open **Serial Monitor** at `115200` baud.
2. **Dry Air Test**: Keep the sensor in open dry air. Note the printed `Raw ADC` number (usually ~`3400 - 3600`).
3. **Water Test**: Dip the white sensor tip into a glass of water (do not submerge the top circuit components!). Note the `Raw ADC` number (usually ~`800 - 1200`).
4. Update lines 29-30 in [KisanSensor.ino](file:///c:/Users/mshiv/Downloads/take%202/esp32/KisanSensor/KisanSensor.ino):
   ```cpp
   #define DRY_VALUE 3500 // Your air reading
   #define WET_VALUE 900  // Your water reading
   ```
5. Re-upload the sketch.

---

## 5. Pairing with the App

1. Power on the ESP32 (LED blinks 3 times on boot).
2. Open KisanSahayak in Chrome, Edge, or mobile Chrome:
   - Tap the **Bluetooth (+)** button in the Dashboard top header, or tap **Pair KisanSensor** on the Soil Moisture card.
   - Click **Scan & Pair Sensor**.
   - Select **KisanSensor** in the browser BLE dialog.
   - Assign the sensor to one of your farms.
3. The dashboard gauge will immediately start showing live soil moisture percentages and real-time irrigation advisories!
