// Configuration
const MQTT_BROKER = 'wss://test.mosquitto.org:8081'; // WebSocket port for browser
const TOPIC_SENSORS = 'wokwi/sensors/sayf_project';
const TOPIC_ACTUATORS = 'wokwi/actuators/sayf_project';

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
const tempThresholdInput = document.getElementById('temp-threshold');
const flowThresholdInput = document.getElementById('flow-threshold');

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

// MQTT Connection
log('system', 'Connecting to MQTT Broker...');
const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
    log('info', 'Connected to MQTT Broker');
    mqttStatus.classList.remove('disconnected');
    mqttStatus.classList.add('connected');
    mqttStatusText.textContent = 'Connected';

    client.subscribe(TOPIC_SENSORS, (err) => {
        if (!err) {
            log('info', `Subscribed to ${TOPIC_SENSORS}`);
        }
    });
});

client.on('message', (topic, message) => {
    console.log('MQTT Message received on topic:', topic);
    console.log('Raw message:', message.toString());

    if (topic === TOPIC_SENSORS) {
        try {
            const data = JSON.parse(message.toString());
            console.log('Parsed data:', data);
            log('info', `Data received: Temp=${data.temp}°C, Humidity=${data.humidity}%, Flow=${data.flow}L/h`);
            updateDashboard(data);
            if (isAgentRunning) {
                runAgentLogic(data);
            }
        } catch (e) {
            console.error('Error parsing JSON', e);
            log('alert', `JSON Parse Error: ${e.message}`);
        }
    }
});

client.on('error', (err) => {
    log('alert', `MQTT Error: ${err.message}`);
    mqttStatus.classList.add('disconnected');
    mqttStatus.classList.remove('connected');
    mqttStatusText.textContent = 'Error';
});

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
    const tempThreshold = parseFloat(tempThresholdInput.value);
    const flowThreshold = parseFloat(flowThresholdInput.value);

    // Actuator 1 (Temperature)
    if (data.temp > tempThreshold) {
        if (!lastAct1State) {
            client.publish(TOPIC_ACTUATORS, 'ACT1:ON');
            log('action', `[AGENT] High Temp (${data.temp}°C) > ${tempThreshold}°C. ACTIVATING LED 1.`);
            lastAct1State = true;
        }
    } else {
        if (lastAct1State) {
            client.publish(TOPIC_ACTUATORS, 'ACT1:OFF');
            log('info', `[AGENT] Temp normalized. Deactivating LED 1.`);
            lastAct1State = false;
        }
    }

    // Actuator 2 (Flow)
    if (data.flow > flowThreshold) {
        if (!lastAct2State) {
            client.publish(TOPIC_ACTUATORS, 'ACT2:ON');
            log('action', `[AGENT] High Flow (${data.flow} L/h) > ${flowThreshold} L/h. ACTIVATING LED 2.`);
            lastAct2State = true;
        }
    } else {
        if (lastAct2State) {
            client.publish(TOPIC_ACTUATORS, 'ACT2:OFF');
            log('info', `[AGENT] Flow normalized. Deactivating LED 2.`);
            lastAct2State = false;
        }
    }
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
