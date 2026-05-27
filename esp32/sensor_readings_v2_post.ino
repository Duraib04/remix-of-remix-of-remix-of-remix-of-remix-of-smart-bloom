/*
 * Smart Bloom — ESP32 → sensor_readings_v2
 * -----------------------------------------
 * Posts soil moisture, temperature, humidity and a computed Crop Stress
 * Score (CSS) to the `sensor_readings_v2` table in the Lovable Cloud
 * (durai-b) Supabase project every 30 seconds.
 *
 * Hardware (adjust pins to your wiring):
 *   - DHT22  → GPIO 4   (temperature + humidity)
 *   - Soil moisture (capacitive, analog) → GPIO 34   (0–4095)
 *
 * Libraries (Arduino Library Manager):
 *   - WiFi, HTTPClient, WiFiClientSecure  (built-in for ESP32)
 *   - ArduinoJson (Benoit Blanchon)
 *   - DHT sensor library (Adafruit)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ---------- USER CONFIG ----------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// durai-b Lovable Cloud project
const char* SUPABASE_URL = "https://ghghfxiumxqlkxdsyvov.supabase.co";

// Publishable (anon) key — safe to embed on the device
const char* SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZ2hmeGl1bXhxbGt4ZHN5dm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzcyMDcsImV4cCI6MjA4NTg1MzIwN30."
  "A9dAktKGDH_4sqkUdUy5GiceNB9IYY9QSEaVmrKrhlc";

const char* TABLE_NAME = "sensor_readings_v2";
const char* DEVICE_ID  = "esp32-field-01";

// Pins
#define DHT_PIN   4
#define DHT_TYPE  DHT22
#define SOIL_PIN  34

const unsigned long UPLOAD_INTERVAL_MS = 30UL * 1000UL;

// ---------- INTERNAL ----------
DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastUpload = 0;

void connectWiFi() {
  Serial.printf("WiFi: connecting to %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 30000) {
    delay(400); Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi OK, IP: "); Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi FAILED — will retry.");
  }
}

// Map raw ADC (dry=high, wet=low) to 0–100 %.
float soilPercent(int raw) {
  const int DRY = 3200;   // calibrate in air
  const int WET = 1200;   // calibrate in water
  float pct = (float)(DRY - raw) * 100.0f / (float)(DRY - WET);
  if (pct < 0) pct = 0; if (pct > 100) pct = 100;
  return pct;
}

// Crop Stress Score 0–100 (higher = more stress).
// Combines moisture deficit, heat stress, humidity deficit.
float computeCSS(float soilPct, float tempC, float humPct) {
  float moistureStress = (100.0f - soilPct);                // dry soil → high
  float heatStress     = constrain((tempC - 25.0f) * 5.0f, 0.0f, 100.0f);
  float humStress      = constrain((50.0f - humPct) * 1.5f, 0.0f, 100.0f);
  float css = 0.55f * moistureStress + 0.30f * heatStress + 0.15f * humStress;
  if (css < 0) css = 0; if (css > 100) css = 100;
  return css;
}

bool postReading(float soilPct, float tempC, float humPct, float css) {
  if (WiFi.status() != WL_CONNECTED) return false;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String endpoint = String(SUPABASE_URL) + "/rest/v1/" + TABLE_NAME;
  if (!https.begin(client, endpoint)) {
    Serial.println("HTTPS begin failed"); return false;
  }
  https.addHeader("Content-Type", "application/json");
  https.addHeader("apikey", SUPABASE_ANON_KEY);
  https.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  https.addHeader("Prefer", "return=minimal");

  StaticJsonDocument<256> doc;
  doc["device_id"]     = DEVICE_ID;
  doc["soil_moisture"] = soilPct;
  doc["temperature"]   = tempC;
  doc["humidity"]      = humPct;
  doc["css"]           = css;

  String body; serializeJson(doc, body);
  Serial.print("POST "); Serial.println(endpoint);
  Serial.print("Body: "); Serial.println(body);

  int code = https.POST(body);
  String resp = https.getString();
  https.end();
  Serial.printf("HTTP %d  %s\n", code, resp.c_str());
  return code >= 200 && code < 300;
}

void setup() {
  Serial.begin(115200);
  delay(300);
  dht.begin();
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) { connectWiFi(); delay(2000); return; }

  if (millis() - lastUpload >= UPLOAD_INTERVAL_MS || lastUpload == 0) {
    lastUpload = millis();

    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (isnan(t)) t = 0;
    if (isnan(h)) h = 0;

    int raw = analogRead(SOIL_PIN);
    float soilPct = soilPercent(raw);
    float css = computeCSS(soilPct, t, h);

    Serial.printf("soil=%.1f%%  T=%.1fC  H=%.1f%%  CSS=%.1f\n",
                  soilPct, t, h, css);
    postReading(soilPct, t, h, css);
  }

  delay(100);
}
