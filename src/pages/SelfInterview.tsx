import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Mic, Square, RotateCcw, ArrowRight, CheckCircle,
  Loader2, Sparkles, Calendar, Users, CreditCard, Settings, MessageSquare,
  UserCircle, Plug, Shield, Rocket, Hammer, Briefcase, Send,
  Save, MinusCircle, HelpCircle, Clock, ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
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
  const [activeTab, setActiveTab] = useState<string>('');

  // Recording state — per question (tracks both answer and note recordings)
  const [recordingQuestionId, setRecordingQuestionId] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);

  // Separate recording state for analyst notes
  const [noteRecordingId, setNoteRecordingId] = useState<string | null>(null);
  const [noteRecordingTime, setNoteRecordingTime] = useState(0);
  const [noteTranscribingId, setNoteTranscribingId] = useState<string | null>(null);
  const noteMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const noteChunksRef = useRef<Blob[]>([]);
  const noteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noteStreamRef = useRef<MediaStream | null>(null);

  // Responses
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
  const streamRef = useRef<MediaStream | null>(null);

  const allQuestions = categories.flatMap(cat =>
    questions.filter(q => q.category_id === cat.id).sort((a, b) => a.sort_order - b.sort_order)
  );

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
        if (cats.length > 0) setActiveTab(cats[0].id);

        const isInvalidAnswer = (v: string) => 
          !v?.trim() || v === 'not_found' || v.toLowerCase().includes('[no audible response]');

        let merged: Record<string, string> = {};
        const discoveryAnswers = (assessment.discovery_answers || {}) as Record<string, any>;
        for (const [key, val] of Object.entries(discoveryAnswers)) {
          const shortId = key.split('__')[1];
          if (!shortId) continue;
          const matchedQ = allQ.find((q: Question) => q.id.startsWith(shortId) && catIds.includes(q.category_id));
          if (matchedQ) {
            const answer = typeof val === 'string' ? val : (val as any)?.answer || JSON.stringify(val);
            if (!isInvalidAnswer(answer)) merged[matchedQ.id] = answer;
          }
        }

        const { data: existing } = await supabase
          .from('straight_talk_responses')
          .select('id, responses, completed')
          .eq('assessment_id', assessmentId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existing?.[0]) {
          setExistingResponseId(existing[0].id);
          const savedResponses = (existing[0].responses || {}) as Record<string, string>;
          // Filter invalid answers but keep meta keys (_note_, _skip_)
          for (const [k, v] of Object.entries(savedResponses)) {
            if (k.startsWith('_') || !isInvalidAnswer(v)) {
              merged[k] = v;
            }
          }
          if (existing[0].completed) setSubmitted(true);
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

  const saveResponsesToDb = useCallback(async (updatedResponses: Record<string, string>) => {
    if (!assessmentId) return;
    setAutoSaving(true);
    try {
      const payload = {
        responses: JSON.parse(JSON.stringify(updatedResponses)),
        updated_at: new Date().toISOString(),
      };
      if (existingResponseId) {
        await supabase.from('straight_talk_responses').update(payload).eq('id', existingResponseId);
      } else {
        const { data } = await supabase.from('straight_talk_responses')
          .insert([{ assessment_id: assessmentId, industry: 'self-interview', responses: JSON.parse(JSON.stringify(updatedResponses)), completed: false }])
          .select('id').single();
        if (data) setExistingResponseId(data.id);
      }
      setLastSaved(new Date());
    } catch (err) { console.error('Auto-save failed:', err); }
    finally { setAutoSaving(false); }
  }, [assessmentId, existingResponseId]);

  // Transcribe a blob for a specific question
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
        setResponses(prev => {
          const updated = { ...prev, [questionId]: transcript };
          saveResponsesToDb(updated);
          return updated;
        });
        toast({ title: 'Answer transcribed & saved ✅' });
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      toast({ title: 'Transcription failed', description: err.message, variant: 'destructive' });
    } finally {
      setTranscribingId(null);
    }
  }, [toast, saveResponsesToDb]);

  const startRecording = useCallback(async (questionId: string) => {
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

      // Find the question text for transcription context
      const q = allQuestions.find(q => q.id === questionId);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setRecordingQuestionId(null);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        // Auto-transcribe immediately
        transcribeBlob(blob, questionId, q?.question || '');
      };

      mediaRecorder.start(1000);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast({ title: 'Microphone access denied', description: 'Please allow microphone access.', variant: 'destructive' });
    }
  }, [allQuestions, toast, transcribeBlob]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  // ── Note transcription ──
  const transcribeNoteBlob = useCallback(async (blob: Blob, questionId: string, questionText: string) => {
    const noteKey = `_note_${questionId}`;
    setNoteTranscribingId(questionId);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'note.webm');
      formData.append('question', `Analyst refinement note for: ${questionText}`);

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
        setResponses(prev => {
          const existing = prev[noteKey] || '';
          const updated = { ...prev, [noteKey]: existing ? `${existing}\n${transcript}` : transcript };
          saveResponsesToDb(updated);
          return updated;
        });
        toast({ title: 'Note transcribed & saved ✅' });
      }
    } catch (err: any) {
      console.error('Note transcription error:', err);
      toast({ title: 'Transcription failed', description: err.message, variant: 'destructive' });
    } finally {
      setNoteTranscribingId(null);
    }
  }, [toast, saveResponsesToDb]);

  const startNoteRecording = useCallback(async (questionId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      noteStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      noteMediaRecorderRef.current = mediaRecorder;
      noteChunksRef.current = [];
      setNoteRecordingTime(0);
      setNoteRecordingId(questionId);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) noteChunksRef.current.push(e.data);
      };

      const q = allQuestions.find(q => q.id === questionId);

      mediaRecorder.onstop = () => {
        const blob = new Blob(noteChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        noteStreamRef.current = null;
        setNoteRecordingId(null);
        if (noteTimerRef.current) { clearInterval(noteTimerRef.current); noteTimerRef.current = null; }
        transcribeNoteBlob(blob, questionId, q?.question || '');
      };

      mediaRecorder.start(1000);
      noteTimerRef.current = setInterval(() => setNoteRecordingTime(t => t + 1), 1000);
    } catch {
      toast({ title: 'Microphone access denied', description: 'Please allow microphone access.', variant: 'destructive' });
    }
  }, [allQuestions, toast, transcribeNoteBlob]);

  const stopNoteRecording = useCallback(() => {
    noteMediaRecorderRef.current?.stop();
  }, []);

  const handleTextChange = useCallback((questionId: string, value: string) => {
    setResponses(prev => {
      const updated = { ...prev, [questionId]: value };
      return updated;
    });
  }, []);

  const handleTextBlur = useCallback((questionId: string) => {
    // Save on blur
    saveResponsesToDb(responses);
  }, [responses, saveResponsesToDb]);

  const handleSubmit = async () => {
    if (!assessmentId) return;
    setSubmitting(true);
    try {
      if (existingResponseId) {
        await supabase.from('straight_talk_responses')
          .update({ responses: JSON.parse(JSON.stringify(responses)), completed: true, updated_at: new Date().toISOString() })
          .eq('id', existingResponseId);
      } else {
        await supabase.from('straight_talk_responses').insert([{
          assessment_id: assessmentId, industry: 'self-interview',
          responses: JSON.parse(JSON.stringify(responses)), completed: true,
        }]);
      }

      await supabase.from('roi_assessments')
        .update({ pipeline_stage: 'deep_dive_complete' as any, discovery_ready: true })
        .eq('id', assessmentId);

      const { data: assessment } = await supabase
        .from('roi_assessments')
        .select('contact_name, contact_email, business_name')
        .eq('id', assessmentId).single();

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
    } finally { setSubmitting(false); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const SKIP_REASONS = [
    { value: 'na', label: 'Not Applicable', icon: MinusCircle, description: 'Not relevant to my business' },
    { value: 'dont_know', label: "Don't Know", icon: HelpCircle, description: 'Need help answering this' },
    { value: 'later', label: 'Will Answer Later', icon: Clock, description: "I'll come back to this" },
  ] as const;
  type SkipReason = typeof SKIP_REASONS[number]['value'];

  const getSkipReason = (qId: string): SkipReason | null => {
    const val = responses[`_skip_${qId}`];
    if (val === 'na' || val === 'dont_know' || val === 'later') return val;
    return null;
  };

  const handleSkip = useCallback((questionId: string, reason: SkipReason) => {
    setResponses(prev => {
      const updated = { ...prev, [`_skip_${questionId}`]: reason };
      saveResponsesToDb(updated);
      return updated;
    });
  }, [saveResponsesToDb]);

  const clearSkip = useCallback((questionId: string) => {
    setResponses(prev => {
      const { [`_skip_${questionId}`]: _, ...rest } = prev;
      saveResponsesToDb(rest);
      return rest;
    });
  }, [saveResponsesToDb]);

  const isQuestionComplete = (qId: string): boolean => {
    if (responses[qId]?.trim()) return true;
    const skip = getSkipReason(qId);
    return skip === 'na' || skip === 'dont_know';
  };

  const answeredCount = allQuestions.filter(q => isQuestionComplete(q.id)).length;
  const progress = allQuestions.length > 0 ? (answeredCount / allQuestions.length) * 100 : 0;

  // ── Loading ──
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

  // ── COMPLETION SCREEN ──
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
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 space-y-3">
            <h3 className="text-lg font-bold text-foreground">Ready to go deeper?</h3>
            <p className="text-sm text-muted-foreground">
              Book a short refinement call so we can dig into the key areas and come to you with a concrete plan.
            </p>
            <Button
              size="lg" className="gap-2 w-full"
              onClick={() => window.open(`${CALENDLY_REFINEMENT_URL}?name=${encodeURIComponent(contactName)}&email=`, '_blank')}
            >
              <Calendar className="w-4 h-4" /> Book Refinement Call
            </Button>
            <p className="text-xs text-muted-foreground">30 minutes · Focused on solutions</p>
          </div>
          <p className="text-sm text-muted-foreground">Or we'll be in touch shortly to arrange this.</p>
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
    const existingAnswers = answeredCount;
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <img src={logo} alt="5to10x" className="h-8" />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{businessName}</p>
              <p className="text-xs text-muted-foreground">Straight Talk™</p>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center bg-primary/10 mb-6">
              <Mic className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">Hi {contactName}! 👋</h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-2">
              Welcome to your <strong className="text-foreground">Straight Talk™ Self-Interview</strong>
            </p>
            <p className="text-muted-foreground max-w-lg mx-auto">
              We've put together a bank of specifically curated questions to help us understand as much as possible about {businessName || 'your business'} — your goals, challenges, and what makes your business tick.
            </p>
            <p className="text-muted-foreground max-w-lg mx-auto mt-3">
              There's no pressure to answer every single question — just do the best you can. Skip anything that doesn't apply or that you're unsure about. Every answer helps us build a better plan for you. 💛
            </p>
          </motion.div>

          {existingAnswers > 0 && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm font-medium text-primary">
                Welcome back! You've made great progress already.
              </p>
              <p className="text-xs text-muted-foreground mt-1">Your answers were saved — pick up right where you left off.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
            <div className="rounded-xl bg-card border border-border p-4 space-y-1">
              <Mic className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Record or Type</p>
              <p className="text-xs text-muted-foreground">Answer each question your way</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-4 space-y-1">
              <CheckCircle className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Auto-Saved</p>
              <p className="text-xs text-muted-foreground">Pause and come back anytime</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-4 space-y-1">
              <Send className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">We Do The Rest</p>
              <p className="text-xs text-muted-foreground">We analyse & prepare your plan</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button size="lg" className="gap-2 px-8 w-full sm:w-auto" onClick={() => setStarted(true)}>
              {existingAnswers > 0 ? 'Continue Self-Interview' : 'Start Self-Interview'} <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground">Progress saves automatically after each answer</p>
          </div>

          <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 space-y-3 max-w-lg mx-auto">
            <h3 className="text-base font-semibold text-foreground flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Prefer to chat with us instead?
            </h3>
            <p className="text-sm text-muted-foreground">
              You're welcome to book an interview with Aidan & Eoghan — we'll walk through everything together on a Zoom call. You can also start the self-interview now and finish up anything remaining during the call.
            </p>
            <Button variant="outline" size="lg" className="gap-2" onClick={() => window.open(CALENDLY_REFINEMENT_URL, '_blank')}>
              <Calendar className="w-4 h-4" /> Book an Interview Instead
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN TAB-BASED INTERVIEW ──
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <img src={logo} alt="5to10x" className="h-7" />
          <div className="flex items-center gap-3">
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
              {progress === 100 ? 'All done ✅' : 'In progress'}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">{businessName}</span>
          </div>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      {/* Tab content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {categories.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || Sparkles;
              const catQuestions = questions.filter(q => q.category_id === cat.id);
              const catAnswered = catQuestions.filter(q => isQuestionComplete(q.id)).length;
              const allDone = catAnswered === catQuestions.length && catQuestions.length > 0;
              return (
                <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-background">
                  {allDone ? (
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || Sparkles;
            const catQuestions = questions.filter(q => q.category_id === cat.id).sort((a, b) => a.sort_order - b.sort_order);

            return (
              <TabsContent key={cat.id} value={cat.id} className="mt-6 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">{cat.label}</h2>
                </div>

                <div className="space-y-4">
                  {catQuestions.map((q, idx) => {
                    const hasAnswer = !!responses[q.id]?.trim();
                    const isRecordingThis = recordingQuestionId === q.id;
                    const isTranscribingThis = transcribingId === q.id;
                    const skipReason = getSkipReason(q.id);
                    const skipMeta = skipReason ? SKIP_REASONS.find(s => s.value === skipReason) : null;
                    const complete = isQuestionComplete(q.id);

                    return (
                      <div key={q.id} className={`rounded-xl border bg-card p-4 sm:p-5 space-y-3 ${skipReason && !hasAnswer ? 'border-muted opacity-75' : 'border-border'}`}>
                        {/* Question header */}
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {idx + 1}
                          </span>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold text-foreground leading-snug">{q.question}</p>
                            {q.detail_prompt && (
                              <p className="text-xs text-muted-foreground">{q.detail_prompt}</p>
                            )}
                            {skipMeta && !hasAnswer && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <skipMeta.icon className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground italic">{skipMeta.label}</span>
                                <button onClick={() => clearSkip(q.id)} className="text-[10px] text-primary underline ml-1">Undo</button>
                              </div>
                            )}
                          </div>
                          {complete && !isTranscribingThis && (
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          )}
                          {isTranscribingThis && (
                            <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0 mt-0.5" />
                          )}
                        </div>

                        {/* Answer area */}
                        <div className="pl-9 space-y-2">
                          {/* Text answer */}
                          <Textarea
                            placeholder="Type your answer here, or use the mic to record..."
                            value={responses[q.id] || ''}
                            onChange={(e) => handleTextChange(q.id, e.target.value)}
                            onBlur={() => handleTextBlur(q.id)}
                            rows={2}
                            className="bg-secondary border-border resize-none text-sm"
                            disabled={isTranscribingThis}
                          />

                          {/* Recording controls */}
                          <div className="flex items-center gap-2">
                            {isRecordingThis ? (
                              <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={stopRecording}>
                                <Square className="w-3 h-3" /> Stop ({formatTime(recordingTime)})
                              </Button>
                            ) : isTranscribingThis ? (
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribing...
                              </span>
                            ) : (
                              <Button
                                size="sm" variant="outline" className="gap-1.5 text-xs"
                                onClick={() => startRecording(q.id)}
                                disabled={recordingQuestionId !== null}
                              >
                                <Mic className="w-3.5 h-3.5" /> {hasAnswer ? 'Re-record' : 'Record'}
                              </Button>
                            )}

                            {/* Skip dropdown */}
                            {!hasAnswer && !isRecordingThis && !isTranscribingThis && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="gap-1 text-xs text-muted-foreground">
                                    <ChevronDown className="w-3 h-3" /> Skip
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  {SKIP_REASONS.map(sr => (
                                    <DropdownMenuItem key={sr.value} onClick={() => handleSkip(q.id, sr.value)} className="gap-2">
                                      <sr.icon className="w-4 h-4" />
                                      <div>
                                        <p className="text-sm font-medium">{sr.label}</p>
                                        <p className="text-[10px] text-muted-foreground">{sr.description}</p>
                                      </div>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>

                          {/* Analyst Notes */}
                          <div className="border-l-2 border-accent pl-3 mt-1">
                            <p className="text-[10px] text-accent-foreground/60 uppercase tracking-wider font-medium mb-1">Analyst Notes</p>
                            <Textarea
                              placeholder="Add refinement notes for the proposal…"
                              value={responses[`_note_${q.id}`] || ''}
                              onChange={(e) => handleTextChange(`_note_${q.id}`, e.target.value)}
                              onBlur={() => handleTextBlur(`_note_${q.id}`)}
                              rows={2}
                              className="text-xs bg-accent/10 border-accent/20 resize-none italic"
                              disabled={noteTranscribingId === q.id}
                            />
                            <div className="flex items-center gap-2 mt-1.5">
                              {noteRecordingId === q.id ? (
                                <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={stopNoteRecording}>
                                  <Square className="w-3 h-3" /> Stop ({formatTime(noteRecordingTime)})
                                </Button>
                              ) : noteTranscribingId === q.id ? (
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribing note...
                                </span>
                              ) : (
                                <Button
                                  size="sm" variant="outline" className="gap-1.5 text-xs border-accent/30"
                                  onClick={() => startNoteRecording(q.id)}
                                  disabled={recordingQuestionId !== null || noteRecordingId !== null}
                                >
                                  <Mic className="w-3.5 h-3.5" /> {responses[`_note_${q.id}`]?.trim() ? 'Add to Note' : 'Record Note'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Next section / Submit */}
                <div className="flex items-center justify-between pt-4">
                  <div />
                  {(() => {
                    const catIndex = categories.findIndex(c => c.id === cat.id);
                    const isLast = catIndex === categories.length - 1;
                    if (isLast) {
                      return (
                        <Button className="gap-2" onClick={handleSubmit} disabled={submitting || answeredCount === 0}>
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Submit All Answers
                        </Button>
                      );
                    }
                    return (
                      <Button variant="outline" className="gap-1.5" onClick={() => setActiveTab(categories[catIndex + 1].id)}>
                        Next Section <ArrowRight className="w-4 h-4" />
                      </Button>
                    );
                  })()}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default SelfInterview;
