
-- Fix reminder-qualified: at qualified stage, next step is Straight Talk (not Game Plan)
UPDATE email_templates SET
  name = 'Reminder: Book Straight Talk™',
  subject = '{{contactName}}, let''s book your Straight Talk™ for {{businessName}}',
  description = 'Nudge email for qualified leads who haven''t booked their Straight Talk™ call yet',
  trigger_description = 'Manually triggered from admin when a qualified lead needs a reminder to book their Straight Talk™',
  html_body = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f8fafc; font-family: Georgia, ''Times New Roman'', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,58,95,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f, #4338ca); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">Ready for the Next Step, {{contactName}}?</h1>
              <p style="color: #bfdbfe; font-size: 14px; margin: 10px 0 0;">Your Straight Talk™ is waiting</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
                Your Reality Check™ showed that <strong>{{businessName}}</strong> has real growth potential. The next step is a quick Straight Talk™ conversation — 20 minutes where we cut through the noise and focus on what matters most.
              </p>
              <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
                No pitch, no pressure — just an honest discussion about what''s worth fixing first.
              </p>
              <p style="color: #64748b; font-size: 13px; margin: 20px 0 0; text-align: center;">
                Simply reply to this email with a time that works, or we''ll send you a booking link.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">5to10X — Clarity Path™</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  updated_at = now()
WHERE template_key = 'reminder-qualified';

-- Fix reminder-discovery-call: at discovery_call stage, they're doing Game Plan (ST is done)
UPDATE email_templates SET
  name = 'Reminder: Complete Game Plan™',
  subject = '{{contactName}}, your Game Plan™ for {{businessName}} is almost ready',
  description = 'Nudge email for leads in the discovery_call stage who need to complete their Game Plan™ questionnaire',
  trigger_description = 'Manually triggered from admin for discovery_call stage leads to encourage Game Plan™ completion',
  html_body = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f8fafc; font-family: Georgia, ''Times New Roman'', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,58,95,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f, #4338ca); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">Your Game Plan™ Awaits, {{contactName}}</h1>
              <p style="color: #bfdbfe; font-size: 14px; margin: 10px 0 0;">Phase 3 — Let''s map it out</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
                Great Straight Talk™ conversation! Now it''s time to map the practical details for <strong>{{businessName}}</strong> with your Game Plan™ questionnaire.
              </p>
              <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
                It takes about 10 minutes and helps us build your Green Light™ document with accurate scope, cost, and timeline — no guesswork.
              </p>
              <p style="color: #64748b; font-size: 13px; margin: 20px 0 0; text-align: center;">
                Check your inbox for the Game Plan™ link, or reply to this email if you need it resent.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">5to10X — Clarity Path™</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  updated_at = now()
WHERE template_key = 'reminder-discovery-call';

-- Fix follow-up-reminder: this fires for deep_dive_sent stage, should reference Straight Talk (the step they need to do)
UPDATE email_templates SET
  name = 'Straight Talk™ Follow-up',
  subject = '{{contactName}}, let''s have that Straight Talk™ about {{businessName}}',
  description = 'Follow-up nudge for leads who have been sent the Straight Talk invite but haven''t progressed',
  trigger_description = 'Automated via cron job every 6 hours for deep_dive_sent leads',
  html_body = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f8fafc; font-family: Georgia, ''Times New Roman'', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,58,95,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f, #1e40af); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">Still Thinking It Over, {{contactName}}?</h1>
              <p style="color: #bfdbfe; font-size: 14px; margin: 10px 0 0;">Your Straight Talk™ is waiting</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
                A few days ago, your Reality Check™ showed that <strong>{{businessName}}</strong> could unlock significant growth. We''d love to have a quick Straight Talk™ conversation — just 20 minutes to discuss what''s worth fixing first.
              </p>
              <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
                No commitment, no pitch — just an honest discussion about your priorities and what a custom solution could look like.
              </p>
              <p style="color: #64748b; font-size: 13px; margin: 20px 0 0; text-align: center;">
                Reply to this email with a time that works, or let us know if the timing isn''t right.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">5to10X — Clarity Path™</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  updated_at = now()
WHERE template_key = 'follow-up-reminder';

-- Fix reminder-deep-dive-sent: repurpose as Game Plan follow-up
UPDATE email_templates SET
  name = 'Reminder: Game Plan™ Pending',
  subject = '{{contactName}}, your Game Plan™ for {{businessName}} is 5 minutes away',
  description = 'Reminder for leads who received the Game Plan link but haven''t completed it',
  trigger_description = 'Manually triggered from admin for leads who need to finish Game Plan™',
  html_body = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f8fafc; font-family: Georgia, ''Times New Roman'', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,58,95,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f, #4338ca); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">Almost There, {{contactName}}!</h1>
              <p style="color: #bfdbfe; font-size: 14px; margin: 10px 0 0;">Your Game Plan™ is 5 minutes away</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
                After our Straight Talk™, we sent you the Game Plan™ questionnaire for <strong>{{businessName}}</strong>. It only takes about 5 minutes and helps us prepare your Green Light™ document with accurate scope and pricing.
              </p>
              <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
                Once completed, we''ll prepare everything so you can review scope, cost, and timeline — with full confidence.
              </p>
              <p style="color: #64748b; font-size: 13px; margin: 20px 0 0; text-align: center;">
                Can''t find the link? Reply to this email and we''ll resend it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">5to10X — Clarity Path™</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  updated_at = now()
WHERE template_key = 'reminder-deep-dive-sent';

-- Fix discovery-call-invite description (template content is correct, just fix metadata)
UPDATE email_templates SET
  description = 'Sent after qualification to invite client to book a Straight Talk™ call via Calendly',
  trigger_description = 'Triggered when admin sends Straight Talk™ invite after Reality Check™ qualification',
  updated_at = now()
WHERE template_key = 'discovery-call-invite';

-- Fix deep-dive-confirmation: this fires after scoping/GP submission, keep as Game Plan
UPDATE email_templates SET
  description = 'Thank-you email with next steps after Game Plan™ submission',
  trigger_description = 'Automatically sent when lead submits Game Plan™ questionnaire',
  updated_at = now()
WHERE template_key = 'deep-dive-confirmation';

-- Fix deep-dive-invite: this sends the scoping/GP questionnaire link — keep as Game Plan
UPDATE email_templates SET
  description = 'Invitation email with CTA to complete the Game Plan™ questionnaire',
  trigger_description = 'Manual send from admin after Straight Talk™ to start Game Plan™',
  updated_at = now()
WHERE template_key = 'deep-dive-invite';
