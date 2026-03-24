import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateICS(
  startTime: string,
  endTime: string,
  summary: string,
  description: string,
  location: string,
  organizerEmail: string
): string {
  const formatDate = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const uid = crypto.randomUUID();
  const now = formatDate(new Date().toISOString());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//5to10X//StraightTalk//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatDate(startTime)}`,
    `DTEND:${formatDate(endTime)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    location ? `LOCATION:${location}` : '',
    `ORGANIZER;CN=5to10X:mailto:${organizerEmail}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

function formatDateTime(isoString: string): { date: string; time: string } {
  const d = new Date(isoString);
  const date = d.toLocaleDateString('en-AU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Australia/Sydney',
  });
  const time = d.toLocaleTimeString('en-AU', {
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    timeZone: 'Australia/Sydney',
  });
  return { date, time };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const { contactName, contactEmail, businessName, scheduledAt, zoomLink, eventName } = await req.json();

    if (!contactEmail || !scheduledAt) {
      throw new Error('Missing contactEmail or scheduledAt');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { date, time } = formatDateTime(scheduledAt);
    const callTitle = eventName || 'Straight Talk™ with 5to10X';

    // Calculate end time (assume 45 min call)
    const endTime = new Date(new Date(scheduledAt).getTime() + 45 * 60 * 1000).toISOString();

    // Generate ICS calendar invite
    const icsContent = generateICS(
      scheduledAt,
      endTime,
      callTitle,
      `Your Straight Talk™ call with Aidan & Eoghan from 5to10X.${zoomLink ? `\n\nJoin via Zoom: ${zoomLink}` : ''}`,
      zoomLink || '',
      'grow@5to10x.app'
    );
    const icsBase64 = btoa(icsContent);

    // Try to load template from DB
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', 'straight-talk-booking-confirmation')
      .single();

    let emailHtml: string;
    let subject: string;
    let fromField: string;

    if (template) {
      emailHtml = template.html_body
        .replace(/\{\{contactName\}\}/g, contactName || '')
        .replace(/\{\{businessName\}\}/g, businessName || 'your business')
        .replace(/\{\{date\}\}/g, date)
        .replace(/\{\{time\}\}/g, time)
        .replace(/\{\{zoomLink\}\}/g, zoomLink || '')
        .replace(/\{\{eventName\}\}/g, callTitle);
      subject = template.subject
        .replace(/\{\{contactName\}\}/g, contactName || '')
        .replace(/\{\{date\}\}/g, date);
      fromField = `${template.from_name} <${template.from_email}>`;
    } else {
      subject = `✅ You're booked — Straight Talk™ on ${date}`;
      fromField = '5to10X <grow@5to10x.app>';
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px 25px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: bold;">✅ You're Booked!</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Your Straight Talk™ is confirmed</p>
          </div>

          <div style="padding: 30px 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #333; margin: 0 0 20px;">Hi ${contactName || 'there'},</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 25px;">
              Great news — your Straight Talk™ call with <strong>Aidan & Eoghan</strong> from 5to10X is locked in. Here are the details:
            </p>

            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 0 0 25px;">
              <table style="width: 100%; font-size: 14px; color: #333;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 80px;">📅 Date</td>
                  <td style="padding: 6px 0;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">🕐 Time</td>
                  <td style="padding: 6px 0;">${time}</td>
                </tr>
                ${zoomLink ? `
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">📹 Zoom</td>
                  <td style="padding: 6px 0;"><a href="${zoomLink}" style="color: #1789CE; text-decoration: none;">Join Meeting</a></td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${zoomLink ? `
            <div style="text-align: center; margin: 0 0 25px;">
              <a href="${zoomLink}" style="display: inline-block; background: #1789CE; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: bold;">
                Join Zoom Meeting
              </a>
            </div>
            ` : ''}

            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 0 0 25px;">
              <p style="margin: 0; font-size: 13px; color: #92400e;">
                💡 <strong>What to expect:</strong> This is a candid, no-pressure conversation about how your business operates today and where AI-powered workflow improvements could make the biggest impact. We'll ask about your current processes, pain points, and goals. It takes about 30–45 minutes.
              </p>
            </div>

            <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 10px;">
              A calendar invite (.ics) is attached — add it to your calendar so you don't miss it.
            </p>

            <p style="font-size: 14px; color: #555; margin: 0;">
              See you soon!<br/>
              <strong>Aidan & Eoghan</strong><br/>
              <span style="color: #999; font-size: 12px;">5to10X — Fix the workflow. Multiply the output.</span>
            </p>
          </div>
        </div>
      `;
    }

    // Send via Resend with ICS attachment
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
        attachments: [
          {
            filename: 'straight-talk-invite.ics',
            content: icsBase64,
            content_type: 'text/calendar; method=REQUEST',
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);

    console.log('Booking confirmation sent to:', contactEmail);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Booking confirmation error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
