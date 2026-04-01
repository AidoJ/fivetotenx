import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEFAULT_CALENDLY_URL = 'https://calendly.com/aidan-rejuvenators/discovery';

Deno.serve(async (req) => {
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

    const selfInterviewUrl = `https://5to10x.app/self-interview?id=${assessmentId}`;
    const calendlyUrl = DEFAULT_CALENDLY_URL;

    // Try to load template from DB
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', 'self-interview-invite')
      .single();

    let emailHtml: string;
    let subject: string;
    let fromField: string;

    if (template) {
      const firstName = (contactName || '').split(' ')[0];
      emailHtml = template.html_body
        .replace(/\{\{contactName\}\}/g, firstName)
        .replace(/\{\{businessName\}\}/g, businessName || 'your business')
        .replace(/\{\{selfInterviewUrl\}\}/g, selfInterviewUrl)
        .replace(/\{\{calendlyUrl\}\}/g, calendlyUrl);
      subject = template.subject
        .replace(/\{\{contactName\}\}/g, firstName)
        .replace(/\{\{businessName\}\}/g, businessName || 'your business');
      fromField = `${template.from_name} <${template.from_email}>`;
    } else {
      const firstName = (contactName || '').split(' ')[0];
      subject = `${firstName}, let's get your Straight Talk™ started`;
      fromField = '5to10X <grow@5to10x.app>';
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a2e;">Hi ${firstName} 👋</h2>
          <p style="color: #444; line-height: 1.6;">
            We're excited to dig deeper into how we can help <strong>${businessName || 'your business'}</strong> grow. You've got two options to share your insights with us:
          </p>
          
          <div style="margin: 28px 0;">
            <!-- Option 1: Self-Interview -->
            <div style="border: 2px solid #e8e0f7; border-radius: 12px; padding: 20px; margin-bottom: 16px; background: #faf8ff;">
              <h3 style="color: #6c3fce; margin: 0 0 8px; font-size: 16px;">🎙️ Option 1: Do it yourself</h3>
              <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0 0 16px;">
                Complete a short self-interview at your own pace. Record audio answers to our questions — takes about 10–15 minutes. You can pause and resume anytime.
              </p>
              <div style="text-align: center;">
                <a href="${selfInterviewUrl}" style="background: linear-gradient(135deg, #6c3fce, #8b5cf6); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                  Start Self-Interview →
                </a>
              </div>
            </div>
            
            <!-- Option 2: Book a Call -->
            <div style="border: 2px solid #dbeafe; border-radius: 12px; padding: 20px; background: #f0f7ff;">
              <h3 style="color: #2563eb; margin: 0 0 8px; font-size: 16px;">📅 Option 2: Book a call</h3>
              <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0 0 16px;">
                Prefer to chat live? Book a Straight Talk™ session with Aidan & Eoghan. We'll walk through everything together.
              </p>
              <div style="text-align: center;">
                <a href="${calendlyUrl}" style="background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                  Book Your Straight Talk™ →
                </a>
              </div>
            </div>
          </div>
          
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            <strong>Tip:</strong> Many clients do the self-interview first, then we have a shorter, more focused call to discuss solutions. Either way works!
          </p>
          
          <p style="color: #444; line-height: 1.6; margin-top: 24px;">
            Looking forward to working with you!<br/>
            — Aidan & Eoghan, 5to10X
          </p>
        </div>
      `;
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
