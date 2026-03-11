ALTER TABLE public.roi_assessments
  ADD COLUMN IF NOT EXISTS stage_reminder_days integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS stage_reminder_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS stage_reminder_sent boolean DEFAULT false;