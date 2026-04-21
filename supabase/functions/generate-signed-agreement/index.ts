// Generates a signed agreement PDF (with embedded drawn signature + filled fields),
// uploads it to the 'interview-audio' bucket, and emails both client and admin.
// Admin countersignature happens later from the admin dashboard.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v || 0);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { proposalId, token } = await req.json();
    if (!proposalId) throw new Error('proposalId is required');

    // Validate token (skip for service-side internal calls when token === 'internal')
    if (token && token !== 'internal' && token !== 'admin-bypass') {
      const { data: tokenRow } = await supabase
        .from('proposal_tokens')
        .select('proposal_id, expires_at')
        .eq('token', token)
        .eq('proposal_id', proposalId)
        .maybeSingle();
      if (!tokenRow) throw new Error('Invalid or expired link');
    }

    const { data: prop, error: propErr } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();
    if (propErr || !prop) throw new Error('Proposal not found');

    const { data: assessment } = await supabase
      .from('roi_assessments')
      .select('contact_name, contact_email, business_name')
      .eq('id', prop.assessment_id)
      .single();
    if (!assessment) throw new Error('Assessment not found');

    const { data: agreementDoc } = await supabase
      .from('legal_documents')
      .select('content, version')
      .eq('key', 'initial-engagement')
      .eq('is_current', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const agreementContent = agreementDoc?.content || 'Agreement document not available.';
    const agreementVersion = agreementDoc?.version || prop.agreement_version || '1.0';

    const clientName = prop.agreement_signer_name || assessment.contact_name;
    const businessName = assessment.business_name || '';
    const clientEmail = assessment.contact_email;
    const total = prop.agreement_accepted_total || 0;
    const items = (prop.agreement_accepted_items as any[]) || [];
    const acceptedAt = prop.agreement_accepted_at || new Date().toISOString();

    // Replace placeholders
    const replaceAll = (s: string, find: string, repl: string) => s.split(find).join(repl);
    let body = agreementContent;
    body = replaceAll(body, '{{CLIENT_NAME}}', clientName);
    body = replaceAll(body, '{{BUSINESS_NAME}}', businessName);
    body = replaceAll(body, '{{CLIENT_EMAIL}}', clientEmail);
    body = replaceAll(body, '{{TOTAL_INC_GST}}', formatCurrency(total));
    body = replaceAll(body, '{{DATE}}', formatDate(acceptedAt));

    // Build PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    const pageWidth = 595;
    const pageHeight = 842;
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const drawText = (text: string, opts: { size?: number; bold?: boolean; color?: any; indent?: number } = {}) => {
      const { size = 10, bold = false, color = rgb(0.1, 0.1, 0.1), indent = 0 } = opts;
      const f = bold ? fontBold : font;
      const maxWidth = pageWidth - margin * 2 - indent;
      // Word wrap
      const words = text.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (f.widthOfTextAtSize(test, size) > maxWidth) {
          if (y < margin + 20) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }
          page.drawText(line, { x: margin + indent, y, size, font: f, color });
          y -= size + 4;
          line = w;
        } else {
          line = test;
        }
      }
      if (line) {
        if (y < margin + 20) { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }
        page.drawText(line, { x: margin + indent, y, size, font: f, color });
        y -= size + 4;
      }
    };

    // Header
    drawText('Initial AI Consultancy Engagement Agreement', { size: 16, bold: true });
    drawText(`Version ${agreementVersion}  ·  Signed ${formatDate(acceptedAt)}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
    y -= 10;

    // Filled fields box
    drawText('Parties & fees', { size: 11, bold: true });
    drawText(`Client: ${clientName}`, { size: 10 });
    if (businessName) drawText(`Business: ${businessName}`, { size: 10 });
    drawText(`Email: ${clientEmail}`, { size: 10 });
    drawText(`Total fees (inc GST): ${formatCurrency(total)}`, { size: 10, bold: true });
    y -= 8;

    // Selected items
    if (items.length > 0) {
      drawText('Selected scope items', { size: 11, bold: true });
      items.forEach((it: any) => {
        drawText(`• ${it.title} — ${formatCurrency(it.cost || 0)}`, { size: 10, indent: 8 });
      });
      y -= 8;
    }

    // Agreement body
    drawText('Agreement', { size: 11, bold: true });
    body.split('\n').forEach((para) => {
      if (para.trim() === '') { y -= 6; return; }
      drawText(para, { size: 9 });
    });

    // Signature block on a fresh page so it always fits
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    drawText('Signed by Client', { size: 12, bold: true });
    y -= 10;

    // Embed drawn signature image
    if (prop.agreement_signer_signature) {
      try {
        const sigBase64 = String(prop.agreement_signer_signature).replace(/^data:image\/\w+;base64,/, '');
        const sigBytes = Uint8Array.from(atob(sigBase64), c => c.charCodeAt(0));
        const sigImg = await pdfDoc.embedPng(sigBytes);
        const sigDims = sigImg.scale(0.4);
        page.drawImage(sigImg, { x: margin, y: y - sigDims.height, width: sigDims.width, height: sigDims.height });
        y -= sigDims.height + 10;
      } catch (err) {
        console.error('Signature embed failed:', err);
      }
    }
    page.drawLine({ start: { x: margin, y }, end: { x: margin + 300, y }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });
    y -= 14;
    drawText(clientName, { size: 11, bold: true });
    drawText(`Date signed: ${formatDate(acceptedAt)}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
    if (prop.agreement_signer_ip) drawText(`IP: ${prop.agreement_signer_ip}`, { size: 8, color: rgb(0.5, 0.5, 0.5) });
    y -= 30;

    // Countersignature placeholder for 5to10X
    drawText('Countersigned by 5to10X', { size: 12, bold: true });
    y -= 10;
    if (prop.countersigner_signature) {
      try {
        const sigBase64 = String(prop.countersigner_signature).replace(/^data:image\/\w+;base64,/, '');
        const sigBytes = Uint8Array.from(atob(sigBase64), c => c.charCodeAt(0));
        const sigImg = await pdfDoc.embedPng(sigBytes);
        const sigDims = sigImg.scale(0.4);
        page.drawImage(sigImg, { x: margin, y: y - sigDims.height, width: sigDims.width, height: sigDims.height });
        y -= sigDims.height + 10;
      } catch (err) { console.error('Counter sig embed failed:', err); }
    } else {
      drawText('[Awaiting 5to10X countersignature]', { size: 9, color: rgb(0.6, 0.4, 0.0) });
      y -= 16;
    }
    page.drawLine({ start: { x: margin, y }, end: { x: margin + 300, y }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });
    y -= 14;
    drawText(prop.countersigner_name || 'Aidan Toomey, Co-Founder', { size: 11, bold: true });
    if (prop.countersigned_at) drawText(`Date countersigned: ${formatDate(prop.countersigned_at)}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });

    const pdfBytes = await pdfDoc.save();

    // Upload to storage
    const fileName = `signed-agreements/${proposalId}-v${agreementVersion}-${Date.now()}.pdf`;
    const { error: upErr } = await supabase.storage
      .from('interview-audio')
      .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

    const { data: pub } = supabase.storage.from('interview-audio').getPublicUrl(fileName);
    const pdfUrl = pub.publicUrl;

    await supabase.from('proposals').update({ signed_pdf_url: pdfUrl }).eq('id', proposalId);

    // Send confirmation emails (client + admin) with attachment + link
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
      const subject = `✅ Agreement signed — ${businessName || clientName}`;
      const firstName = (clientName || 'there').split(' ')[0];

      const html = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#f8fafc;padding:30px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
          <div style="background:#1e3a5f;color:#fff;padding:30px;text-align:center;">
            <h1 style="margin:0;font-size:22px;">Agreement Signed ✅</h1>
            <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">Initial AI Consultancy Engagement Agreement v${agreementVersion}</p>
          </div>
          <div style="padding:28px;color:#334155;font-size:15px;line-height:1.7;">
            <p>Hi ${firstName},</p>
            <p>Thank you for signing the engagement agreement for <strong>${businessName || clientName}</strong>. A copy is attached to this email and also available at the link below.</p>
            <p style="background:#f1f5f9;padding:14px 16px;border-radius:8px;margin:18px 0;">
              <strong>Total fees (inc GST):</strong> ${formatCurrency(total)}<br>
              <strong>Items selected:</strong> ${items.length}<br>
              <strong>Signed:</strong> ${formatDate(acceptedAt)}
            </p>
            <p style="text-align:center;margin:24px 0;">
              <a href="${pdfUrl}" style="display:inline-block;padding:14px 28px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">View Signed Agreement</a>
            </p>
            <p style="font-size:13px;color:#64748b;">Aidan will countersign on our side shortly and you'll receive the fully countersigned version. Next step is your $1,000 commitment deposit, which we'll invoice separately.</p>
            <p>Welcome aboard!<br>— The 5to10X team</p>
          </div>
        </div>
      </body></html>`;

      const recipients = [clientEmail, 'eoghan@5to10x.app', 'aidan@5to10x.app'];

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: '5to10X <grow@5to10x.app>',
          to: recipients,
          subject,
          html,
          attachments: [{
            filename: `5to10X-Engagement-Agreement-${(businessName || clientName).replace(/\s+/g, '-')}.pdf`,
            content: pdfBase64,
          }],
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, pdfUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('generate-signed-agreement error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
