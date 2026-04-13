
CREATE TABLE public.client_artifacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.roi_assessments(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL DEFAULT 'text',
  title TEXT,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read artifacts" ON public.client_artifacts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert artifacts" ON public.client_artifacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update artifacts" ON public.client_artifacts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete artifacts" ON public.client_artifacts FOR DELETE USING (true);

CREATE INDEX idx_client_artifacts_assessment ON public.client_artifacts(assessment_id);
