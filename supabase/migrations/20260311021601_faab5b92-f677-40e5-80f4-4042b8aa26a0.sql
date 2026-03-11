
CREATE TABLE public.admin_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  due_date DATE,
  owner TEXT NOT NULL DEFAULT 'Eoghan',
  assessment_id UUID REFERENCES public.roi_assessments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tasks" ON public.admin_tasks FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert tasks" ON public.admin_tasks FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON public.admin_tasks FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete tasks" ON public.admin_tasks FOR DELETE TO public USING (true);
