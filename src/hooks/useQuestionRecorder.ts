import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseQuestionRecorderOptions {
  onTranscribed: (questionId: string, transcript: string) => void;
}

export const useQuestionRecorder = ({ onTranscribed }: UseQuestionRecorderOptions) => {
  const { toast } = useToast();
  const [recordingQuestionId, setRecordingQuestionId] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const transcribeBlob = useCallback(async (blob: Blob, questionId: string, questionText: string) => {
    setTranscribingId(questionId);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'answer.webm');
      formData.append('question', questionText);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/transcribe-question`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Failed: ${res.status}`);
      }

      const { transcript } = await res.json();
      if (transcript) {
        onTranscribed(questionId, transcript);
        toast({ title: 'Answer transcribed & saved ✅' });
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      toast({ title: 'Transcription failed', description: err.message, variant: 'destructive' });
    } finally {
      setTranscribingId(null);
    }
  }, [toast, onTranscribed]);

  const startRecording = useCallback(async (questionId: string, questionText: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingTime(0);
      setRecordingQuestionId(questionId);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setRecordingQuestionId(null);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        transcribeBlob(blob, questionId, questionText);
      };

      mediaRecorder.start(1000);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast({ title: 'Microphone access denied', description: 'Please allow microphone access.', variant: 'destructive' });
    }
  }, [toast, transcribeBlob]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return {
    recordingQuestionId,
    recordingTime,
    transcribingId,
    startRecording,
    stopRecording,
    formatTime,
  };
};
