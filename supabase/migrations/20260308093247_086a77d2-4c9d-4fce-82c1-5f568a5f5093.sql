
DROP POLICY IF EXISTS "Service role can read deep dives" ON public.deep_dive_submissions;
CREATE POLICY "Anyone can read deep dives"
  ON public.deep_dive_submissions FOR SELECT
  USING (true);
