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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { interviewId, audioUrl } = await req.json();
    if (!interviewId || !audioUrl) throw new Error('interviewId and audioUrl are required');

    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) throw new Error(`Failed to download audio: ${audioResponse.status}`);
    
    const audioBlob = await audioResponse.blob();
    const audioBase64 = btoa(
      new Uint8Array(await audioBlob.arrayBuffer()).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Determine media type
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
    let mimeType = 'audio/mp3';
    if (contentType.includes('wav')) mimeType = 'audio/wav';
    else if (contentType.includes('mp4') || contentType.includes('m4a')) mimeType = 'audio/mp4';
    else if (contentType.includes('webm')) mimeType = 'audio/webm';
    else if (contentType.includes('ogg')) mimeType = 'audio/ogg';

    // Use Gemini multimodal to transcribe
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert audio transcriber. Transcribe the provided audio accurately and completely. 
Output ONLY the transcription text — no timestamps, no speaker labels unless clearly distinct speakers are present (in which case use "Speaker 1:", "Speaker 2:" etc).
Preserve the natural flow of conversation. Clean up filler words (um, uh) but keep the meaning intact.
If there are key topics or action items mentioned, add a brief "KEY POINTS:" section at the end with bullet points.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please transcribe this audio recording of a client interview. Capture all details accurately as this will be used for a business proposal.'
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: audioBase64,
                  format: mimeType.split('/')[1] || 'mp3'
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage limit reached. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error('AI Gateway error:', response.status, errText);
      throw new Error(`AI transcription failed: ${response.status}`);
    }

    const result = await response.json();
    const transcript = result.choices?.[0]?.message?.content || '';

    if (!transcript) {
      throw new Error('No transcript generated from audio');
    }

    // Save transcript to the interview record
    const { error: updateError } = await supabase
      .from('client_interviews')
      .update({ transcript })
      .eq('id', interviewId);

    if (updateError) {
      console.error('Failed to save transcript:', updateError);
      throw new Error(`Failed to save transcript: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true, transcript }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Transcription error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
