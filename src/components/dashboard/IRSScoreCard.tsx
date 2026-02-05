// ============================================================
// STEP 7A: IRS SCORE CARD
// Visual dashboard component showing the Irrigation Risk Score
// Includes score gauge, risk level, and factor breakdown
// ============================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gauge, Droplets, Thermometer, Wind, Leaf, CloudRain, AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { IrrigationDecision } from "@/utils/irrigationDecisionEngine";
import { getIRSColor } from "@/utils/irsCalculator";
import { getHardwareFeedback, getLEDCSSClasses, getBuzzerText } from "@/utils/hardwareFeedback";

interface IRSScoreCardProps {
  decision: IrrigationDecision | null;
  className?: string;
}

export function IRSScoreCard({ decision, className }: IRSScoreCardProps) {
  const { t } = useLanguage();

  if (!decision) {
    return (
      <Card className={cn("border-0 shadow-md", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            {t.irsScore || 'Irrigation Risk Score'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Gauge className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t.noDataYet || 'Connect sensors to see IRS'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hardware = getHardwareFeedback(decision);
  const irsColor = getIRSColor(decision.riskLevel);

  const getRiskBadgeVariant = () => {
    switch (decision.riskLevel) {
      case 'safe': return 'default';
      case 'monitor': return 'secondary';
      case 'caution': return 'outline';
      case 'critical': return 'destructive';
    }
  };

  const getRiskIcon = () => {
    switch (decision.riskLevel) {
      case 'safe': return <CheckCircle className="h-4 w-4" />;
      case 'monitor': return <Info className="h-4 w-4" />;
      case 'caution': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <ShieldAlert className="h-4 w-4" />;
    }
  };

  const factorItems = [
    { key: 'soilDryness', label: t.soilDryness || 'Soil Dryness', icon: Droplets, data: decision.factors.soilDryness, color: 'text-blue-500' },
    { key: 'tempStress', label: t.tempStress || 'Temp Stress', icon: Thermometer, data: decision.factors.tempStress, color: 'text-orange-500' },
    { key: 'humidityStress', label: t.humidityStress || 'Humidity Stress', icon: Wind, data: decision.factors.humidityStress, color: 'text-cyan-500' },
    { key: 'cropSensitivity', label: t.cropSensitivity || 'Crop Sensitivity', icon: Leaf, data: decision.factors.cropSensitivity, color: 'text-green-500' },
    { key: 'weatherFactor', label: t.weatherFactor || 'Rain Factor', icon: CloudRain, data: decision.factors.weatherFactor, color: 'text-indigo-500' },
  ];

  return (
    <Card className={cn("border-0 shadow-md overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            {t.irsScore || 'Irrigation Risk Score'}
          </CardTitle>
          <Badge variant={getRiskBadgeVariant()} className="flex items-center gap-1">
            {getRiskIcon()}
            {(t.riskLevelSafe && decision.riskLevel === 'safe') ? t.riskLevelSafe :
             (t.riskLevelWarning && decision.riskLevel === 'monitor') ? t.riskLevelWarning :
             (t.riskLevelWarning && decision.riskLevel === 'caution') ? t.riskLevelWarning :
             (t.riskLevelCritical && decision.riskLevel === 'critical') ? t.riskLevelCritical :
             decision.riskLevel.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* IRS Score Gauge */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                className="text-muted/20" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={irsColor} strokeWidth="8"
                strokeDasharray={`${(decision.irsScore / 100) * 264} 264`}
                strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: irsColor }}>{decision.irsScore}</span>
              <span className="text-[10px] text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <p className="text-sm font-semibold">{decision.recommendationText}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t.confidenceScore || 'Confidence'}: {decision.confidence}%</span>
              <span>•</span>
              <span>{decision.optimalTime}</span>
            </div>
            {decision.shouldIrrigate && (
              <p className="text-xs font-medium text-primary">
                💧 {decision.recommendedDuration} {t.minutes || 'min'} ({decision.recommendedWaterVolume} {t.liters || 'L'})
              </p>
            )}
          </div>
        </div>

        {/* Factor Breakdown */}
        <div className="space-y-2.5 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t.factorBreakdown || 'Factor Analysis'}
          </p>
          {factorItems.map((item) => (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{item.data.value}%</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    +{item.data.weighted}
                  </Badge>
                </div>
              </div>
              <Progress value={item.data.value} className="h-1.5" />
            </div>
          ))}
        </div>

        {/* Hardware Status Strip */}
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border">
          <div className={cn(
            "w-3 h-3 rounded-full shadow-lg flex-shrink-0",
            getLEDCSSClasses(decision.ledStatus)
          )} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{hardware.label}</p>
            <p className="text-[10px] text-muted-foreground truncate">{hardware.description}</p>
          </div>
          <div className="text-[10px] text-muted-foreground text-right flex-shrink-0">
            <div>🔊 {getBuzzerText(decision.buzzerPattern)}</div>
          </div>
        </div>

        {/* Sensor Reliability Warning */}
        {!decision.sensorReliable && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-xs">
            <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span className="text-yellow-700">
              {t.sensorAnomaly || 'Sensor reading unstable'} ({decision.anomalyCount} {decision.anomalyCount === 1 ? 'issue' : 'issues'})
            </span>
          </div>
        )}

        {/* Context Alerts */}
        {decision.contextFlags.filter(f => f.severity !== 'info').slice(0, 2).map((flag, i) => (
          <div key={i} className={cn(
            "flex items-start gap-2 p-2 rounded-lg text-xs border",
            flag.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
          )}>
            <AlertTriangle className={cn(
              "h-3.5 w-3.5 flex-shrink-0 mt-0.5",
              flag.severity === 'critical' ? 'text-red-500' : 'text-orange-500'
            )} />
            <div>
              <p className={flag.severity === 'critical' ? 'text-red-700' : 'text-orange-700'}>
                {flag.message}
              </p>
              <p className="text-muted-foreground mt-0.5">{flag.action}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
