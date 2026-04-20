ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS client_selection jsonb NOT NULL DEFAULT '{}'::jsonb;