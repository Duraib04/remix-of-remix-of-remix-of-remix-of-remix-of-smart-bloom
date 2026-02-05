-- AI decision tracking table
CREATE TABLE public.ai_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('irrigation', 'health', 'recommendation')),
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  was_followed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Farm preferences table for AI learning
CREATE TABLE public.farm_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL,
  preferred_irrigation_time TEXT,
  water_budget_daily DOUBLE PRECISION,
  crop_types TEXT[],
  irrigation_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_decisions
CREATE POLICY "Users can view their own AI decisions"
ON public.ai_decisions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI decisions"
ON public.ai_decisions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI decisions"
ON public.ai_decisions
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for farm_preferences
CREATE POLICY "Users can view their own farm preferences"
ON public.farm_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own farm preferences"
ON public.farm_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farm preferences"
ON public.farm_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farm preferences"
ON public.farm_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for farm_preferences updated_at
CREATE TRIGGER update_farm_preferences_updated_at
BEFORE UPDATE ON public.farm_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();