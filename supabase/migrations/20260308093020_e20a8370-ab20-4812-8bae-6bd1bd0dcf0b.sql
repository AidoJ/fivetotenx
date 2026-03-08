
CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.roi_assessments(id) ON DELETE CASCADE,
  note_type text NOT NULL DEFAULT 'comment',
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lead notes"
  ON public.lead_notes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert lead notes"
  ON public.lead_notes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update lead notes"
  ON public.lead_notes FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete lead notes"
  ON public.lead_notes FOR DELETE
  USING (true);
