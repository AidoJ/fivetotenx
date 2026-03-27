import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Mic, Square, Play, RotateCcw, ArrowRight, ArrowLeft, CheckCircle,
  Loader2, Sparkles, Calendar, Users, CreditCard, Settings, MessageSquare,
  UserCircle, Plug, Shield, Rocket, Hammer, Briefcase, Send, Pause,
  ExternalLink, Save,
} from 'lucide-react';
import logo from '@/assets/logo-5to10x-color.webp';

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, Calendar, Users, CreditCard, Settings, MessageSquare,
  UserCircle, Plug, Shield, Rocket, Hammer, Briefcase,
};

const CALENDLY_REFINEMENT_URL = 'https://calendly.com/aidan-rejuvenators/discovery';

interface Category { id: string; label: string; icon: string; sort_order: number; }
interface Question { id: string; category_id: string; question: string; detail_prompt: string; sort_order: number; }

const SelfInterview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const assessmentId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [industryId, setIndustryId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Transcription & responses
  const [transcribing, setTranscribing] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [existingResponseId, setExistingResponseId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Flatten questions across all categories
  const allQuestions = categories.flatMap(cat =>
    questions.filter(q => q.category_id === cat.id).sort((a, b) => a.sort_order - b.sort_order)
  );
  const currentQuestion = allQuestions[currentQuestionIndex];
  const currentCategory = categories.find(c => c.id === currentQuestion?.category_id);
  const progress = allQuestions.length > 0 ? ((currentQuestionIndex) / allQuestions.length) * 100 : 0;

  useEffect(() => {
    if (!assessmentId) { setLoading(false); return; }
    const load = async () => {
      const { data: assessment } = await supabase
        .from('roi_assessments')
        .select('business_name, contact_name, industry_id, discovery_answers')
        .eq('id', assessmentId)
        .single();

      if (!assessment) {
        toast({ title: 'Invalid link', description: 'Assessment not found.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      setBusinessName(assessment.business_name || '');
      setContactName(assessment.contact_name || '');
      setIndustryId(assessment.industry_id);

      if (assessment.industry_id) {
        const [catRes, qRes] = await Promise.all([
          supabase.from('scoping_categories').select('*')
            .eq('industry_id', assessment.industry_id)
            .in('phase', ['straight_talk', 'game_plan'])
            .order('sort_order'),
          supabase.from('scoping_questions').select('*').order('sort_order'),
        ]);

        const cats = (catRes.data as any) || [];
        const allQ = (qRes.data as any) || [];
        const catIds = cats.map((c: Category) => c.id);
        setCategories(cats);
        setQuestions(allQ.filter((q: Question) => catIds.includes(q.category_id)));

        // Build merged responses: start with discovery_answers (extracted from transcripts)
        let merged: Record<string, string> = {};
        const discoveryAnswers = (assessment.discovery_answers || {}) as Record<string, any>;
        // discovery_answers keys are "category-slug__shortId" — extract the shortId part
        for (const [key, val] of Object.entries(discoveryAnswers)) {
          const shortId = key.split('__')[1];
          if (!shortId) continue;
          // Find the full question ID that starts with this shortId
          const matchedQ = allQ.find((q: Question) => q.id.startsWith(shortId) && catIds.includes(q.category_id));
          if (matchedQ) {
            const answer = typeof val === 'string' ? val : (val as any)?.answer || JSON.stringify(val);
            merged[matchedQ.id] = answer;
          }
        }

        // Load existing self-interview responses (resume support) — these override transcript answers
        const { data: existing } = await supabase
          .from('straight_talk_responses')
          .select('id, responses, completed')
          .eq('assessment_id', assessmentId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existing?.[0]) {
          setExistingResponseId(existing[0].id);
          const savedResponses = (existing[0].responses || {}) as Record<string, string>;
          // Self-interview responses take priority over transcript extractions
          merged = { ...merged, ...savedResponses };
          if (existing[0].completed) {
            setSubmitted(true);
          }
        }

        if (Object.keys(merged).length > 0) {
          setResponses(merged);
          setStarted(true);
        }
      }
      setLoading(false);
    };
    load();
  }, [assessmentId]);

  // Cleanup audio URLs
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // ── Auto-save to DB after each answer ──
  const saveResponsesToDb = useCallback(async (updatedResponses: Record<string, string>) => {
    if (!assessmentId) return;
    setAutoSaving(true);
    try {
      const payload = {
        responses: JSON.parse(JSON.stringify(updatedResponses)),
        updated_at: new Date().toISOString(),
      };

      if (existingResponseId) {
        await supabase.from('straight_talk_responses')
          .update(payload)
          .eq('id', existingResponseId);
      } else {
        const { data } = await supabase.from('straight_talk_responses')
          .insert([{
            assessment_id: assessmentId,
            industry: 'self-interview',
            responses: JSON.parse(JSON.stringify(updatedResponses)),
            completed: false,
          }])
          .select('id')
          .single();
        if (data) setExistingResponseId(data.id);
      }
      setLastSaved(new Date());
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setAutoSaving(false);
    }
  }, [assessmentId, existingResponseId]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      toast({ title: 'Microphone access denied', description: 'Please allow microphone access to record your answers.', variant: 'destructive' });
    }
  }, [audioUrl, toast]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const playAudio = useCallback(() => {
    if (!audioUrl) return;
    if (audioRef.current) { audioRef.current.pause(); }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  }, [audioUrl]);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }, [audioUrl]);

  const transcribeAndSave = useCallback(async () => {
    if (!audioBlob || !currentQuestion) return;
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'answer.webm');
      formData.append('question', currentQuestion.question);

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
        const updatedResponses = { ...responses, [currentQuestion.id]: transcript };
        setResponses(updatedResponses);
        // Auto-save to DB immediately
        await saveResponsesToDb(updatedResponses);
        toast({ title: 'Answer saved ✅', description: 'Progress saved automatically' });
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      toast({ title: 'Transcription failed', description: err.message, variant: 'destructive' });
    } finally {
      setTranscribing(false);
    }
  }, [audioBlob, currentQuestion, toast, responses, saveResponsesToDb]);

  const goNext = useCallback(() => {
    resetRecording();
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
    }
  }, [currentQuestionIndex, allQuestions.length, resetRecording]);

  const goPrev = useCallback(() => {
    resetRecording();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(i => i - 1);
    }
  }, [currentQuestionIndex, resetRecording]);

  const handleSubmit = async () => {
    if (!assessmentId) return;
    setSubmitting(true);
    try {
      // Mark as completed
      if (existingResponseId) {
        await supabase.from('straight_talk_responses')
          .update({ responses: JSON.parse(JSON.stringify(responses)), completed: true, updated_at: new Date().toISOString() })
          .eq('id', existingResponseId);
      } else {
        await supabase.from('straight_talk_responses').insert([{
          assessment_id: assessmentId,
          industry: 'self-interview',
          responses: JSON.parse(JSON.stringify(responses)),
          completed: true,
        }]);
      }

      // Advance pipeline
      await supabase.from('roi_assessments')
        .update({ pipeline_stage: 'deep_dive_complete' as any, discovery_ready: true })
        .eq('id', assessmentId);

      // Notify admin
      const { data: assessment } = await supabase
        .from('roi_assessments')
        .select('contact_name, contact_email, business_name')
        .eq('id', assessmentId)
        .single();

      if (assessment) {
        supabase.functions.invoke('notify-admin', {
          body: {
            eventType: 'self_interview_completed',
            leadName: assessment.contact_name,
            leadEmail: assessment.contact_email,
            businessName: assessment.business_name,
            assessmentId,
          },
        }).catch(console.error);
      }

      setSubmitted(true);
      toast({ title: 'Self-Interview Complete! 🎉' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── States ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assessmentId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Invalid Link</h1>
          <p className="text-muted-foreground">This link is missing an assessment ID.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  // ── COMPLETION SCREEN with refinement call booking ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-primary/10">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Thank You, {contactName}!</h1>
          <p className="text-muted-foreground">
            Your self-interview is complete. We'll review your answers and come prepared with tailored solutions for {businessName || 'your business'}.
          </p>

          {/* Refinement Call CTA */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 space-y-3">
            <h3 className="text-lg font-bold text-foreground">Ready to go deeper?</h3>
            <p className="text-sm text-muted-foreground">
              Book a short refinement call so we can dig into the key areas and come to you with a concrete plan.
            </p>
            <Button
              size="lg"
              className="gap-2 w-full"
              onClick={() => window.open(`${CALENDLY_REFINEMENT_URL}?name=${encodeURIComponent(contactName)}&email=`, '_blank')}
            >
              <Calendar className="w-4 h-4" /> Book Refinement Call
            </Button>
            <p className="text-xs text-muted-foreground">30 minutes · Focused on solutions</p>
          </div>

          <p className="text-sm text-muted-foreground">
            Or we'll be in touch shortly to arrange this.
          </p>
        </motion.div>
      </div>
    );
  }

  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">No Questions Available</h1>
          <p className="text-muted-foreground">The self-interview hasn't been configured for your industry yet.</p>
        </div>
      </div>
    );
  }

  // ── INTRO SCREEN ──
  if (!started) {
    const existingAnswers = Object.keys(responses).filter(k => allQuestions.some(q => q.id === k)).length;
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <img src={logo} alt="5to10x" className="h-8" />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{businessName}</p>
              <p className="text-xs text-muted-foreground">Self-Interview</p>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center bg-primary/10 mb-6">
              <Mic className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Hi {contactName}! 👋
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-2">
              Welcome to your <strong className="text-foreground">Straight Talk™ Self-Interview</strong>
            </p>
            <p className="text-muted-foreground max-w-lg mx-auto">
              We'll walk you through {allQuestions.length} questions about your business.
              For each one, simply tap the microphone and speak your answer — just like a conversation.
            </p>
          </motion.div>

          {existingAnswers > 0 && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm font-medium text-primary">
                Welcome back! You've answered {existingAnswers} of {allQuestions.length} questions.
              </p>
              <p className="text-xs text-muted-foreground mt-1">Your progress was saved — pick up where you left off.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
            <div className="rounded-xl bg-card border border-border p-4 space-y-1">
              <Mic className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Record</p>
              <p className="text-xs text-muted-foreground">Tap & speak your answer</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-4 space-y-1">
              <Play className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Review</p>
              <p className="text-xs text-muted-foreground">Listen back & re-record if needed</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-4 space-y-1">
              <Send className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Submit</p>
              <p className="text-xs text-muted-foreground">We transcribe & analyse</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button size="lg" className="gap-2 px-8" onClick={() => setStarted(true)}>
              {existingAnswers > 0 ? 'Continue Self-Interview' : 'Start Self-Interview'} <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground">Takes about 10–15 minutes · Your progress saves automatically</p>
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTION FLOW ──
  const Icon = ICON_MAP[currentCategory?.icon || 'Sparkles'] || Sparkles;
  const hasAnswer = !!responses[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === allQuestions.length - 1;
  const answeredCount = Object.keys(responses).filter(k => allQuestions.some(q => q.id === k)).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <img src={logo} alt="5to10x" className="h-7" />
          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            <div className="flex items-center gap-1.5">
              {autoSaving ? (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1 text-[10px] text-primary/70">
                  <Save className="w-3 h-3" /> Saved
                </span>
              ) : null}
            </div>
            <Badge variant="outline" className="text-[10px]">
              {answeredCount}/{allQuestions.length} answered
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">{businessName}</span>
          </div>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="w-full max-w-xl space-y-8"
          >
            {/* Category badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{currentCategory?.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">Q{currentQuestionIndex + 1} of {allQuestions.length}</span>
            </div>

            {/* Question */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground leading-snug">{currentQuestion.question}</h2>
              {currentQuestion.detail_prompt && (
                <p className="text-sm text-muted-foreground">{currentQuestion.detail_prompt}</p>
              )}
            </div>

            {/* Recording area */}
            <div className="rounded-2xl border-2 border-border bg-card p-8 text-center space-y-4">
              {isRecording ? (
                <>
                  <div className="flex items-center justify-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                    <span className="text-2xl font-mono font-bold text-foreground">{formatTime(recordingTime)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Recording... speak your answer</p>
                  <Button size="lg" variant="destructive" className="gap-2" onClick={stopRecording}>
                    <Square className="w-4 h-4" /> Stop Recording
                  </Button>
                </>
              ) : audioBlob ? (
                <>
                  <p className="text-sm text-muted-foreground">Recording complete — {formatTime(recordingTime)}</p>
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={playAudio} disabled={isPlaying}>
                      <Play className="w-3.5 h-3.5" /> {isPlaying ? 'Playing...' : 'Play Back'}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={resetRecording}>
                      <RotateCcw className="w-3.5 h-3.5" /> Re-record
                    </Button>
                  </div>
                  {!hasAnswer && (
                    <Button className="gap-2 mt-2" onClick={transcribeAndSave} disabled={transcribing}>
                      {transcribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {transcribing ? 'Transcribing...' : 'Save Answer'}
                    </Button>
                  )}
                  {hasAnswer && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-left mt-2">
                      <p className="text-[10px] uppercase font-semibold text-primary mb-1">Your Answer</p>
                      <p className="text-sm text-foreground">{responses[currentQuestion.id]}</p>
                    </div>
                  )}
                </>
              ) : hasAnswer ? (
                <>
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-left">
                    <p className="text-[10px] uppercase font-semibold text-primary mb-1">Your Answer</p>
                    <p className="text-sm text-foreground">{responses[currentQuestion.id]}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 mt-2" onClick={startRecording}>
                    <RotateCcw className="w-3.5 h-3.5" /> Re-record Answer
                  </Button>
                </>
              ) : (
                <>
                  <button
                    onClick={startRecording}
                    className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 transition-all mx-auto flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    <Mic className="w-8 h-8 text-primary-foreground" />
                  </button>
                  <p className="text-sm text-muted-foreground">Tap to record your answer</p>
                </>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={goPrev} disabled={currentQuestionIndex === 0}>
                <ArrowLeft className="w-4 h-4" /> Previous
              </Button>

              <div className="flex gap-2">
                {!isLastQuestion && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={goNext}>
                    {hasAnswer ? 'Next' : 'Skip'} <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
                {isLastQuestion && (
                  <Button size="sm" className="gap-1.5" onClick={handleSubmit} disabled={submitting || answeredCount === 0}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit All Answers
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SelfInterview;
