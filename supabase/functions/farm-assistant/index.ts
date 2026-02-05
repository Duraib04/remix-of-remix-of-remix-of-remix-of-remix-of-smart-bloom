import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
     const { message, language, farmId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
     const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
     const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

     if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
       throw new Error('Supabase credentials not configured');
     }
 
     const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
 
    console.log(`Received question in ${language}: ${message}`);

     // Fetch real sensor data from database
     let sensorData = {
       soil_moisture: 0,
       temperature: 0,
       humidity: 0,
       ph_level: 0,
       water_level: 0,
       pump_status: false,
     };
 
     if (farmId) {
       const { data: readings, error: readError } = await supabase
         .from('sensor_readings')
         .select('*')
         .eq('farm_id', farmId)
         .order('created_at', { ascending: false })
         .limit(1);
 
       if (!readError && readings && readings.length > 0) {
         sensorData = readings[0];
         console.log('Using real sensor data:', sensorData);
       } else {
         console.log('No sensor data found, using defaults');
       }
     }

     // Build dynamic farm data string
     const farmDataString = `
 Current farm sensor data (REAL-TIME from sensors):
 - Soil moisture: ${sensorData.soil_moisture || 0}%
 - Temperature: ${sensorData.temperature || 0}°C
 - Air humidity: ${sensorData.humidity || 0}%
 - pH level: ${sensorData.ph_level || 'not measured'}
 - Water tank level: ${sensorData.water_level || 0}%
 - Pump status: ${sensorData.pump_status ? 'ON (running)' : 'OFF (stopped)'}
 `;

     // Language-specific system prompts for farmer-friendly responses
     const languagePrompts: Record<string, string> = {
       en: `You are a friendly farming assistant for Indian farmers. Speak in simple, easy-to-understand English. 
 You help farmers with:
 - Weather predictions and rain forecasts
 - Irrigation advice based on soil moisture
 - Crop health tips
 - Water conservation tips
 ${farmDataString}
 If sensor data shows 0, mention that sensors may not be connected yet or no readings received.
 Keep answers short, practical, and helpful. Use simple words a village farmer would understand.`,

       ta: `நீங்கள் இந்திய விவசாயிகளுக்கான நட்பான விவசாய உதவியாளர். எளிய, புரிந்துகொள்ள எளிதான தமிழில் பேசுங்கள்.
 விவசாயிகளுக்கு உதவுங்கள்:
 - வானிலை கணிப்பு மற்றும் மழை முன்னறிவிப்பு
 - மண் ஈரப்பதத்தின் அடிப்படையில் நீர்ப்பாசன ஆலோசனை
 - பயிர் ஆரோக்கிய குறிப்புகள்
 - நீர் சேமிப்பு குறிப்புகள்
 ${farmDataString}
 சென்சார் தரவு 0 காட்டினால், சென்சார்கள் இன்னும் இணைக்கப்படவில்லை என்று குறிப்பிடவும்.
 பதில்கள் சுருக்கமாகவும், நடைமுறை சார்ந்ததாகவும், உதவிகரமாகவும் இருக்க வேண்டும்.`,
 
       tanglish: `Nee oru friendly farming assistant for Indian farmers. Simple, easy-a puriyura Tanglish-la pesu.
 Farmers-ku help pannu:
 - Weather predictions and mazhai forecasts
 - Soil moisture based-la irrigation advice
 - Crop health tips
 - Thanneer save panna tips
 ${farmDataString}
 Sensor data 0 kaatinaa, sensors connect aagala-nu sollu.
 Answers short-a, practical-a, helpful-a irukanum. Village farmer puriyura mathiri simple words use pannu.`,
 
       hi: `आप भारतीय किसानों के लिए एक दोस्ताना खेती सहायक हैं। सरल, समझने में आसान हिंदी में बोलें।
 किसानों की मदद करें:
 - मौसम भविष्यवाणी और बारिश पूर्वानुमान
 - मिट्टी की नमी के आधार पर सिंचाई सलाह
 - फसल स्वास्थ्य टिप्स
 - पानी बचाने के टिप्स
 ${farmDataString}
 यदि सेंसर डेटा 0 दिखाता है, तो बताएं कि सेंसर अभी कनेक्ट नहीं हुए हैं।
 जवाब छोटे, व्यावहारिक और मददगार रखें। गाँव के किसान समझ सकें ऐसे सरल शब्द इस्तेमाल करें।`,
    };

    const systemPrompt = languagePrompts[language] || languagePrompts.en;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Too many requests. Please wait and try again.',
          errorCode: 'RATE_LIMITED'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted. Please add more credits.',
          errorCode: 'CREDITS_EXHAUSTED'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not understand. Please try again.';

    console.log('AI Response:', aiResponse);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Farm assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});