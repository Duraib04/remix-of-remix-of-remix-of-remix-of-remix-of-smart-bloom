 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const OPENWEATHERMAP_API_KEY = Deno.env.get('OPENWEATHERMAP_API_KEY');
     if (!OPENWEATHERMAP_API_KEY) {
       console.error('OPENWEATHERMAP_API_KEY is not configured');
       throw new Error('Weather service not configured');
     }
 
     const { lat, lon, lang = 'en' } = await req.json();
     
     if (!lat || !lon) {
       console.error('Missing coordinates:', { lat, lon });
       return new Response(
         JSON.stringify({ error: 'Location coordinates required' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     console.log(`Fetching weather for coordinates: ${lat}, ${lon}, language: ${lang}`);
 
     // Fetch current weather
     const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&lang=${lang}`;
     const currentResponse = await fetch(currentWeatherUrl);
     
     if (!currentResponse.ok) {
       const errorText = await currentResponse.text();
       console.error(`OpenWeatherMap current weather error [${currentResponse.status}]: ${errorText}`);
       throw new Error(`Weather API failed: ${currentResponse.status}`);
     }
     
     const currentData = await currentResponse.json();
     console.log('Current weather fetched:', currentData.name);
 
     // Fetch 5-day forecast (free tier)
     const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&lang=${lang}`;
     const forecastResponse = await fetch(forecastUrl);
     
     if (!forecastResponse.ok) {
       const errorText = await forecastResponse.text();
       console.error(`OpenWeatherMap forecast error [${forecastResponse.status}]: ${errorText}`);
       throw new Error(`Forecast API failed: ${forecastResponse.status}`);
     }
     
     const forecastData = await forecastResponse.json();
     console.log('Forecast fetched successfully');
 
     // Map weather condition to our format
     const mapCondition = (weatherId: number): "sunny" | "cloudy" | "rainy" => {
       if (weatherId >= 200 && weatherId < 600) return "rainy"; // Thunderstorm, Drizzle, Rain, Snow
       if (weatherId >= 600 && weatherId < 700) return "rainy"; // Snow
       if (weatherId >= 700 && weatherId < 800) return "cloudy"; // Atmosphere (fog, mist)
       if (weatherId === 800) return "sunny"; // Clear
       return "cloudy"; // Clouds (801-804)
     };
 
     // Get rain probability from forecast
     const rainProbability = forecastData.list[0]?.pop 
       ? Math.round(forecastData.list[0].pop * 100) 
       : 0;
 
     // Process forecast for next 3 days
     const dailyForecasts: { [key: string]: { temps: number[]; conditions: number[] } } = {};
     const today = new Date().toDateString();
     
     forecastData.list.forEach((item: any) => {
       const date = new Date(item.dt * 1000);
       const dateStr = date.toDateString();
       
       if (!dailyForecasts[dateStr]) {
         dailyForecasts[dateStr] = { temps: [], conditions: [] };
       }
       dailyForecasts[dateStr].temps.push(item.main.temp);
       dailyForecasts[dateStr].conditions.push(item.weather[0].id);
     });
 
     const getDayName = (dateStr: string, index: number): string => {
       if (index === 0) return "Today";
       const date = new Date(dateStr);
       const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
       return days[date.getDay()];
     };
 
     const forecast = Object.entries(dailyForecasts)
       .slice(0, 3)
       .map(([dateStr, data], index) => ({
         day: getDayName(dateStr, index),
         condition: mapCondition(Math.round(data.conditions.reduce((a, b) => a + b, 0) / data.conditions.length)),
         high: Math.round(Math.max(...data.temps)),
         low: Math.round(Math.min(...data.temps)),
       }));
 
     const weatherResult = {
       condition: mapCondition(currentData.weather[0].id),
       temperature: Math.round(currentData.main.temp),
       humidity: currentData.main.humidity,
       windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
       rainProbability,
       forecast,
       location: currentData.name,
       description: currentData.weather[0].description,
     };
 
     console.log('Weather data prepared:', weatherResult.location);
 
     return new Response(
       JSON.stringify(weatherResult),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
 
   } catch (error) {
     console.error('Weather function error:', error);
     const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather';
     return new Response(
       JSON.stringify({ error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });