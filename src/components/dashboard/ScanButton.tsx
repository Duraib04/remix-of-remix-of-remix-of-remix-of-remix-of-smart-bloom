import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface ScanButtonProps {
  onClick: () => void;
}

export function ScanButton({ onClick }: ScanButtonProps) {
  const { t } = useLanguage();

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 left-6 h-16 pl-4 pr-5 rounded-full shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90 z-50 ring-4 ring-primary/30 hover:ring-primary/50 transition-all gap-2 font-semibold"
      title={t.scanCrop || "Scan Crop"}
    >
      <Camera className="h-6 w-6" />
      <span className="hidden sm:inline">{t.scanCrop || "Scan Crop"}</span>
    </Button>
  );
}
