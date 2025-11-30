# PWA Offline Functionality

## How It Works

The app now has **automatic offline detection** and graceful handling:

### Service Worker (Automatic)
The service worker (`service-worker.js`) automatically:
1. **Caches resources** on first visit (HTML, CSS, JS, fonts, Chart.js)
2. **Intercepts network requests** when you're offline
3. **Serves cached content** instead of showing errors
4. **Updates cache** when you're back online

### Offline Detection (New)
The app now detects when you go offline and shows:
- 📴 **"Offline Mode"** status indicator
- Alert log: "App is OFFLINE. Showing cached data only."
- Charts display last known data
- UI remains fully functional

### Online Detection (New)
When you come back online:
- 🌐 **"Reconnecting..."** status message
- Automatic page reload after 1 second
- WebSocket reconnects to Node-RED
- Real-time data resumes

## Testing Offline Mode

1. **Open the app** (`web/index-nodered.html`)
2. **Wait for it to load** completely
3. **Disconnect internet** (WiFi off or unplug ethernet)
4. **Refresh the page** (F5)
5. **Verify**:
   - Page still loads (from cache)
   - Status shows "Offline Mode"
   - Activity log shows offline message
   - Charts show last data
6. **Reconnect internet**
7. **Verify**:
   - Status shows "Reconnecting..."
   - Page auto-reloads
   - Real-time data resumes

## What Works Offline

✅ **Fully Functional:**
- App UI and layout
- Charts (last known data)
- Agent interface
- Recommendations panel
- All styling and fonts

❌ **Requires Internet:**
- Real-time sensor data (MQTT/WebSocket)
- Actuator control commands
- Node-RED communication

## Browser DevTools Check

**To verify service worker:**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers**
4. Should see: `service-worker.js` (activated and running)
5. Click **Cache Storage**
6. Should see: `wokwi-agent-v1` with cached files
