import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Droplets, AlertTriangle, CheckCircle, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface LogEntry {
  id: string;
  type: "irrigation" | "alert" | "system" | "ai";
  message: string;
  timestamp: string;
  details?: string;
}

interface ActivityLogProps {
  entries: LogEntry[];
  className?: string;
  style?: React.CSSProperties;
}

const LogIcon = ({ type }: { type: LogEntry["type"] }) => {
  switch (type) {
    case "irrigation":
      return <Droplets className="h-4 w-4 text-accent" />;
    case "alert":
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "system":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "ai":
      return <Brain className="h-4 w-4 text-primary" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

export function ActivityLog({ entries, className, style }: ActivityLogProps) {
  const { t } = useLanguage();

  return (
    <Card className={cn("card-hover border-0 shadow-md", className)} style={style}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {t.recentActivity}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50",
                  index === 0 && "animate-fade-in"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    entry.type === "irrigation" && "bg-accent/10",
                    entry.type === "alert" && "bg-warning/10",
                    entry.type === "system" && "bg-success/10",
                    entry.type === "ai" && "bg-primary/10"
                  )}
                >
                  <LogIcon type={entry.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{entry.message}</p>
                  {entry.details && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.details}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {entry.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}