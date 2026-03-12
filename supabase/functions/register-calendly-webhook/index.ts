import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calendlyToken } = await req.json();

    if (!calendlyToken) {
      return new Response(JSON.stringify({ error: 'Calendly Personal Access Token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Get user info to find organization URI
    const userRes = await fetch('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${calendlyToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userRes.ok) {
      const error = await userRes.text();
      return new Response(JSON.stringify({ error: `Failed to get user info: ${error}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userData = await userRes.json();
    const organizationUri = userData.resource.current_organization;

    // Step 2: Register webhook
    const webhookRes = await fetch('https://api.calendly.com/webhook_subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${calendlyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://hfszmulinpwzmroqemke.supabase.co/functions/v1/calendly-webhook',
        events: ['invitee.created', 'invitee.canceled'],
        organization: organizationUri,
        scope: 'organization',
      }),
    });

    if (!webhookRes.ok) {
      const error = await webhookRes.text();
      return new Response(JSON.stringify({ error: `Failed to register webhook: ${error}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const webhookData = await webhookRes.json();

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook registered successfully!',
      webhookId: webhookData.resource.uri,
      organization: organizationUri,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
