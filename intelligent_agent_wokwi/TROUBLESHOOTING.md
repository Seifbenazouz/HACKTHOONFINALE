# Troubleshooting Guide: Recommendations Not Appearing

## Problem Identified

The web interface is loading correctly, but **Node-RED is not running**. This causes:
- ❌ WebSocket connection failure to `ws://localhost:1880/ws/sensors`
- ❌ No data flowing to the web interface
- ❌ No recommendations appearing
- ❌ No reports being generated (backend needs data from Node-RED)

## Solution Options

### Option 1: Start Node-RED (Recommended if you have it installed)

1. **Start Node-RED**:
   ```powershell
   node-red
   ```

2. **Access Node-RED**: Open http://localhost:1880

3. **Import the flow** from `nodered/flows.json` (if you have one)

4. **Configure the flow** to:
   - Subscribe to MQTT topic: `wokwi/sensors/sayf_project`
   - Forward data to WebSocket endpoint: `/ws/sensors`
   - Forward actuator commands from HTTP endpoint: `/api/actuator`

5. **Deploy the flow** in Node-RED

6. **Test**: Send data using the test script

### Option 2: Direct MQTT Connection (Simpler, No Node-RED needed)

If you don't need Node-RED, I can modify the web interface to connect directly to MQTT. This is simpler but requires a browser-compatible MQTT library.

**Steps**:
1. Modify `app-nodered.js` to use MQTT.js instead of WebSocket
2. Connect directly to the MQTT broker
3. Subscribe to the sensor topic

### Option 3: Use Backend Service with HTTP Polling (Easiest)

Modify the system to have the web interface poll the backend service for latest data instead of using WebSocket.

## Quick Test (Without Node-RED)

To verify the backend and report generation work:

1. **Run the test script** to send 35 messages:
   ```powershell
   python test_mqtt_pub.py
   ```

2. **Check the backend console** - you should see:
   - Data being logged
   - Counter incrementing
   - Report generated after message 30

3. **Check the reports folder** - you should find an HTML report

## Current Status

✅ Web server running on port 8000
✅ Backend service running (Python process active)
✅ Web interface loads correctly
❌ Node-RED not running (WebSocket connection fails)
❌ No data flowing to web interface

## Next Steps

**Choose one of the options above** based on your setup:
- If you have Node-RED installed → Use Option 1
- If you want to simplify → Use Option 2 or 3
- To test backend/reports only → Run the test script

Let me know which option you prefer, and I'll help you implement it!
