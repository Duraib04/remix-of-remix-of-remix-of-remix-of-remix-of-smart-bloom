import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const languageInstructions: Record<string, string> = {
  en: "Respond in simple English. Use short sentences a farmer can understand.",
  ta: "தமிழில் பதிலளிக்கவும். விவசாயி புரிந்துகொள்ளும் எளிய வாக்கியங்களைப் பயன்படுத்தவும்.",
  tanglish: "Respond in Tanglish (Tamil words written in English letters). Keep it simple for farmers. Example: 'Itha oru fungal disease. Copper spray adikanum.'",
  hi: "हिंदी में जवाब दें। किसान समझ सके ऐसी सरल भाषा में लिखें।",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { imageBase64, scanType, language, farmContext } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lang = language || 'en';
    const langInstruction = languageInstructions[lang] || languageInstructions.en;

    const scanTypePrompts: Record<string, string> = {
      crop: "Identify this crop or plant. Tell me its name, health status, and any issues you see.",
      pest: "Look for any pests or insects on this plant. Identify them and suggest how to control them.",
      disease: "Check this plant for any disease. Identify the disease, how serious it is, and how to treat it.",
      soil: "Analyze this soil image. Tell me about soil type, quality, and what crops would grow well.",
      general: "Analyze this farming-related image. Identify what you see and give useful farming advice.",
    };

    const typePrompt = scanTypePrompts[scanType] || scanTypePrompts.general;

    const systemPrompt = `You are a farming expert AI assistant helping Indian farmers.

RULES:
- Do NOT use markdown formatting
- Do NOT use asterisks, hash symbols, or bullet points
- Do NOT use bold, italic, or any special formatting
- Write in plain text only with simple punctuation
- Keep sentences short and clear
- ${langInstruction}

Your response MUST follow this exact structure (use these exact labels):

IDENTIFIED: [Name of what you identified]
CONFIDENCE: [High/Medium/Low]
CATEGORY: [crop/pest/disease/soil/plant]
SEVERITY: [None/Low/Medium/High] (skip if not applicable)

ANALYSIS:
[2-3 sentences describing what you found]

RECOMMENDATIONS:
[List 3-5 practical actions the farmer should take, each on a new line, numbered 1 2 3]

TIPS:
[1-2 additional helpful tips]`;

    const userContent = [
      { type: "text", text: typePrompt },
      {
        type: "image_url",
        image_url: { url: imageBase64 }
      }
    ];

    if (farmContext?.soilType) {
      userContent[0] = {
        type: "text",
        text: `${typePrompt}\n\nFarm context: Soil type is ${farmContext.soilType}. Location: ${farmContext.location || 'India'}.`
      };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment.", errorCode: "RATE_LIMITED" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable.", errorCode: "CREDITS_EXHAUSTED" }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway returned ${response.status}`);
    }

    const aiData = await response.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";

    // Parse structured response
    const parseField = (text: string, field: string): string => {
      const regex = new RegExp(`${field}:\\s*(.+?)(?=\\n[A-Z]+:|$)`, 's');
      const match = text.match(regex);
      return match ? match[1].trim() : "";
    };

    const identified = parseField(rawText, "IDENTIFIED");
    const confidence = parseField(rawText, "CONFIDENCE");
    const category = parseField(rawText, "CATEGORY");
    const severity = parseField(rawText, "SEVERITY");
    const analysis = parseField(rawText, "ANALYSIS");
    const recommendations = parseField(rawText, "RECOMMENDATIONS")
      .split(/\n/)
      .map(r => r.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(r => r.length > 0);
    const tips = parseField(rawText, "TIPS")
      .split(/\n/)
      .map(t => t.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(t => t.length > 0);

    const result = {
      identified: {
        name: identified || "Unknown",
        confidence: confidence.toLowerCase().includes("high") ? 0.9 : confidence.toLowerCase().includes("medium") ? 0.7 : 0.5,
        confidenceLabel: confidence || "Medium",
        category: category.toLowerCase() || scanType || "general",
      },
      analysis: analysis || rawText,
      severity: severity || "None",
      recommendations,
      tips,
      rawText,
    };

    // Store scan in history if user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          await supabase.from('scan_history').insert({
            user_id: user.id,
            farm_id: farmContext?.farmId || null,
            image_url: 'stored_locally',
            scan_type: scanType || 'general',
            result,
            language: lang,
          });
        }
      } catch (dbErr) {
        console.error("Failed to save scan history:", dbErr);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Image analyzer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze image. Please try again." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
