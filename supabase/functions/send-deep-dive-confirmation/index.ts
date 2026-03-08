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
    const { contactName, contactEmail, businessName } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Try to load template from DB
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', 'deep-dive-confirmation')
      .single();

    let emailHtml: string;
    let subject: string;
    let fromField: string;

    if (template) {
      emailHtml = template.html_body
        .replace(/\{\{contactName\}\}/g, contactName || '')
        .replace(/\{\{businessName\}\}/g, businessName || 'your business');
      subject = template.subject
        .replace(/\{\{contactName\}\}/g, contactName || '')
        .replace(/\{\{businessName\}\}/g, businessName || 'your business');
      fromField = `${template.from_name} <${template.from_email}>`;
    } else {
      subject = `We've received your Deep Dive — next steps for ${businessName || 'your project'}`;
      fromField = '5to10X <grow@5to10x.app>';
      emailHtml = `<p>Thank you ${contactName}! We've received your Deep Dive for ${businessName}. We'll be in touch within 24-48 hours.</p>`;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromField,
        to: [contactEmail],
        subject,
        html: emailHtml,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);

    // Also notify admin
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '5to10X Pipeline <grow@5to10x.app>',
        to: ['grow@5to10x.app'],
        subject: `✅ Deep Dive Complete: ${contactName} – ${businessName || 'Unknown'}`,
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2>✅ Deep Dive Submitted</h2>
          <p><strong>${contactName}</strong> from <strong>${businessName || 'Unknown'}</strong> has completed their Deep Dive questionnaire.</p>
          <p><a href="https://5to10x.app/admin">View in Pipeline →</a></p>
        </div>`,
      }),
    }).catch(e => console.error('Admin notify failed:', e));

    return new Response(JSON.stringify({ success: true }), {
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
