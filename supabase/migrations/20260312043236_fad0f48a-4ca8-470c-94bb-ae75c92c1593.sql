ALTER TABLE public.client_interviews 
  ADD COLUMN zoom_link text DEFAULT NULL,
  ADD COLUMN call_completed boolean DEFAULT false,
  ADD COLUMN calendly_event_id text DEFAULT NULL,
  ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL;