import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map pipeline stages to template keys
const STAGE_TEMPLATE_MAP: Record<string, string> = {
  qualified: 'reminder-qualified',
  deep_dive_sent: 'reminder-deep-dive-sent',
  proposal: 'reminder-proposal',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessmentId } = await req.json();
    if (!assessmentId) throw new Error('assessmentId is required');

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch the lead
    const { data: lead, error: leadErr } = await supabase
      .from('roi_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (leadErr || !lead) throw new Error('Lead not found');

    const templateKey = STAGE_TEMPLATE_MAP[lead.pipeline_stage];
    if (!templateKey) {
      return new Response(JSON.stringify({ success: false, error: `No reminder template for stage: ${lead.pipeline_stage}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch template
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', templateKey)
      .single();

    // Fetch proposal if needed
    let proposalUrl = '';
    if (lead.pipeline_stage === 'proposal') {
      const { data: proposal } = await supabase
        .from('proposals')
        .select('id')
        .eq('assessment_id', assessmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (proposal) {
        proposalUrl = `https://5to10x.app/proposal/${proposal.id}`;
      }
    }

    const deepDiveUrl = `https://5to10x.app/deep-dive?id=${assessmentId}`;
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

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ success: true, templateKey }), {
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
