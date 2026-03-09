ALTER TABLE public.roi_assessments 
  ADD COLUMN IF NOT EXISTS proposal_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS proposal_follow_up_days integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS proposal_follow_up_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS proposal_follow_up_sent boolean DEFAULT false;