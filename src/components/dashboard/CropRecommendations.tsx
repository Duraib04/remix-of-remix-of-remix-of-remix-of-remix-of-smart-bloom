 import { useState, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Sprout, RefreshCw, Loader2, Leaf, Sun, Droplets } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
 
 interface CropRecommendation {
   id: string;
   crop_name: string;
   suitability_score: number;
   reason: string;
   season: string;
 }
 
 interface CropRecommendationsProps {
   farmId: string | null;
   soilType: string | null;
   weather?: {
     temperature: number;
     humidity: number;
     rainProbability: number;
   };
   className?: string;
 }
 
 export function CropRecommendations({ farmId, soilType, weather, className }: CropRecommendationsProps) {
  const { t } = useLanguage();
   const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const fetchRecommendations = async () => {
     if (!farmId) return;
 
     setIsLoading(true);
     setError(null);
 
     try {
       const { data, error: fetchError } = await supabase.functions.invoke('crop-recommendations', {
         body: {
           farmId,
           soilType,
           weather,
         },
       });
 
       if (fetchError) throw fetchError;
 
       if (data?.recommendations) {
         setRecommendations(data.recommendations);
       }
     } catch (err) {
       console.error("Error fetching recommendations:", err);
      setError(t.failedRecommendations);
     } finally {
       setIsLoading(false);
     }
   };
 
   useEffect(() => {
     if (farmId && soilType) {
       fetchRecommendations();
     }
   }, [farmId, soilType]);
 
   const getScoreColor = (score: number) => {
     if (score >= 80) return "text-success";
     if (score >= 60) return "text-warning";
     return "text-muted-foreground";
   };
 
   const getSeasonIcon = (season: string) => {
     switch (season?.toLowerCase()) {
       case "summer":
         return <Sun className="h-3 w-3" />;
       case "monsoon":
       case "rainy":
         return <Droplets className="h-3 w-3" />;
       default:
         return <Leaf className="h-3 w-3" />;
     }
   };
 
   if (!soilType) {
     return (
       <Card className={cn("border-0 shadow-md", className)}>
         <CardHeader className="pb-2">
           <CardTitle className="text-base font-semibold flex items-center gap-2">
             <Sprout className="h-5 w-5 text-primary" />
            {t.cropRecommendations}
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="text-center py-4 text-muted-foreground">
             <Sprout className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t.setSoilType}</p>
           </div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className={cn("border-0 shadow-md", className)}>
       <CardHeader className="pb-2">
         <div className="flex items-center justify-between">
           <CardTitle className="text-base font-semibold flex items-center gap-2">
             <Sprout className="h-5 w-5 text-primary" />
            {t.cropRecommendations}
           </CardTitle>
           <Button
             variant="ghost"
             size="icon"
             onClick={fetchRecommendations}
             disabled={isLoading}
           >
             {isLoading ? (
               <Loader2 className="h-4 w-4 animate-spin" />
             ) : (
               <RefreshCw className="h-4 w-4" />
             )}
           </Button>
         </div>
         <p className="text-xs text-muted-foreground">
          {t.basedOnSoil} {soilType}
         </p>
       </CardHeader>
       <CardContent>
         {isLoading ? (
           <div className="flex items-center justify-center py-8">
             <Loader2 className="h-6 w-6 animate-spin text-primary" />
           </div>
         ) : error ? (
           <div className="text-center py-4 text-destructive">
             <p className="text-sm">{error}</p>
             <Button variant="outline" size="sm" onClick={fetchRecommendations} className="mt-2">
              {t.retry}
             </Button>
           </div>
         ) : recommendations.length === 0 ? (
           <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">{t.noRecommendations}</p>
             <Button variant="outline" size="sm" onClick={fetchRecommendations} className="mt-2">
              {t.getRecommendations}
             </Button>
           </div>
         ) : (
           <div className="space-y-3">
             {recommendations.slice(0, 4).map((crop) => (
               <div
                 key={crop.id}
                 className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
               >
                 <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                   <Sprout className={cn("h-5 w-5", getScoreColor(crop.suitability_score))} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2">
                     <p className="font-medium text-sm">{crop.crop_name}</p>
                     <Badge variant="secondary" className="text-xs">
                       {getSeasonIcon(crop.season)}
                       <span className="ml-1">{crop.season}</span>
                     </Badge>
                   </div>
                   <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                     {crop.reason}
                   </p>
                   <div className="flex items-center gap-1 mt-1">
                     <span className={cn("text-xs font-medium", getScoreColor(crop.suitability_score))}>
                      {crop.suitability_score}% {t.suitable}
                     </span>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         )}
       </CardContent>
     </Card>
   );
 }