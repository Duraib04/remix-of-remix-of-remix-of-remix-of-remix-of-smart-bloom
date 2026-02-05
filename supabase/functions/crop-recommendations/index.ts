 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 interface CropRecommendation {
   id: string;
   crop_name: string;
   suitability_score: number;
   reason: string;
   season: string;
 }
 
 // Crop database with soil and weather requirements
 const CROP_DATABASE: Record<string, {
   name: string;
   soilTypes: string[];
   tempRange: [number, number];
   humidityRange: [number, number];
   rainTolerance: number;
   seasons: string[];
 }> = {
   rice: {
     name: "Rice (Paddy)",
     soilTypes: ["clay", "alluvial", "loamy"],
     tempRange: [20, 35],
     humidityRange: [60, 90],
     rainTolerance: 90,
     seasons: ["Monsoon", "Kharif"],
   },
   wheat: {
     name: "Wheat",
     soilTypes: ["loamy", "clay", "alluvial"],
     tempRange: [10, 25],
     humidityRange: [40, 70],
     rainTolerance: 50,
     seasons: ["Winter", "Rabi"],
   },
   cotton: {
     name: "Cotton",
     soilTypes: ["black", "alluvial", "loamy"],
     tempRange: [20, 35],
     humidityRange: [50, 70],
     rainTolerance: 60,
     seasons: ["Summer", "Kharif"],
   },
   sugarcane: {
     name: "Sugarcane",
     soilTypes: ["loamy", "alluvial", "clay"],
     tempRange: [20, 35],
     humidityRange: [60, 80],
     rainTolerance: 80,
     seasons: ["All Year"],
   },
   groundnut: {
     name: "Groundnut (Peanut)",
     soilTypes: ["sandy", "loamy", "red"],
     tempRange: [20, 30],
     humidityRange: [40, 60],
     rainTolerance: 50,
     seasons: ["Summer", "Kharif"],
   },
   maize: {
     name: "Maize (Corn)",
     soilTypes: ["loamy", "alluvial", "sandy"],
     tempRange: [18, 30],
     humidityRange: [50, 80],
     rainTolerance: 70,
     seasons: ["Monsoon", "Kharif"],
   },
   tomato: {
     name: "Tomato",
     soilTypes: ["loamy", "sandy", "red"],
     tempRange: [15, 30],
     humidityRange: [50, 70],
     rainTolerance: 50,
     seasons: ["All Year"],
   },
   onion: {
     name: "Onion",
     soilTypes: ["loamy", "alluvial", "sandy"],
     tempRange: [10, 25],
     humidityRange: [40, 70],
     rainTolerance: 40,
     seasons: ["Winter", "Rabi"],
   },
   potato: {
     name: "Potato",
     soilTypes: ["loamy", "sandy", "alluvial"],
     tempRange: [10, 25],
     humidityRange: [60, 80],
     rainTolerance: 50,
     seasons: ["Winter", "Rabi"],
   },
   chilli: {
     name: "Chilli (Pepper)",
     soilTypes: ["loamy", "sandy", "black"],
     tempRange: [20, 35],
     humidityRange: [50, 70],
     rainTolerance: 60,
     seasons: ["All Year"],
   },
   banana: {
     name: "Banana",
     soilTypes: ["loamy", "alluvial", "clay"],
     tempRange: [20, 35],
     humidityRange: [70, 90],
     rainTolerance: 80,
     seasons: ["All Year"],
   },
   mango: {
     name: "Mango",
     soilTypes: ["loamy", "alluvial", "red"],
     tempRange: [20, 40],
     humidityRange: [40, 70],
     rainTolerance: 60,
     seasons: ["Summer"],
   },
 };
 
 function calculateSuitabilityScore(
   crop: typeof CROP_DATABASE[string],
   soilType: string,
   weather: { temperature: number; humidity: number; rainProbability: number }
 ): { score: number; reasons: string[] } {
   const reasons: string[] = [];
   let score = 0;
 
   // Soil compatibility (40 points max)
   if (crop.soilTypes.includes(soilType.toLowerCase())) {
     score += 40;
     reasons.push(`Excellent soil match for ${soilType} soil`);
   } else {
     score += 10;
     reasons.push(`Can grow in ${soilType} with care`);
   }
 
   // Temperature compatibility (30 points max)
   const [minTemp, maxTemp] = crop.tempRange;
   if (weather.temperature >= minTemp && weather.temperature <= maxTemp) {
     score += 30;
     reasons.push(`Ideal temperature range (${minTemp}-${maxTemp}°C)`);
   } else if (weather.temperature >= minTemp - 5 && weather.temperature <= maxTemp + 5) {
     score += 15;
     reasons.push(`Acceptable temperature, prefer ${minTemp}-${maxTemp}°C`);
   } else {
     reasons.push(`Temperature outside optimal range`);
   }
 
   // Humidity compatibility (15 points max)
   const [minHum, maxHum] = crop.humidityRange;
   if (weather.humidity >= minHum && weather.humidity <= maxHum) {
     score += 15;
   } else if (weather.humidity >= minHum - 10 && weather.humidity <= maxHum + 10) {
     score += 8;
   }
 
   // Rain tolerance (15 points max)
   if (weather.rainProbability <= crop.rainTolerance) {
     score += 15;
   } else if (weather.rainProbability <= crop.rainTolerance + 20) {
     score += 8;
     reasons.push(`Monitor rain levels`);
   } else {
     reasons.push(`High rain may affect growth`);
   }
 
   return { score: Math.min(score, 100), reasons };
 }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     const { farmId, soilType, weather } = await req.json();
 
     if (!soilType) {
       return new Response(
         JSON.stringify({ error: 'Soil type is required' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Default weather if not provided
     const weatherData = weather || { temperature: 25, humidity: 60, rainProbability: 30 };
 
     // Calculate recommendations for all crops
     const recommendations: CropRecommendation[] = [];
 
     for (const [cropId, cropData] of Object.entries(CROP_DATABASE)) {
       const { score, reasons } = calculateSuitabilityScore(cropData, soilType, weatherData);
       
       if (score >= 40) { // Only recommend crops with decent suitability
         recommendations.push({
           id: cropId,
           crop_name: cropData.name,
           suitability_score: score,
           reason: reasons.join('. '),
           season: cropData.seasons[0],
         });
       }
     }
 
     // Sort by score descending
     recommendations.sort((a, b) => b.suitability_score - a.suitability_score);
 
     // Store recommendations if farmId provided
     if (farmId) {
       // Get user_id from the request auth
       const authHeader = req.headers.get('Authorization');
       if (authHeader) {
         const token = authHeader.replace('Bearer ', '');
         const { data: { user } } = await supabase.auth.getUser(token);
         
         if (user) {
           // Delete old recommendations for this farm
           await supabase
             .from('crop_recommendations')
             .delete()
             .eq('farm_id', farmId)
             .eq('user_id', user.id);
 
           // Insert new recommendations
           const toInsert = recommendations.slice(0, 6).map(rec => ({
             farm_id: farmId,
             user_id: user.id,
             crop_name: rec.crop_name,
             suitability_score: rec.suitability_score,
             reason: rec.reason,
             season: rec.season,
           }));
 
           if (toInsert.length > 0) {
             await supabase.from('crop_recommendations').insert(toInsert);
           }
         }
       }
     }
 
     console.log(`Generated ${recommendations.length} crop recommendations for ${soilType} soil`);
 
     return new Response(
       JSON.stringify({ recommendations: recommendations.slice(0, 6) }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error) {
     console.error('Error generating recommendations:', error);
     return new Response(
       JSON.stringify({ error: 'Failed to generate recommendations' }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });