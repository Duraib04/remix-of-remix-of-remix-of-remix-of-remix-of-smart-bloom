import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, AlertCircle, Leaf } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ScanResult } from "@/hooks/useImageScanner";

interface ScanResultCardProps {
  result: ScanResult;
}

export function ScanResultCard({ result }: ScanResultCardProps) {
  const { t } = useLanguage();

  const severityConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
    none: { icon: CheckCircle, color: "text-green-600", label: t.noIssuesFound || "No Issues Found" },
    low: { icon: Leaf, color: "text-yellow-500", label: t.warning || "Low" },
    medium: { icon: AlertTriangle, color: "text-orange-500", label: t.warning || "Medium" },
    high: { icon: AlertCircle, color: "text-red-500", label: t.critical || "High" },
  };

  const severity = severityConfig[result.severity?.toLowerCase()] || severityConfig.none;
  const SeverityIcon = severity.icon;

  const confidencePercent = Math.round(result.identified.confidence * 100);

  return (
    <div className="space-y-4">
      {/* Identified Item */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t.identified || "Identified"}</CardTitle>
            <Badge variant="secondary">{confidencePercent}% {t.confidence || "confident"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold text-foreground">{result.identified.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{result.identified.category}</Badge>
            <div className={`flex items-center gap-1 ${severity.color}`}>
              <SeverityIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{severity.label}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.healthAnalysis || "Analysis"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.analysis}</p>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.recommendations || "Recommendations"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {result.tips.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">💡 {t.aiSuggestion || "Tips"}</p>
            {result.tips.map((tip, i) => (
              <p key={i} className="text-sm text-muted-foreground">{tip}</p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
