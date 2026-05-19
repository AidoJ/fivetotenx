
CREATE TABLE public.outbound_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  suburb TEXT,
  category TEXT,
  notes TEXT,
  stage TEXT NOT NULL DEFAULT 'not_contacted',
  drip_step INTEGER NOT NULL DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ,
  source TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.outbound_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prospects" ON public.outbound_prospects FOR SELECT USING (true);
CREATE POLICY "Anyone can insert prospects" ON public.outbound_prospects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update prospects" ON public.outbound_prospects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete prospects" ON public.outbound_prospects FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_outbound_prospects_stage ON public.outbound_prospects(stage);
CREATE INDEX idx_outbound_prospects_next_action ON public.outbound_prospects(next_action_at);
