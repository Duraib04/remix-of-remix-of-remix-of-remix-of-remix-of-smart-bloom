import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'ta' | 'tanglish' | 'hi';

interface Translations {
  // Header
  appName: string;
  smartIrrigation: string;
  systemOnline: string;
  lastSync: string;
  minAgo: string;
  
  // Dashboard
  dashboard: string;
  liveMonitoring: string;
  
  // Metrics
  soilMoisture: string;
  temperature: string;
  humidity: string;
  cropHealth: string;
  waterSaved: string;
  efficiency: string;
  vsLastHour: string;
  
  // Weather
  weather: string;
  rainChance: string;
  wind: string;
  today: string;
   locationNeeded: string;
   allowLocation: string;
   farmLocation: string;
   detectingLocation: string;
   locationError: string;
   unknownLocation: string;
   yourArea: string;
   rainAlert: string;
  
  // Irrigation
  waterControl: string;
  autoMode: string;
  manualMode: string;
  startWatering: string;
  stopWatering: string;
  active: string;
  idle: string;
  nextScheduled: string;
  
  // AI Recommendation
  aiSuggestion: string;
  confidence: string;
  suggestedTime: string;
  
  // System Status
  deviceStatus: string;
  online: string;
  offline: string;
  devicesOnline: string;
  allGood: string;
  needsAttention: string;
  battery: string;
  signal: string;
  lastUpdated: string;
  sensor: string;
  valve: string;
  controller: string;
  
  // Activity Log
  recentActivity: string;
  wateringDone: string;
  
  // Charts
  moistureTrend: string;
  last24Hours: string;
  actualMoisture: string;
  goodLevel: string;
  weeklyWater: string;
  waterUsed: string;
  
  // Voice Assistant
  askQuestion: string;
  voiceAssistant: string;
  tapToSpeak: string;
  listening: string;
  thinking: string;
  speakNow: string;
  
  // Footer
  poweredByAI: string;
  connected: string;
  synced: string;
  
  // Common
  minutes: string;
  liters: string;
  thisWeek: string;
}

