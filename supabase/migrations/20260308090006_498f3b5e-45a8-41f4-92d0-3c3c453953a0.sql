CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  from_name text NOT NULL DEFAULT '5to10X',
  from_email text NOT NULL DEFAULT 'grow@5to10x.app',
  html_body text NOT NULL,
  description text,
  trigger_description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Public read so edge functions can access
CREATE POLICY "Anyone can read templates" ON public.email_templates
  FOR SELECT USING (true);

-- Only service role can modify (admin will use functions)
CREATE POLICY "Anyone can update templates" ON public.email_templates
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can insert templates" ON public.email_templates
  FOR INSERT WITH CHECK (true);