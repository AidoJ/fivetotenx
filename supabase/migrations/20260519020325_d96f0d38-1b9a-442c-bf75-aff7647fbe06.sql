ALTER TABLE public.outbound_prospects
  ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT;