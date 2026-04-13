import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MIME_MAP: Record<string, string> = {
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
};

function getMimeType(url: string): string {
  const ext = (url.match(/\.\w+(?=\?|$)/) || ['.m4a'])[0].toLowerCase();
  return MIME_MAP[ext] || 'audio/mp4';
}

// Standard base64 encoding table
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const len = bytes.length;
  const parts: string[] = [];
  // Process in 48KB output chunks (~36KB input) to avoid giant string concatenation
  const INPUT_CHUNK = 36000; // must be divisible by 3
  for (let offset = 0; offset < len; offset += INPUT_CHUNK) {
    const end = Math.min(offset + INPUT_CHUNK, len);
    const chunk = bytes.subarray(offset, end);
    let str = '';
    const cLen = chunk.length;
    let i = 0;
    for (; i + 2 < cLen; i += 3) {
      const n = (chunk[i] << 16) | (chunk[i + 1] << 8) | chunk[i + 2];
      str += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
    }
    if (i < cLen) {
      const n1 = chunk[i];
      if (i + 1 < cLen) {
        const n2 = chunk[i + 1];
        str += B64[(n1 >> 2)] + B64[((n1 & 3) << 4) | (n2 >> 4)] + B64[((n2 & 15) << 2)] + '=';
      } else {
        str += B64[(n1 >> 2)] + B64[((n1 & 3) << 4)] + '==' ;
      }
    }
    parts.push(str);
  }
  return parts.join('');
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

    // Download audio
    const audioResp = await fetch(audioUrl);
    if (!audioResp.ok) throw new Error(`Failed to download audio: ${audioResp.status}`);

    const audioBytes = new Uint8Array(await audioResp.arrayBuffer());
    const fileSizeMB = audioBytes.length / (1024 * 1024);
    console.log(`Audio file size: ${fileSizeMB.toFixed(1)}MB`);
    
    // Hard limit at 25MB for edge function memory safety
    if (audioBytes.length > 25 * 1024 * 1024) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `File is ${fileSizeMB.toFixed(0)}MB — too large for transcription (max 25MB). Please use the "Audio Only" (.m4a) export from Zoom, or compress the file before uploading.` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert to base64 data URL using memory-efficient encoding
    const mime = getMimeType(audioUrl);
    const base64 = uint8ArrayToBase64(audioBytes);
    const dataUrl = `data:${mime};base64,${base64}`;

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
