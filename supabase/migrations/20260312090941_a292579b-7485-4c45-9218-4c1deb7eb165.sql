CREATE TABLE public.training_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit training registration" ON public.training_registrations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read training registrations" ON public.training_registrations FOR SELECT TO public USING (true);