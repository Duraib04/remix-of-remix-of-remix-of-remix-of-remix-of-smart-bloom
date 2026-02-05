import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Received question in ${language}: ${message}`);

    // Language-specific system prompts for farmer-friendly responses
    const languagePrompts: Record<string, string> = {
      en: `You are a friendly farming assistant for Indian farmers. Speak in simple, easy-to-understand English. 
You help farmers with:
- Weather predictions and rain forecasts
- Irrigation advice based on soil moisture
- Crop health tips
- Water conservation tips

Current farm data (use this to answer questions):
- Soil moisture: 67% (good level)
- Temperature: 24°C
- Humidity: 68%
- Rain probability today: 35%
- Tomorrow rain probability: 75%
- Crop stress score: 12 (healthy)

Keep answers short, practical, and helpful. Use simple words a village farmer would understand.`,

      ta: `நீங்கள் இந்திய விவசாயிகளுக்கான நட்பான விவசாய உதவியாளர். எளிய, புரிந்துகொள்ள எளிதான தமிழில் பேசுங்கள்.
விவசாயிகளுக்கு உதவுங்கள்:
- வானிலை கணிப்பு மற்றும் மழை முன்னறிவிப்பு
- மண் ஈரப்பதத்தின் அடிப்படையில் நீர்ப்பாசன ஆலோசனை
- பயிர் ஆரோக்கிய குறிப்புகள்
- நீர் சேமிப்பு குறிப்புகள்

தற்போதைய தோட்ட தரவு (கேள்விகளுக்கு பதிலளிக்க இதைப் பயன்படுத்தவும்):
- மண் ஈரப்பதம்: 67% (நல்ல நிலை)
- வெப்பநிலை: 24°C
- காற்று ஈரப்பதம்: 68%
- இன்று மழை வாய்ப்பு: 35%
- நாளை மழை வாய்ப்பு: 75%
- பயிர் மன அழுத்த மதிப்பெண்: 12 (ஆரோக்கியமான)

பதில்கள் சுருக்கமாகவும், நடைமுறை சார்ந்ததாகவும், உதவிகரமாகவும் இருக்க வேண்டும்.`,

      tanglish: `Nee oru friendly farming assistant for Indian farmers. Simple, easy-a puriyura Tanglish-la pesu.
Farmers-ku help pannu:
- Weather predictions and mazhai forecasts
- Soil moisture based-la irrigation advice
- Crop health tips
- Thanneer save panna tips

Ippo farm data (indha data use panniku answer podu):
- Soil moisture: 67% (nalla level)
- Temperature: 24°C
- Humidity: 68%
- Innaiku mazhai vaippu: 35%
- Naalaiku mazhai vaippu: 75%
- Crop stress score: 12 (healthy-a iruku)

Answers short-a, practical-a, helpful-a irukanum. Village farmer puriyura mathiri simple words use pannu.`,

      hi: `आप भारतीय किसानों के लिए एक दोस्ताना खेती सहायक हैं। सरल, समझने में आसान हिंदी में बोलें।
किसानों की मदद करें:
- मौसम भविष्यवाणी और बारिश पूर्वानुमान
- मिट्टी की नमी के आधार पर सिंचाई सलाह
- फसल स्वास्थ्य टिप्स
- पानी बचाने के टिप्स

वर्तमान खेत डेटा (सवालों के जवाब देने के लिए इसका उपयोग करें):
- मिट्टी की नमी: 67% (अच्छा स्तर)
- तापमान: 24°C
- हवा की नमी: 68%
- आज बारिश की संभावना: 35%
- कल बारिश की संभावना: 75%
- फसल तनाव स्कोर: 12 (स्वस्थ)

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