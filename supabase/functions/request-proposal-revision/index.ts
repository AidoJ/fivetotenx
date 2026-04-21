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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { proposalId, token, selectedIndexes, selectedItems, totals, clientNote } = await req.json();
    if (!proposalId || !token) throw new Error('proposalId and token are required');

    // Validate token
    const { data: tokenRow, error: tokenErr } = await supabase
      .from('proposal_tokens')
      .select('proposal_id, expires_at')
      .eq('token', token)
      .eq('proposal_id', proposalId)
      .maybeSingle();
    if (tokenErr || !tokenRow) throw new Error('Invalid or expired link');
    if (new Date(tokenRow.expires_at) < new Date()) throw new Error('This link has expired. Please request a new one.');

    // Persist client selection on the proposal
    const { data: prop, error: propErr } = await supabase
      .from('proposals')
      .select('id, assessment_id, revision')
      .eq('id', proposalId)
      .single();
    if (propErr || !prop) throw new Error('Proposal not found');

    await supabase
      .from('proposals')
      .update({
        client_selection: {
          selected_indexes: selectedIndexes ?? [],
          selected_items: selectedItems ?? [],
          totals: totals ?? null,
          revision_requested: true,
          client_note: clientNote || null,
          requested_at: new Date().toISOString(),
        } as any,
        client_revision_requested_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    // Fire admin notification
    const { data: assessment } = await supabase
      .from('roi_assessments')
      .select('contact_name, contact_email, business_name')
      .eq('id', prop.assessment_id)
      .single();

    if (assessment) {
      await supabase.functions.invoke('notify-admin', {
        body: {
          eventType: 'proposal_revision_requested',
          leadName: assessment.contact_name,
          leadEmail: assessment.contact_email,
          businessName: assessment.business_name,
          assessmentId: prop.assessment_id,
          details: {
            proposalId,
            revision: prop.revision,
            itemsSelected: (selectedItems ?? []).length,
            totalIncGst: totals?.totalIncGst ?? 0,
            clientNote: clientNote || null,
            selectedItems: (selectedItems ?? []).map((i: any) => ({ title: i.title, cost: i.cost })),
          },
        },
      }).catch((err) => console.error('Notify admin failed:', err));
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
