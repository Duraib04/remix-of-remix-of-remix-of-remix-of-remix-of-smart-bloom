-- Add user_id and soil_type to farms table
ALTER TABLE public.farms ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.farms ADD COLUMN soil_type TEXT;

-- Create user_settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  notification_enabled BOOLEAN DEFAULT true,
  rain_alert_threshold INTEGER DEFAULT 60,
  temperature_unit TEXT DEFAULT 'celsius',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Create crop_recommendations table
CREATE TABLE public.crop_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  crop_name TEXT NOT NULL,
  suitability_score INTEGER,
  reason TEXT,
  season TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on crop_recommendations
ALTER TABLE public.crop_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for crop_recommendations
CREATE POLICY "Users can view their own recommendations"
ON public.crop_recommendations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations"
ON public.crop_recommendations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations"
ON public.crop_recommendations FOR DELETE
USING (auth.uid() = user_id);

-- Update farms RLS policies to support both authenticated and anonymous access
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow public read access to farms" ON public.farms;
DROP POLICY IF EXISTS "Allow public insert to farms" ON public.farms;
DROP POLICY IF EXISTS "Allow public update to farms" ON public.farms;

-- New policies: Allow access to own farms OR farms without user_id (legacy)
CREATE POLICY "Users can view their own farms or unassigned farms"
ON public.farms FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create farms"
ON public.farms FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own farms or unassigned farms"
ON public.farms FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own farms"
ON public.farms FOR DELETE
USING (auth.uid() = user_id);

-- Update related tables to also filter by user's farms
-- Update activity_logs policies
DROP POLICY IF EXISTS "Allow public read access to activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow public insert to activity_logs" ON public.activity_logs;

CREATE POLICY "Users can view activity logs for their farms"
ON public.activity_logs FOR SELECT
USING (
  farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid() OR user_id IS NULL)
);

CREATE POLICY "Users can insert activity logs for their farms"
ON public.activity_logs FOR INSERT
WITH CHECK (
  farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid() OR user_id IS NULL)
);

-- Update irrigation_logs policies
DROP POLICY IF EXISTS "Allow public read access to irrigation_logs" ON public.irrigation_logs;
DROP POLICY IF EXISTS "Allow public insert to irrigation_logs" ON public.irrigation_logs;

CREATE POLICY "Users can view irrigation logs for their farms"
ON public.irrigation_logs FOR SELECT
USING (
  farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid() OR user_id IS NULL)
);

CREATE POLICY "Users can insert irrigation logs for their farms"
ON public.irrigation_logs FOR INSERT
WITH CHECK (
  farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid() OR user_id IS NULL)
);

-- Update sensor_readings policies
DROP POLICY IF EXISTS "Allow public read access to sensor_readings" ON public.sensor_readings;
DROP POLICY IF EXISTS "Allow public insert to sensor_readings" ON public.sensor_readings;

CREATE POLICY "Users can view sensor readings for their farms"
ON public.sensor_readings FOR SELECT
USING (
  farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid() OR user_id IS NULL)
);

CREATE POLICY "Users can insert sensor readings for their farms"
ON public.sensor_readings FOR INSERT
WITH CHECK (
  farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid() OR user_id IS NULL)
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add trigger for user_settings updated_at
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();