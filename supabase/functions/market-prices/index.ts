import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { crops, language } = await req.json();
    const cropList = crops || ['rice', 'wheat', 'cotton', 'tomato', 'onion'];
    const lang = language || 'en';

    const today = new Date();
    const currentMonth = today.toLocaleString('en', { month: 'long' });
    const currentYear = today.getFullYear();

    const systemPrompt = `You are an Indian agricultural market data analyst. Provide REALISTIC current mandi prices for Indian crops.

RULES:
- Use realistic Indian mandi prices in INR per quintal
- Base prices on typical Indian wholesale market (APMC/mandi) rates for ${currentMonth} ${currentYear}
- Include seasonal variations and current market conditions
- MSP (Minimum Support Price) should reflect actual government MSP rates

You MUST respond with ONLY valid JSON, no markdown, no explanation.`;

    const userPrompt = `Give me current market data for these crops: ${cropList.join(', ')}

Return JSON in this exact format:
{
  "prices": [
    {
      "crop": "rice",
      "currentPrice": 2450,
      "msp": 2320,
      "weekAgoPrice": 2400,
      "monthAgoPrice": 2350,
      "trend": "up",
      "priceRange": {"min": 2200, "max": 2700},
      "topMandis": [
        {"name": "Karnal", "state": "Haryana", "price": 2500},
        {"name": "Nizamabad", "state": "Telangana", "price": 2450}
      ],
      "forecast": "Prices expected to rise 3-5% in next 2 weeks due to festival demand",
      "lastUpdated": "${today.toISOString().split('T')[0]}"
    }
  ],
  "marketSummary": "Brief 1-2 sentence overall market summary"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_market_data",
            description: "Return structured market price data for crops",
            parameters: {
              type: "object",
              properties: {
                prices: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      crop: { type: "string" },
                      currentPrice: { type: "number" },
                      msp: { type: "number" },
                      weekAgoPrice: { type: "number" },
                      monthAgoPrice: { type: "number" },
                      trend: { type: "string", enum: ["up", "down", "stable"] },
                      priceRange: {
                        type: "object",
                        properties: {
                          min: { type: "number" },
                          max: { type: "number" }
                        },
                        required: ["min", "max"]
                      },
                      topMandis: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            state: { type: "string" },
                            price: { type: "number" }
                          },
                          required: ["name", "state", "price"]
                        }
                      },
                      forecast: { type: "string" },
                      lastUpdated: { type: "string" }
                    },
                    required: ["crop", "currentPrice", "msp", "weekAgoPrice", "monthAgoPrice", "trend", "priceRange", "topMandis", "forecast", "lastUpdated"]
                  }
                },
                marketSummary: { type: "string" }
              },
              required: ["prices", "marketSummary"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_market_data" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI Gateway returned ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let marketData;
    if (toolCall?.function?.arguments) {
      marketData = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
    } else {
      // Fallback: try parsing from content
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        marketData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse market data from AI response");
      }
    }

    return new Response(JSON.stringify(marketData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Market prices error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch market prices. Please try again." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
