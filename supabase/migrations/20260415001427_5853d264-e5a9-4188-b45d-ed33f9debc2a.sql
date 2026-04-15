
-- Create refinement_tokens table
CREATE TABLE public.refinement_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.roi_assessments(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '14 days'),
  used BOOLEAN NOT NULL DEFAULT false,
  questions_sent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.refinement_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tokens" ON public.refinement_tokens FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tokens" ON public.refinement_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tokens" ON public.refinement_tokens FOR UPDATE USING (true) WITH CHECK (true);

-- Add sent_to_client flag to refinement_questions
ALTER TABLE public.refinement_questions ADD COLUMN sent_to_client BOOLEAN NOT NULL DEFAULT false;
