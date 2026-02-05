 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Cloud, CloudRain, Sun, Droplets, Wind, MapPin, RefreshCw, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeatherData {
  condition: "sunny" | "cloudy" | "rainy";
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  forecast: Array<{
    day: string;
    condition: "sunny" | "cloudy" | "rainy";
    high: number;
    low: number;
  }>;
}

 interface WeatherCardProps {
   data: WeatherData;
   location?: string;
   isLoading?: boolean;
   error?: string | null;
   onRefresh?: () => void;
   onRequestLocation?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const WeatherIcon = ({ condition, className }: { condition: string; className?: string }) => {
  switch (condition) {
    case "sunny":
      return <Sun className={cn("text-warning", className)} />;
    case "cloudy":
      return <Cloud className={cn("text-muted-foreground", className)} />;
    case "rainy":
      return <CloudRain className={cn("text-accent", className)} />;
    default:
      return <Sun className={className} />;
  }
};

 export function WeatherCard({ 
   data, 
   location, 
   isLoading, 
   error, 
   onRefresh, 
   onRequestLocation,
   className, 
   style 
 }: WeatherCardProps) {
  const { t } = useLanguage();

  return (
    <Card className={cn("card-hover border-0 shadow-md overflow-hidden", className)} style={style}>
      <CardHeader className="pb-2">
         <CardTitle className="text-base font-semibold flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Cloud className="h-5 w-5 text-primary" />
             {t.weather}
           </div>
           <div className="flex items-center gap-2">
             {location && (
               <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                 <MapPin className="h-3 w-3" />
                 {location}
               </span>
             )}
             {onRefresh && (
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-6 w-6"
                 onClick={onRefresh}
                 disabled={isLoading}
               >
                 {isLoading ? (
                   <Loader2 className="h-3 w-3 animate-spin" />
                 ) : (
                   <RefreshCw className="h-3 w-3" />
                 )}
               </Button>
             )}
           </div>
        </CardTitle>
      </CardHeader>
       <CardContent className="space-y-4 relative">
         {/* Loading overlay */}
         {isLoading && (
           <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
         )}
 
         {/* Location permission request */}
         {error && error.includes("denied") && onRequestLocation && (
           <div className="p-4 bg-muted rounded-lg text-center space-y-2">
             <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
             <p className="text-sm text-muted-foreground">{t.locationNeeded || "Location access needed for weather"}</p>
             <Button size="sm" onClick={onRequestLocation}>
               {t.allowLocation || "Allow Location"}
             </Button>
           </div>
         )}
 
        {/* Current Weather */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <WeatherIcon condition={data.condition} className="h-12 w-12" />
            <div>
              <p className="text-3xl font-display font-bold">{data.temperature}°C</p>
               <p className="text-sm text-muted-foreground capitalize">
                 {(data as any).description || data.condition}
               </p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Droplets className="h-4 w-4 text-accent" />
              <span>{data.humidity}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wind className="h-4 w-4 text-muted-foreground" />
              <span>{data.windSpeed} km/h</span>
            </div>
          </div>
        </div>

        {/* Rain Probability Alert */}
        <div
          className={cn(
            "flex items-center justify-between p-3 rounded-lg",
            data.rainProbability > 60
              ? "bg-accent/10 border border-accent/20"
              : "bg-muted"
          )}
        >
          <div className="flex items-center gap-2">
            <CloudRain className={cn("h-5 w-5", data.rainProbability > 60 ? "text-accent" : "text-muted-foreground")} />
            <span className="text-sm font-medium">{t.rainChance}</span>
          </div>
          <span className={cn(
            "text-lg font-bold font-display",
            data.rainProbability > 60 ? "text-accent" : "text-foreground"
          )}>
            {data.rainProbability}%
          </span>
        </div>

        {/* 3-Day Forecast */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          {data.forecast.map((day) => (
            <div
              key={day.day}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50"
            >
              <span className="text-xs font-medium text-muted-foreground">{day.day}</span>
              <WeatherIcon condition={day.condition} className="h-6 w-6" />
              <div className="text-xs">
                <span className="font-semibold">{day.high}°</span>
                <span className="text-muted-foreground">/{day.low}°</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}