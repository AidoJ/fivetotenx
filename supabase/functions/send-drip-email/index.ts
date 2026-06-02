import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM = '5to10X <grow@5to10x.app>';
const APP_URL = 'https://5to10x.app';

type Template = { subject: string; body: string };

const firstName = (contact: string | null, business: string) => {
  if (contact && contact.trim()) return contact.trim().split(/\s+/)[0];
  return business?.trim() || 'there';
};

const templates = (name: string): Record<number, Template> => ({
  1: {
    subject: 'Most businesses are leaking hours without realising it',
    body: `Hi ${name},

Most business owners don't have a workload problem.

They have an efficiency visibility problem.

Usually the biggest bottlenecks aren't dramatic — they're hidden in:

• repeated admin
• double handling
• manual follow-ups
• fragmented systems
• staff doing low-value tasks repeatedly

The tricky part is they slowly become "normal."

We built a short business efficiency questionnaire to help identify where time, revenue, and momentum may be getting lost inside day-to-day operations.

It takes about 3–5 minutes and gives you a practical snapshot of where hidden opportunities may exist in your business.

👉 Start here:
${APP_URL}/discover-efficiency

No pressure. No technical knowledge needed.

Just a useful exercise for business owners who know things could probably run smoother than they currently do.

– Aidan
5to10x`,
  },
  2: {
    subject: 'A quick question about your business operations',
    body: `Hi ${name},

Quick question:

How much time do you think your business loses each week to tasks that could probably be automated, simplified, or removed entirely?

For most businesses we speak with, it's far more than they realise.

The challenge is that inefficiency rarely shows up as one obvious problem — it shows up as:

• staff interruptions
• repeated data entry
• delayed communication
• missed follow-ups
• admin overflow
• systems that don't talk to each other

Over time, it drains energy from the business owner and the team.

That's exactly why we created the "Discover Where Efficiency Is Hiding" questionnaire.

It's designed to help identify operational friction points and uncover areas where AI, automation, or process improvements could create immediate impact.

👉 Take the assessment here:
${APP_URL}/discover-efficiency

Even if you don't work with us afterwards, most business owners finish it with a clearer understanding of where their time is actually going.

– Aidan
5to10x`,
  },
  3: {
    subject: 'Most businesses already know where the problem is',
    body: `Hi ${name},

In our experience, most business owners already know where the inefficiencies are.

They just haven't had the time to stop and properly map them.

Usually it sounds like:

• "We're constantly chasing things."
• "Too much relies on one person."
• "We've outgrown our systems."
• "Everything works… but it feels heavier than it should."

That operational drag adds up quietly:

• slower growth
• team fatigue
• missed opportunities
• unnecessary overhead
• owner burnout

The businesses that scale best aren't necessarily working harder.

They're reducing friction.

That's the purpose of the "Discover Where Efficiency Is Hiding" questionnaire — helping business owners identify where simplification, automation, and smarter systems could unlock time and momentum.

👉 Complete the questionnaire here:
${APP_URL}/discover-efficiency

Sometimes the fastest growth comes from removing what's slowing you down.

– Aidan
5to10x`,
  },
});

const toHtml = (body: string, unsubscribeUrl: string) => {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const html = escaped
    .split('\n\n')
    .map(block => {
      if (block.trim().startsWith('•')) {
        const items = block.split('\n').filter(l => l.trim().startsWith('•'))
          .map(l => `<li style="margin:4px 0;">${l.replace(/^•\s*/, '')}</li>`).join('');
        return `<ul style="margin:0 0 16px;padding-left:20px;color:#334155;">${items}</ul>`;
      }
      if (block.includes(APP_URL)) {
        return `<p style="margin:0 0 16px;color:#334155;line-height:1.6;">${block.replace(
          /(https:\/\/5to10x\.app[^\s]*)/g,
          '<a href="$1" style="color:#6d3ce8;font-weight:600;">$1</a>'
        ).replace(/\n/g, '<br/>')}</p>`;
      }
      return `<p style="margin:0 0 16px;color:#334155;line-height:1.6;">${block.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
  const footer = `<div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px;line-height:1.6;">
    You're receiving this because we identified your business as a potential fit for AI-driven efficiency improvements.<br/>
    Not interested? <a href="${unsubscribeUrl}" style="color:#6d3ce8;font-weight:600;text-decoration:underline;">Unsubscribe here</a> — we won't email you again.
  </div>`;
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <tr><td>${html}${footer}</td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { prospect_id, step } = await req.json();
    if (!prospect_id || ![1, 2, 3].includes(step)) {
      return new Response(JSON.stringify({ error: 'prospect_id and step (1|2|3) required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: p, error } = await supabase
      .from('outbound_prospects').select('*').eq('id', prospect_id).single();
    if (error || !p) throw new Error('Prospect not found');
    if (!p.email) throw new Error('Prospect has no email address');

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const name = firstName(p.contact_name, p.business_name);
    const tpl = templates(name);
    const trackedLink = `${APP_URL}/discover-efficiency?p=${p.id}`;
    const unsubscribeUrl = `${APP_URL}/unsubscribe?id=${p.id}`;

    // Try to load editable template from DB
    const templateKey = `drip-email-${step}`;
    const { data: dbTemplate } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', templateKey)
      .maybeSingle();

    let subject: string;
    let html: string;
    let textBody: string;
    let fromField = FROM;

    if (dbTemplate) {
      const replace = (s: string) => s
        .replace(/\{\{firstName\}\}/g, name)
        .replace(/\{\{contactName\}\}/g, name)
        .replace(/\{\{businessName\}\}/g, p.business_name || 'your business')
        .replace(/\{\{trackedLink\}\}/g, trackedLink)
        .replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl);
      subject = replace(dbTemplate.subject);
      html = replace(dbTemplate.html_body);
      textBody = html.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();
      fromField = `${dbTemplate.from_name} <${dbTemplate.from_email}>`;
    } else {
      const body = tpl[step].body.replace(new RegExp(`${APP_URL}/discover-efficiency`, 'g'), trackedLink);
      subject = tpl[step].subject;
      html = toHtml(body, unsubscribeUrl);
      textBody = `${body}\n\n---\nUnsubscribe: ${unsubscribeUrl}`;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromField,
        to: [p.email],
        subject,
        html,
        text: textBody,
        reply_to: 'aidan@5to10x.app',
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      }),
    });


    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend error: ${errBody}`);
    }

    const stageMap: Record<number, string> = {
      1: 'email_1_sent', 2: 'email_2_sent', 3: 'email_3_sent',
    };
    await supabase.from('outbound_prospects').update({
      stage: stageMap[step],
      drip_step: step,
      last_contacted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', prospect_id);

    return new Response(JSON.stringify({ success: true, step }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('send-drip-email error', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
