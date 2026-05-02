-- In-app admin notifications
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  assessment_id UUID,
  lead_name TEXT,
  business_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications (created_at DESC);
CREATE INDEX idx_admin_notifications_read ON public.admin_notifications (read);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read admin notifications"
ON public.admin_notifications FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert admin notifications"
ON public.admin_notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update admin notifications"
ON public.admin_notifications FOR UPDATE
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete admin notifications"
ON public.admin_notifications FOR DELETE
TO authenticated
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;