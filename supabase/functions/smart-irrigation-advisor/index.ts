 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 interface IrrigationDecision {
   shouldIrrigate: boolean;
   confidence: number;
   optimalTime: string;
   duration: number;
   waterVolume: number;
   reasoning: string[];
   factors: {
     name: string;
     value: number | string;
     impact: 'positive' | 'negative' | 'neutral';
   }[];
 }
 
 // Soil water retention properties (field capacity %)
 const SOIL_WATER_RETENTION: Record<string, number> = {
   clay: 40,
   sandy: 15,
   loamy: 30,
   silt: 35,
   peat: 60,
   chalky: 20,
   black: 45,
   red: 25,
   alluvial: 35,
 };
 
 // Calculate evapotranspiration (simplified Hargreaves equation)
 function calculateET(tempMax: number, tempMin: number, avgTemp: number): number {
   const tempRange = tempMax - tempMin;
   const et = 0.0023 * (avgTemp + 17.8) * Math.sqrt(tempRange) * 0.408;
   return Math.max(0, et);
 }
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     const { farmId, sensorData, weather, soilType } = await req.json();
 
     if (!farmId) {
       return new Response(
         JSON.stringify({ error: 'Farm ID is required' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const factors: IrrigationDecision['factors'] = [];
     const reasoning: string[] = [];
     let irrigationScore = 50; // Start at neutral
 
     // Factor 1: Current Soil Moisture
     const currentMoisture = sensorData?.soil_moisture ?? 0;
     const optimalMoisture = SOIL_WATER_RETENTION[soilType?.toLowerCase() || 'loamy'] || 30;
     
     if (currentMoisture < optimalMoisture * 0.6) {
       irrigationScore += 30;
       factors.push({ name: 'Soil Moisture', value: `${currentMoisture}%`, impact: 'negative' });
       reasoning.push(`Soil moisture (${currentMoisture}%) is below optimal level (${optimalMoisture}%)`);
     } else if (currentMoisture < optimalMoisture) {
       irrigationScore += 15;
       factors.push({ name: 'Soil Moisture', value: `${currentMoisture}%`, impact: 'neutral' });
       reasoning.push('Soil moisture is approaching minimum threshold');
     } else {
       irrigationScore -= 20;
       factors.push({ name: 'Soil Moisture', value: `${currentMoisture}%`, impact: 'positive' });
       reasoning.push('Soil moisture is adequate');
     }
 
     // Factor 2: Rain Probability
     const rainProbability = weather?.rainProbability ?? 0;
     if (rainProbability > 70) {
       irrigationScore -= 40;
       factors.push({ name: 'Rain Forecast', value: `${rainProbability}%`, impact: 'positive' });
       reasoning.push(`High rain probability (${rainProbability}%) - irrigation not recommended`);
     } else if (rainProbability > 40) {
       irrigationScore -= 15;
       factors.push({ name: 'Rain Forecast', value: `${rainProbability}%`, impact: 'neutral' });
       reasoning.push('Moderate rain expected - reduce irrigation');
     } else {
       factors.push({ name: 'Rain Forecast', value: `${rainProbability}%`, impact: 'neutral' });
     }
 
     // Factor 3: Temperature & ET
     const temperature = sensorData?.temperature ?? weather?.temperature ?? 25;
     const humidity = sensorData?.humidity ?? weather?.humidity ?? 60;
     const et = calculateET(temperature + 5, temperature - 5, temperature);
     
     if (temperature > 35) {
       irrigationScore += 15;
       factors.push({ name: 'Temperature', value: `${temperature}°C`, impact: 'negative' });
       reasoning.push('High temperature increases water demand');
     } else if (temperature < 15) {
       irrigationScore -= 10;
       factors.push({ name: 'Temperature', value: `${temperature}°C`, impact: 'positive' });
       reasoning.push('Low temperature reduces water needs');
     } else {
       factors.push({ name: 'Temperature', value: `${temperature}°C`, impact: 'neutral' });
     }
 
     // Factor 4: Time of Day
     const currentHour = new Date().getHours();
     let optimalTime = '6:00 AM';
     if (currentHour >= 10 && currentHour <= 16) {
       irrigationScore -= 10;
       factors.push({ name: 'Time of Day', value: 'Midday', impact: 'negative' });
       reasoning.push('Avoid midday irrigation - high evaporation');
       optimalTime = 'Early morning (5-7 AM) or evening (6-8 PM)';
     } else if (currentHour >= 5 && currentHour <= 8) {
       irrigationScore += 5;
       factors.push({ name: 'Time of Day', value: 'Morning', impact: 'positive' });
       optimalTime = 'Now (optimal morning window)';
     } else if (currentHour >= 18 && currentHour <= 20) {
       factors.push({ name: 'Time of Day', value: 'Evening', impact: 'positive' });
       optimalTime = 'Now (evening window)';
     }
 
     // Factor 5: Water Tank Level
     const waterLevel = sensorData?.water_level ?? 100;
     if (waterLevel < 20) {
       irrigationScore -= 30;
       factors.push({ name: 'Water Tank', value: `${waterLevel}%`, impact: 'negative' });
       reasoning.push('Low water tank level - conserve water');
     } else if (waterLevel < 50) {
       irrigationScore -= 10;
       factors.push({ name: 'Water Tank', value: `${waterLevel}%`, impact: 'neutral' });
     } else {
       factors.push({ name: 'Water Tank', value: `${waterLevel}%`, impact: 'positive' });
     }
 
     // Calculate final decision
     const confidence = Math.min(95, Math.max(40, irrigationScore));
     const shouldIrrigate = irrigationScore > 50;
     
     // Calculate duration based on moisture deficit
     const moistureDeficit = Math.max(0, optimalMoisture - currentMoisture);
     const duration = shouldIrrigate ? Math.ceil((moistureDeficit / 10) * 5 + 5) : 0; // 5-20 minutes
     const waterVolume = duration * 2; // ~2 liters per minute
 
     const decision: IrrigationDecision = {
       shouldIrrigate,
       confidence,
       optimalTime,
       duration,
       waterVolume,
       reasoning,
       factors,
     };
 
     // Store AI decision for learning
     const authHeader = req.headers.get('Authorization');
     if (authHeader) {
       const token = authHeader.replace('Bearer ', '');
       const { data: { user } } = await supabase.auth.getUser(token);
       
       if (user) {
         await supabase.from('ai_decisions').insert({
           farm_id: farmId,
           user_id: user.id,
           decision_type: 'irrigation',
           input_data: { sensorData, weather, soilType },
           output_data: decision,
           confidence_score: confidence,
         });
       }
     }
 
     console.log(`Irrigation decision for farm ${farmId}: ${shouldIrrigate ? 'IRRIGATE' : 'SKIP'} (${confidence}% confidence)`);
 
     return new Response(
       JSON.stringify(decision),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error) {
     console.error('Smart irrigation advisor error:', error);
     return new Response(
       JSON.stringify({ error: 'Failed to generate irrigation advice' }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });