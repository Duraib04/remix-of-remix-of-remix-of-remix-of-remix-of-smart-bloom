 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 interface HealthAnalysis {
   overallScore: number;
   status: 'optimal' | 'good' | 'warning' | 'critical';
   factors: {
     name: string;
     score: number;
     status: 'optimal' | 'warning' | 'critical';
     recommendation: string;
   }[];
   alerts: string[];
   recommendations: string[];
 }
 
 // Optimal ranges for different parameters
 const OPTIMAL_RANGES = {
   soil_moisture: { min: 40, max: 70, unit: '%' },
   temperature: { min: 20, max: 32, unit: '°C' },
   humidity: { min: 50, max: 80, unit: '%' },
   ph_level: { min: 6.0, max: 7.5, unit: 'pH' },
   nitrogen: { min: 20, max: 50, unit: 'mg/kg' },
   phosphorus: { min: 15, max: 40, unit: 'mg/kg' },
   potassium: { min: 100, max: 200, unit: 'mg/kg' },
 };
 
 function calculateFactorScore(value: number | null, range: { min: number; max: number }): { score: number; status: 'optimal' | 'warning' | 'critical' } {
   if (value === null || value === 0) {
     return { score: 0, status: 'warning' };
   }
   
   const midpoint = (range.min + range.max) / 2;
   const rangeWidth = range.max - range.min;
   
   if (value >= range.min && value <= range.max) {
     // Within optimal range
     const distanceFromMid = Math.abs(value - midpoint);
     const score = 100 - (distanceFromMid / (rangeWidth / 2)) * 20;
     return { score: Math.round(score), status: 'optimal' };
   } else if (value < range.min) {
     // Below optimal
     const deviation = (range.min - value) / range.min;
     if (deviation > 0.3) {
       return { score: Math.max(20, 50 - deviation * 100), status: 'critical' };
     }
     return { score: Math.round(60 - deviation * 40), status: 'warning' };
   } else {
     // Above optimal
     const deviation = (value - range.max) / range.max;
     if (deviation > 0.3) {
       return { score: Math.max(20, 50 - deviation * 100), status: 'critical' };
     }
     return { score: Math.round(60 - deviation * 40), status: 'warning' };
   }
 }
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     const { farmId, sensorData } = await req.json();
 
     if (!farmId) {
       return new Response(
         JSON.stringify({ error: 'Farm ID is required' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const factors: HealthAnalysis['factors'] = [];
     const alerts: string[] = [];
     const recommendations: string[] = [];
 
     // Analyze Soil Moisture
     const moistureResult = calculateFactorScore(sensorData?.soil_moisture, OPTIMAL_RANGES.soil_moisture);
     factors.push({
       name: 'Soil Moisture',
       score: moistureResult.score,
       status: moistureResult.status,
       recommendation: moistureResult.status === 'critical' 
         ? 'Urgent: Irrigate immediately' 
         : moistureResult.status === 'warning' 
           ? 'Consider light irrigation'
           : 'Moisture level optimal',
     });
     if (moistureResult.status === 'critical') {
       alerts.push('Critical: Soil moisture dangerously low');
       recommendations.push('Start irrigation immediately to prevent crop stress');
     }
 
     // Analyze Temperature
     const tempResult = calculateFactorScore(sensorData?.temperature, OPTIMAL_RANGES.temperature);
     factors.push({
       name: 'Temperature',
       score: tempResult.score,
       status: tempResult.status,
       recommendation: tempResult.status === 'critical'
         ? sensorData?.temperature > 32 ? 'Provide shade or misting' : 'Consider frost protection'
         : 'Temperature acceptable',
     });
     if (tempResult.status === 'critical' && sensorData?.temperature > 35) {
       alerts.push('Heat stress warning: Temperature too high');
       recommendations.push('Increase irrigation frequency during hot periods');
     }
 
     // Analyze Humidity
     const humidityResult = calculateFactorScore(sensorData?.humidity, OPTIMAL_RANGES.humidity);
     factors.push({
       name: 'Air Humidity',
       score: humidityResult.score,
       status: humidityResult.status,
       recommendation: humidityResult.status !== 'optimal' ? 'Monitor for fungal diseases' : 'Humidity optimal',
     });
 
     // Analyze pH Level
     if (sensorData?.ph_level) {
       const phResult = calculateFactorScore(sensorData.ph_level, OPTIMAL_RANGES.ph_level);
       factors.push({
         name: 'Soil pH',
         score: phResult.score,
         status: phResult.status,
         recommendation: phResult.status !== 'optimal'
           ? sensorData.ph_level < 6 ? 'Add lime to raise pH' : 'Add sulfur to lower pH'
           : 'pH level optimal',
       });
       if (phResult.status === 'critical') {
         alerts.push('Soil pH outside optimal range');
         recommendations.push('Consider soil amendment to adjust pH');
       }
     }
 
     // Analyze Nutrients (NPK)
     if (sensorData?.nitrogen) {
       const nResult = calculateFactorScore(sensorData.nitrogen, OPTIMAL_RANGES.nitrogen);
       factors.push({
         name: 'Nitrogen (N)',
         score: nResult.score,
         status: nResult.status,
         recommendation: nResult.status !== 'optimal' ? 'Apply nitrogen fertilizer' : 'Nitrogen level good',
       });
     }
 
     if (sensorData?.phosphorus) {
       const pResult = calculateFactorScore(sensorData.phosphorus, OPTIMAL_RANGES.phosphorus);
       factors.push({
         name: 'Phosphorus (P)',
         score: pResult.score,
         status: pResult.status,
         recommendation: pResult.status !== 'optimal' ? 'Apply phosphorus fertilizer' : 'Phosphorus level good',
       });
     }
 
     if (sensorData?.potassium) {
       const kResult = calculateFactorScore(sensorData.potassium, OPTIMAL_RANGES.potassium);
       factors.push({
         name: 'Potassium (K)',
         score: kResult.score,
         status: kResult.status,
         recommendation: kResult.status !== 'optimal' ? 'Apply potassium fertilizer' : 'Potassium level good',
       });
     }
 
     // Calculate overall score
     const validFactors = factors.filter(f => f.score > 0);
     const overallScore = validFactors.length > 0
       ? Math.round(validFactors.reduce((sum, f) => sum + f.score, 0) / validFactors.length)
       : 0;
 
     let status: HealthAnalysis['status'];
     if (overallScore >= 80) status = 'optimal';
     else if (overallScore >= 60) status = 'good';
     else if (overallScore >= 40) status = 'warning';
     else status = 'critical';
 
     // Add general recommendations based on status
     if (status === 'optimal') {
       recommendations.push('Your farm conditions are excellent. Maintain current practices.');
     } else if (status === 'good') {
       recommendations.push('Farm conditions are good. Minor adjustments may improve yields.');
     } else if (status === 'warning') {
       recommendations.push('Several factors need attention. Review individual recommendations.');
     }
 
     const analysis: HealthAnalysis = {
       overallScore,
       status,
       factors,
       alerts,
       recommendations,
     };
 
     // Store AI decision
     const authHeader = req.headers.get('Authorization');
     if (authHeader) {
       const token = authHeader.replace('Bearer ', '');
       const { data: { user } } = await supabase.auth.getUser(token);
       
       if (user) {
         await supabase.from('ai_decisions').insert({
           farm_id: farmId,
           user_id: user.id,
           decision_type: 'health',
           input_data: { sensorData },
           output_data: analysis,
           confidence_score: overallScore,
         });
       }
     }
 
     console.log(`Health analysis for farm ${farmId}: ${status} (${overallScore}%)`);
 
     return new Response(
       JSON.stringify(analysis),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error) {
     console.error('Crop health analyzer error:', error);
     return new Response(
       JSON.stringify({ error: 'Failed to analyze crop health' }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });