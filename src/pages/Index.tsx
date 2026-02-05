 import { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CircularGauge } from "@/components/dashboard/CircularGauge";
import { WeatherCard } from "@/components/dashboard/WeatherCard";
import { IrrigationControl } from "@/components/dashboard/IrrigationControl";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { MoistureChart } from "@/components/dashboard/MoistureChart";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { WaterEfficiency } from "@/components/dashboard/WaterEfficiency";
import { VoiceAssistant } from "@/components/dashboard/VoiceAssistant";
import { useLanguage } from "@/contexts/LanguageContext";
 import { useWeather } from "@/hooks/useWeather";
 import { useRainAlert } from "@/hooks/useRainAlert";
 import { LocationBanner } from "@/components/dashboard/LocationBanner";
 import { RainAlertBanner } from "@/components/dashboard/RainAlertBanner";
import { Droplets, Thermometer, Wind, Sprout } from "lucide-react";

const mockDevices = [
  { id: "1", name: "Field Sensor A", type: "sensor" as const, status: "online" as const, battery: 85, signal: 92, lastUpdate: "2 min ago" },
  { id: "2", name: "Field Sensor B", type: "sensor" as const, status: "online" as const, battery: 62, signal: 78, lastUpdate: "3 min ago" },
  { id: "3", name: "Main Valve", type: "valve" as const, status: "online" as const, lastUpdate: "1 min ago" },
  { id: "4", name: "ESP32 Controller", type: "controller" as const, status: "online" as const, battery: 100, signal: 95, lastUpdate: "1 min ago" },
];

const mockMoistureData = [
  { time: "00:00", moisture: 65, optimal: 70 },
  { time: "04:00", moisture: 58, optimal: 70 },
  { time: "08:00", moisture: 52, optimal: 70 },
  { time: "12:00", moisture: 72, optimal: 70 },
  { time: "16:00", moisture: 68, optimal: 70 },
  { time: "20:00", moisture: 64, optimal: 70 },
  { time: "Now", moisture: 67, optimal: 70 },
];

const mockActivityLog = [
  { id: "1", type: "ai" as const, message: "AI deferred irrigation", details: "Rain probability 75% in next 2 hours", timestamp: "10 min ago" },
  { id: "2", type: "irrigation" as const, message: "Irrigation completed", details: "Zone A - 15 minutes, 45L used", timestamp: "2 hours ago" },
  { id: "3", type: "system" as const, message: "All sensors calibrated", timestamp: "4 hours ago" },
  { id: "4", type: "alert" as const, message: "Low battery warning", details: "Field Sensor B at 25%", timestamp: "6 hours ago" },
  { id: "5", type: "ai" as const, message: "Optimal moisture reached", details: "Target 70% achieved", timestamp: "8 hours ago" },
];

const mockEfficiencyData = {
  currentEfficiency: 87,
  waterSaved: 156,
  weeklyData: [
    { day: "Mon", used: 45, saved: 12 },
    { day: "Tue", used: 38, saved: 18 },
    { day: "Wed", used: 52, saved: 8 },
    { day: "Thu", used: 35, saved: 22 },
    { day: "Fri", used: 41, saved: 15 },
    { day: "Sat", used: 28, saved: 25 },
    { day: "Sun", used: 32, saved: 20 },
  ],
};

const Index = () => {
  const { t } = useLanguage();
   const { weather, location, isLoading: weatherLoading, error: weatherError, refresh: refreshWeather, requestLocation } = useWeather();
   const { checkRainAlert } = useRainAlert();
   const [isIrrigating, setIsIrrigating] = useState(false);
  const [irrigationMode, setIrrigationMode] = useState<"auto" | "manual">("auto");
   const [showRainAlert, setShowRainAlert] = useState(true);
 
   // Check for rain alerts when weather data updates
   useEffect(() => {
     if (weather && location.name && !weatherLoading) {
       checkRainAlert({
         rainProbability: weather.rainProbability,
         locationName: location.name,
       });
     }
   }, [weather, location.name, weatherLoading, checkRainAlert]);

  return (
    <div className="min-h-screen bg-background">
      <Header notifications={2} />
      
      <main className="container px-4 lg:px-8 py-6 space-y-6">
        {/* Hero Section with Key Metrics */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-display font-bold">{t.dashboard}</h2>
              <p className="text-muted-foreground">{t.liveMonitoring}</p>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title={t.soilMoisture}
              value={67}
              unit="%"
              icon={Droplets}
              status="success"
              trend={{ value: 5, isPositive: true }}
            />
            <MetricCard
              title={t.temperature}
              value={24}
              unit="°C"
              icon={Thermometer}
              status="normal"
              trend={{ value: 2, isPositive: false }}
            />
            <MetricCard
              title={t.humidity}
              value={68}
              unit="%"
              icon={Wind}
              status="normal"
            />
            <MetricCard
              title={t.cropHealth}
              value={12}
              unit="CSS"
              icon={Sprout}
              status="success"
              trend={{ value: 8, isPositive: true }}
            />
          </div>
        </section>

       {/* Location Banner */}
       <section className="animate-fade-in" style={{ animationDelay: "0.05s" }}>
         <LocationBanner
           locationName={location.name}
           isLoading={location.loading}
           error={location.error}
           onRequestLocation={requestLocation}
         />
       </section>
 
       {/* Rain Alert Banner */}
       {showRainAlert && weather.rainProbability > 60 && (
         <section className="animate-fade-in">
           <RainAlertBanner
             rainProbability={weather.rainProbability}
             locationName={location.name}
             onDismiss={() => setShowRainAlert(false)}
           />
         </section>
       )}
 
        {/* Gauges Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="bg-card rounded-xl p-4 shadow-md flex flex-col items-center">
            <CircularGauge value={67} max={100} label={t.soilMoisture} variant="primary" />
          </div>
          <div className="bg-card rounded-xl p-4 shadow-md flex flex-col items-center">
            <CircularGauge value={24} max={50} label={t.temperature} unit="°C" variant="warning" />
          </div>
          <div className="bg-card rounded-xl p-4 shadow-md flex flex-col items-center">
            <CircularGauge value={68} max={100} label={t.humidity} variant="accent" />
          </div>
          <div className="bg-card rounded-xl p-4 shadow-md flex flex-col items-center">
            <CircularGauge value={87} max={100} label={t.efficiency} variant="success" />
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <MoistureChart data={mockMoistureData} className="animate-fade-in" style={{ animationDelay: "0.2s" } as React.CSSProperties} />
            <WaterEfficiency data={mockEfficiencyData} className="animate-fade-in" style={{ animationDelay: "0.3s" } as React.CSSProperties} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <IrrigationControl
              isActive={isIrrigating}
              mode={irrigationMode}
              scheduledTime="6:00 AM tomorrow"
              aiRecommendation={{
                shouldIrrigate: false,
                duration: 0,
                reason: "Soil moisture is optimal. Rain expected tomorrow morning.",
                confidence: 89,
              }}
              onToggle={() => setIsIrrigating(!isIrrigating)}
              onModeChange={setIrrigationMode}
              className="animate-slide-in-right"
            />
             <WeatherCard 
               data={weather} 
               location={location.name}
               isLoading={weatherLoading}
               error={weatherError}
               onRefresh={refreshWeather}
               onRequestLocation={requestLocation}
               className="animate-slide-in-right" 
               style={{ animationDelay: "0.1s" } as React.CSSProperties} 
             />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <SystemStatus devices={mockDevices} className="animate-fade-in" style={{ animationDelay: "0.4s" } as React.CSSProperties} />
          <ActivityLog entries={mockActivityLog} className="animate-fade-in" style={{ animationDelay: "0.5s" } as React.CSSProperties} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-8">
        <div className="container px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2025 {t.appName}. {t.poweredByAI}</p>
            <div className="flex items-center gap-4">
              <span>ESP32 {t.connected}</span>
              <span>•</span>
              <span>Firebase {t.synced}</span>
              <span>•</span>
              <span>FastAPI {t.online}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Voice Assistant */}
      <VoiceAssistant />
    </div>
  );
};

export default Index;
