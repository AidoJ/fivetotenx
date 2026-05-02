import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { eventType, leadName, leadEmail, businessName, assessmentId, details } = await req.json();

    // Get automation settings to check if notifications are enabled
    const { data: settings } = await supabase
      .from('automation_settings')
      .select('*')
      .limit(1)
      .single();

    if (!settings) {
      return new Response(JSON.stringify({ success: false, error: 'No automation settings found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if this notification type is enabled
    let shouldNotify = false;
    let subject = '';
    let bodyHtml = '';

    switch (eventType) {
      case 'booking_created':
        shouldNotify = settings.admin_notify_on_booking;
        subject = `📅 New Booking: ${leadName || 'Unknown'} — ${businessName || 'Unknown Business'}`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; color: white; padding: 20px 25px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 20px;">📅 New Straight Talk™ Booking</h1>
            </div>
            <div style="padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;"><strong>${leadName || 'Unknown'}</strong> has booked a Straight Talk™ call.</p>
              <table style="width: 100%; margin: 15px 0; font-size: 14px; color: #555;">
                <tr><td style="padding: 5px 0;"><strong>Business:</strong></td><td>${businessName || '—'}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Email:</strong></td><td>${leadEmail || '—'}</td></tr>
                ${details?.scheduledAt ? `<tr><td style="padding: 5px 0;"><strong>Scheduled:</strong></td><td>${new Date(details.scheduledAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}</td></tr>` : ''}
                ${details?.zoomLink ? `<tr><td style="padding: 5px 0;"><strong>Zoom:</strong></td><td><a href="${details.zoomLink}">${details.zoomLink}</a></td></tr>` : ''}
              </table>
              <a href="https://fivetotenx.lovable.app/admin" style="display: inline-block; background: #1789CE; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold;">View in Dashboard</a>
            </div>
          </div>
        `;
        break;

      case 'gameplan_completed':
        shouldNotify = settings.admin_notify_on_gp_complete;
        subject = `✅ Game Plan™ Completed: ${leadName || 'Unknown'} — ${businessName || 'Unknown Business'}`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; color: white; padding: 20px 25px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 20px;">✅ Game Plan™ Completed</h1>
            </div>
            <div style="padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;"><strong>${leadName || 'Unknown'}</strong> has completed their Game Plan™ questionnaire.</p>
              <table style="width: 100%; margin: 15px 0; font-size: 14px; color: #555;">
                <tr><td style="padding: 5px 0;"><strong>Business:</strong></td><td>${businessName || '—'}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Email:</strong></td><td>${leadEmail || '—'}</td></tr>
              </table>
              <p style="font-size: 14px; color: #555;">This lead is now ready for their Green Light™ proposal.</p>
              <a href="https://fivetotenx.lovable.app/admin" style="display: inline-block; background: #73AD12; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold;">Review & Prepare Proposal</a>
            </div>
          </div>
        `;
        break;

      case 'proposal_accepted': {
        shouldNotify = settings.admin_notify_on_proposal_accepted;
        const sel = details?.selectedItems as Array<{ title: string; cost: number }> | undefined;
        const itemsRows = Array.isArray(sel) && sel.length
          ? sel.map(s => `<tr><td style="padding: 4px 0; color: #555;">${s.title}</td><td style="padding: 4px 0; text-align: right; color: #1a1a2e; font-weight: 600;">$${(s.cost || 0).toLocaleString()}</td></tr>`).join('')
          : '';
        const totalLine = details?.totalIncGst != null
          ? `<p style="font-size: 16px; color: #1a1a2e; margin: 12px 0 4px;"><strong>Final accepted total:</strong> $${Number(details.totalIncGst).toLocaleString()} inc GST</p>`
          : '';
        const scopeLine = details?.itemsSelected != null
          ? `<p style="font-size: 13px; color: #555; margin: 0 0 12px;">Client selected <strong>${details.itemsSelected} of ${details.itemsOffered}</strong> proposed items · ~${details.totalWeeks ?? '?'} weeks</p>`
          : '';
        subject = `🎉 Proposal Accepted: ${leadName || 'Unknown'} — ${businessName || 'Unknown Business'}`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; color: white; padding: 20px 25px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 20px;">🎉 Green Light™ Proposal Accepted!</h1>
            </div>
            <div style="padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;"><strong>${leadName || 'Unknown'}</strong> has accepted the Green Light™ proposal!</p>
              <table style="width: 100%; margin: 15px 0; font-size: 14px; color: #555;">
                <tr><td style="padding: 5px 0;"><strong>Business:</strong></td><td>${businessName || '—'}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Email:</strong></td><td>${leadEmail || '—'}</td></tr>
              </table>
              ${scopeLine}
              ${itemsRows ? `<table style="width: 100%; margin: 8px 0 12px; font-size: 13px; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">${itemsRows}</table>` : ''}
              ${totalLine}
              <p style="font-size: 14px; color: #73AD12; font-weight: bold;">Time to start the Build™ phase! 🚀</p>
              <a href="https://fivetotenx.lovable.app/admin" style="display: inline-block; background: #1789CE; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold;">View in Dashboard</a>
            </div>
          </div>
        `;
        break;
      }

      case 'refinement_submitted':
        shouldNotify = true;
        subject = `📝 Refinement Answers Received: ${leadName || 'Unknown'} — ${businessName || 'Unknown Business'}`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; color: white; padding: 20px 25px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 20px;">📝 Scope Refinement Answers Received</h1>
            </div>
            <div style="padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;"><strong>${leadName || 'Unknown'}</strong> has submitted their scope refinement answers.</p>
              <table style="width: 100%; margin: 15px 0; font-size: 14px; color: #555;">
                <tr><td style="padding: 5px 0;"><strong>Business:</strong></td><td>${businessName || '—'}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Email:</strong></td><td>${leadEmail || '—'}</td></tr>
                ${details?.answeredCount != null ? `<tr><td style="padding: 5px 0;"><strong>Answered:</strong></td><td>${details.answeredCount} of ${details.totalQuestions} questions</td></tr>` : ''}
              </table>
              <p style="font-size: 14px; color: #555;">Review their answers in the Scope Refinement tab to update your analysis.</p>
              <a href="https://fivetotenx.lovable.app/admin" style="display: inline-block; background-color: #6b46c1; color: #ffffff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold;">Review Answers</a>
            </div>
          </div>
        `;
        break;

      case 'proposal_revision_requested': {
        shouldNotify = true;
        const sel = details?.selectedItems as Array<{ title: string; cost: number }> | undefined;
        const itemsRows = Array.isArray(sel) && sel.length
          ? sel.map(s => `<tr><td style="padding: 4px 0; color: #555;">${s.title}</td><td style="padding: 4px 0; text-align: right; color: #1a1a2e; font-weight: 600;">$${(s.cost || 0).toLocaleString()}</td></tr>`).join('')
          : '';
        const totalLine = details?.totalIncGst != null
          ? `<p style="font-size: 16px; color: #1a1a2e; margin: 12px 0 4px;"><strong>Requested total:</strong> $${Number(details.totalIncGst).toLocaleString()} inc GST</p>`
          : '';
        subject = `✏️ Revised Proposal Requested: ${leadName || 'Unknown'} — ${businessName || 'Unknown Business'}`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; color: white; padding: 20px 25px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 20px;">✏️ Client Requested a Revised Proposal</h1>
            </div>
            <div style="padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;"><strong>${leadName || 'Unknown'}</strong> has refined the scope and asked us to send a revised proposal.</p>
              <table style="width: 100%; margin: 15px 0; font-size: 14px; color: #555;">
                <tr><td style="padding: 5px 0;"><strong>Business:</strong></td><td>${businessName || '—'}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Email:</strong></td><td>${leadEmail || '—'}</td></tr>
                ${details?.itemsSelected != null ? `<tr><td style="padding: 5px 0;"><strong>Selected:</strong></td><td>${details.itemsSelected} of ${details.itemsOffered} items · ~${details.totalWeeks ?? '?'} weeks</td></tr>` : ''}
              </table>
              ${itemsRows ? `<table style="width: 100%; margin: 8px 0 12px; font-size: 13px; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">${itemsRows}</table>` : ''}
              ${totalLine}
              <p style="font-size: 13px; color: #555; margin: 12px 0;">Open the lead in Admin, review the new selection, then click <strong>Send Proposal</strong> to issue the revised version.</p>
              <a href="https://fivetotenx.lovable.app/admin" style="display: inline-block; background: #d97706; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold;">Review &amp; Send Revision</a>
            </div>
          </div>
        `;
        break;
      }

      case 'agreement_signed': {
        shouldNotify = true;
        const totalLine = details?.totalIncGst != null
          ? `<p style="font-size: 16px; color: #1a1a2e; margin: 12px 0 4px;"><strong>Signed amount:</strong> $${Number(details.totalIncGst).toLocaleString()} inc GST</p>`
          : '';
        const pdfLine = details?.signedPdfUrl
          ? `<p style="margin: 12px 0;"><a href="${details.signedPdfUrl}" style="color: #1789CE; text-decoration: underline;">📄 Download client-signed agreement (PDF)</a></p>`
          : '';
        subject = `✍️ Client Signed Agreement: ${leadName || 'Unknown'} — ${businessName || 'Unknown Business'}`;
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; color: white; padding: 20px 25px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 20px;">✍️ Engagement Agreement Signed by Client</h1>
            </div>
            <div style="padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;"><strong>${leadName || 'Unknown'}</strong> has accepted the proposal and signed the Initial AI Consultancy Engagement Agreement.</p>
              <table style="width: 100%; margin: 15px 0; font-size: 14px; color: #555;">
                <tr><td style="padding: 5px 0;"><strong>Business:</strong></td><td>${businessName || '—'}</td></tr>
                <tr><td style="padding: 5px 0;"><strong>Email:</strong></td><td>${leadEmail || '—'}</td></tr>
                ${details?.signerName ? `<tr><td style="padding: 5px 0;"><strong>Signed by:</strong></td><td>${details.signerName}</td></tr>` : ''}
                ${details?.signedAt ? `<tr><td style="padding: 5px 0;"><strong>Signed at:</strong></td><td>${new Date(details.signedAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}</td></tr>` : ''}
              </table>
              ${totalLine}
              ${pdfLine}
              <p style="font-size: 14px; color: #d97706; font-weight: bold; margin-top: 16px;">⚠️ Action required: Aidan to countersign in the Admin Proposals tab.</p>
              <a href="https://fivetotenx.lovable.app/admin" style="display: inline-block; background: #1789CE; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold;">Open Admin to Countersign</a>
            </div>
          </div>
        `;
        break;
      }

      default:
        return new Response(JSON.stringify({ success: false, error: `Unknown event type: ${eventType}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Always insert in-app notification (independent of email setting) so admins
    // see the bell badge even when an email channel is muted.
    try {
      const inAppTitles: Record<string, string> = {
        booking_created: '📅 New Straight Talk™ booking',
        gameplan_completed: '✅ Game Plan™ completed',
        proposal_accepted: '🎉 Proposal accepted',
        refinement_submitted: '📝 Refinement answers received',
        proposal_revision_requested: '✏️ Revised proposal requested',
        agreement_signed: '✍️ Agreement signed',
      };
      const inAppTitle = inAppTitles[eventType] || eventType;
      const inAppMessage = `${leadName || 'A client'}${businessName ? ` (${businessName})` : ''}`;
      await supabase.from('admin_notifications').insert({
        event_type: eventType,
        title: inAppTitle,
        message: inAppMessage,
        assessment_id: assessmentId || null,
        lead_name: leadName || null,
        business_name: businessName || null,
        details: details || {},
      });
    } catch (e) {
      console.error('Failed to insert in-app notification:', e);
    }

    if (!shouldNotify) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Email notification disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const notifyEmails = settings.admin_notify_emails || ['eoghan@5to10x.app', 'aidan@5to10x.app'];

    // Send email to each admin
    for (const email of notifyEmails) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: '5to10X Pipeline <grow@5to10x.app>',
          to: [email],
          subject,
          html: bodyHtml,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Failed to notify ${email}:`, errText);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Admin notification error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
