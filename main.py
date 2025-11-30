import network
import time
import json
from machine import Pin, ADC
from umqtt.simple import MQTTClient
import dht

# Pin Configuration
DHT_PIN = 15
POT_PIN = 34
LED1_PIN = 12
LED2_PIN = 14

# WiFi Configuration
SSID = "Wokwi-GUEST"
PASSWORD = ""

# MQTT Configuration
MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
MQTT_CLIENT_ID = "esp32_wokwi"
TOPIC_SENSORS = b"wokwi/sensors/sayf_project"
TOPIC_ACTUATORS = b"wokwi/actuators/sayf_project"

# Initialize Hardware
sensor = dht.DHT22(Pin(DHT_PIN))
pot = ADC(Pin(POT_PIN))
pot.atten(ADC.ATTN_11DB)  # Full range: 0-3.3V
led1 = Pin(LED1_PIN, Pin.OUT)
led2 = Pin(LED2_PIN, Pin.OUT)

led1.value(0)
led2.value(0)

# WiFi Connection
def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print('Connecting to WiFi...')
        wlan.connect(SSID, PASSWORD)
        while not wlan.isconnected():
            time.sleep(0.5)
            print('.', end='')
    print('\nWiFi connected')
    print('IP address:', wlan.ifconfig()[0])
    return wlan

# MQTT Callback
def mqtt_callback(topic, msg):
    print(f"Message arrived [{topic.decode()}] {msg.decode()}")
    
    if topic == TOPIC_ACTUATORS:
        message = msg.decode()
        if message == "ACT1:ON":
            led1.value(1)
        elif message == "ACT1:OFF":
            led1.value(0)
        elif message == "ACT2:ON":
            led2.value(1)
        elif message == "ACT2:OFF":
            led2.value(0)

# Main Loop
def main():
    # Connect to WiFi
    wlan = connect_wifi()
    
    # Connect to MQTT
    print('Connecting to MQTT...')
    client = MQTTClient(MQTT_CLIENT_ID, MQTT_BROKER, port=MQTT_PORT)
    client.set_callback(mqtt_callback)
    client.connect()
    client.subscribe(TOPIC_ACTUATORS)
    print('MQTT connected and subscribed')
    
    print('Starting sensor readings...')
    time.sleep(2)
    
    while True:
        try:
            # Check for MQTT messages
            client.check_msg()
            
            # Read DHT22 Sensor
            sensor.measure()
            temperature = sensor.temperature()
            humidity = sensor.humidity()
            
            # Read potentiometer (0-4095) and map to 0-100 L/h
            pot_value = pot.read()
            water_flow = int((pot_value / 4095) * 100)
            
            # Create JSON
            data = {
                "temp": temperature,
                "humidity": humidity,
                "flow": water_flow
            }
            json_str = json.dumps(data)
            
            # Publish to MQTT
            client.publish(TOPIC_SENSORS, json_str)
            print(json_str)
            
            time.sleep(2)
            
        except OSError as e:
            print(f"Sensor error: {e}")
            time.sleep(2)
            
        except Exception as e:
            print(f"Error: {e}")
            # Reconnect if connection lost
            try:
                client.connect()
                client.subscribe(TOPIC_ACTUATORS)
                print("Reconnected to MQTT")
            except:
                print("Reconnection failed, waiting...")
                time.sleep(5)

if __name__ == "__main__":
    main()
