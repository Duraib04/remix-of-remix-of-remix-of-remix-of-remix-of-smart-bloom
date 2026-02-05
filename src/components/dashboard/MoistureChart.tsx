import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface MoistureDataPoint {
  time: string;
  moisture: number;
  optimal: number;
}

interface MoistureChartProps {
  data: MoistureDataPoint[];
  className?: string;
  style?: React.CSSProperties;
}

export function MoistureChart({ data, className, style }: MoistureChartProps) {
  const { t } = useLanguage();

  return (
    <Card className={cn("card-hover border-0 shadow-md", className)} style={style}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t.moistureTrend}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t.last24Hours}</p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 70%, 28%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152, 70%, 28%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="optimalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(200, 75%, 50%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(200, 75%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                className="text-muted-foreground"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-sm text-primary">
                          Moisture: {payload[0]?.value}%
                        </p>
                        <p className="text-sm text-accent">
                          Optimal: {payload[1]?.value}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="moisture"
                stroke="hsl(152, 70%, 28%)"
                strokeWidth={2}
                fill="url(#moistureGradient)"
              />
              <Area
                type="monotone"
                dataKey="optimal"
                stroke="hsl(200, 75%, 50%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#optimalGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">{t.actualMoisture}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">{t.goodLevel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}