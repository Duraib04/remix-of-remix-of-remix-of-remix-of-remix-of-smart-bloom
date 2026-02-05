 import { CloudRain, Volume2, VolumeX, X } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { useState } from "react";
 
 interface RainAlertBannerProps {
   rainProbability: number;
   locationName?: string;
   onDismiss?: () => void;
   className?: string;
 }
 
 export function RainAlertBanner({
   rainProbability,
   locationName,
   onDismiss,
   className,
 }: RainAlertBannerProps) {
   const { t, language } = useLanguage();
   const [isSpeaking, setIsSpeaking] = useState(false);
 
   if (rainProbability <= 60) return null;
 
   const getMessage = () => {
     const location = locationName || t.yourArea;
     switch (language) {
       case "ta":
         return `${location} இல் அடுத்த 2 மணி நேரத்தில் ${rainProbability}% மழை வாய்ப்பு!`;
       case "tanglish":
         return `${location} la next 2 hours la ${rainProbability}% mazhai vaippu!`;
       case "hi":
         return `${location} में अगले 2 घंटे में ${rainProbability}% बारिश की संभावना!`;
       default:
         return `${rainProbability}% chance of rain in ${location} in the next 2 hours!`;
     }
   };
 
   const speakAlert = () => {
     if (!("speechSynthesis" in window)) return;
     
     if (isSpeaking) {
       window.speechSynthesis.cancel();
       setIsSpeaking(false);
       return;
     }
 
     const voices = window.speechSynthesis.getVoices();
     let langCode = language === "ta" || language === "tanglish" ? "ta" : language === "hi" ? "hi" : "en";
     const voice = voices.find(v => v.lang.startsWith(langCode)) || voices[0];
 
     const utterance = new SpeechSynthesisUtterance(getMessage());
     utterance.voice = voice;
     utterance.rate = 0.9;
     utterance.onend = () => setIsSpeaking(false);
     
     setIsSpeaking(true);
     window.speechSynthesis.speak(utterance);
   };
 
   return (
     <div
       className={cn(
         "flex items-center justify-between p-4 bg-accent/10 border-2 border-accent/30 rounded-xl animate-pulse-slow",
         className
       )}
     >
       <div className="flex items-center gap-3">
         <div className="p-2 bg-accent/20 rounded-lg">
           <CloudRain className="h-6 w-6 text-accent" />
         </div>
         <div>
           <p className="text-sm font-medium text-accent">{t.rainAlert}</p>
           <p className="text-base font-semibold">{getMessage()}</p>
         </div>
       </div>
 
       <div className="flex items-center gap-2">
         <Button
           variant="ghost"
           size="icon"
           onClick={speakAlert}
           className="text-accent hover:text-accent hover:bg-accent/10"
         >
           {isSpeaking ? (
             <VolumeX className="h-5 w-5" />
           ) : (
             <Volume2 className="h-5 w-5" />
           )}
         </Button>
         {onDismiss && (
           <Button
             variant="ghost"
             size="icon"
             onClick={onDismiss}
             className="text-muted-foreground hover:text-foreground"
           >
             <X className="h-5 w-5" />
           </Button>
         )}
       </div>
     </div>
   );
 }