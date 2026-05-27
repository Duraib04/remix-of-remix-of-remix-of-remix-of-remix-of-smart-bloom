
CREATE TABLE public.sensor_readings_v2 (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text,
  soil_moisture double precision,
  temperature double precision,
  humidity double precision,
  css double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.sensor_readings_v2 TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sensor_readings_v2 TO authenticated;
GRANT ALL ON public.sensor_readings_v2 TO service_role;

ALTER TABLE public.sensor_readings_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert sensor readings"
  ON public.sensor_readings_v2 FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read sensor readings"
  ON public.sensor_readings_v2 FOR SELECT TO anon, authenticated
  USING (true);

CREATE INDEX idx_sensor_readings_v2_created_at ON public.sensor_readings_v2 (created_at DESC);

ALTER TABLE public.sensor_readings_v2 REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings_v2;
