import paho.mqtt.client as mqtt
import json
import time
import pandas as pd
import os
import threading
from datetime import datetime


# Configuration
MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
TOPIC_SENSORS = "wokwi/sensors/sayf_project"
EXCEL_FILE = "sensor_data.xlsx"
REPORTS_DIR = "reports"
REPORT_INTERVAL = 30  # Generate report every 30 data captures
TIMER_INTERVAL = 60  # Generate report every 60 seconds

# Global Data Buffer
data_buffer = []
data_counter = 0
last_timer_report = None

# Ensure reports directory exists
if not os.path.exists(REPORTS_DIR):
    os.makedirs(REPORTS_DIR)

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT Broker with result code {rc}")
    client.subscribe(TOPIC_SENSORS)

def on_message(client, userdata, msg):
    global data_counter
    try:
        payload = msg.payload.decode()
        data = json.loads(payload)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Add timestamp to data
        entry = {
            "Timestamp": timestamp,
            "Temperature": data.get("temp", 0),
            "Humidity": data.get("humidity", 0),
            "Water Flow": data.get("flow", 0)
        }
        
        data_buffer.append(entry)
        data_counter += 1
        print(f"Logged: {entry} (Count: {data_counter})")
        
        # Save to Excel immediately
        save_to_excel(entry)
        
        # Generate report every REPORT_INTERVAL captures
        if data_counter >= REPORT_INTERVAL:
            generate_report()
            data_counter = 0
        
    except Exception as e:
        print(f"Error processing message: {e}")

def save_to_excel(entry):
    df_new = pd.DataFrame([entry])
    if os.path.exists(EXCEL_FILE):
        try:
            # Read existing data
            df_existing = pd.read_excel(EXCEL_FILE)
            # Concat new data
            df_combined = pd.concat([df_existing, df_new], ignore_index=True)
            # Write back
            df_combined.to_excel(EXCEL_FILE, index=False)
        except Exception as e:
            print(f"Error saving to Excel: {e}")
    else:
        df_new.to_excel(EXCEL_FILE, index=False)

