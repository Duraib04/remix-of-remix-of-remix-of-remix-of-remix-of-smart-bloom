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

// Crop name translations
const CROP_NAMES: Record<string, Record<string, string>> = {
  en: {
    rice: "Rice (Paddy)", wheat: "Wheat", cotton: "Cotton", sugarcane: "Sugarcane",
    groundnut: "Groundnut (Peanut)", maize: "Maize (Corn)", tomato: "Tomato",
    onion: "Onion", potato: "Potato", chilli: "Chilli (Pepper)", banana: "Banana", mango: "Mango"
  },
  ta: {
    rice: "நெல் (அரிசி)", wheat: "கோதுமை", cotton: "பருத்தி", sugarcane: "கரும்பு",
    groundnut: "நிலக்கடலை", maize: "மக்காச்சோளம்", tomato: "தக்காளி",
    onion: "வெங்காயம்", potato: "உருளைக்கிழங்கு", chilli: "மிளகாய்", banana: "வாழை", mango: "மாம்பழம்"
  },
  tanglish: {
    rice: "Rice (Nel)", wheat: "Wheat (Gothumai)", cotton: "Cotton (Paruthi)", sugarcane: "Sugarcane (Karumbu)",
    groundnut: "Groundnut (Verkadalai)", maize: "Maize (Makka Cholam)", tomato: "Tomato (Thakkali)",
    onion: "Onion (Vengayam)", potato: "Potato (Urulai)", chilli: "Chilli (Milagai)", banana: "Banana (Vazhai)", mango: "Mango (Mambazham)"
  },
  hi: {
    rice: "चावल (धान)", wheat: "गेहूं", cotton: "कपास", sugarcane: "गन्ना",
    groundnut: "मूंगफली", maize: "मक्का", tomato: "टमाटर",
    onion: "प्याज", potato: "आलू", chilli: "मिर्च", banana: "केला", mango: "आम"
  }
};

// Season translations
const SEASON_NAMES: Record<string, Record<string, string>> = {
  en: { "Monsoon": "Monsoon", "Kharif": "Kharif", "Winter": "Winter", "Rabi": "Rabi", "Summer": "Summer", "All Year": "All Year" },
  ta: { "Monsoon": "பருவமழை", "Kharif": "கரீஃப்", "Winter": "குளிர்காலம்", "Rabi": "ரபி", "Summer": "கோடை", "All Year": "ஆண்டு முழுவதும்" },
  tanglish: { "Monsoon": "Mazhai Kaalam", "Kharif": "Kharif", "Winter": "Winter", "Rabi": "Rabi", "Summer": "Summer", "All Year": "Varudam Muzhudum" },
  hi: { "Monsoon": "मानसून", "Kharif": "खरीफ", "Winter": "सर्दी", "Rabi": "रबी", "Summer": "गर्मी", "All Year": "पूरे साल" }
};

// Reason translations
const REASON_TRANS: Record<string, Record<string, string>> = {
  en: {
    soilMatch: "Excellent soil match for {soil} soil",
    canGrow: "Can grow in {soil} with care",
    idealTemp: "Ideal temperature range ({min}-{max}°C)",
    acceptableTemp: "Acceptable temperature, prefer {min}-{max}°C",
    tempOutside: "Temperature outside optimal range",
    monitorRain: "Monitor rain levels",
    highRain: "High rain may affect growth"
  },
  ta: {
    soilMatch: "{soil} மண்ணுக்கு சிறந்த பொருத்தம்",
    canGrow: "{soil} மண்ணில் கவனத்துடன் வளர்க்கலாம்",
    idealTemp: "சரியான வெப்பநிலை ({min}-{max}°C)",
    acceptableTemp: "ஏற்றுக்கொள்ளக்கூடியது, {min}-{max}°C விரும்பப்படுகிறது",
    tempOutside: "வெப்பநிலை சரியான வரம்பிற்கு வெளியே",
    monitorRain: "மழை அளவை கண்காணிக்கவும்",
    highRain: "அதிக மழை வளர்ச்சியை பாதிக்கலாம்"
  },
  tanglish: {
    soilMatch: "{soil} soil-ku super match",
    canGrow: "{soil} soil-la careful-a valarkalam",
    idealTemp: "Perfect temperature range ({min}-{max}°C)",
    acceptableTemp: "Ok temperature, {min}-{max}°C better",
    tempOutside: "Temperature optimal range-ku veliya iruku",
    monitorRain: "Rain-a watch pannunga",
    highRain: "Adhiga mazhai growth-a affect pannalaam"
  },
  hi: {
    soilMatch: "{soil} मिट्टी के लिए उत्कृष्ट मेल",
    canGrow: "{soil} मिट्टी में देखभाल से उगा सकते हैं",
    idealTemp: "आदर्श तापमान सीमा ({min}-{max}°C)",
    acceptableTemp: "स्वीकार्य तापमान, {min}-{max}°C बेहतर",
    tempOutside: "तापमान इष्टतम सीमा से बाहर",
    monitorRain: "बारिश के स्तर पर नज़र रखें",
    highRain: "अधिक बारिश विकास को प्रभावित कर सकती है"
  }
};

