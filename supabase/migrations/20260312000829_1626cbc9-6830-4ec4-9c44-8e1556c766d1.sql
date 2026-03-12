
-- Add build_refinement stage to pipeline
ALTER TYPE public.pipeline_stage ADD VALUE 'build_refinement' AFTER 'signed';

-- Add discovery_ready flag so admin can mark discovery as complete before proposal
ALTER TABLE public.roi_assessments ADD COLUMN IF NOT EXISTS discovery_ready boolean DEFAULT false;
