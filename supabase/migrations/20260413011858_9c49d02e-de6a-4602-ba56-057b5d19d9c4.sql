
CREATE POLICY "Authenticated can delete assessments"
ON public.roi_assessments
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete deep dives"
ON public.deep_dive_submissions
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete straight talk responses"
ON public.straight_talk_responses
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete proposals"
ON public.proposals
FOR DELETE
TO authenticated
USING (true);