// Crop database with soil and weather requirements
const CROP_DATABASE: Record<string, {
  soilTypes: string[];
  tempRange: [number, number];
  humidityRange: [number, number];
  rainTolerance: number;
  seasons: string[];
}> = {
  rice: { soilTypes: ["clay", "alluvial", "loamy"], tempRange: [20, 35], humidityRange: [60, 90], rainTolerance: 90, seasons: ["Monsoon", "Kharif"] },
  wheat: { soilTypes: ["loamy", "clay", "alluvial"], tempRange: [10, 25], humidityRange: [40, 70], rainTolerance: 50, seasons: ["Winter", "Rabi"] },
  cotton: { soilTypes: ["black", "alluvial", "loamy"], tempRange: [20, 35], humidityRange: [50, 70], rainTolerance: 60, seasons: ["Summer", "Kharif"] },
  sugarcane: { soilTypes: ["loamy", "alluvial", "clay"], tempRange: [20, 35], humidityRange: [60, 80], rainTolerance: 80, seasons: ["All Year"] },
  groundnut: { soilTypes: ["sandy", "loamy", "red"], tempRange: [20, 30], humidityRange: [40, 60], rainTolerance: 50, seasons: ["Summer", "Kharif"] },
  maize: { soilTypes: ["loamy", "alluvial", "sandy"], tempRange: [18, 30], humidityRange: [50, 80], rainTolerance: 70, seasons: ["Monsoon", "Kharif"] },
  tomato: { soilTypes: ["loamy", "sandy", "red"], tempRange: [15, 30], humidityRange: [50, 70], rainTolerance: 50, seasons: ["All Year"] },
  onion: { soilTypes: ["loamy", "alluvial", "sandy"], tempRange: [10, 25], humidityRange: [40, 70], rainTolerance: 40, seasons: ["Winter", "Rabi"] },
  potato: { soilTypes: ["loamy", "sandy", "alluvial"], tempRange: [10, 25], humidityRange: [60, 80], rainTolerance: 50, seasons: ["Winter", "Rabi"] },
  chilli: { soilTypes: ["loamy", "sandy", "black"], tempRange: [20, 35], humidityRange: [50, 70], rainTolerance: 60, seasons: ["All Year"] },
  banana: { soilTypes: ["loamy", "alluvial", "clay"], tempRange: [20, 35], humidityRange: [70, 90], rainTolerance: 80, seasons: ["All Year"] },
  mango: { soilTypes: ["loamy", "alluvial", "red"], tempRange: [20, 40], humidityRange: [40, 70], rainTolerance: 60, seasons: ["Summer"] },
};

function calculateSuitabilityScore(
  crop: typeof CROP_DATABASE[string],
  soilType: string,
  weather: { temperature: number; humidity: number; rainProbability: number },
  lang: string
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const rt = REASON_TRANS[lang] || REASON_TRANS.en;

  // Soil compatibility (40 points max)
  if (crop.soilTypes.includes(soilType.toLowerCase())) {
    score += 40;
    reasons.push(rt.soilMatch.replace('{soil}', soilType));
  } else {
    score += 10;
    reasons.push(rt.canGrow.replace('{soil}', soilType));
  }

  // Temperature compatibility (30 points max)
  const [minTemp, maxTemp] = crop.tempRange;
  if (weather.temperature >= minTemp && weather.temperature <= maxTemp) {
    score += 30;
    reasons.push(rt.idealTemp.replace('{min}', String(minTemp)).replace('{max}', String(maxTemp)));
  } else if (weather.temperature >= minTemp - 5 && weather.temperature <= maxTemp + 5) {
    score += 15;
    reasons.push(rt.acceptableTemp.replace('{min}', String(minTemp)).replace('{max}', String(maxTemp)));
  } else {
    reasons.push(rt.tempOutside);
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
    reasons.push(rt.monitorRain);
  } else {
    reasons.push(rt.highRain);
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

    const { farmId, soilType, weather, language = 'en' } = await req.json();

    // Normalize language
    const lang = language === 'tamil' ? 'ta' : language === 'hindi' ? 'hi' : language;
    const cropNames = CROP_NAMES[lang] || CROP_NAMES.en;
    const seasonNames = SEASON_NAMES[lang] || SEASON_NAMES.en;

    if (!soilType) {
      return new Response(
        JSON.stringify({ error: 'Soil type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weatherData = weather || { temperature: 25, humidity: 60, rainProbability: 30 };
    const recommendations: CropRecommendation[] = [];

    for (const [cropId, cropData] of Object.entries(CROP_DATABASE)) {
      const { score, reasons } = calculateSuitabilityScore(cropData, soilType, weatherData, lang);
      
      if (score >= 40) {
        recommendations.push({
          id: cropId,
          crop_name: cropNames[cropId] || cropId,
          suitability_score: score,
          reason: reasons.join('. '),
          season: seasonNames[cropData.seasons[0]] || cropData.seasons[0],
        });
      }
    }

    recommendations.sort((a, b) => b.suitability_score - a.suitability_score);

    // Store recommendations if farmId provided
    if (farmId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          await supabase.from('crop_recommendations').delete().eq('farm_id', farmId).eq('user_id', user.id);
          const toInsert = recommendations.slice(0, 6).map(rec => ({
            farm_id: farmId, user_id: user.id, crop_name: rec.crop_name,
            suitability_score: rec.suitability_score, reason: rec.reason, season: rec.season,
          }));
          if (toInsert.length > 0) await supabase.from('crop_recommendations').insert(toInsert);
        }
      }
    }

    console.log(`Generated ${recommendations.length} crop recommendations for ${soilType} soil in ${lang}`);

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