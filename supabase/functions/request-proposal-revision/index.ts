// When the client clicks "Send Me This Revised Proposal", this function:
//   1. Validates the proposal access token.
//   2. Persists the client's selection on the current proposal.
//   3. Rebuilds proposal_data from the selected items (totals, payment schedule, weeks).
//   4. Invokes send-proposal to clone into a new revision and email the client.
//   5. Notifies admin (non-blocking) so we can see the loop in real time.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GST_RATE = 0.10;
const DEPOSIT_PCT = 0.10;
const MVP_PCT = 0.50;

interface IncomingItem {
  title: string;
  cost?: number;
  weeks?: number;
  _type?: 'big_hit' | 'quick_win';
  estimated_annual_impact?: number;
}

const recalcTotals = (items: IncomingItem[]) => {
  const subtotalExGst = items.reduce((sum, i) => sum + (Number(i.cost) || 0), 0);
  const gst = Math.round(subtotalExGst * GST_RATE);
  const totalIncGst = subtotalExGst + gst;
  const deposit = Math.round(subtotalExGst * DEPOSIT_PCT);
  const mvp = Math.round(subtotalExGst * MVP_PCT);
  const final = subtotalExGst - deposit - mvp;

  let maxBigHit = 0;
  let quickWinWeeks = 0;
  items.forEach((i) => {
    const w = Number(i.weeks) || 0;
    if (i._type === 'big_hit') maxBigHit = Math.max(maxBigHit, w);
    else quickWinWeeks += w * 0.5;
  });
  const totalWeeks = Math.ceil(maxBigHit + quickWinWeeks) || 0;

  return { subtotalExGst, gst, totalIncGst, deposit, mvp, final, totalWeeks };
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

    const { proposalId, token, selectedIndexes, selectedItems, clientNote } = await req.json();
    if (!proposalId || !token) throw new Error('proposalId and token are required');

    // 1. Validate token (admins from the dashboard pass 'admin-bypass')
    if (token !== 'admin-bypass') {
      const { data: tokenRow, error: tokenErr } = await supabase
        .from('proposal_tokens')
        .select('proposal_id, expires_at')
        .eq('token', token)
        .eq('proposal_id', proposalId)
        .maybeSingle();
      if (tokenErr || !tokenRow) throw new Error('Invalid or expired link');
      if (new Date(tokenRow.expires_at) < new Date()) {
        throw new Error('This link has expired. Please request a new one.');
      }
    }

    // 2. Load the proposal we're revising
    const { data: prop, error: propErr } = await supabase
      .from('proposals')
      .select('id, assessment_id, revision, proposal_data, delivered_at')
      .eq('id', proposalId)
      .single();
    if (propErr || !prop) throw new Error('Proposal not found');

    const existingData: any = prop.proposal_data || {};
    const existingItems: any[] = Array.isArray(existingData.items) ? existingData.items : [];

    // 3. Compute the new item list. Prefer the rich existing item bodies,
    //    matched by index from selectedIndexes; fall back to the lightweight
    //    selectedItems payload from the client.
    let newItems: any[] = [];
    if (Array.isArray(selectedIndexes) && selectedIndexes.length > 0 && existingItems.length > 0) {
      newItems = (selectedIndexes as number[])
        .filter((i) => Number.isInteger(i) && i >= 0 && i < existingItems.length)
        .map((i) => existingItems[i]);
    } else if (Array.isArray(selectedItems)) {
      newItems = selectedItems as any[];
    }

    if (newItems.length === 0) {
      throw new Error('No items selected. Please tick at least one item before requesting a revision.');
    }

    const totals = recalcTotals(newItems as IncomingItem[]);
    const newProposalData = {
      ...existingData,
      items: newItems,
      totals,
      feeStructure: {
        deposit: { percent: DEPOSIT_PCT * 100, amount: totals.deposit, label: 'On Commencement' },
        mvp: { percent: MVP_PCT * 100, amount: totals.mvp, label: 'On MVP Achieved & Reviewed' },
        final: { percent: 40, amount: totals.final, label: 'On Handover of Final Build' },
      },
      regenerated_at: new Date().toISOString(),
      regenerated_by: 'client_revision',
    };

    // 4. Persist the client's intent on the CURRENT proposal so the audit trail is intact.
    await supabase
      .from('proposals')
      .update({
        client_selection: {
          selected_indexes: selectedIndexes ?? [],
          selected_items: newItems.map((i: any) => ({
            title: i.title,
            cost: i.cost ?? 0,
            weeks: i.weeks ?? 0,
            _type: i._type,
            estimated_annual_impact: i.estimated_annual_impact ?? 0,
          })),
          totals,
          revision_requested: true,
          client_note: clientNote || null,
          requested_at: new Date().toISOString(),
        } as any,
        client_revision_requested_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    // 5. If the proposal was already delivered, send-proposal will clone into v+1
    //    using THIS new proposal_data. Apply the new data to the current row first
    //    so the clone copies the correct scope/totals.
    await supabase
      .from('proposals')
      .update({ proposal_data: newProposalData })
      .eq('id', proposalId);

    // 6. Regenerate the tech stack so it matches the revised build scope.
    //    Non-blocking: if it fails we still send the revised proposal.
    try {
      const { error: techErr } = await supabase.functions.invoke('analyze-opportunities', {
        body: { assessmentId: prop.assessment_id, mode: 'tech_stack' },
      });
      if (techErr) console.error('Tech stack regen failed (non-fatal):', techErr);
    } catch (e) {
      console.error('Tech stack regen threw (non-fatal):', e);
    }

    // 7. Invoke send-proposal — this clones to a new revision (because delivered_at is set),
    //    generates a fresh access token, and emails the client the revised proposal.
    const { data: sendResult, error: sendErr } = await supabase.functions.invoke('send-proposal', {
      body: { assessmentId: prop.assessment_id, proposalId, cc: ['aidan@5to10x.app', 'eoghan@5to10x.app'] },
    });

    if (sendErr) {
      console.error('send-proposal failed during revision flow:', sendErr);
      throw new Error('Could not send the revised proposal email. Our team has been notified.');
    }

    // 7. Fire admin notification (non-blocking)
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
            previousRevision: prop.revision,
            newRevision: (sendResult as any)?.revision ?? null,
            itemsSelected: newItems.length,
            totalIncGst: totals.totalIncGst,
            clientNote: clientNote || null,
            selectedItems: newItems.map((i: any) => ({ title: i.title, cost: i.cost })),
          },
        },
      }).catch((err) => console.error('Notify admin failed:', err));
    }

    return new Response(
      JSON.stringify({
        success: true,
        revision: (sendResult as any)?.revision ?? null,
        newProposalId: (sendResult as any)?.proposalId ?? null,
        viewUrl: (sendResult as any)?.viewUrl ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: unknown) {
    console.error('request-proposal-revision error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
