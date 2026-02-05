-- ============================================================
-- STEP 8: LEARNING FEEDBACK TABLE
-- Tracks user overrides and system decisions for ML readiness
-- Enables pattern analysis and weight adjustment
-- ============================================================

-- Learning feedback table for tracking overrides
CREATE TABLE IF NOT EXISTS public.learning_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- What the system recommended
  irs_score INTEGER NOT NULL CHECK (irs_score >= 0 AND irs_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'monitor', 'caution', 'critical')),
  recommended_action TEXT NOT NULL CHECK (recommended_action IN ('irrigate', 'skip', 'delay')),
  
  -- What the user did
  user_action TEXT NOT NULL CHECK (user_action IN ('followed', 'overridden_start', 'overridden_stop', 'ignored')),
  override_reason TEXT,
  
  -- Snapshot of conditions at decision time
  context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Expected format:
  -- {
  --   soil_moisture: number,
  --   temperature: number,
  --   humidity: number,
  --   rain_probability: number,
  --   crop_type: string,
  --   soil_type: string,
  --   time_of_day: string,
  --   season: string,
  --   factors: { soilDryness, tempStress, humidityStress, cropSensitivity, weatherFactor }
  -- }
  
  -- Outcome tracking (can be updated later)
  outcome TEXT CHECK (outcome IN ('good', 'bad', 'neutral', 'unknown')) DEFAULT 'unknown',
  outcome_notes TEXT,
  
  -- Custom weights at time of decision
  weights_used JSONB DEFAULT '{}'::jsonb,
  
  -- Confidence calibration
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adjusted weights table (learned from overrides)
CREATE TABLE IF NOT EXISTS public.irs_weight_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL,
  
  -- Adjusted weights (default: 0.4, 0.2, 0.2, 0.1, 0.1)
  soil_dryness_weight DOUBLE PRECISION DEFAULT 0.40,
  temp_stress_weight DOUBLE PRECISION DEFAULT 0.20,
  humidity_stress_weight DOUBLE PRECISION DEFAULT 0.20,
  crop_sensitivity_weight DOUBLE PRECISION DEFAULT 0.10,
  weather_factor_weight DOUBLE PRECISION DEFAULT 0.10,
  
  -- Tracking
  adjustment_count INTEGER DEFAULT 0,
  last_adjustment_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irs_weight_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS policies for learning_feedback
CREATE POLICY "Users can view their own learning feedback"
ON public.learning_feedback FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning feedback"
ON public.learning_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning feedback"
ON public.learning_feedback FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for irs_weight_adjustments
CREATE POLICY "Users can view their own weight adjustments"
ON public.irs_weight_adjustments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight adjustments"
ON public.irs_weight_adjustments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight adjustments"
ON public.irs_weight_adjustments FOR UPDATE USING (auth.uid() = user_id);

-- Index for faster queries on learning data
CREATE INDEX IF NOT EXISTS idx_learning_feedback_farm ON public.learning_feedback(farm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_feedback_overrides ON public.learning_feedback(farm_id) WHERE user_action != 'followed';
