
-- Add 'completed' to the pipeline_stage enum
ALTER TYPE public.pipeline_stage ADD VALUE IF NOT EXISTS 'completed';

-- Add scoping tracking columns to roi_assessments
ALTER TABLE public.roi_assessments 
  ADD COLUMN IF NOT EXISTS scoping_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS scoping_sent_at timestamp with time zone;
