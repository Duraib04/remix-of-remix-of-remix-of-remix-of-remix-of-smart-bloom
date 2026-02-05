import { cn } from "@/lib/utils";

interface CircularGaugeProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "accent" | "success" | "warning" | "destructive";
  className?: string;
}

export function CircularGauge({
  value,
  max,
  label,
  unit = "%",
  size = "md",
  variant = "primary",
  className,
}: CircularGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizes = {
    sm: { wrapper: "w-24 h-24", text: "text-lg", label: "text-xs" },
    md: { wrapper: "w-32 h-32", text: "text-2xl", label: "text-sm" },
    lg: { wrapper: "w-40 h-40", text: "text-3xl", label: "text-base" },
  };

  const variants = {
    primary: "stroke-primary",
    accent: "stroke-accent",
    success: "stroke-success",
    warning: "stroke-warning",
    destructive: "stroke-destructive",
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size].wrapper, className)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/50"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={cn(variants[variant], "transition-all duration-1000 ease-out")}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-display font-bold", sizes[size].text)}>
          {Math.round(value)}
          <span className="text-muted-foreground font-normal">{unit}</span>
        </span>
        <span className={cn("text-muted-foreground font-medium", sizes[size].label)}>
          {label}
        </span>
      </div>
    </div>
  );
}