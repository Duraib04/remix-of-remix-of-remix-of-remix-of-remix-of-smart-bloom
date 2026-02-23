import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, ImagePlus, Loader2, RotateCcw, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useImageScanner, type ScanResult } from "@/hooks/useImageScanner";
import { ScanResultCard } from "./ScanResultCard";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId?: string | null;
  soilType?: string | null;
}

type ScanType = 'crop' | 'pest' | 'disease' | 'soil' | 'general';

export function ScannerModal({ isOpen, onClose, farmId, soilType }: ScannerModalProps) {
  const { t } = useLanguage();
  const [selectedScanType, setSelectedScanType] = useState<ScanType>('general');
  const {
    isAnalyzing,
    result,
    previewUrl,
    error,
    fileInputRef,
    handleFileSelect,
    openCamera,
    openGallery,
    reset,
  } = useImageScanner();

  const scanTypes: { key: ScanType; label: string; emoji: string }[] = [
    { key: 'crop', label: t.cropHealth || 'Crop Health', emoji: '🌾' },
    { key: 'pest', label: t.pestDetection || 'Pest Detection', emoji: '🐛' },
    { key: 'disease', label: t.diseaseAnalysis || 'Disease Analysis', emoji: '🔬' },
    { key: 'soil', label: t.soilAnalysis || 'Soil Analysis', emoji: '🌍' },
    { key: 'general', label: t.all || 'General', emoji: '📷' },
  ];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileSelect(file, selectedScanType, {
      farmId: farmId || undefined,
      soilType: soilType || undefined,
    });
    // Reset the input so same file can be selected again
    e.target.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {t.scanCrop || "Scan Crop"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />

          {/* Scan Type Selector */}
          {!result && (
            <div className="flex flex-wrap gap-2">
              {scanTypes.map(({ key, label, emoji }) => (
                <Badge
                  key={key}
                  variant={selectedScanType === key ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1.5 px-3"
                  onClick={() => setSelectedScanType(key)}
                >
                  {emoji} {label}
                </Badge>
              ))}
            </div>
          )}

          {/* Preview Image */}
          {previewUrl && (
            <div className="relative rounded-xl overflow-hidden border bg-muted">
              <img
                src={previewUrl}
                alt="Scan preview"
                className="w-full max-h-64 object-contain"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">{t.analyzing || "Analyzing..."}</p>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {result && <ScanResultCard result={result} />}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!result && !isAnalyzing && (
              <>
                <Button onClick={openCamera} className="flex-1 gap-2" size="lg">
                  <Camera className="h-5 w-5" />
                  {t.takePhoto || "Take Photo"}
                </Button>
                <Button onClick={openGallery} variant="outline" className="flex-1 gap-2" size="lg">
                  <ImagePlus className="h-5 w-5" />
                  {t.uploadPhoto || "Upload"}
                </Button>
              </>
            )}

            {result && (
              <Button onClick={reset} className="flex-1 gap-2" size="lg">
                <RotateCcw className="h-5 w-5" />
                {t.scanAgain || "Scan Again"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
