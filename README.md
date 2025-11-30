# Intelligent Agent with Wokwi & Web Dashboard

This project implements an intelligent agent that monitors sensors from a Wokwi simulation (ESP32) and controls actuators based on defined logic. It features a modern Web Dashboard with real-time charts and an integrated agent.

## Components

1.  **Wokwi Simulation**:
    *   **ESP32**: Microcontroller with WiFi & MQTT.
    *   **Sensors**: DHT22 (Temp/Humidity), Potentiometer (Water Flow).
    *   **Actuators**: LEDs (Red/Blue).
    *   **Communication**: Publishes to `wokwi/sensors`, Subscribes to `wokwi/actuators`.

2.  **Web Dashboard**:
    *   **Real-time Charts**: Visualizes Temperature, Humidity, and Water Flow.
    *   **Intelligent Agent**: JavaScript-based agent running in the browser.
    *   **Control**: Automatically toggles LEDs based on configurable thresholds.
    *   **Logs**: Displays detailed agent actions (e.g., "High Temp > 30°C. ACTIVATING LED 1").

## Setup & Running

### 1. Wokwi Simulation

**Using Wokwi Web Simulator (Recommended):**
1.  Go to [Wokwi.com](https://wokwi.com/projects/new/micropython-esp32)
2.  Copy the content of `main.py` into the code editor
3.  Copy the content of `diagram.json` into the diagram.json tab
4.  Click **Start Simulation**
5.  Watch the Serial Monitor for:
    *   "WiFi connected"
    *   "MQTT connected and subscribed"
    *   JSON messages like `{"temp": 24, "humidity": 50, "flow": 10}`

**Using Wokwi VS Code Extension:**
1.  Open the project folder in VS Code with Wokwi extension installed
2.  Open `diagram.json`
3.  Start the simulation (Wokwi will automatically use `main.py`)

### 2. Web Dashboard

**Option A: Direct MQTT Connection**
1.  Navigate to the `web` folder.
2.  Open `index.html` in your browser.
3.  The dashboard will automatically connect to the same public MQTT broker.
4.  Monitor: You should see the charts updating in real-time as the simulation runs.

**Option B: Via Node-RED (Recommended)**
1.  **Install Node-RED**: `npm install -g --unsafe-perm node-red`
2.  **Start Node-RED**: `node-red` (runs on `http://localhost:1880`)
3.  **Import Flow**: 
    *   Open `http://localhost:1880`
    *   Menu → Import → Select `nodered/flows.json`
    *   Click Deploy
4.  **Open Dashboard**: Open `web/index-nodered.html` in your browser
5.  **Verify**: Status should show "Connected", charts should update

See [nodered/README.md](file:///C:/Users/SAYF/.gemini/antigravity/scratch/intelligent_agent_wokwi/nodered/README.md) for detailed Node-RED setup.

### 3. Agent Configuration
    *   Adjust the **Thresholds** in the UI.
    *   Change sensor values in Wokwi (click on DHT22 or Potentiometer).
    *   Watch the **Activity Log** and the LEDs in Wokwi.

## Architecture
*   **Protocol**: MQTT (Message Queuing Telemetry Transport).
*   **Broker**: `test.mosquitto.org` (Public).
*   **Topics**:
    *   `wokwi/sensors`: JSON data from ESP32.
    *   `wokwi/actuators`: Commands from Agent (`ACT1:ON`, etc.).

## Troubleshooting
*   **No Data?**: Ensure Wokwi is running and connected to WiFi. Check the Serial Monitor.
*   **Firewall**: Ensure your network allows MQTT traffic (Port 1883/8081).
*   **Broker Issues**: If `test.mosquitto.org` is down, you can edit `sketch.ino` and `web/app.js` to use a different broker or a local Mosquitto instance.

