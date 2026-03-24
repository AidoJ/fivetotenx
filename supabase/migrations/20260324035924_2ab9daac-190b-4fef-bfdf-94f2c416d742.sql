
CREATE TABLE public.automation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_qualify_enabled boolean NOT NULL DEFAULT true,
  roi_threshold_percent integer NOT NULL DEFAULT 150,
  auto_send_invite_on_qualify boolean NOT NULL DEFAULT true,
  auto_send_gameplan_on_st_complete boolean NOT NULL DEFAULT true,
  auto_prepare_proposal_on_gp_complete boolean NOT NULL DEFAULT false,
  admin_notify_on_booking boolean NOT NULL DEFAULT true,
  admin_notify_on_gp_complete boolean NOT NULL DEFAULT true,
  admin_notify_on_proposal_accepted boolean NOT NULL DEFAULT true,
  admin_notify_emails text[] NOT NULL DEFAULT ARRAY['eoghan@5to10x.app', 'aidan@5to10x.app'],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read automation settings" ON public.automation_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated can update automation settings" ON public.automation_settings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can insert automation settings" ON public.automation_settings
  FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default row
INSERT INTO public.automation_settings (id) VALUES (gen_random_uuid());
