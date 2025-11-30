# Node-RED Setup Guide

## Installation

### Windows
```powershell
# Install Node.js first (if not already installed)
# Download from: https://nodejs.org/

# Install Node-RED globally
npm install -g --unsafe-perm node-red
```

### Start Node-RED
```powershell
node-red
```

Node-RED will start on `http://localhost:1880`

## Import the Flow

1. Open Node-RED in your browser: `http://localhost:1880`
2. Click the **menu** (☰) in the top-right corner
3. Select **Import**
4. Click **select a file to import**
5. Navigate to `nodered/flows.json` and select it
6. Click **Import**
7. Click **Deploy** (top-right red button)

## Flow Overview

The imported flow includes:

### MQTT Nodes
- **MQTT In**: Subscribes to `wokwi/sensors/sayf_project`
- **MQTT Out**: Publishes to `wokwi/actuators/sayf_project`

### Processing
- **Process Sensor Data**: Validates and adds timestamp to incoming data
- **Store Latest**: Keeps the most recent sensor reading in memory

### Web Interface
- **WebSocket Server** (`/ws/sensors`): Real-time data push to web clients
- **HTTP GET** (`/api/sensors`): REST endpoint to get latest data
- **HTTP POST** (`/api/actuator`): REST endpoint to send actuator commands

### Debug
- **Debug Node**: Shows incoming sensor data in the Debug panel

## Testing

1. **Start Wokwi Simulation** (see main README.md)
2. **Start Node-RED**: `node-red`
3. **Check Debug Panel**: You should see sensor data appearing
4. **Open Web Dashboard**: `web/index-nodered.html`
5. **Verify Connection**: Status should show "Connected"
6. **Watch Data Flow**: Charts should update in real-time

## Troubleshooting

### No data in Node-RED?
- Check that Wokwi is running and connected to MQTT
- Verify the MQTT broker is `test.mosquitto.org`
- Check the Debug panel in Node-RED for errors

### Web dashboard not connecting?
- Ensure Node-RED is running on `localhost:1880`
- Check browser console for WebSocket errors
- Verify CORS is enabled (it's configured in the flow)

### Actuators not responding?
- Check the Debug panel for POST requests
- Verify the MQTT Out node is publishing correctly
- Check Wokwi Serial Monitor for incoming commands
