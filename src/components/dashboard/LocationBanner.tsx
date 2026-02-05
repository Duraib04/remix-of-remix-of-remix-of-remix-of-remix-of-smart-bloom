 import { MapPin, Navigation, RefreshCw, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 import { useLanguage } from "@/contexts/LanguageContext";
 
 interface LocationBannerProps {
   locationName?: string;
   isLoading?: boolean;
   error?: string | null;
   onRequestLocation?: () => void;
   className?: string;
 }
 
 export function LocationBanner({
   locationName,
   isLoading,
   error,
   onRequestLocation,
   className,
 }: LocationBannerProps) {
   const { t } = useLanguage();
 
   return (
     <div
       className={cn(
         "flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl",
         className
       )}
     >
       <div className="flex items-center gap-3">
         <div className="p-2 bg-primary/10 rounded-lg">
           {isLoading ? (
             <Loader2 className="h-5 w-5 text-primary animate-spin" />
           ) : (
             <MapPin className="h-5 w-5 text-primary" />
           )}
         </div>
         <div>
           <p className="text-sm font-medium text-muted-foreground">
             {t.farmLocation}
           </p>
           {isLoading ? (
             <p className="text-base font-semibold">{t.detectingLocation}</p>
           ) : error ? (
             <p className="text-base font-semibold text-destructive">
               {t.locationError}
             </p>
           ) : locationName ? (
             <p className="text-base font-semibold flex items-center gap-1">
               <Navigation className="h-4 w-4 text-primary" />
               {locationName}
             </p>
           ) : (
             <p className="text-base font-semibold text-muted-foreground">
               {t.unknownLocation}
             </p>
           )}
         </div>
       </div>
 
       {(error || !locationName) && onRequestLocation && (
         <Button
           variant="outline"
           size="sm"
           onClick={onRequestLocation}
           disabled={isLoading}
           className="gap-2"
         >
           {isLoading ? (
             <Loader2 className="h-4 w-4 animate-spin" />
           ) : (
             <RefreshCw className="h-4 w-4" />
           )}
           {t.allowLocation}
         </Button>
       )}
     </div>
   );
 }