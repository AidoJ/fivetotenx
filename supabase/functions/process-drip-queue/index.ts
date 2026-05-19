import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STEP_INTERVAL_DAYS = 7;
const STOP_STAGES = ['replied', 'qualified', 'dead'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const nowIso = new Date().toISOString();
  const { data: due, error } = await supabase
    .from('outbound_prospects')
    .select('id, drip_step, email, business_name, stage')
    .eq('auto_drip', true)
    .eq('unsubscribed', false)
    .is('clicked_link_at', null)
    .lte('next_send_at', nowIso)
    .not('email', 'is', null);

  if (error) {
    console.error('Query failed', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: any[] = [];
  for (const p of due ?? []) {
    if (STOP_STAGES.includes(p.stage)) {
      await supabase.from('outbound_prospects')
        .update({ auto_drip: false, next_send_at: null })
        .eq('id', p.id);
      results.push({ id: p.id, skipped: 'stage_stop' });
      continue;
    }
    const nextStep = Math.min((p.drip_step || 0) + 1, 3);
    try {
      const { error: invErr } = await supabase.functions.invoke('send-drip-email', {
        body: { prospect_id: p.id, step: nextStep },
      });
      if (invErr) throw invErr;

      const nextSendAt = nextStep < 3
        ? new Date(Date.now() + STEP_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
        : null;
      await supabase.from('outbound_prospects')
        .update({ next_send_at: nextSendAt, auto_drip: nextStep < 3 })
        .eq('id', p.id);
      results.push({ id: p.id, step: nextStep, next_send_at: nextSendAt });
    } catch (e: any) {
      console.error('Send failed', p.id, e);
      results.push({ id: p.id, error: e.message });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
