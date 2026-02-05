import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface EfficiencyData {
  currentEfficiency: number;
  waterSaved: number;
  weeklyData: Array<{
    day: string;
    used: number;
    saved: number;
  }>;
}

interface WaterEfficiencyProps {
  data: EfficiencyData;
  className?: string;
  style?: React.CSSProperties;
}

export function WaterEfficiency({ data, className, style }: WaterEfficiencyProps) {
  const { t } = useLanguage();

  return (
    <Card className={cn("card-hover border-0 shadow-md", className)} style={style}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {t.efficiency}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Efficiency Score */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
          <div>
            <p className="text-sm text-muted-foreground">{t.efficiency}</p>
            <p className="text-4xl font-display font-bold text-primary">
              {data.currentEfficiency}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t.waterSaved}</p>
            <p className="text-2xl font-display font-bold text-accent">
              {data.waterSaved}{t.liters}
            </p>
            <p className="text-xs text-muted-foreground">{t.thisWeek}</p>
          </div>
        </div>

        {/* Weekly Chart */}
        <div>
          <p className="text-sm font-medium mb-3">{t.weeklyWater}</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}L`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-sm text-accent">
                            Used: {payload[0]?.value}L
                          </p>
                          <p className="text-sm text-success">
                            Saved: {payload[1]?.value}L
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="used" fill="hsl(200, 75%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saved" fill="hsl(142, 70%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground">{t.waterUsed}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">{t.waterSaved}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}