
-- Table to store ROI assessment submissions
CREATE TABLE public.roi_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  business_name TEXT,
  industry TEXT,
  form_data JSONB NOT NULL DEFAULT '{}',
  roi_results JSONB NOT NULL DEFAULT '{}',
  report_sent BOOLEAN DEFAULT false,
  invite_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roi_assessments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form)
CREATE POLICY "Anyone can submit assessments"
  ON public.roi_assessments
  FOR INSERT
  WITH CHECK (true);

-- Only service role can read (for admin/edge functions)
CREATE POLICY "Service role can read assessments"
  ON public.roi_assessments
  FOR SELECT
  USING (false);
