import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Battery, Clock, AlertTriangle, CheckCircle, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface DeviceStatus {
  id: string;
  name: string;
  type: "sensor" | "valve" | "controller";
  status: "online" | "offline" | "warning";
  battery?: number;
  lastUpdate: string;
  signal?: number;
}

interface SystemStatusProps {
  devices: DeviceStatus[];
  className?: string;
  style?: React.CSSProperties;
}

export function SystemStatus({ devices, className, style }: SystemStatusProps) {
  const { t } = useLanguage();
  const onlineCount = devices.filter((d) => d.status === "online").length;
  const hasWarnings = devices.some((d) => d.status === "warning" || d.status === "offline");

  return (
    <Card className={cn("card-hover border-0 shadow-md", className)} style={style}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            {t.deviceStatus}
          </CardTitle>
          <Badge
            variant={hasWarnings ? "destructive" : "default"}
            className={cn(
              "font-medium",
              !hasWarnings && "bg-success hover:bg-success/90"
            )}
          >
            {hasWarnings ? (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {t.needsAttention}
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                {t.allGood}
              </>
            )}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {onlineCount}/{devices.length} {t.devicesOnline}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-colors",
                device.status === "online"
                  ? "bg-muted/50"
                  : device.status === "warning"
                  ? "bg-warning/10"
                  : "bg-destructive/10"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    device.status === "online"
                      ? "bg-success"
                      : device.status === "warning"
                      ? "bg-warning"
                      : "bg-destructive"
                  )}
                />
                <div>
                  <p className="text-sm font-medium">{device.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {device.type === 'sensor' ? t.sensor : device.type === 'valve' ? t.valve : t.controller}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {device.battery !== undefined && (
                  <div className="flex items-center gap-1">
                    <Battery
                      className={cn(
                        "h-4 w-4",
                        device.battery > 50
                          ? "text-success"
                          : device.battery > 20
                          ? "text-warning"
                          : "text-destructive"
                      )}
                    />
                    <span className="text-muted-foreground">{device.battery}%</span>
                  </div>
                )}
                {device.signal !== undefined && (
                  <div className="flex items-center gap-1">
                    <Wifi
                      className={cn(
                        "h-4 w-4",
                        device.signal > 70
                          ? "text-success"
                          : device.signal > 40
                          ? "text-warning"
                          : "text-destructive"
                      )}
                    />
                    <span className="text-muted-foreground">{device.signal}%</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{device.lastUpdate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}