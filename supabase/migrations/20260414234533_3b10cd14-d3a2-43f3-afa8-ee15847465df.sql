
CREATE TABLE public.refinement_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.roi_assessments(id) ON DELETE CASCADE,
  source_context TEXT,
  source_type TEXT NOT NULL DEFAULT 'ai_detected',
  category TEXT NOT NULL DEFAULT 'General',
  question TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'important',
  status TEXT NOT NULL DEFAULT 'unanswered',
  answer TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.refinement_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read refinement questions"
  ON public.refinement_questions FOR SELECT USING (true);

CREATE POLICY "Anyone can insert refinement questions"
  ON public.refinement_questions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update refinement questions"
  ON public.refinement_questions FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete refinement questions"
  ON public.refinement_questions FOR DELETE USING (true);
