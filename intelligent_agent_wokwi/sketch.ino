#include <WiFi.h>
#include "DHTesp.h"
#include <PubSubClient.h>

const int DHT_PIN = 15;
const int POT_PIN = 34;
const int LED1_PIN = 12;
const int LED2_PIN = 14;

// WiFi Configuration (Wokwi Guest)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// MQTT Configuration
const char* mqtt_server = "test.mosquitto.org"; // Public broker for demo
const int mqtt_port = 1883;
const char* mqtt_topic_sensors = "wokwi/sensors/sayf_project";
const char* mqtt_topic_actuators = "wokwi/actuators/sayf_project";

DHTesp dht;
WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.println(message);

  if (String(topic) == mqtt_topic_actuators) {
    if (message == "ACT1:ON") {
      digitalWrite(LED1_PIN, HIGH);
    } else if (message == "ACT1:OFF") {
      digitalWrite(LED1_PIN, LOW);
    } else if (message == "ACT2:ON") {
      digitalWrite(LED2_PIN, HIGH);
    } else if (message == "ACT2:OFF") {
      digitalWrite(LED2_PIN, LOW);
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      client.subscribe(mqtt_topic_actuators);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  dht.setup(DHT_PIN, DHTesp::DHT22);
  pinMode(POT_PIN, INPUT);
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Read Sensors
  float temperature = dht.getTemperature();
  float humidity = dht.getHumidity();
  int potValue = analogRead(POT_PIN);
  float waterFlow = map(potValue, 0, 4095, 0, 100);

  // Create JSON
  String json = "{";
  json += "\"temp\": " + String(temperature) + ",";
  json += "\"humidity\": " + String(humidity) + ",";
  json += "\"flow\": " + String(waterFlow);
  json += "}";

  // Publish
  client.publish(mqtt_topic_sensors, json.c_str());
  
  delay(2000); 
}
