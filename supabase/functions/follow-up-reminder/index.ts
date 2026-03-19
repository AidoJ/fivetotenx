import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Load template from DB
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', 'follow-up-reminder')
      .single();

    // Find leads with scheduled follow-ups that are due and not yet sent
    const now = new Date().toISOString();

    const { data: staleLeads, error } = await supabase
      .from('roi_assessments')
      .select('id, contact_name, contact_email, business_name, qualified_at, follow_up_days')
      .eq('pipeline_stage', 'deep_dive_sent')
      .eq('follow_up_sent', false)
      .lt('follow_up_scheduled_at', now);

    if (error) throw error;

    if (!staleLeads || staleLeads.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No follow-ups needed', count: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    for (const lead of staleLeads) {
      const deepDiveUrl = `https://5to10x.app/deep-dive?id=${lead.id}`;

      let emailHtml: string;
      let subject: string;
      let fromField: string;

      if (template) {
        emailHtml = template.html_body
          .replace(/\{\{contactName\}\}/g, lead.contact_name || '')
          .replace(/\{\{businessName\}\}/g, lead.business_name || 'your business')
          .replace(/\{\{deepDiveUrl\}\}/g, deepDiveUrl);
        subject = template.subject
          .replace(/\{\{contactName\}\}/g, lead.contact_name || '')
          .replace(/\{\{businessName\}\}/g, lead.business_name || 'your business');
        fromField = `${template.from_name} <${template.from_email}>`;
      } else {
        subject = `${lead.contact_name}, your custom app proposal is waiting`;
        fromField = '5to10X <grow@5to10x.app>';
        emailHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <p>Hi ${lead.contact_name},</p>
            <p>We noticed you haven't had a chance to complete your Game Plan™ questionnaire for <strong>${lead.business_name || 'your business'}</strong> yet. No worries — we know you're busy!</p>
            <p>Your personalised proposal is just a few questions away:</p>
            <p style="text-align:center;margin:24px 0;">
              <a href="${deepDiveUrl}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Complete Game Plan™</a>
            </p>
            <p><strong>Need some help?</strong> We're happy to walk you through it on a quick call:</p>
            <ul style="margin:12px 0;">
              <li>📞 Schedule a <strong>phone call</strong> — just reply to this email with your preferred time</li>
              <li>💻 Book a <strong>Zoom call</strong> — reply with "Zoom" and we'll send you a link</li>
            </ul>
            <p>Looking forward to helping ${lead.business_name || 'your business'} grow 5 to 10X!</p>
            <p style="margin-top:24px;color:#666;">— The 5to10X Team<br/>grow@5to10x.app</p>
          </div>`;
      }

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromField,
            to: [lead.contact_email],
            subject,
            html: emailHtml,
          }),
        });

        if (res.ok) {
          sent++;
          await supabase
            .from('roi_assessments')
            .update({ follow_up_sent: true })
            .eq('id', lead.id);
        }
      } catch (e) {
        console.error(`Failed to send follow-up to ${lead.contact_email}:`, e);
      }
    }

    return new Response(JSON.stringify({ success: true, count: sent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
