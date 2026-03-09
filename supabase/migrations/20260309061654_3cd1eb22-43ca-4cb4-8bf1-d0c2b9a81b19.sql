
-- Create client_interviews table for storing interview notes and audio transcripts
CREATE TABLE public.client_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.roi_assessments(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL DEFAULT 'text',
  title TEXT NOT NULL DEFAULT 'Client Interview',
  content TEXT,
  audio_file_url TEXT,
  transcript TEXT,
  interviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_interviews ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read interviews" ON public.client_interviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert interviews" ON public.client_interviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update interviews" ON public.client_interviews FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete interviews" ON public.client_interviews FOR DELETE USING (true);

-- Storage bucket for interview audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('interview-audio', 'interview-audio', true);

-- Storage policies for interview audio
CREATE POLICY "Anyone can upload audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'interview-audio');
CREATE POLICY "Anyone can read audio" ON storage.objects FOR SELECT USING (bucket_id = 'interview-audio');
CREATE POLICY "Anyone can delete audio" ON storage.objects FOR DELETE USING (bucket_id = 'interview-audio');
