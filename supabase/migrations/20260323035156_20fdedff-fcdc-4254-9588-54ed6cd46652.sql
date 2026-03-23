
ALTER TABLE public.scoping_categories 
ADD COLUMN phase text NOT NULL DEFAULT 'game_plan';

ALTER TABLE public.scoping_questions
ADD COLUMN question_type text NOT NULL DEFAULT 'text',
ADD COLUMN options jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE public.straight_talk_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.roi_assessments(id) ON DELETE CASCADE,
  industry text NOT NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.straight_talk_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert straight talk responses"
  ON public.straight_talk_responses FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can read straight talk responses"
  ON public.straight_talk_responses FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can update straight talk responses"
  ON public.straight_talk_responses FOR UPDATE TO public USING (true) WITH CHECK (true);

ALTER TABLE public.roi_assessments
ADD COLUMN industry_id uuid REFERENCES public.scoping_industries(id);