def generate_report():
    """Generate a comprehensive report from the last 30 data points"""
    if len(data_buffer) < REPORT_INTERVAL:
        print(f"Not enough data for report. Have {len(data_buffer)}, need {REPORT_INTERVAL}")
        return
    
    # Get last 30 data points
    recent_data = data_buffer[-REPORT_INTERVAL:]
    df = pd.DataFrame(recent_data)
    
    # Calculate statistics
    stats = {
        'temperature': {
            'min': df['Temperature'].min(),
            'max': df['Temperature'].max(),
            'avg': df['Temperature'].mean(),
            'std': df['Temperature'].std()
        },
        'humidity': {
            'min': df['Humidity'].min(),
            'max': df['Humidity'].max(),
            'avg': df['Humidity'].mean(),
            'std': df['Humidity'].std()
        },
        'flow': {
            'min': df['Water Flow'].min(),
            'max': df['Water Flow'].max(),
            'avg': df['Water Flow'].mean(),
            'std': df['Water Flow'].std()
        }
    }
    
    # Determine trends
    temp_trend = "Increasing" if df['Temperature'].iloc[-1] > df['Temperature'].iloc[0] else "Decreasing"
    humidity_trend = "Increasing" if df['Humidity'].iloc[-1] > df['Humidity'].iloc[0] else "Decreasing"
    flow_trend = "Increasing" if df['Water Flow'].iloc[-1] > df['Water Flow'].iloc[0] else "Decreasing"
    
    # Generate report filename
    report_filename = os.path.join(REPORTS_DIR, f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html")
    
    # Create HTML report
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Sensor Data Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
            .container {{ max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            h1 {{ color: #333; border-bottom: 3px solid #38bdf8; padding-bottom: 10px; }}
            h2 {{ color: #555; margin-top: 30px; }}
            table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
            th {{ background-color: #38bdf8; color: white; }}
            .metric {{ background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #38bdf8; }}
            .metric-name {{ font-weight: bold; color: #555; }}
            .metric-value {{ font-size: 1.2em; color: #333; }}
            .trend {{ display: inline-block; padding: 5px 10px; border-radius: 5px; font-weight: bold; }}
            .trend.up {{ background: #fef3c7; color: #92400e; }}
            .trend.down {{ background: #dbeafe; color: #1e40af; }}
            .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Sensor Data Analysis Report</h1>
            <p><strong>Report Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>Data Range:</strong> {df['Timestamp'].iloc[0]} to {df['Timestamp'].iloc[-1]}</p>
            <p><strong>Total Samples:</strong> {len(recent_data)}</p>
            
            <h2>Temperature Analysis</h2>
            <div class="metric">
                <div class="metric-name">Average Temperature</div>
                <div class="metric-value">{stats['temperature']['avg']:.2f} °C</div>
            </div>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Minimum</td>
                    <td>{stats['temperature']['min']:.2f} °C</td>
                </tr>
                <tr>
                    <td>Maximum</td>
                    <td>{stats['temperature']['max']:.2f} °C</td>
                </tr>
                <tr>
                    <td>Standard Deviation</td>
                    <td>{stats['temperature']['std']:.2f} °C</td>
                </tr>
                <tr>
                    <td>Trend</td>
                    <td><span class="trend {'up' if temp_trend == 'Increasing' else 'down'}">{temp_trend}</span></td>
                </tr>
            </table>
            
            <h2>Humidity Analysis</h2>
            <div class="metric">
                <div class="metric-name">Average Humidity</div>
                <div class="metric-value">{stats['humidity']['avg']:.2f} %</div>
            </div>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Minimum</td>
                    <td>{stats['humidity']['min']:.2f} %</td>
                </tr>
                <tr>
                    <td>Maximum</td>
                    <td>{stats['humidity']['max']:.2f} %</td>
                </tr>
                <tr>
                    <td>Standard Deviation</td>
                    <td>{stats['humidity']['std']:.2f} %</td>
                </tr>
                <tr>
                    <td>Trend</td>
                    <td><span class="trend {'up' if humidity_trend == 'Increasing' else 'down'}">{humidity_trend}</span></td>
                </tr>
            </table>
            
            <h2>Water Flow Analysis</h2>
            <div class="metric">
                <div class="metric-name">Average Water Flow</div>
                <div class="metric-value">{stats['flow']['avg']:.2f} L/h</div>
            </div>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Minimum</td>
                    <td>{stats['flow']['min']:.2f} L/h</td>
                </tr>
                <tr>
                    <td>Maximum</td>
                    <td>{stats['flow']['max']:.2f} L/h</td>
                </tr>
                <tr>
                    <td>Standard Deviation</td>
                    <td>{stats['flow']['std']:.2f} L/h</td>
                </tr>
                <tr>
                    <td>Trend</td>
                    <td><span class="trend {'up' if flow_trend == 'Increasing' else 'down'}">{flow_trend}</span></td>
                </tr>
            </table>
            
            <h2>Recommendations</h2>
            <ul>
                <li>Temperature range: {stats['temperature']['min']:.1f}°C to {stats['temperature']['max']:.1f}°C - {'Within normal range' if stats['temperature']['max'] < 30 else 'Review cooling systems'}</li>
                <li>Humidity range: {stats['humidity']['min']:.1f}% to {stats['humidity']['max']:.1f}% - {'Optimal conditions' if 30 <= stats['humidity']['avg'] <= 70 else 'Consider humidity control'}</li>
                <li>Water flow range: {stats['flow']['min']:.1f} to {stats['flow']['max']:.1f} L/h - {'Normal operation' if stats['flow']['max'] < 50 else 'Check for leaks'}</li>
            </ul>
            
            <div class="footer">
                <p>This report was automatically generated by the Wokwi Intelligent Agent System.</p>
                <p>For questions or concerns, please review the sensor data and agent logs.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Write report to file
    with open(report_filename, 'w') as f:
        f.write(html_content)
    
    print(f"\n{'='*60}")
    print(f"REPORT GENERATED: {report_filename}")
    print(f"{'='*60}")
    print(f"Temperature: {stats['temperature']['avg']:.2f}°C (min: {stats['temperature']['min']:.2f}, max: {stats['temperature']['max']:.2f})")
    print(f"Humidity: {stats['humidity']['avg']:.2f}% (min: {stats['humidity']['min']:.2f}, max: {stats['humidity']['max']:.2f})")
    print(f"Water Flow: {stats['flow']['avg']:.2f} L/h (min: {stats['flow']['min']:.2f}, max: {stats['flow']['max']:.2f})")
    print(f"{'='*60}\n")


def generate_timed_reports():
    """Generate reports every 60 seconds automatically"""
    global last_timer_report
    while True:
        time.sleep(TIMER_INTERVAL)
        if len(data_buffer) > 0:  # Only generate if we have data
            print(f"\n{'='*60}")
            print(f"[TIMER] Generating automatic report at {datetime.now().strftime('%H:%M:%S')}")
            print(f"{'='*60}")
            generate_report()
            last_timer_report = datetime.now()
        else:
            print(f"[TIMER] Skipping report - no data available yet")

def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    
    print("Connecting to MQTT Broker...")
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    
    # Start timer-based report generation in background thread
    timer_thread = threading.Thread(target=generate_timed_reports, daemon=True)
    timer_thread.start()
    
    print(f"\n{'='*60}")
    print(f"Backend Service Running")
    print(f"{'='*60}")
    print(f"Report Triggers:")
    print(f"  1. Every {REPORT_INTERVAL} data captures (data-based)")
    print(f"  2. Every {TIMER_INTERVAL} seconds (time-based)")
    print(f"Reports saved to: {os.path.abspath(REPORTS_DIR)}")
    print(f"{'='*60}\n")
    
    try:
        while True:
            time.sleep(1)
                
    except KeyboardInterrupt:
        print("\nStopping service...")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
