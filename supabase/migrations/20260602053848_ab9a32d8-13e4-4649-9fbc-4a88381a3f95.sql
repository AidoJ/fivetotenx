
ALTER TABLE public.roi_assessments
  ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_saved_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_step integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_roi_assessments_is_draft ON public.roi_assessments(is_draft, last_saved_at DESC);
