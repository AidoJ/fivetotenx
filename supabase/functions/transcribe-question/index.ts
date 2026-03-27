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

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const questionText = formData.get('question') as string;

    if (!audioFile) throw new Error('audio file is required');

    // Convert to base64
    const audioBytes = new Uint8Array(await audioFile.arrayBuffer());
    if (audioBytes.length > 25 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Audio too large (max 25MB)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ext = audioFile.name?.match(/\.\w+$/)?.[0]?.toLowerCase() || '.webm';
    const mimeMap: Record<string, string> = {
      '.webm': 'audio/webm', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp4': 'video/mp4',
    };
    const mime = mimeMap[ext] || 'audio/webm';

    const chunkSize = 32768;
    let binary = '';
    for (let i = 0; i < audioBytes.length; i += chunkSize) {
      const chunk = audioBytes.subarray(i, Math.min(i + chunkSize, audioBytes.length));
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${mime};base64,${base64}`;

    const systemPrompt = questionText
      ? `You are transcribing a short audio answer to this question: "${questionText}". Output ONLY the transcribed answer text. Clean up filler words but preserve meaning. If the audio is silent or unintelligible, respond with "[No audible response]".`
      : `Transcribe this short audio clip accurately. Output ONLY the transcription text. Clean up filler words but preserve meaning.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please transcribe this audio recording.' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI Gateway error:', response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited. Please wait a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI transcription failed: ${response.status}`);
    }

    const result = await response.json();
    const transcript = result.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ success: true, transcript }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Transcribe-question error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
