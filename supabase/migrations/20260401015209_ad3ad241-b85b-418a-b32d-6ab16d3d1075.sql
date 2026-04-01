UPDATE public.email_templates 
SET html_body = REPLACE(
  html_body,
  '✨ YOU QUALIFY FOR A CUSTOM BUILD',
  '✨ YOU QUALIFY FOR AN AI BUSINESS REWIRING SESSION'
)
WHERE template_key = 'roi-report';