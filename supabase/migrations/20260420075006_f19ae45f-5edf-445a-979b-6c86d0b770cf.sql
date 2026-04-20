ALTER TABLE public.automation_settings
ADD COLUMN IF NOT EXISTS auto_rerun_tech_stack_on_proposal_save boolean NOT NULL DEFAULT false;