
INSERT INTO public.email_templates (template_key, name, subject, from_name, from_email, html_body, description, trigger_description) VALUES
('reminder-qualified', 'Reminder: Take the Deep Dive', '{{contactName}}, your personalised growth plan is one step away', '5to10X', 'grow@5to10x.app',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <p>Hi {{contactName}},</p>
  <p>Thanks for completing the ROI assessment for <strong>{{businessName}}</strong> — the results showed some exciting potential!</p>
  <p>The next step is a short <strong>Deep Dive questionnaire</strong> that helps us understand your business in more detail so we can prepare a personalised proposal.</p>
  <p>It only takes about 10 minutes and covers things like your current tools, goals, and must-have features.</p>
  <p style="text-align:center;margin:24px 0;">
    <a href="{{deepDiveUrl}}" style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Start the Deep Dive →</a>
  </p>
  <p><strong>Prefer a chat instead?</strong> We''re happy to walk you through it:</p>
  <ul style="margin:12px 0;">
    <li>📞 Reply with your preferred time for a quick <strong>phone call</strong></li>
    <li>💻 Reply with "Zoom" and we''ll send you a meeting link</li>
  </ul>
  <p>Looking forward to helping {{businessName}} grow!</p>
  <p style="margin-top:24px;color:#666;">— The 5to10X Team<br/>grow@5to10x.app</p>
</div>',
'Nudge email for qualified leads who haven''t started the Deep Dive',
'Manually triggered from admin when a qualified lead needs a reminder to complete the Deep Dive questionnaire'),

('reminder-deep-dive-sent', 'Reminder: Book a Discovery Call', '{{contactName}}, let''s chat about {{businessName}}''s growth plan', '5to10X', 'grow@5to10x.app',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <p>Hi {{contactName}},</p>
  <p>We noticed you haven''t had a chance to complete the Deep Dive for <strong>{{businessName}}</strong> yet — no worries, we know you''re busy!</p>
  <p>If filling out a form isn''t your thing, we''d love to <strong>jump on a quick discovery call</strong> instead. We can cover the same ground in a casual 15-minute chat.</p>
  <p style="text-align:center;margin:24px 0;">
    <a href="{{deepDiveUrl}}" style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Complete Deep Dive Online</a>
  </p>
  <p style="text-align:center;margin-bottom:24px;"><strong>— or —</strong></p>
  <p style="text-align:center;">Just reply to this email with "Call me" and your preferred day/time, and we''ll get it booked in.</p>
  <p>Your personalised proposal is just around the corner!</p>
  <p style="margin-top:24px;color:#666;">— The 5to10X Team<br/>grow@5to10x.app</p>
</div>',
'Reminder for leads who received the Deep Dive invite but haven''t completed it — offers a discovery call alternative',
'Manually triggered from admin for deep_dive_sent leads who haven''t progressed'),

('reminder-proposal', 'Reminder: Your Proposal is Waiting', '{{contactName}}, your {{businessName}} proposal is ready for review', '5to10X', 'grow@5to10x.app',
'<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <p>Hi {{contactName}},</p>
  <p>Just a friendly nudge — your custom proposal for <strong>{{businessName}}</strong> is still waiting for you.</p>
  <p>We''ve put together a detailed plan covering the app features, timeline, investment, and projected ROI based on everything we discussed.</p>
  <p style="text-align:center;margin:24px 0;">
    <a href="{{proposalUrl}}" style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Review Your Proposal →</a>
  </p>
  <p><strong>Have questions?</strong> We''re here to help:</p>
  <ul style="margin:12px 0;">
    <li>📞 Reply with "Call me" and your preferred time</li>
    <li>💻 Reply with "Zoom" for a screen-share walkthrough of the proposal</li>
    <li>💬 Or just reply to this email with any questions</li>
  </ul>
  <p>We''d love to get started on building something great for {{businessName}}.</p>
  <p style="margin-top:24px;color:#666;">— The 5to10X Team<br/>grow@5to10x.app</p>
</div>',
'Reminder for leads in the proposal stage who haven''t accepted yet',
'Manually triggered from admin for proposal-stage leads to encourage acceptance');
