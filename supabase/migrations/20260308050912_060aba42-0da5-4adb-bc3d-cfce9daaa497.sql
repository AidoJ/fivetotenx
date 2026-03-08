
-- Create pipeline stages enum
CREATE TYPE public.pipeline_stage AS ENUM ('assessment', 'qualified', 'deep_dive_sent', 'deep_dive_complete', 'proposal', 'signed');

-- Add pipeline stage to roi_assessments
ALTER TABLE public.roi_assessments 
  ADD COLUMN pipeline_stage pipeline_stage NOT NULL DEFAULT 'assessment',
  ADD COLUMN qualified_at timestamp with time zone,
  ADD COLUMN is_qualified boolean NOT NULL DEFAULT false;

-- Deep dive submissions table
CREATE TABLE public.deep_dive_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.roi_assessments(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Current tech & tools
  current_website text,
  current_tools text,
  pain_points text,
  
  -- Business goals
  primary_goals text[],
  timeline text,
  budget_comfort text,
  
  -- Decision making
  decision_maker_name text,
  decision_maker_role text,
  decision_timeline text,
  
  -- Integrations & requirements
  required_integrations text[],
  must_have_features text,
  nice_to_have_features text,
  
  -- Additional context
  competitors text,
  additional_notes text
);

-- Enable RLS
ALTER TABLE public.deep_dive_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (public intake form)
CREATE POLICY "Anyone can submit deep dive" ON public.deep_dive_submissions
  FOR INSERT WITH CHECK (true);

-- Only service role can read
CREATE POLICY "Service role can read deep dives" ON public.deep_dive_submissions
  FOR SELECT USING (false);

-- Allow public read of roi_assessments by id (for deep dive form to validate assessment)
CREATE POLICY "Public can read assessment by id" ON public.roi_assessments
  FOR SELECT USING (true);

-- Allow updating pipeline stage
CREATE POLICY "Anyone can update assessment stage" ON public.roi_assessments
  FOR UPDATE USING (true) WITH CHECK (true);
