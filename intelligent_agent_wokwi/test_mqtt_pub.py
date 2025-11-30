import paho.mqtt.client as mqtt
import json
import time
import random

BROKER = "test.mosquitto.org"
TOPIC = "wokwi/sensors/sayf_project"

client = mqtt.Client()
client.connect(BROKER, 1883, 60)

print("Sending 35 messages to trigger report generation...")
print("This will send varied data to test all recommendation scenarios\n")

for i in range(35):
    # Vary the data to trigger different recommendations
    if i < 10:
        # Normal values
        data = {
            "temp": random.uniform(20, 25),
            "humidity": random.uniform(40, 60),
            "flow": random.uniform(20, 40)
        }
    elif i < 20:
        # High temperature
        data = {
            "temp": random.uniform(31, 35),
            "humidity": random.uniform(40, 60),
            "flow": random.uniform(20, 40)
        }
    elif i < 30:
        # Low humidity
        data = {
            "temp": random.uniform(20, 25),
            "humidity": random.uniform(20, 28),
            "flow": random.uniform(20, 40)
        }
    else:
        # High water flow
        data = {
            "temp": random.uniform(20, 25),
            "humidity": random.uniform(40, 60),
            "flow": random.uniform(55, 65)
        }
    
    client.publish(TOPIC, json.dumps(data))
    print(f"Sent message {i+1}/35: Temp={data['temp']:.1f}°C, Humidity={data['humidity']:.1f}%, Flow={data['flow']:.1f}L/h")
    time.sleep(0.5)

print("\n✓ Finished sending 35 messages.")
print("✓ Report should be generated after message 30")
print("✓ Check the 'reports' directory for the generated HTML report")
client.disconnect()
