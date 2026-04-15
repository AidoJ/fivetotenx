import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { assessmentId, questionIds, contactEmail, contactName, businessName } = await req.json();
    if (!assessmentId || !questionIds?.length || !contactEmail) {
      throw new Error("assessmentId, questionIds, and contactEmail are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Mark selected questions as sent_to_client
    await sb.from("refinement_questions")
      .update({ sent_to_client: true })
      .in("id", questionIds);

    // Create a secure token
    const { data: tokenData, error: tokenError } = await sb
      .from("refinement_tokens")
      .insert({
        assessment_id: assessmentId,
        questions_sent: questionIds.length,
      })
      .select("token")
      .single();

    if (tokenError || !tokenData) throw new Error("Failed to create access token");

    const portalUrl = `https://5to10x.app/refinement/${tokenData.token}`;

    // Fetch the questions for the email body
    const { data: questions } = await sb
      .from("refinement_questions")
      .select("question, category, priority")
      .in("id", questionIds)
      .order("sort_order");

    const priorityLabel: Record<string, string> = {
      blocker: "🔴 Critical",
      important: "🟡 Important",
      nice_to_know: "🔵 Helpful",
    };

    const questionRows = (questions || []).map((q: any, idx: number) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; vertical-align: top;">
          ${idx + 1}. ${q.question}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #64748b; text-align: center; vertical-align: top; white-space: nowrap;">
          ${priorityLabel[q.priority] || q.priority}
        </td>
      </tr>
    `).join("");

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6b46c1, #d63384); padding: 32px; text-align: center;">
            <img src="https://hfszmulinpwzmroqemke.supabase.co/storage/v1/object/public/email-assets/logo-5to10x-white-strap.png" alt="5to10X" style="height: 40px; margin-bottom: 16px;" />
            <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700;">Scope Refinement</h1>
            <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 8px 0 0;">We need a few more details</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px;">
            <p style="color: #1e293b; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Hi ${contactName || "there"},
            </p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Thanks for all the information you've shared so far. As we refine the scope for ${businessName ? `<strong>${businessName}</strong>` : "your project"}, 
              we've identified ${questionIds.length} question${questionIds.length > 1 ? "s" : ""} that will help us build exactly what you need.
            </p>

            <!-- Question preview -->
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Question</th>
                  <th style="padding: 10px 12px; text-align: center; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Priority</th>
                </tr>
              </thead>
              <tbody>
                ${questionRows}
              </tbody>
            </table>

            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              Click the button below to answer these questions online. You can also attach files or links to support your answers.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #6b46c1, #d63384); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
                Answer Questions →
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
              This link is valid for 14 days. If you have any questions, reply to this email.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0; text-align: center;">
              © ${new Date().getFullYear()} 5to10X · <a href="https://5to10x.app" style="color: #6b46c1; text-decoration: none;">5to10x.app</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>`;

    // Send via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "5to10X <grow@5to10x.app>",
        to: [contactEmail],
        cc: ["aidan@5to10x.app", "eoghan@5to10x.app"],
        subject: `We need a few more details — ${businessName || "Scope Refinement"}`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
      throw new Error("Email send failed");
    }

    return new Response(JSON.stringify({
      success: true,
      portalUrl,
      questionsSent: questionIds.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-refinement-invite error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});