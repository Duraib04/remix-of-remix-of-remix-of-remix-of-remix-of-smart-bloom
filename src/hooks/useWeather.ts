 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
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
   location?: string;
   description?: string;
 }
 
 interface LocationState {
   lat: number | null;
   lon: number | null;
   error: string | null;
   loading: boolean;
 }
 
 // Default mock data for fallback
 const defaultWeatherData: WeatherData = {
   condition: "cloudy",
   temperature: 24,
   humidity: 68,
   windSpeed: 12,
   rainProbability: 35,
   forecast: [
     { day: "Today", condition: "cloudy", high: 26, low: 18 },
     { day: "Tue", condition: "rainy", high: 22, low: 16 },
     { day: "Wed", condition: "sunny", high: 28, low: 19 },
   ],
 };
 
 export function useWeather() {
   const { language } = useLanguage();
   const [weather, setWeather] = useState<WeatherData>(defaultWeatherData);
   const [location, setLocation] = useState<LocationState>({
     lat: null,
     lon: null,
     error: null,
     loading: true,
   });
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   // Map language to OpenWeatherMap language code
   const getApiLang = useCallback(() => {
     switch (language) {
       case "ta":
       case "tanglish":
         return "ta";
       case "hi":
         return "hi";
       default:
         return "en";
     }
   }, [language]);
 
   // Get user's location
   const getLocation = useCallback(() => {
     if (!navigator.geolocation) {
       setLocation({
         lat: null,
         lon: null,
         error: "Geolocation is not supported by your browser",
         loading: false,
       });
       return;
     }
 
     setLocation((prev) => ({ ...prev, loading: true }));
 
     navigator.geolocation.getCurrentPosition(
       (position) => {
         console.log("Location obtained:", position.coords.latitude, position.coords.longitude);
         setLocation({
           lat: position.coords.latitude,
           lon: position.coords.longitude,
           error: null,
           loading: false,
         });
       },
       (err) => {
         console.error("Geolocation error:", err.message);
         setLocation({
           lat: null,
           lon: null,
           error: err.message,
           loading: false,
         });
       },
       {
         enableHighAccuracy: true,
         timeout: 10000,
         maximumAge: 300000, // Cache for 5 minutes
       }
     );
   }, []);
 
   // Fetch weather data
   const fetchWeather = useCallback(async () => {
     if (!location.lat || !location.lon) return;
 
     setIsLoading(true);
     setError(null);
 
     try {
       console.log("Fetching weather for:", location.lat, location.lon);
       
       const { data, error: fnError } = await supabase.functions.invoke("weather", {
         body: {
           lat: location.lat,
           lon: location.lon,
           lang: getApiLang(),
         },
       });
 
       if (fnError) {
         console.error("Weather function error:", fnError);
         throw new Error(fnError.message);
       }
 
       if (data.error) {
         console.error("Weather API error:", data.error);
         throw new Error(data.error);
       }
 
       console.log("Weather data received:", data);
       setWeather(data);
     } catch (err) {
       console.error("Failed to fetch weather:", err);
       setError(err instanceof Error ? err.message : "Failed to fetch weather");
       // Keep using default/previous data
     } finally {
       setIsLoading(false);
     }
   }, [location.lat, location.lon, getApiLang]);
 
   // Request location on mount
   useEffect(() => {
     getLocation();
   }, [getLocation]);
 
   // Fetch weather when location is available
   useEffect(() => {
     if (location.lat && location.lon) {
       fetchWeather();
     }
   }, [location.lat, location.lon, fetchWeather]);
 
   // Refresh weather when language changes
   useEffect(() => {
     if (location.lat && location.lon && !location.loading) {
       fetchWeather();
     }
   }, [language]);
 
   return {
     weather,
     location: {
       ...location,
       name: weather.location,
     },
     isLoading: isLoading || location.loading,
     error: error || location.error,
     refresh: fetchWeather,
     requestLocation: getLocation,
   };
 }