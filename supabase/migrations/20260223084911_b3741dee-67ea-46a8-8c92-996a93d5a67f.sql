
-- Create scan_history table
CREATE TABLE public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id),
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  scan_type TEXT DEFAULT 'crop',
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans"
  ON public.scan_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
  ON public.scan_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans"
  ON public.scan_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for scan images
INSERT INTO storage.buckets (id, name, public)
VALUES ('scan-images', 'scan-images', true);

CREATE POLICY "Authenticated users can upload scan images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'scan-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view scan images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'scan-images');

CREATE POLICY "Users can delete own scan images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'scan-images' AND auth.role() = 'authenticated');
