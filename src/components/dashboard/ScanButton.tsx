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
      className="fixed bottom-6 left-6 h-16 w-16 rounded-full shadow-lg bg-accent hover:bg-accent/90 z-50 animate-pulse hover:animate-none"
      size="icon"
      title={t.scanCrop || "Scan Crop"}
    >
      <Camera className="h-7 w-7" />
    </Button>
  );
}
