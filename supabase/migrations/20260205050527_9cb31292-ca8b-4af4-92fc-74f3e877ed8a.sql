-- Create farms table for storing farm/field locations
CREATE TABLE public.farms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sensor_readings table for ESP32 data
CREATE TABLE public.sensor_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  soil_moisture DOUBLE PRECISION,
  temperature DOUBLE PRECISION,
  humidity DOUBLE PRECISION,
  ph_level DOUBLE PRECISION,
  nitrogen DOUBLE PRECISION,
  phosphorus DOUBLE PRECISION,
  potassium DOUBLE PRECISION,
  water_level DOUBLE PRECISION,
  pump_status BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create irrigation_logs table
CREATE TABLE public.irrigation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  duration_minutes INTEGER,
  water_used_liters DOUBLE PRECISION,
  triggered_by TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_logs table for dashboard activity feed
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create public read policies (for ESP32 and dashboard)
CREATE POLICY "Allow public read access to farms" ON public.farms FOR SELECT USING (true);
CREATE POLICY "Allow public insert to farms" ON public.farms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to farms" ON public.farms FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to sensor_readings" ON public.sensor_readings FOR SELECT USING (true);
CREATE POLICY "Allow public insert to sensor_readings" ON public.sensor_readings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to irrigation_logs" ON public.irrigation_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert to irrigation_logs" ON public.irrigation_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to activity_logs" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert to activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_sensor_readings_farm_id ON public.sensor_readings(farm_id);
CREATE INDEX idx_sensor_readings_created_at ON public.sensor_readings(created_at DESC);
CREATE INDEX idx_irrigation_logs_farm_id ON public.irrigation_logs(farm_id);
CREATE INDEX idx_activity_logs_farm_id ON public.activity_logs(farm_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for farms table
CREATE TRIGGER update_farms_updated_at
BEFORE UPDATE ON public.farms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for sensor_readings and activity_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;