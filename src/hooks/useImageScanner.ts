import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export interface ScanResult {
  identified: {
    name: string;
    confidence: number;
    confidenceLabel: string;
    category: string;
  };
  analysis: string;
  severity: string;
  recommendations: string[];
  tips: string[];
  rawText: string;
}

export function useImageScanner() {
  const { language } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const analyzeImage = useCallback(async (
    imageBase64: string,
    scanType: string = 'general',
    farmContext?: { farmId?: string; soilType?: string; location?: string }
  ) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('image-analyzer', {
        body: { imageBase64, scanType, language, farmContext }
      });

      if (fnError) throw fnError;
      if (data.error) {
        setError(data.error);
        toast.error(data.error);
        return null;
      }

      setResult(data);
      return data as ScanResult;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to analyze image";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [language]);

  const handleFileSelect = useCallback(async (
    file: File,
    scanType?: string,
    farmContext?: { farmId?: string; soilType?: string; location?: string }
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    const compressed = await compressImage(file);
    setPreviewUrl(compressed);
    return analyzeImage(compressed, scanType, farmContext);
  }, [compressImage, analyzeImage]);

  const openCamera = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  }, []);

  const openGallery = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setPreviewUrl(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    result,
    previewUrl,
    error,
    fileInputRef,
    analyzeImage,
    handleFileSelect,
    openCamera,
    openGallery,
    reset,
    setPreviewUrl,
  };
}
