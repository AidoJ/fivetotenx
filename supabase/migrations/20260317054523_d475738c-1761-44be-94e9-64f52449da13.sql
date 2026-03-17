CREATE TABLE public.scoping_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.roi_assessments(id) ON DELETE CASCADE NOT NULL,
  industry text NOT NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  skipped_categories text[] DEFAULT '{}',
  completed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scoping_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scoping responses" ON public.scoping_responses FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert scoping responses" ON public.scoping_responses FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update scoping responses" ON public.scoping_responses FOR UPDATE TO public USING (true) WITH CHECK (true);