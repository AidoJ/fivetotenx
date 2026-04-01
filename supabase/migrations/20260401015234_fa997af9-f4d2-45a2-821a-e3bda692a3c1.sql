UPDATE public.email_templates 
SET html_body = REPLACE(
  html_body,
  'Your business qualifies for a custom app build. The next step is your Straight Talk™ — a focused conversation about what matters most to {{businessName}}. Choose the option that works best for you:',
  'This isn''t about building another app. It''s about redesigning how work flows through your business.<br/><br/>Your Straight Talk™ session is a strategic review where we map:<br/>• the hidden friction slowing your operations<br/>• the decisions AI can start making for you<br/>• the workflows that should disappear completely<br/>• and the fastest path to measurable efficiency gains<br/><br/><strong style="color: #93c5fd;">Most businesses uncover 5–10× leverage opportunities in this session alone.</strong><br/><br/>Choose the option that works best for you:'
)
WHERE template_key = 'roi-report';