import serial
import time
import json
import sys

# Configuration
SERIAL_PORT = 'COM3' # Default, user might need to change this
BAUD_RATE = 115200
TEMP_THRESHOLD = 30.0 # Celsius
FLOW_THRESHOLD = 50.0 # Liters/hour

class IntelligentAgent:
    def __init__(self, port, baud_rate):
        self.port = port
        self.baud_rate = baud_rate
        self.ser = None

    def connect(self):
        try:
            print(f"Connecting to agent on {self.port}...")
            self.ser = serial.Serial(self.port, self.baud_rate, timeout=1)
            print("Connected successfully.")
            return True
        except serial.SerialException as e:
            print(f"Error connecting to serial port: {e}")
            return False

    def process_data(self, data):
        """
        Analyzes sensor data and decides on actions.
        Returns a list of commands to send.
        """
        commands = []
        try:
            # Parse JSON data
            sensors = json.loads(data)
            temp = sensors.get('temp', 0)
            flow = sensors.get('flow', 0)
            
            print(f"Received: Temp={temp:.1f}C, Flow={flow:.1f}L/h")

            # Logic for Actuator 1 (Temperature)
            if temp > TEMP_THRESHOLD:
                print(f"  [ALERT] High Temperature! Activating Actuator 1.")
                commands.append("ACT1:ON")
            else:
                commands.append("ACT1:OFF")

            # Logic for Actuator 2 (Water Flow)
            if flow > FLOW_THRESHOLD:
                print(f"  [ALERT] High Water Flow! Activating Actuator 2.")
                commands.append("ACT2:ON")
            else:
                commands.append("ACT2:OFF")
                
        except json.JSONDecodeError:
            print(f"  [WARN] Invalid data received: {data}")
        except Exception as e:
            print(f"  [ERROR] Processing error: {e}")
            
        return commands

    def run(self):
        if not self.connect():
            return

        print("Agent is running. Press Ctrl+C to stop.")
        try:
            while True:
                if self.ser.in_waiting > 0:
                    line = self.ser.readline().decode('utf-8').strip()
                    if line:
                        actions = self.process_data(line)
                        for action in actions:
                            self.ser.write((action + '\n').encode('utf-8'))
                            # print(f"  Sent: {action}") # Optional debug
                            
                time.sleep(0.1) # Prevent CPU hogging
                
        except KeyboardInterrupt:
            print("\nStopping agent...")
        finally:
            if self.ser and self.ser.is_open:
                self.ser.close()
            print("Disconnected.")

if __name__ == "__main__":
    # Allow port to be passed as argument
    port = SERIAL_PORT
    if len(sys.argv) > 1:
        port = sys.argv[1]
    
    agent = IntelligentAgent(port, BAUD_RATE)
    agent.run()
