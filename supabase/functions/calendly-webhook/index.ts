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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload = await req.json();
    const event = payload.event || payload.trigger_event;
    
    console.log('Calendly webhook received:', event, JSON.stringify(payload).substring(0, 500));

    // Handle invitee.created events (new booking)
    if (event === 'invitee.created') {
      const inviteePayload = payload.payload;
      const inviteeEmail = inviteePayload?.email || inviteePayload?.invitee?.email;
      const inviteeName = inviteePayload?.name || inviteePayload?.invitee?.name;
      const scheduledAt = inviteePayload?.scheduled_event?.start_time || inviteePayload?.event?.start_time;
      const zoomLink = inviteePayload?.scheduled_event?.location?.join_url 
        || inviteePayload?.event?.location?.join_url
        || null;
      const calendlyEventId = inviteePayload?.scheduled_event?.uri 
        || inviteePayload?.event?.uri 
        || null;
      const eventName = inviteePayload?.scheduled_event?.name 
        || inviteePayload?.event?.name 
        || 'Discovery Call';

      if (!inviteeEmail) {
        console.error('No email in webhook payload');
        return new Response(JSON.stringify({ success: false, error: 'No email found' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find the assessment by email
      const { data: assessment, error: findErr } = await supabase
        .from('roi_assessments')
        .select('id, pipeline_stage, business_name')
        .eq('contact_email', inviteeEmail.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (findErr || !assessment) {
        console.log('No assessment found for email:', inviteeEmail);
        // Still return 200 so Calendly doesn't retry
        return new Response(JSON.stringify({ success: true, matched: false, message: 'No matching assessment' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create a client_interview record with the booking details
      const { error: insertErr } = await supabase
        .from('client_interviews')
        .insert({
          assessment_id: assessment.id,
          interview_type: 'scheduled',
          title: eventName,
          content: `Booked by ${inviteeName || inviteeEmail} via Calendly`,
          zoom_link: zoomLink,
          scheduled_at: scheduledAt,
          calendly_event_id: calendlyEventId,
          call_completed: false,
        });

      if (insertErr) {
        console.error('Failed to insert interview:', insertErr);
        throw new Error(`Insert failed: ${insertErr.message}`);
      }

      console.log('Booking saved for assessment:', assessment.id);

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

      // Send booking confirmation to the CLIENT with ICS invite (fire and forget)
      fetch(`${supabaseUrl}/functions/v1/send-booking-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactName: inviteeName || inviteeEmail,
          contactEmail: inviteeEmail,
          businessName: null,
          scheduledAt,
          zoomLink,
          eventName,
        }),
      }).catch(err => console.error('Booking confirmation email failed:', err));

      // Fire admin notification (fire and forget)
      fetch(`${supabaseUrl}/functions/v1/notify-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'booking_created',
          leadName: inviteeName || inviteeEmail,
          leadEmail: inviteeEmail,
          businessName: null,
          assessmentId: assessment.id,
          details: { scheduledAt, zoomLink },
        }),
      }).catch(err => console.error('Admin notification failed:', err));

      return new Response(JSON.stringify({ success: true, matched: true, assessmentId: assessment.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle invitee.canceled events
    if (event === 'invitee.canceled') {
      const cancelPayload = payload.payload;
      const cancelledEventUri = cancelPayload?.scheduled_event?.uri || cancelPayload?.event?.uri;
      
      if (cancelledEventUri) {
        // Mark the interview as cancelled by updating the title
        await supabase
          .from('client_interviews')
          .update({ title: '❌ Cancelled — ' + (cancelPayload?.scheduled_event?.name || 'Discovery Call') })
          .eq('calendly_event_id', cancelledEventUri);
      }

      return new Response(JSON.stringify({ success: true, action: 'cancelled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Unknown event type — still return 200
    return new Response(JSON.stringify({ success: true, action: 'ignored', event }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Calendly webhook error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
