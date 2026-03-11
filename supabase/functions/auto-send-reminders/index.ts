import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const STAGE_TEMPLATE_MAP: Record<string, string> = {
  qualified: 'reminder-qualified',
  deep_dive_sent: 'reminder-deep-dive-sent',
  discovery_call: 'reminder-discovery-call',
  proposal: 'reminder-proposal',
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

    const now = new Date().toISOString();

    // Find leads with scheduled reminders that are due and not yet sent
    const { data: dueLeads, error } = await supabase
      .from('roi_assessments')
      .select('*')
      .in('pipeline_stage', ['qualified', 'deep_dive_sent', 'proposal'])
      .eq('stage_reminder_sent', false)
      .not('stage_reminder_scheduled_at', 'is', null)
      .lt('stage_reminder_scheduled_at', now);

    if (error) throw error;

    if (!dueLeads || dueLeads.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No reminders due', count: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    for (const lead of dueLeads) {
      const templateKey = STAGE_TEMPLATE_MAP[lead.pipeline_stage];
      if (!templateKey) continue;

      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .single();

      let proposalUrl = '';
      if (lead.pipeline_stage === 'proposal') {
        const { data: proposal } = await supabase
          .from('proposals')
          .select('id')
          .eq('assessment_id', lead.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (proposal) {
          proposalUrl = `https://5to10x.app/proposal/${proposal.id}`;
        }
      }

      const deepDiveUrl = `https://5to10x.app/deep-dive?id=${lead.id}`;
      const contactName = lead.contact_name || '';
      const businessName = lead.business_name || 'your business';

      let emailHtml: string;
      let subject: string;
      let fromField: string;

      if (template) {
        emailHtml = template.html_body
          .replace(/\{\{contactName\}\}/g, contactName)
          .replace(/\{\{businessName\}\}/g, businessName)
          .replace(/\{\{deepDiveUrl\}\}/g, deepDiveUrl)
          .replace(/\{\{proposalUrl\}\}/g, proposalUrl);
        subject = template.subject
          .replace(/\{\{contactName\}\}/g, contactName)
          .replace(/\{\{businessName\}\}/g, businessName);
        fromField = `${template.from_name} <${template.from_email}>`;
      } else {
        subject = `${contactName}, a quick reminder from 5to10X`;
        fromField = '5to10X <grow@5to10x.app>';
        emailHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <p>Hi ${contactName},</p>
          <p>Just a friendly reminder about your project with <strong>${businessName}</strong>. We'd love to help you move forward!</p>
          <p>Reply to this email or let us know a good time to chat.</p>
          <p style="margin-top:24px;color:#666;">— The 5to10X Team</p>
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
            .update({ stage_reminder_sent: true })
            .eq('id', lead.id);
        }
      } catch (e) {
        console.error(`Failed to send reminder to ${lead.contact_email}:`, e);
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
