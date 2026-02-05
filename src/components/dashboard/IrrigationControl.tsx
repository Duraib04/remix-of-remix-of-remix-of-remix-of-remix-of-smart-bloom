import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Power, Clock, Brain, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface IrrigationControlProps {
  isActive: boolean;
  mode: "auto" | "manual";
  scheduledTime?: string;
  aiRecommendation: {
    shouldIrrigate: boolean;
    duration: number;
    reason: string;
    confidence: number;
  };
  onToggle: () => void;
  onModeChange: (mode: "auto" | "manual") => void;
  className?: string;
}

export function IrrigationControl({
  isActive,
  mode,
  scheduledTime,
  aiRecommendation,
  onToggle,
  onModeChange,
  className,
}: IrrigationControlProps) {
  const { t } = useLanguage();
  const [localMode, setLocalMode] = useState(mode);

  const handleModeChange = (newMode: "auto" | "manual") => {
    setLocalMode(newMode);
    onModeChange(newMode);
  };

  return (
    <Card className={cn("card-hover border-0 shadow-md overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-accent" />
            {t.waterControl}
          </div>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
              isActive
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                isActive ? "bg-success animate-pulse" : "bg-muted-foreground"
              )}
            />
            {isActive ? t.active : t.idle}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{t.autoMode}/{t.manualMode}</span>
          <div className="flex items-center gap-2 bg-background rounded-lg p-1">
            <button
              onClick={() => handleModeChange("auto")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                localMode === "auto"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Brain className="h-4 w-4 inline mr-1" />
              {t.autoMode}
            </button>
            <button
              onClick={() => handleModeChange("manual")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                localMode === "manual"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.manualMode}
            </button>
          </div>
        </div>

        {/* AI Recommendation */}
        <div
          className={cn(
            "p-4 rounded-xl border-2 transition-all",
            aiRecommendation.shouldIrrigate
              ? "border-primary/30 bg-primary/5"
              : "border-accent/30 bg-accent/5"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                aiRecommendation.shouldIrrigate
                  ? "bg-primary/10"
                  : "bg-accent/10"
              )}
            >
              <Brain
                className={cn(
                  "h-5 w-5",
                  aiRecommendation.shouldIrrigate
                    ? "text-primary"
                    : "text-accent"
                )}
              />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t.aiSuggestion}</p>
                <span className="text-xs text-muted-foreground">
                  {aiRecommendation.confidence}% {t.confidence}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {aiRecommendation.reason}
              </p>
              {aiRecommendation.shouldIrrigate && (
                <p className="text-sm font-medium text-primary">
                  {t.suggestedTime}: {aiRecommendation.duration} {t.minutes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Manual Control Button */}
        <Button
          onClick={onToggle}
          className={cn(
            "w-full h-14 text-base font-semibold transition-all",
            isActive
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-primary hover:bg-primary/90"
          )}
        >
          <Power className="mr-2 h-5 w-5" />
          {isActive ? t.stopWatering : t.startWatering}
        </Button>

        {/* Schedule Info */}
        {scheduledTime && localMode === "auto" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{t.nextScheduled}: {scheduledTime}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}