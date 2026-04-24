import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Mic, Square, ArrowRight, ArrowLeft, CheckCircle,
  Loader2, Sparkles, Calendar, Users, CreditCard, Settings, MessageSquare,
  UserCircle, Plug, Shield, Rocket, Hammer, Briefcase, Send,
  Save, MinusCircle, HelpCircle, Clock, ChevronDown, Pencil, ListChecks,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import SEO from '@/components/SEO';
import logo from '@/assets/logo-5to10x-color.webp';

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, Calendar, Users, CreditCard, Settings, MessageSquare,
  UserCircle, Plug, Shield, Rocket, Hammer, Briefcase,
};

const CALENDLY_REFINEMENT_URL = 'https://calendly.com/aidan-rejuvenators/discovery';

interface Category { id: string; label: string; icon: string; sort_order: number; }
interface Question { id: string; category_id: string; question: string; detail_prompt: string; sort_order: number; }

type Stage = 'intro' | 'category-picker' | 'runner' | 'review';

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

  const [stage, setStage] = useState<Stage>('intro');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerMode, setAnswerMode] = useState<'text' | 'voice'>('text');

  // Recording state
  const [recordingQuestionId, setRecordingQuestionId] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);

  // Note recording (kept available on each question)
  const [noteRecordingId, setNoteRecordingId] = useState<string | null>(null);
  const [noteRecordingTime, setNoteRecordingTime] = useState(0);
  const [noteTranscribingId, setNoteTranscribingId] = useState<string | null>(null);
  const noteMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const noteChunksRef = useRef<Blob[]>([]);
  const noteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noteStreamRef = useRef<MediaStream | null>(null);

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [existingResponseId, setExistingResponseId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Derived: ordered question list based on selected categories ──
  const runnerQuestions = useMemo(() => {
    const orderedCats = categories
      .filter(c => selectedCategoryIds.includes(c.id))
      .sort((a, b) => a.sort_order - b.sort_order);
    return orderedCats.flatMap(cat =>
      questions
        .filter(q => q.category_id === cat.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(q => ({ ...q, _categoryLabel: cat.label, _categoryIcon: cat.icon }))
    );
  }, [categories, questions, selectedCategoryIds]);

  // ── Load assessment + existing responses ──
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

        // Default: all categories selected
        let initialSelected: string[] = catIds;

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

        let resumeIndex = 0;
        let hadProgress = false;

        if (existing?.[0]) {
          setExistingResponseId(existing[0].id);
          const savedResponses = (existing[0].responses || {}) as Record<string, any>;
          for (const [k, v] of Object.entries(savedResponses)) {
            if (k === '_meta') continue;
            if (typeof v === 'string') {
              if (k.startsWith('_') || !isInvalidAnswer(v)) merged[k] = v;
            }
          }
          if (existing[0].completed) setSubmitted(true);

          // Restore meta if present
          const meta = (savedResponses._meta || {}) as { selected_category_ids?: string[]; current_index?: number };
          if (Array.isArray(meta.selected_category_ids) && meta.selected_category_ids.length > 0) {
            initialSelected = meta.selected_category_ids.filter(id => catIds.includes(id));
            if (initialSelected.length === 0) initialSelected = catIds;
          }
          if (typeof meta.current_index === 'number' && meta.current_index >= 0) {
            resumeIndex = meta.current_index;
          }
          hadProgress = Object.keys(merged).length > 0;
        }

        setSelectedCategoryIds(initialSelected);
        if (Object.keys(merged).length > 0) setResponses(merged);

        // If they had real progress, jump to runner at saved cursor; otherwise start at intro
        if (hadProgress && !existing?.[0]?.completed) {
          setCurrentIndex(resumeIndex);
        }
      }
      setLoading(false);
    };
    load();
  }, [assessmentId]);

  // ── Persistence ──
  const saveResponsesToDb = useCallback(async (
    updatedResponses: Record<string, string>,
    metaOverride?: { selected_category_ids?: string[]; current_index?: number }
  ) => {
    if (!assessmentId) return;
    setAutoSaving(true);
    try {
      const meta = {
        selected_category_ids: metaOverride?.selected_category_ids ?? selectedCategoryIds,
        current_index: metaOverride?.current_index ?? currentIndex,
      };
      const payloadResponses: Record<string, any> = { ...updatedResponses, _meta: meta };
      const payload = {
        responses: JSON.parse(JSON.stringify(payloadResponses)),
        updated_at: new Date().toISOString(),
      };
      if (existingResponseId) {
        await supabase.from('straight_talk_responses').update(payload).eq('id', existingResponseId);
      } else {
        const { data } = await supabase.from('straight_talk_responses')
          .insert([{
            assessment_id: assessmentId,
            industry: 'self-interview',
            responses: payload.responses,
            completed: false,
          }])
          .select('id').single();
        if (data) setExistingResponseId(data.id);
      }
      setLastSaved(new Date());
    } catch (err) { console.error('Auto-save failed:', err); }
    finally { setAutoSaving(false); }
  }, [assessmentId, existingResponseId, selectedCategoryIds, currentIndex]);

  // Persist meta whenever cursor or selection changes (but not before they've started)
  useEffect(() => {
    if (stage === 'runner' || stage === 'review') {
      saveResponsesToDb(responses);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, selectedCategoryIds, stage]);

  // ── Transcription ──
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

  const startNoteRecording = useCallback(async (questionId: string, questionText: string) => {
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
      mediaRecorder.onstop = () => {
        const blob = new Blob(noteChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        noteStreamRef.current = null;
        setNoteRecordingId(null);
        if (noteTimerRef.current) { clearInterval(noteTimerRef.current); noteTimerRef.current = null; }
        transcribeNoteBlob(blob, questionId, questionText);
      };
      mediaRecorder.start(1000);
      noteTimerRef.current = setInterval(() => setNoteRecordingTime(t => t + 1), 1000);
    } catch {
      toast({ title: 'Microphone access denied', description: 'Please allow microphone access.', variant: 'destructive' });
    }
  }, [toast, transcribeNoteBlob]);

  const stopNoteRecording = useCallback(() => {
    noteMediaRecorderRef.current?.stop();
  }, []);

  // ── Text editing ──
  const handleTextChange = useCallback((questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const handleTextBlur = useCallback(() => {
    saveResponsesToDb(responses);
  }, [responses, saveResponsesToDb]);

  // ── Skip ──
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

  // ── Submit ──
  const handleSubmit = async () => {
    if (!assessmentId) return;
    setSubmitting(true);
    try {
      const meta = { selected_category_ids: selectedCategoryIds, current_index: currentIndex };
      const finalPayload: Record<string, any> = { ...responses, _meta: meta };

      if (existingResponseId) {
        await supabase.from('straight_talk_responses')
          .update({
            responses: JSON.parse(JSON.stringify(finalPayload)),
            completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingResponseId);
      } else {
        await supabase.from('straight_talk_responses').insert([{
          assessment_id: assessmentId, industry: 'self-interview',
          responses: JSON.parse(JSON.stringify(finalPayload)), completed: true,
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

  const answeredCount = runnerQuestions.filter(q => isQuestionComplete(q.id)).length;
  const progress = runnerQuestions.length > 0 ? (answeredCount / runnerQuestions.length) * 100 : 0;

  // ── LOADING ──
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

  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">No Questions Available</h1>
          <p className="text-muted-foreground">The self-interview hasn't been configured for your industry yet.</p>
        </div>
      </div>
    );
  }

  // ── Header (shared by runner/review) ──
  const Header = () => (
    <div className="border-b border-border bg-card sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <img src={logo} alt="5to10x" className="h-7 flex-shrink-0" />
        <div className="flex items-center gap-3 min-w-0">
          {autoSaving ? (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving...
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1 text-[10px] text-primary/70">
              <Save className="w-3 h-3" /> Saved
            </span>
          ) : null}
          <Badge variant="outline" className="text-[10px]">
            {answeredCount}/{runnerQuestions.length}
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[160px]">{businessName}</span>
        </div>
      </div>
      <Progress value={progress} className="h-1" />
    </div>
  );

  // ── INTRO ──
  if (stage === 'intro') {
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
            <h1 className="text-3xl font-bold text-foreground mb-3">Hi {contactName.split(' ')[0]},</h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-2">
              Welcome to your <strong className="text-foreground">Straight Talk™ Self-Interview</strong>
            </p>
            <p className="text-muted-foreground max-w-lg mx-auto">
              We'll walk through one question at a time. You choose which areas you want to cover, then answer each one by typing or recording your voice.
            </p>
            <p className="text-muted-foreground max-w-lg mx-auto mt-3">
              No pressure to do it all in one sitting — we save your progress automatically. 💛
            </p>
          </motion.div>

          {existingAnswers > 0 && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm font-medium text-primary">Welcome back! You've made great progress already.</p>
              <p className="text-xs text-muted-foreground mt-1">Pick up right where you left off.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
            <div className="rounded-xl bg-card border border-border p-4 space-y-1">
              <ListChecks className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Pick Your Topics</p>
              <p className="text-xs text-muted-foreground">Skip what isn't relevant</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-4 space-y-1">
              <Mic className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Type or Record</p>
              <p className="text-xs text-muted-foreground">Whichever feels easier</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-4 space-y-1">
              <Save className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Auto-Saved</p>
              <p className="text-xs text-muted-foreground">Pause and return anytime</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button size="lg" className="gap-2 px-8 w-full sm:w-auto" onClick={() => {
              if (existingAnswers > 0) setStage('runner');
              else setStage('category-picker');
            }}>
              {existingAnswers > 0 ? 'Continue Self-Interview' : 'Get Started'} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 space-y-3 max-w-lg mx-auto">
            <h3 className="text-base font-semibold text-foreground flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Prefer to chat with us instead?
            </h3>
            <p className="text-sm text-muted-foreground">
              Book a Zoom call with Aidan & Eoghan and we'll walk through everything together.
            </p>
            <Button variant="outline" size="lg" className="gap-2" onClick={() => window.open(CALENDLY_REFINEMENT_URL, '_blank')}>
              <Calendar className="w-4 h-4" /> Book an Interview Instead
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── CATEGORY PICKER ──
  if (stage === 'category-picker') {
    const toggleCat = (id: string) => {
      setSelectedCategoryIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    };
    const selectAll = () => setSelectedCategoryIds(categories.map(c => c.id));
    const clearAll = () => setSelectedCategoryIds([]);
    const totalSelectedQs = questions.filter(q => selectedCategoryIds.includes(q.category_id)).length;

    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <img src={logo} alt="5to10x" className="h-8" />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{businessName}</p>
              <p className="text-xs text-muted-foreground">Choose your topics</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-primary/10 mb-2">
              <ListChecks className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Which areas would you like to cover?</h1>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              All topics are pre-selected. Untick anything that isn't relevant to {businessName || 'your business'}. You can always change your mind later.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">{selectedCategoryIds.length}</strong> of {categories.length} topics
              {totalSelectedQs > 0 && <span className="ml-1">· ~{totalSelectedQs} questions</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">Select all</Button>
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">Clear</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map(cat => {
              const Icon = ICON_MAP[cat.icon] || Sparkles;
              const checked = selectedCategoryIds.includes(cat.id);
              const qCount = questions.filter(q => q.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCat(cat.id)}
                  className={`flex items-center gap-3 text-left p-3 rounded-xl border-2 transition-colors ${
                    checked
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggleCat(cat.id)} />
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    checked ? 'bg-primary/15' : 'bg-muted'
                  }`}>
                    <Icon className={`w-4 h-4 ${checked ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{cat.label}</p>
                    <p className="text-[11px] text-muted-foreground">{qCount} {qCount === 1 ? 'question' : 'questions'}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 pt-4">
            <Button variant="ghost" onClick={() => setStage('intro')} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              size="lg"
              className="gap-2"
              disabled={selectedCategoryIds.length === 0}
              onClick={() => {
                setCurrentIndex(0);
                setStage('runner');
                saveResponsesToDb(responses, { selected_category_ids: selectedCategoryIds, current_index: 0 });
              }}
            >
              Begin · {totalSelectedQs} {totalSelectedQs === 1 ? 'question' : 'questions'} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── REVIEW ──
  if (stage === 'review') {
    const orderedSelectedCats = categories
      .filter(c => selectedCategoryIds.includes(c.id))
      .sort((a, b) => a.sort_order - b.sort_order);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Review your answers</h1>
            <p className="text-sm text-muted-foreground">
              Tap any question to edit. When you're happy, hit submit and we'll take it from there.
            </p>
          </div>

          <div className="space-y-6">
            {orderedSelectedCats.map(cat => {
              const Icon = ICON_MAP[cat.icon] || Sparkles;
              const catQs = questions.filter(q => q.category_id === cat.id).sort((a, b) => a.sort_order - b.sort_order);
              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-base font-bold text-foreground">{cat.label}</h2>
                  </div>
                  <div className="space-y-2">
                    {catQs.map((q, idx) => {
                      const answer = responses[q.id]?.trim() || '';
                      const skipReason = getSkipReason(q.id);
                      const skipMeta = skipReason ? SKIP_REASONS.find(s => s.value === skipReason) : null;
                      const globalIdx = runnerQuestions.findIndex(rq => rq.id === q.id);
                      return (
                        <div key={q.id} className="rounded-xl border border-border bg-card p-3 sm:p-4">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-sm font-medium text-foreground leading-snug">{q.question}</p>
                              {answer ? (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{answer}</p>
                              ) : skipMeta ? (
                                <p className="text-xs italic text-muted-foreground flex items-center gap-1.5">
                                  <skipMeta.icon className="w-3.5 h-3.5" /> {skipMeta.label}
                                </p>
                              ) : (
                                <p className="text-xs italic text-muted-foreground">Not answered yet</p>
                              )}
                            </div>
                            <Button
                              size="sm" variant="ghost" className="gap-1 text-xs"
                              onClick={() => { if (globalIdx >= 0) { setCurrentIndex(globalIdx); setStage('runner'); } }}
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => { setCurrentIndex(Math.max(0, runnerQuestions.length - 1)); setStage('runner'); }} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back to questions
            </Button>
            <Button
              size="lg" className="gap-2"
              onClick={handleSubmit}
              disabled={submitting || answeredCount === 0}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit All Answers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── RUNNER (one question at a time) ──
  if (runnerQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">No topics selected</h1>
          <Button onClick={() => setStage('category-picker')}>Pick topics</Button>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(Math.max(currentIndex, 0), runnerQuestions.length - 1);
  const currentQ = runnerQuestions[safeIndex];
  const CategoryIcon = ICON_MAP[currentQ._categoryIcon] || Sparkles;
  const hasAnswer = !!responses[currentQ.id]?.trim();
  const isRecordingThis = recordingQuestionId === currentQ.id;
  const isTranscribingThis = transcribingId === currentQ.id;
  const skipReason = getSkipReason(currentQ.id);
  const skipMeta = skipReason ? SKIP_REASONS.find(s => s.value === skipReason) : null;
  const complete = isQuestionComplete(currentQ.id);
  const isLast = safeIndex === runnerQuestions.length - 1;
  const isFirst = safeIndex === 0;

  const goNext = () => {
    if (isLast) setStage('review');
    else setCurrentIndex(safeIndex + 1);
  };
  const goPrev = () => {
    if (!isFirst) setCurrentIndex(safeIndex - 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Straight Talk Self-Interview — 5to10X" noindex />
      <Header />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">
        {/* Crumb */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
            <CategoryIcon className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
            <span className="truncate">{currentQ._categoryLabel}</span>
          </div>
          <span className="text-muted-foreground flex-shrink-0">
            Question <strong className="text-foreground">{safeIndex + 1}</strong> of {runnerQuestions.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4"
          >
            {/* Question */}
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {safeIndex + 1}
              </span>
              <div className="flex-1 space-y-1">
                <h2 className="text-base sm:text-lg font-semibold text-foreground leading-snug">
                  {currentQ.question}
                </h2>
                {currentQ.detail_prompt && (
                  <p className="text-xs sm:text-sm text-muted-foreground">{currentQ.detail_prompt}</p>
                )}
              </div>
              {complete && !isTranscribingThis && (
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              )}
              {isTranscribingThis && (
                <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0 mt-1" />
              )}
            </div>

            {skipMeta && !hasAnswer && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/50">
                <skipMeta.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground italic">Marked: {skipMeta.label}</span>
                <button onClick={() => clearSkip(currentQ.id)} className="text-[10px] text-primary underline ml-1">Undo</button>
              </div>
            )}

            {/* Answer mode tabs */}
            <Tabs value={answerMode} onValueChange={(v) => setAnswerMode(v as 'text' | 'voice')}>
              <TabsList className="grid grid-cols-2 w-full max-w-xs">
                <TabsTrigger value="text" className="gap-1.5 text-xs">
                  <Pencil className="w-3.5 h-3.5" /> Write
                </TabsTrigger>
                <TabsTrigger value="voice" className="gap-1.5 text-xs">
                  <Mic className="w-3.5 h-3.5" /> Voice
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-3 space-y-2">
                <Textarea
                  placeholder="Type your answer here..."
                  value={responses[currentQ.id] || ''}
                  onChange={(e) => handleTextChange(currentQ.id, e.target.value)}
                  onBlur={handleTextBlur}
                  rows={5}
                  className="bg-secondary border-border resize-none text-sm"
                  disabled={isTranscribingThis}
                />
                <p className="text-[10px] text-muted-foreground">Saves automatically when you click away.</p>
              </TabsContent>

              <TabsContent value="voice" className="mt-3 space-y-3">
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 sm:p-5 flex flex-col items-center justify-center gap-3 min-h-[140px]">
                  {isRecordingThis ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                        <span className="text-sm font-mono text-foreground">{formatTime(recordingTime)}</span>
                      </div>
                      <Button size="lg" variant="destructive" className="gap-2" onClick={stopRecording}>
                        <Square className="w-4 h-4" /> Stop & Transcribe
                      </Button>
                    </>
                  ) : isTranscribingThis ? (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Transcribing your answer...
                    </span>
                  ) : (
                    <>
                      <Button
                        size="lg" className="gap-2"
                        onClick={() => startRecording(currentQ.id, currentQ.question)}
                        disabled={recordingQuestionId !== null}
                      >
                        <Mic className="w-4 h-4" />
                        {hasAnswer ? 'Re-record answer' : 'Start recording'}
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center">
                        Speak naturally — we'll transcribe and you can edit before moving on.
                      </p>
                    </>
                  )}
                </div>

                {hasAnswer && !isRecordingThis && !isTranscribingThis && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Transcript (editable)</p>
                    <Textarea
                      value={responses[currentQ.id] || ''}
                      onChange={(e) => handleTextChange(currentQ.id, e.target.value)}
                      onBlur={handleTextBlur}
                      rows={5}
                      className="bg-secondary border-border resize-none text-sm"
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Skip option */}
            {!hasAnswer && !isRecordingThis && !isTranscribingThis && !skipMeta && (
              <div className="pt-2 border-t border-border">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="gap-1 text-xs text-muted-foreground">
                      <ChevronDown className="w-3 h-3" /> Skip this one
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {SKIP_REASONS.map(sr => (
                      <DropdownMenuItem key={sr.value} onClick={() => handleSkip(currentQ.id, sr.value)} className="gap-2">
                        <sr.icon className="w-4 h-4" />
                        <div>
                          <p className="text-sm font-medium">{sr.label}</p>
                          <p className="text-[10px] text-muted-foreground">{sr.description}</p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Analyst notes (kept) */}
            <details className="border-t border-border pt-3">
              <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
                + Add a note for our analyst (optional)
              </summary>
              <div className="mt-2 border-l-2 border-accent pl-3 space-y-2">
                <Textarea
                  placeholder="Anything extra you'd like us to know..."
                  value={responses[`_note_${currentQ.id}`] || ''}
                  onChange={(e) => handleTextChange(`_note_${currentQ.id}`, e.target.value)}
                  onBlur={handleTextBlur}
                  rows={2}
                  className="text-xs bg-accent/10 border-accent/20 resize-none italic"
                  disabled={noteTranscribingId === currentQ.id}
                />
                <div>
                  {noteRecordingId === currentQ.id ? (
                    <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={stopNoteRecording}>
                      <Square className="w-3 h-3" /> Stop ({formatTime(noteRecordingTime)})
                    </Button>
                  ) : noteTranscribingId === currentQ.id ? (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribing note...
                    </span>
                  ) : (
                    <Button
                      size="sm" variant="outline" className="gap-1.5 text-xs border-accent/30"
                      onClick={() => startNoteRecording(currentQ.id, currentQ.question)}
                      disabled={recordingQuestionId !== null || noteRecordingId !== null}
                    >
                      <Mic className="w-3.5 h-3.5" /> {responses[`_note_${currentQ.id}`]?.trim() ? 'Add to note' : 'Record note'}
                    </Button>
                  )}
                </div>
              </div>
            </details>
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" className="gap-1.5" onClick={goPrev} disabled={isFirst}>
            <ArrowLeft className="w-4 h-4" /> Previous
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="sm"
              onClick={() => setStage('category-picker')}
              className="text-xs"
            >
              Edit topics
            </Button>
            <Button className="gap-1.5" onClick={goNext} disabled={isRecordingThis || isTranscribingThis}>
              {isLast ? 'Review & Submit' : 'Next'} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfInterview;
