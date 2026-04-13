import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getMimeType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('.mp3')) return 'audio/mp3';
  if (lower.includes('.m4a')) return 'audio/mp4';
  if (lower.includes('.wav')) return 'audio/wav';
  if (lower.includes('.ogg')) return 'audio/ogg';
  if (lower.includes('.webm')) return 'audio/webm';
  return 'audio/mp3';
}

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

    // Download the audio file and convert to base64 data URL
    console.log('Downloading audio from:', audioUrl);
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) throw new Error(`Failed to download audio: ${audioResponse.status}`);

    const audioBytes = new Uint8Array(await audioResponse.arrayBuffer());
    console.log(`Audio size: ${(audioBytes.length / 1024 / 1024).toFixed(2)} MB`);

    if (audioBytes.length > 25 * 1024 * 1024) {
      throw new Error('Audio file too large (>25MB). Please compress and re-upload.');
    }

    // Encode to base64 — chunk size MUST be multiple of 3 for correct concatenation
    let base64 = '';
    const CHUNK = 32766; // multiple of 3
    for (let i = 0; i < audioBytes.length; i += CHUNK) {
      const chunk = audioBytes.subarray(i, Math.min(i + CHUNK, audioBytes.length));
      // Spread can OOM on large chunks, build string manually
      let binaryStr = '';
      for (let j = 0; j < chunk.length; j++) {
        binaryStr += String.fromCharCode(chunk[j]);
      }
      base64 += btoa(binaryStr);
    }

    const mimeType = getMimeType(audioUrl);
    const dataUrl = `data:${mimeType};base64,${base64}`;
    console.log(`Base64 encoding complete (${(base64.length / 1024 / 1024).toFixed(1)}MB b64), sending to AI gateway...`);

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
                type: 'image_url',
                image_url: {
                  url: dataUrl,
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
    console.log('AI response status:', response.status, 'finish_reason:', result.choices?.[0]?.finish_reason);
    const transcript = result.choices?.[0]?.message?.content || '';

    if (!transcript) {
      console.error('Empty transcript. Full response:', JSON.stringify(result).substring(0, 500));
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

    // Get the assessment_id for this interview to trigger extraction
    const { data: interview } = await supabase
      .from('client_interviews')
      .select('assessment_id')
      .eq('id', interviewId)
      .single();

    // Auto-trigger discovery answer extraction (fire and forget)
    if (interview?.assessment_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      fetch(`${supabaseUrl}/functions/v1/extract-discovery-answers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessmentId: interview.assessment_id }),
      }).catch(err => console.error('Auto-extraction trigger failed:', err));
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
