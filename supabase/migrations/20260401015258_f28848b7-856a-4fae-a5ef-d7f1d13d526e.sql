UPDATE public.email_templates 
SET html_body = REPLACE(
  html_body,
  'We''d love to discuss how to bring this to life for {{businessName}}. The next step is your <strong>Straight Talk™</strong> — a focused conversation about what''s worth fixing first. We''ll be in touch to schedule that.',
  'We''re looking forward to mapping out the biggest wins for {{businessName}}. Choose one of the options above and we''ll take it from there.'
)
WHERE template_key = 'roi-report';