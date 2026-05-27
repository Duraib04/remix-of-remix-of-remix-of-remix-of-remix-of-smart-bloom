ALTER TABLE public.sensor_readings_v2
  ADD COLUMN IF NOT EXISTS flow double precision,
  ADD COLUMN IF NOT EXISTS rain text,
  ADD COLUMN IF NOT EXISTS pump text;