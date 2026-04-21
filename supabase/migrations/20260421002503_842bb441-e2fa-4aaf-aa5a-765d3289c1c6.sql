UPDATE public.email_templates
SET 
  subject = CASE WHEN subject LIKE '%{{revisionLabel}}%' THEN subject 
    ELSE REPLACE(subject, '{{contactName}},', '{{contactName}},{{revisionLabel}}') END,
  html_body = CASE WHEN html_body LIKE '%{{revisionBanner}}%' THEN html_body 
    ELSE REPLACE(html_body, '{{itemsTable}}', '{{revisionBanner}}{{itemsTable}}') END
WHERE template_key = 'proposal-email';