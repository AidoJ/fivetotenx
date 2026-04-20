ALTER TABLE public.automation_settings
ADD COLUMN IF NOT EXISTS auto_regenerate_proposal_on_analysis_update boolean NOT NULL DEFAULT false;