const translations: Record<Language, Translations> = {
  en: {
    appName: 'AquaSmart',
    smartIrrigation: 'Smart Watering',
    systemOnline: 'System Working',
    lastSync: 'Last checked',
    minAgo: 'min ago',
    
    dashboard: 'My Farm',
    liveMonitoring: 'Live farm updates',
    
    soilMoisture: 'Soil Wetness',
    temperature: 'Heat Level',
    humidity: 'Air Moisture',
    cropHealth: 'Crop Health',
    waterSaved: 'Water Saved',
    efficiency: 'How Good',
    vsLastHour: 'vs last hour',
    
    weather: 'Weather Today',
    rainChance: 'Rain Chance',
    wind: 'Wind',
    today: 'Today',
     locationNeeded: 'Location access needed for weather',
     allowLocation: 'Allow Location',
     farmLocation: 'Your Farm Location',
     detectingLocation: 'Finding your location...',
     locationError: 'Could not find location',
     unknownLocation: 'Location not set',
     yourArea: 'your area',
     rainAlert: 'Rain Alert!',
    
    waterControl: 'Water Control',
    autoMode: 'Auto',
    manualMode: 'By Hand',
    startWatering: 'Start Watering',
    stopWatering: 'Stop Watering',
    active: 'Watering Now',
    idle: 'Not Watering',
    nextScheduled: 'Next watering at',
    
    aiSuggestion: 'Smart Advice',
    confidence: 'sure',
    suggestedTime: 'Water for',
    
    deviceStatus: 'Device Health',
    online: 'Working',
    offline: 'Not Working',
    devicesOnline: 'devices working',
    allGood: 'All Good!',
    needsAttention: 'Check This',
    battery: 'Battery',
    signal: 'Signal',
    lastUpdated: 'Updated',
    sensor: 'Sensor',
    valve: 'Valve',
    controller: 'Controller',
    
    recentActivity: 'Recent Events',
    wateringDone: 'Watering done',
    
    moistureTrend: 'Soil Wetness Over Time',
    last24Hours: 'Last 24 hours',
    actualMoisture: 'Current Level',
    goodLevel: 'Good Level',
    weeklyWater: 'Weekly Water Use',
    waterUsed: 'Water Used',
    
    askQuestion: 'Ask me anything about your farm...',
    voiceAssistant: 'Farm Helper',
    tapToSpeak: 'Tap to speak',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speakNow: 'Speak now',
    
    poweredByAI: 'Smart Farming Made Easy',
    connected: 'Connected',
    synced: 'Synced',
    
    minutes: 'min',
    liters: 'L',
    thisWeek: 'this week',
  },
  ta: {
    appName: 'அக்வாஸ்மார்ட்',
    smartIrrigation: 'ஸ்மார்ட் நீர்ப்பாசனம்',
    systemOnline: 'சிஸ்டம் வேலை செய்கிறது',
    lastSync: 'கடைசி செக்',
    minAgo: 'நிமிடம் முன்',
    
    dashboard: 'என் தோட்டம்',
    liveMonitoring: 'நேரடி தகவல்கள்',
    
    soilMoisture: 'மண் ஈரப்பதம்',
    temperature: 'வெப்பநிலை',
    humidity: 'காற்று ஈரப்பதம்',
    cropHealth: 'பயிர் ஆரோக்கியம்',
    waterSaved: 'சேமித்த தண்ணீர்',
    efficiency: 'எவ்வளவு நல்லது',
    vsLastHour: 'கடந்த மணி நேரத்தை விட',
    
    weather: 'இன்றைய வானிலை',
    rainChance: 'மழை வாய்ப்பு',
    wind: 'காற்று',
    today: 'இன்று',
     locationNeeded: 'வானிலைக்கு இடம் தேவை',
     allowLocation: 'இடம் அனுமதி',
     farmLocation: 'உங்கள் தோட்ட இடம்',
     detectingLocation: 'இடம் கண்டுபிடிக்கிறது...',
     locationError: 'இடம் கிடைக்கவில்லை',
     unknownLocation: 'இடம் தெரியவில்லை',
     yourArea: 'உங்கள் பகுதி',
     rainAlert: 'மழை எச்சரிக்கை!',
    
    waterControl: 'தண்ணீர் கட்டுப்பாடு',
    autoMode: 'ஆட்டோ',
    manualMode: 'கைமுறை',
    startWatering: 'நீர் பாய்ச்சு',
    stopWatering: 'நிறுத்து',
    active: 'நீர் பாய்கிறது',
    idle: 'நிறுத்தி உள்ளது',
    nextScheduled: 'அடுத்த நீர்ப்பாசனம்',
    
    aiSuggestion: 'AI ஆலோசனை',
    confidence: 'நம்பிக்கை',
    suggestedTime: 'தண்ணீர் விட',
    
    deviceStatus: 'கருவி நிலை',
    online: 'வேலை செய்கிறது',
    offline: 'நிறுத்தி உள்ளது',
    devicesOnline: 'கருவிகள் வேலை செய்கின்றன',
    allGood: 'எல்லாம் நல்லது!',
    needsAttention: 'பாருங்க',
    battery: 'பேட்டரி',
    signal: 'சிக்னல்',
    lastUpdated: 'புதுப்பிக்கப்பட்டது',
    sensor: 'சென்சார்',
    valve: 'வால்வு',
    controller: 'கண்ட்ரோலர்',
    
    recentActivity: 'சமீபத்திய நிகழ்வுகள்',
    wateringDone: 'நீர்ப்பாசனம் முடிந்தது',
    
    moistureTrend: 'மண் ஈரப்பதம் நேரப்படி',
    last24Hours: 'கடந்த 24 மணி நேரம்',
    actualMoisture: 'தற்போதைய நிலை',
    goodLevel: 'நல்ல நிலை',
    weeklyWater: 'வாராந்திர தண்ணீர் பயன்பாடு',
    waterUsed: 'பயன்படுத்திய தண்ணீர்',
    
    askQuestion: 'உங்கள் தோட்டம் பற்றி கேளுங்கள்...',
    voiceAssistant: 'தோட்ட உதவியாளர்',
    tapToSpeak: 'பேச தட்டுங்கள்',
    listening: 'கேட்கிறேன்...',
    thinking: 'யோசிக்கிறேன்...',
    speakNow: 'இப்போது பேசுங்கள்',
    
    poweredByAI: 'ஸ்மார்ட் விவசாயம் எளிதாக',
    connected: 'இணைக்கப்பட்டது',
    synced: 'ஒத்திசைக்கப்பட்டது',
    
    minutes: 'நிமிடம்',
    liters: 'லிட்டர்',
    thisWeek: 'இந்த வாரம்',
  },
  tanglish: {
    appName: 'AquaSmart',
    smartIrrigation: 'Smart Thanneer Paasanam',
    systemOnline: 'System Velai Seiyudhu',
    lastSync: 'Last check',
    minAgo: 'nimisham munnadhi',
    
    dashboard: 'En Thotam',
    liveMonitoring: 'Live thakavalkal',
    
    soilMoisture: 'Mann Eerappatham',
    temperature: 'Veppanilai',
    humidity: 'Kaatru Eerappatham',
    cropHealth: 'Payir Health',
    waterSaved: 'Save Aana Thanneer',
    efficiency: 'Evvalavu Nalladu',
    vsLastHour: 'vs kadantha hour',
    
    weather: 'Innaiku Weather',
    rainChance: 'Mazhai Vaippu',
    wind: 'Kaatru',
    today: 'Innaiku',
     locationNeeded: 'Weather ku location venum',
     allowLocation: 'Location Allow Pannunga',
     farmLocation: 'Unga Thotam Location',
     detectingLocation: 'Location kandupidikiranga...',
     locationError: 'Location kidaikala',
     unknownLocation: 'Location theriyala',
     yourArea: 'unga area',
     rainAlert: 'Mazhai Alert!',
    
    waterControl: 'Thanneer Control',
    autoMode: 'Auto',
    manualMode: 'Manual',
    startWatering: 'Thanneer Vidu',
    stopWatering: 'Niruthu',
    active: 'Thanneer Pogudhu',
    idle: 'Niruthiyiruku',
    nextScheduled: 'Aduthadhu',
    
    aiSuggestion: 'AI Yosanai',
    confidence: 'sure',
    suggestedTime: 'Thanneer vida',
    
    deviceStatus: 'Device Status',
    online: 'Velai Seiyudhu',
    offline: 'Velai Seiyala',
    devicesOnline: 'devices velai seiyudhu',
    allGood: 'Ellam Nalla Iruku!',
    needsAttention: 'Parunga',
    battery: 'Battery',
    signal: 'Signal',
    lastUpdated: 'Updated',
    sensor: 'Sensor',
    valve: 'Valve',
    controller: 'Controller',
    
    recentActivity: 'Recent Events',
    wateringDone: 'Watering mudinjichu',
    
    moistureTrend: 'Mann Eerappatham Over Time',
    last24Hours: 'Kadantha 24 hours',
    actualMoisture: 'Ippo Level',
    goodLevel: 'Nalla Level',
    weeklyWater: 'Weekly Thanneer Use',
    waterUsed: 'Use Aana Thanneer',
    
    askQuestion: 'Unga thotam pathi ketkalaam...',
    voiceAssistant: 'Thotam Helper',
    tapToSpeak: 'Pesa tap pannunga',
    listening: 'Kekkuren...',
    thinking: 'Yosikkuren...',
    speakNow: 'Ippo pesunga',
    
    poweredByAI: 'Smart Vivasayam Easy-a',
    connected: 'Connected',
    synced: 'Synced',
    
    minutes: 'min',
    liters: 'L',
    thisWeek: 'inda week',
  },
  hi: {
    appName: 'एक्वास्मार्ट',
    smartIrrigation: 'स्मार्ट सिंचाई',
    systemOnline: 'सिस्टम चल रहा है',
    lastSync: 'आखिरी जांच',
    minAgo: 'मिनट पहले',
    
    dashboard: 'मेरा खेत',
    liveMonitoring: 'लाइव जानकारी',
    
    soilMoisture: 'मिट्टी की नमी',
    temperature: 'तापमान',
    humidity: 'हवा की नमी',
    cropHealth: 'फसल स्वास्थ्य',
    waterSaved: 'बचाया पानी',
    efficiency: 'कितना अच्छा',
    vsLastHour: 'पिछले घंटे से',
    
    weather: 'आज का मौसम',
    rainChance: 'बारिश की संभावना',
    wind: 'हवा',
    today: 'आज',
     locationNeeded: 'मौसम के लिए स्थान आवश्यक',
     allowLocation: 'स्थान अनुमति दें',
     farmLocation: 'आपके खेत का स्थान',
     detectingLocation: 'स्थान खोज रहा है...',
     locationError: 'स्थान नहीं मिला',
     unknownLocation: 'स्थान अज्ञात',
     yourArea: 'आपका क्षेत्र',
     rainAlert: 'बारिश की चेतावनी!',
    
    waterControl: 'पानी नियंत्रण',
    autoMode: 'ऑटो',
    manualMode: 'हाथ से',
    startWatering: 'पानी डालो',
    stopWatering: 'बंद करो',
    active: 'पानी चल रहा',
    idle: 'बंद है',
    nextScheduled: 'अगली सिंचाई',
    
    aiSuggestion: 'AI सलाह',
    confidence: 'भरोसा',
    suggestedTime: 'पानी देना',
    
    deviceStatus: 'यंत्र स्थिति',
    online: 'चल रहा',
    offline: 'बंद है',
    devicesOnline: 'यंत्र चल रहे',
    allGood: 'सब ठीक है!',
    needsAttention: 'देखें',
    battery: 'बैटरी',
    signal: 'सिग्नल',
    lastUpdated: 'अपडेट',
    sensor: 'सेंसर',
    valve: 'वाल्व',
    controller: 'कंट्रोलर',
    
    recentActivity: 'हाल की घटनाएं',
    wateringDone: 'सिंचाई पूरी हुई',
    
    moistureTrend: 'मिट्टी नमी का रुझान',
    last24Hours: 'पिछले 24 घंटे',
    actualMoisture: 'अभी का स्तर',
    goodLevel: 'अच्छा स्तर',
    weeklyWater: 'साप्ताहिक पानी उपयोग',
    waterUsed: 'इस्तेमाल पानी',
    
    askQuestion: 'अपने खेत के बारे में पूछें...',
    voiceAssistant: 'खेत सहायक',
    tapToSpeak: 'बोलने के लिए दबाएं',
    listening: 'सुन रहा हूं...',
    thinking: 'सोच रहा हूं...',
    speakNow: 'अब बोलें',
    
    poweredByAI: 'स्मार्ट खेती आसान',
    connected: 'जुड़ा हुआ',
    synced: 'सिंक हुआ',
    
    minutes: 'मिनट',
    liters: 'लीटर',
    thisWeek: 'इस हफ्ते',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  languageNames: Record<Language, string>;
}

const languageNames: Record<Language, string> = {
  en: 'English',
  ta: 'தமிழ்',
  tanglish: 'Tanglish',
  hi: 'हिंदी',
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
    languageNames,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}