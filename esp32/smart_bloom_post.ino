/*
 * Smart Bloom — ESP32 Sensor Uploader
 * ------------------------------------
 * Posts temperature, humidity, soil moisture, rain and pump state to the
 * Supabase `smart_bloom_data` table using the REST API + anon key.
 *
 * Hardware (adjust pins to your wiring):
 *   - DHT22  → GPIO 4   (temperature + humidity)
 *   - Soil moisture (analog, capacitive) → GPIO 34
 *   - Rain sensor (digital)              → GPIO 35
 *   - Relay / pump control               → GPIO 26
 *
 * Libraries required (install via Arduino Library Manager):
 *   - WiFi               (built-in for ESP32)
 *   - HTTPClient         (built-in for ESP32)
 *   - WiFiClientSecure   (built-in for ESP32)
 *   - ArduinoJson        (Benoit Blanchon)
 *   - DHT sensor library (Adafruit)
 *
 * Notes:
 *   - The anon key is PUBLIC by design; safe to embed on the device.
 *   - Make sure RLS on `smart_bloom_data` allows anon INSERT, or use a
 *     service role key kept secret on a backend instead.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ---------- USER CONFIG ----------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Supabase project that owns the `smart_bloom_data` table (sensor project)
const char* SUPABASE_URL  = "https://nynciqqkmavfazabkgud.supabase.co";
const char* SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55bmNpcXFrbWF2ZmF6YWJrZ3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTc3MjYsImV4cCI6MjA4NTg3MzcyNn0."
  "RFqZaAdUTCadYwi_bFAsP3LavSabYuQPemO2SNUfS4o";

const char* TABLE_NAME = "smart_bloom_data";

// Pins
#define DHT_PIN        4
#define DHT_TYPE       DHT22
#define SOIL_PIN       34   // analog input
#define RAIN_PIN       35   // digital input (HIGH = dry, LOW = raining on most modules)
#define PUMP_PIN       26   // relay

// Upload interval
const unsigned long UPLOAD_INTERVAL_MS = 30UL * 1000UL; // every 30 s

// ---------- INTERNAL ----------
DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastUpload = 0;
bool pumpState = false;

void connectWiFi() {
  Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 30000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("✅ WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("❌ WiFi failed — will retry in loop().");
  }
}

bool postReading(float temperature, float humidity, int soilRaw, bool raining, bool pump) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi down, skipping upload.");
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure(); // Supabase uses valid certs; skip CA bundle for simplicity.

  HTTPClient https;
  String endpoint = String(SUPABASE_URL) + "/rest/v1/" + TABLE_NAME;

  if (!https.begin(client, endpoint)) {
    Serial.println("HTTPS begin failed");
    return false;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("apikey", SUPABASE_ANON_KEY);
  https.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  https.addHeader("Prefer", "return=minimal");

  StaticJsonDocument<256> doc;
  doc["temperature"] = temperature;
  doc["humidity"]    = humidity;
  doc["soil"]        = soilRaw;     // raw 0–4095 (ESP32 ADC) — frontend maps to %
  doc["raining"]     = raining;
  doc["pump"]        = pump;

  String body;
  serializeJson(doc, body);

  Serial.print("POST → "); Serial.println(endpoint);
  Serial.print("Body:  "); Serial.println(body);

  int code = https.POST(body);
  String resp = https.getString();
  https.end();

  Serial.printf("HTTP %d  %s\n", code, resp.c_str());
  return code >= 200 && code < 300;
}

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(RAIN_PIN, INPUT);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);

  dht.begin();
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    delay(2000);
    return;
  }

  if (millis() - lastUpload >= UPLOAD_INTERVAL_MS || lastUpload == 0) {
    lastUpload = millis();

    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (isnan(t) || isnan(h)) {
      Serial.println("DHT read failed — using 0s.");
      t = 0;
      h = 0;
    }

    int soilRaw = analogRead(SOIL_PIN);          // 0–4095 on ESP32
    bool raining = digitalRead(RAIN_PIN) == LOW; // LOW = wet on most modules

    // Simple local control: turn pump ON if soil very dry and not raining.
    // Replace with your own logic or read commands from Supabase if needed.
    if (!raining && soilRaw > 3000) pumpState = true;
    else if (soilRaw < 1800)        pumpState = false;
    digitalWrite(PUMP_PIN, pumpState ? HIGH : LOW);

    postReading(t, h, soilRaw, raining, pumpState);
  }

  delay(100);
}
