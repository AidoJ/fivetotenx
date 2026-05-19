
ALTER TABLE public.outbound_prospects
  ADD COLUMN IF NOT EXISTS auto_drip boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_send_at timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_link_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_outbound_prospects_due
  ON public.outbound_prospects (next_send_at)
  WHERE auto_drip = true AND unsubscribed = false AND clicked_link_at IS NULL;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
