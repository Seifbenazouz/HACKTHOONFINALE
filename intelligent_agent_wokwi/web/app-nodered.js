// Configuration
const NODERED_WS = 'ws://localhost:1880/ws/sensors';
const NODERED_API = 'http://localhost:1880/api';

// State
let isAgentRunning = true;
let chartData = {
    labels: [],
    temp: [],
    humidity: [],
    flow: []
};
const MAX_DATA_POINTS = 20;

// DOM Elements
const tempValue = document.getElementById('temp-value');
const humidityValue = document.getElementById('humidity-value');
const flowValue = document.getElementById('flow-value');
const logContainer = document.getElementById('log-container');
const mqttStatus = document.getElementById('mqtt-status');
const mqttStatusText = document.getElementById('mqtt-status-text');
const toggleAgentBtn = document.getElementById('toggle-agent');

// Initialize Charts
const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false }
    },
    scales: {
        x: { display: false },
        y: {
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { color: '#94a3b8' }
        }
    },
    elements: {
        line: { tension: 0.4, borderWidth: 2 },
        point: { radius: 0 }
    }
};

const tempChart = new Chart(document.getElementById('tempChart'), {
    type: 'line',
    data: {
        labels: chartData.labels,
        datasets: [{
            label: 'Temperature',
            data: chartData.temp,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true
        }]
    },
    options: commonChartOptions
});

const humidityChart = new Chart(document.getElementById('humidityChart'), {
    type: 'line',
    data: {
        labels: chartData.labels,
        datasets: [{
            label: 'Humidity',
            data: chartData.humidity,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            fill: true
        }]
    },
    options: commonChartOptions
});

const flowChart = new Chart(document.getElementById('flowChart'), {
    type: 'line',
    data: {
        labels: chartData.labels,
        datasets: [{
            label: 'Water Flow',
            data: chartData.flow,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true
        }]
    },
    options: commonChartOptions
});

// WebSocket Connection to Node-RED
function connectWebSocket() {
    log('system', 'Connecting to Node-RED WebSocket...');
    const ws = new WebSocket(NODERED_WS);

    ws.onopen = () => {
        log('info', 'Connected to Node-RED');
        mqttStatus.classList.remove('disconnected');
        mqttStatus.classList.add('connected');
        mqttStatusText.textContent = 'Connected';
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Data received from Node-RED:', data);
            log('info', `Data received: Temp=${data.temp}°C, Humidity=${data.humidity}%, Flow=${data.flow}L/h`);
            updateDashboard(data);
            if (isAgentRunning) {
                runAgentLogic(data);
            }
        } catch (e) {
            console.error('Error parsing WebSocket data', e);
            log('alert', `Parse Error: ${e.message}`);
        }
    };

    ws.onerror = (error) => {
        log('alert', `WebSocket Error: ${error.message || 'Connection failed'}`);
        mqttStatus.classList.add('disconnected');
        mqttStatus.classList.remove('connected');
        mqttStatusText.textContent = 'Error';
    };

    ws.onclose = () => {
        log('alert', 'WebSocket connection closed');
        mqttStatus.classList.add('disconnected');
        mqttStatus.classList.remove('connected');
        mqttStatusText.textContent = 'Disconnected';
    };
}

// Offline/Online Detection
window.addEventListener('offline', () => {
    log('alert', '📴 App is OFFLINE. Showing cached data only.');
    mqttStatusText.textContent = 'Offline Mode';
    mqttStatus.classList.add('disconnected');
    mqttStatus.classList.remove('connected');
});

window.addEventListener('online', () => {
    log('info', '🌐 App is ONLINE. Reconnecting...');
    mqttStatusText.textContent = 'Reconnecting...';
    setTimeout(() => {
        location.reload();
    }, 1000);
});

// Check initial online status
if (!navigator.onLine) {
    log('alert', '📴 App started in OFFLINE mode. Showing cached data only.');
    mqttStatusText.textContent = 'Offline Mode';
} else {
    connectWebSocket();
}

