import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: "normal" | "warning" | "critical" | "success";
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  status = "normal",
  className,
}: MetricCardProps) {
  const { t } = useLanguage();
  
  const statusColors = {
    normal: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    critical: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  };

  const statusRing = {
    normal: "ring-primary/20",
    warning: "ring-warning/20",
    critical: "ring-destructive/20",
    success: "ring-success/20",
  };

  return (
    <Card
      className={cn(
        "card-hover overflow-hidden border-0 shadow-md",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-display tracking-tight">
                {value}
              </span>
              {unit && (
                <span className="text-sm font-medium text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground font-normal">{t.vsLastHour}</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl ring-2",
              statusColors[status],
              statusRing[status]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}