-- Add revision tracking columns
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS superseded_by uuid NULL REFERENCES public.proposals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz NULL;

-- Backfill: number existing proposals per assessment by created_at
WITH ranked AS (
  SELECT id, assessment_id,
    ROW_NUMBER() OVER (PARTITION BY assessment_id ORDER BY created_at ASC) AS rn,
    COUNT(*) OVER (PARTITION BY assessment_id) AS total
  FROM public.proposals
)
UPDATE public.proposals p
SET revision = r.rn
FROM ranked r
WHERE p.id = r.id;

-- For each assessment that has more than one proposal, mark older ones superseded by the newest
WITH latest AS (
  SELECT DISTINCT ON (assessment_id) assessment_id, id AS latest_id
  FROM public.proposals
  ORDER BY assessment_id, revision DESC, created_at DESC
)
UPDATE public.proposals p
SET superseded_by = l.latest_id
FROM latest l
WHERE p.assessment_id = l.assessment_id
  AND p.id <> l.latest_id
  AND p.superseded_by IS NULL;

-- Backfill delivered_at from sent_at where the row has been considered "sent" historically.
-- We assume any pre-existing row with a non-default sent_at older than its created_at + 1s was sent.
-- For safety, just copy sent_at into delivered_at for all existing rows (they were already in the wild).
UPDATE public.proposals
SET delivered_at = sent_at
WHERE delivered_at IS NULL;

-- Helpful index for "latest proposal per assessment" lookups
CREATE INDEX IF NOT EXISTS idx_proposals_assessment_revision
  ON public.proposals (assessment_id, revision DESC);