// Dashboard Updates
function updateDashboard(data) {
    const timestamp = new Date().toLocaleTimeString();

    // Update Values
    tempValue.textContent = `${data.temp.toFixed(1)} °C`;
    humidityValue.textContent = `${data.humidity.toFixed(1)} %`;
    flowValue.textContent = `${data.flow.toFixed(1)} L/h`;

    // Update Charts
    if (chartData.labels.length > MAX_DATA_POINTS) {
        chartData.labels.shift();
        chartData.temp.shift();
        chartData.humidity.shift();
        chartData.flow.shift();
    }

    chartData.labels.push(timestamp);
    chartData.temp.push(data.temp);
    chartData.humidity.push(data.humidity);
    chartData.flow.push(data.flow);

    tempChart.update();
    humidityChart.update();
    flowChart.update();
}

// Agent Logic
let lastAct1State = false;
let lastAct2State = false;

function runAgentLogic(data) {
    const tempThreshold = parseFloat(document.getElementById('temp-threshold').value);
    const tempMinThreshold = parseFloat(document.getElementById('temp-min-threshold').value);
    const humidityMaxThreshold = parseFloat(document.getElementById('humidity-max-threshold').value);
    const humidityMinThreshold = parseFloat(document.getElementById('humidity-min-threshold').value);
    const flowThreshold = parseFloat(document.getElementById('flow-threshold').value);
    const flowMinThreshold = parseFloat(document.getElementById('flow-min-threshold').value);

    const recommendations = [];
    let hasAlert = false;

    // Temperature Analysis
    if (data.temp > tempThreshold) {
        hasAlert = true;
        recommendations.push({
            type: 'critical',
            icon: '🔥',
            title: 'Critical Temperature Alert',
            text: `Temperature at ${data.temp.toFixed(1)}°C exceeds maximum threshold of ${tempThreshold}°C. Immediate actions: (1) Activate cooling system, (2) Check ventilation systems, (3) Reduce heat-generating equipment, (4) Monitor for equipment overheating, (5) Ensure proper airflow.`
        });

        if (!lastAct1State) {
            sendActuatorCommand('ACT1:ON');
            log('action', `[AGENT] High Temp (${data.temp.toFixed(1)}°C) > ${tempThreshold}°C. ACTIVATING LED 1.`);
            lastAct1State = true;
        }
    } else if (data.temp < tempMinThreshold) {
        hasAlert = true;
        recommendations.push({
            type: 'warning',
            icon: '❄️',
            title: 'Low Temperature Warning',
            text: `Temperature at ${data.temp.toFixed(1)}°C is below minimum threshold of ${tempMinThreshold}°C. Recommended actions: (1) Activate heating system, (2) Check insulation, (3) Close windows/doors, (4) Monitor for freezing conditions, (5) Protect sensitive equipment.`
        });
    } else {
        if (lastAct1State) {
            sendActuatorCommand('ACT1:OFF');
            log('info', `[AGENT] Temp normalized (${data.temp.toFixed(1)}°C). Deactivating LED 1.`);
            lastAct1State = false;
        }
    }

    // Humidity Analysis
    if (data.humidity > humidityMaxThreshold) {
        hasAlert = true;
        recommendations.push({
            type: 'warning',
            icon: '💧',
            title: 'High Humidity Warning',
            text: `Humidity at ${data.humidity.toFixed(1)}% exceeds maximum threshold of ${humidityMaxThreshold}%. Recommended actions: (1) Activate dehumidifier, (2) Improve ventilation, (3) Check for water leaks, (4) Monitor for condensation, (5) Prevent mold growth.`
        });
    } else if (data.humidity < humidityMinThreshold) {
        hasAlert = true;
        recommendations.push({
            type: 'info',
            icon: '🌵',
            title: 'Low Humidity Notice',
            text: `Humidity at ${data.humidity.toFixed(1)}% is below minimum threshold of ${humidityMinThreshold}%. Recommended actions: (1) Activate humidifier, (2) Add moisture sources, (3) Reduce ventilation temporarily, (4) Monitor for static electricity, (5) Protect sensitive electronics.`
        });
    }

    // Water Flow Analysis
    if (data.flow > flowThreshold) {
        hasAlert = true;
        recommendations.push({
            type: 'critical',
            icon: '🚰',
            title: 'High Water Flow Alert',
            text: `Water flow at ${data.flow.toFixed(1)} L/h exceeds maximum threshold of ${flowThreshold} L/h. Immediate actions: (1) Check for leaks in the system, (2) Inspect all valves and connections, (3) Verify pump settings, (4) Monitor water pressure, (5) Shut off if necessary.`
        });

        if (!lastAct2State) {
            sendActuatorCommand('ACT2:ON');
            log('action', `[AGENT] High Flow (${data.flow.toFixed(1)} L/h) > ${flowThreshold} L/h. ACTIVATING LED 2.`);
            lastAct2State = true;
        }
    } else if (data.flow < flowMinThreshold) {
        hasAlert = true;
        recommendations.push({
            type: 'warning',
            icon: '🔻',
            title: 'Low Water Flow Warning',
            text: `Water flow at ${data.flow.toFixed(1)} L/h is below minimum threshold of ${flowMinThreshold} L/h. Recommended actions: (1) Check for blockages, (2) Verify pump operation, (3) Inspect inlet filters, (4) Check water supply, (5) Monitor system pressure.`
        });
    } else {
        if (lastAct2State) {
            sendActuatorCommand('ACT2:OFF');
            log('info', `[AGENT] Flow normalized (${data.flow.toFixed(1)} L/h). Deactivating LED 2.`);
            lastAct2State = false;
        }
    }

    // Update recommendations display
    updateRecommendations(recommendations, hasAlert, data);
}

function updateRecommendations(recommendations, hasAlert, data) {
    const container = document.getElementById('recommendations-container');
    const badge = document.getElementById('agent-status-badge');

    // Safety check if elements exist
    if (!container) return;

    container.innerHTML = '';

    if (!hasAlert || recommendations.length === 0) {
        if (badge) {
            badge.className = 'status-badge';
            badge.style.color = '#22c55e';
            badge.style.background = 'rgba(34, 197, 94, 0.1)';
            badge.textContent = 'All Systems Normal';
        }

        const currentValues = data ? `Temp: ${data.temp.toFixed(1)}°C | Humidity: ${data.humidity.toFixed(1)}% | Flow: ${data.flow.toFixed(1)} L/h` : 'Monitoring...';

        container.innerHTML = `
            <div class="recommendation-item normal">
                <div class="rec-icon-wrapper">
                    <span class="recommendation-icon">✓</span>
                </div>
                <div class="rec-content">
                    <h3>System Normal</h3>
                    <p>All sensors are within optimal ranges. ${currentValues}</p>
                </div>
            </div>
        `;
    } else {
        if (badge) {
            const criticalCount = recommendations.filter(r => r.type === 'critical').length;
            if (criticalCount > 0) {
                badge.className = 'status-badge';
                badge.style.color = '#ef4444';
                badge.style.background = 'rgba(239, 68, 68, 0.1)';
                badge.textContent = `${criticalCount} Critical Alert${criticalCount > 1 ? 's' : ''}`;
            } else {
                badge.className = 'status-badge';
                badge.style.color = '#f59e0b';
                badge.style.background = 'rgba(245, 158, 11, 0.1)';
                badge.textContent = `${recommendations.length} Warning${recommendations.length > 1 ? 's' : ''}`;
            }
        }

        recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = `recommendation-item ${rec.type}`;

            item.innerHTML = `
                <div class="rec-icon-wrapper">
                    <span class="recommendation-icon">${rec.icon}</span>
                </div>
                <div class="rec-content">
                    <h3>${rec.title}</h3>
                    <p>${rec.text}</p>
                </div>
            `;
            container.appendChild(item);
        });
    }
}

// Send Actuator Command via HTTP to Node-RED
function sendActuatorCommand(command) {
    fetch(`${NODERED_API}/actuator`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: command })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Actuator command sent:', data);
        })
        .catch(error => {
            console.error('Error sending actuator command:', error);
            log('alert', `Failed to send command: ${error.message}`);
        });
}

// Helper Functions
function log(type, message) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// UI Controls
toggleAgentBtn.addEventListener('click', () => {
    isAgentRunning = !isAgentRunning;
    if (isAgentRunning) {
        toggleAgentBtn.textContent = 'Stop Agent';
        toggleAgentBtn.classList.remove('danger');
        toggleAgentBtn.classList.add('primary');
        log('system', 'Agent resumed.');
    } else {
        toggleAgentBtn.textContent = 'Start Agent';
        toggleAgentBtn.classList.remove('primary');
        toggleAgentBtn.classList.add('danger');
        log('system', 'Agent paused.');
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then((registration) => {
                console.log('ServiceWorker registered:', registration.scope);
            })
            .catch((error) => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}