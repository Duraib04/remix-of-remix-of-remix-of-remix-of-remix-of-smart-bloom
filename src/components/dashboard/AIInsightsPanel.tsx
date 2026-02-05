 import { useState, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { Brain, RefreshCw, Loader2, Droplets, Leaf, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { cn } from "@/lib/utils";
 import { useLanguage } from "@/contexts/LanguageContext";
 
 interface IrrigationAdvice {
   shouldIrrigate: boolean;
   confidence: number;
   optimalTime: string;
   duration: number;
   waterVolume: number;
   reasoning: string[];
   factors: { name: string; value: string | number; impact: 'positive' | 'negative' | 'neutral' }[];
 }
 
 interface HealthAnalysis {
   overallScore: number;
   status: 'optimal' | 'good' | 'warning' | 'critical';
   factors: { name: string; score: number; status: string; recommendation: string }[];
   alerts: string[];
   recommendations: string[];
 }
 
 interface AIInsightsPanelProps {
   farmId: string | null;
   sensorData: {
     soil_moisture: number;
     temperature: number;
     humidity: number;
     ph_level?: number;
     water_level?: number;
     nitrogen?: number;
     phosphorus?: number;
     potassium?: number;
   };
   weather?: {
     temperature: number;
     humidity: number;
     rainProbability: number;
   };
   soilType: string | null;
   className?: string;
 }
 
 export function AIInsightsPanel({ farmId, sensorData, weather, soilType, className }: AIInsightsPanelProps) {
   const { t } = useLanguage();
   const [irrigationAdvice, setIrrigationAdvice] = useState<IrrigationAdvice | null>(null);
   const [healthAnalysis, setHealthAnalysis] = useState<HealthAnalysis | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [activeTab, setActiveTab] = useState<'irrigation' | 'health'>('irrigation');
 
   const fetchAIInsights = async () => {
     if (!farmId) return;
 
     setIsLoading(true);
     try {
       const [irrigationRes, healthRes] = await Promise.all([
         supabase.functions.invoke('smart-irrigation-advisor', {
           body: { farmId, sensorData, weather, soilType },
         }),
         supabase.functions.invoke('crop-health-analyzer', {
           body: { farmId, sensorData },
         }),
       ]);
 
       if (irrigationRes.data) setIrrigationAdvice(irrigationRes.data);
       if (healthRes.data) setHealthAnalysis(healthRes.data);
     } catch (err) {
       console.error("Error fetching AI insights:", err);
     } finally {
       setIsLoading(false);
     }
   };
 
   useEffect(() => {
     if (farmId && sensorData.soil_moisture > 0) {
       fetchAIInsights();
     }
   }, [farmId]);
 
   const getStatusColor = (status: string) => {
     switch (status) {
       case 'optimal': return 'text-success';
       case 'good': return 'text-primary';
       case 'warning': return 'text-warning';
       case 'critical': return 'text-destructive';
       default: return 'text-muted-foreground';
     }
   };
 
   const getStatusIcon = (status: string) => {
     switch (status) {
       case 'optimal': return <CheckCircle className="h-4 w-4 text-success" />;
       case 'good': return <TrendingUp className="h-4 w-4 text-primary" />;
       case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
       case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
       default: return null;
     }
   };
 
   if (!farmId) {
     return (
       <Card className={cn("border-0 shadow-md", className)}>
         <CardHeader className="pb-2">
           <CardTitle className="text-base font-semibold flex items-center gap-2">
             <Brain className="h-5 w-5 text-primary" />
             {t.aiInsights}
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="text-center py-6 text-muted-foreground">
             <Brain className="h-10 w-10 mx-auto mb-2 opacity-50" />
             <p className="text-sm">{t.noDataYet}</p>
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
             <Brain className="h-5 w-5 text-primary" />
             {t.aiInsights}
           </CardTitle>
           <Button variant="ghost" size="icon" onClick={fetchAIInsights} disabled={isLoading}>
             {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
           </Button>
         </div>
         <div className="flex gap-2 mt-2">
           <Button
             variant={activeTab === 'irrigation' ? 'default' : 'outline'}
             size="sm"
             onClick={() => setActiveTab('irrigation')}
             className="flex-1"
           >
             <Droplets className="h-4 w-4 mr-1" />
             {t.irrigationAdvice}
           </Button>
           <Button
             variant={activeTab === 'health' ? 'default' : 'outline'}
             size="sm"
             onClick={() => setActiveTab('health')}
             className="flex-1"
           >
             <Leaf className="h-4 w-4 mr-1" />
             {t.healthAnalysis}
           </Button>
         </div>
       </CardHeader>
       <CardContent>
         {isLoading ? (
           <div className="flex flex-col items-center justify-center py-8">
             <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
             <p className="text-sm text-muted-foreground">{t.analyzingData}</p>
           </div>
         ) : activeTab === 'irrigation' ? (
           irrigationAdvice ? (
             <div className="space-y-4">
               <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                 <div className="flex items-center gap-3">
                   <div className={cn(
                     "w-12 h-12 rounded-full flex items-center justify-center",
                     irrigationAdvice.shouldIrrigate ? "bg-primary/20" : "bg-success/20"
                   )}>
                     <Droplets className={cn(
                       "h-6 w-6",
                       irrigationAdvice.shouldIrrigate ? "text-primary" : "text-success"
                     )} />
                   </div>
                   <div>
                     <p className="font-semibold">
                       {irrigationAdvice.shouldIrrigate ? t.startWatering : t.idle}
                     </p>
                     <p className="text-sm text-muted-foreground">
                       {t.confidenceScore}: {irrigationAdvice.confidence}%
                     </p>
                   </div>
                 </div>
                 <Badge variant={irrigationAdvice.shouldIrrigate ? "default" : "secondary"}>
                   {irrigationAdvice.duration} {t.minutes}
                 </Badge>
               </div>
 
               <div className="space-y-2">
                 <p className="text-xs font-medium text-muted-foreground uppercase">{t.factors}</p>
                 {irrigationAdvice.factors.slice(0, 4).map((factor, i) => (
                   <div key={i} className="flex items-center justify-between text-sm">
                     <span>{factor.name}</span>
                     <Badge variant={factor.impact === 'positive' ? 'default' : factor.impact === 'negative' ? 'destructive' : 'secondary'} className="text-xs">
                       {factor.value}
                     </Badge>
                   </div>
                 ))}
               </div>
 
               {irrigationAdvice.reasoning.length > 0 && (
                 <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                   {irrigationAdvice.reasoning.slice(0, 2).map((reason, i) => (
                     <p key={i}>• {reason}</p>
                   ))}
                 </div>
               )}
             </div>
           ) : (
             <div className="text-center py-6 text-muted-foreground">
               <p className="text-sm">{t.noDataYet}</p>
               <Button variant="outline" size="sm" onClick={fetchAIInsights} className="mt-2">
                 {t.refreshAnalysis}
               </Button>
             </div>
           )
         ) : (
           healthAnalysis ? (
             <div className="space-y-4">
               <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                 <div className="flex items-center gap-3">
                   <div className={cn(
                     "w-12 h-12 rounded-full flex items-center justify-center",
                     healthAnalysis.status === 'optimal' ? "bg-success/20" :
                     healthAnalysis.status === 'good' ? "bg-primary/20" :
                     healthAnalysis.status === 'warning' ? "bg-warning/20" : "bg-destructive/20"
                   )}>
                     {getStatusIcon(healthAnalysis.status)}
                   </div>
                   <div>
                     <p className={cn("font-semibold capitalize", getStatusColor(healthAnalysis.status))}>
                       {healthAnalysis.status === 'optimal' ? t.optimal :
                        healthAnalysis.status === 'warning' ? t.warning :
                        healthAnalysis.status === 'critical' ? t.critical : healthAnalysis.status}
                     </p>
                     <p className="text-sm text-muted-foreground">
                       {t.cropHealth}: {healthAnalysis.overallScore}%
                     </p>
                   </div>
                 </div>
               </div>
 
               <div className="space-y-3">
                 {healthAnalysis.factors.slice(0, 4).map((factor, i) => (
                   <div key={i} className="space-y-1">
                     <div className="flex items-center justify-between text-sm">
                       <span>{factor.name}</span>
                       <span className={cn("text-xs", getStatusColor(factor.status))}>{factor.score}%</span>
                     </div>
                     <Progress value={factor.score} className="h-1.5" />
                   </div>
                 ))}
               </div>
 
               {healthAnalysis.alerts.length > 0 && (
                 <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">
                   {healthAnalysis.alerts[0]}
                 </div>
               )}
 
               {healthAnalysis.recommendations.length > 0 && (
                 <div className="text-xs text-muted-foreground pt-2 border-t">
                   <p className="font-medium mb-1">{t.recommendation}:</p>
                   <p>{healthAnalysis.recommendations[0]}</p>
                 </div>
               )}
             </div>
           ) : (
             <div className="text-center py-6 text-muted-foreground">
               <p className="text-sm">{t.noDataYet}</p>
               <Button variant="outline" size="sm" onClick={fetchAIInsights} className="mt-2">
                 {t.refreshAnalysis}
               </Button>
             </div>
           )
         )}
       </CardContent>
     </Card>
   );
 }