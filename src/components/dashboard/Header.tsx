import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Bell, Settings, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";

interface HeaderProps {
  notifications?: number;
  onMenuClick?: () => void;
  className?: string;
}

export function Header({ notifications = 0, onMenuClick, className }: HeaderProps) {
  const { t } = useLanguage();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-card/80 backdrop-blur-md border-b border-border/50",
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-6 w-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-display font-bold">{t.appName}</h1>
              <p className="text-xs text-muted-foreground">{t.smartIrrigation}</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="hidden md:flex items-center gap-2">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30 font-medium">
            <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse" />
            {t.systemOnline}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {t.lastSync}: 2 {t.minAgo}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                {notifications > 9 ? "9+" : notifications}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}