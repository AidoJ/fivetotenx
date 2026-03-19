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
    const { contactName, contactEmail, businessName, assessmentId } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const deepDiveUrl = `https://5to10x.app/deep-dive?id=${assessmentId}`;

    // Try to load template from DB
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', 'deep-dive-invite')
      .single();

    let emailHtml: string;
    let subject: string;
    let fromField: string;

    if (template) {
      emailHtml = template.html_body
        .replace(/\{\{contactName\}\}/g, contactName || '')
        .replace(/\{\{businessName\}\}/g, businessName || 'your business')
        .replace(/\{\{deepDiveUrl\}\}/g, deepDiveUrl);
      subject = template.subject
        .replace(/\{\{contactName\}\}/g, contactName || '')
        .replace(/\{\{businessName\}\}/g, businessName || 'your business');
      fromField = `${template.from_name} <${template.from_email}>`;
    } else {
      // Fallback
      subject = `${contactName}, complete your Game Plan™ questionnaire for 5to10X`;
      fromField = '5to10X <grow@5to10x.app>';
      emailHtml = `<p>Hi ${contactName}, please complete your Game Plan™ questionnaire: <a href="${deepDiveUrl}">${deepDiveUrl}</a></p>`;
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
