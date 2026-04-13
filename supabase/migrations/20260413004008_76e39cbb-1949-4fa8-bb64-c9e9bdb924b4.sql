
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.roi_assessments(id) ON DELETE CASCADE,
  team_member TEXT NOT NULL DEFAULT 'Eoghan',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read time entries" ON public.time_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert time entries" ON public.time_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update time entries" ON public.time_entries FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete time entries" ON public.time_entries FOR DELETE USING (true);

CREATE INDEX idx_time_entries_assessment ON public.time_entries(assessment_id);
CREATE INDEX idx_time_entries_member ON public.time_entries(team_member);
