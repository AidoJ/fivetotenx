import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, AlertTriangle, CheckCircle2, Circle, XCircle,
  Search, Sparkles, ChevronDown, ChevronRight, MessageSquare,
  FileText, Mic, Link2, Brain, Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface RefinementQuestion {
  id: string;
  assessment_id: string;
  question: string;
  source_context: string | null;
  source_type: string;
  category: string;
  priority: string;
  status: string;
  answer: string | null;
  sort_order: number;
  created_at: string;
  sent_to_client?: boolean;
}

interface Props {
  assessmentId: string;
  contactEmail?: string;
  contactName?: string;
  businessName?: string;
}

interface CompletenessItem {
  present: boolean;
  detail: string;
}

interface ReviewedSources {
  transcripts: number;
  notes: number;
  artifacts: {
    total: number;
    text: number;
    links: number;
    files: number;
    images_reviewed: number;
    link_previews: number;
    text_file_previews: number;
  };
}

const hasMeaningfulData = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasMeaningfulData);
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).some(hasMeaningfulData);
  return true;
};

const formatCount = (count: number, singular: string, plural = `${singular}s`) => (
  `${count} ${count === 1 ? singular : plural}`
);

const PRIORITY_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  blocker: { color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: XCircle, label: 'Blocker' },
  important: { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: AlertTriangle, label: 'Important' },
  nice_to_know: { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: Circle, label: 'Nice to Know' },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  unanswered: { color: 'bg-muted text-muted-foreground', label: 'Unanswered' },
  answered: { color: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Answered' },
  not_applicable: { color: 'bg-secondary text-secondary-foreground', label: 'N/A' },
};

const SOURCE_ICONS: Record<string, React.ElementType> = {
  transcript: Mic,
  questionnaire: FileText,
  artifact: Link2,
  analysis: Brain,
  general: Search,
  ai_detected: Sparkles,
};

const ScopeRefinement: React.FC<Props> = ({ assessmentId, contactEmail, contactName, businessName }) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<RefinementQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<number | null>(null);
  const [reviewedSources, setReviewedSources] = useState<ReviewedSources | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionDraft, setQuestionDraft] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sendingToClient, setSendingToClient] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customCategory, setCustomCategory] = useState('General');
  const [clientResponseInfo, setClientResponseInfo] = useState<{ answeredAt: string; answered: number; total: number } | null>(null);

  // Data completeness check
  const [completeness, setCompleteness] = useState<Record<string, CompletenessItem>>({});

  const loadQuestions = useCallback(async () => {
    const { data, error } = await supabase
      .from('refinement_questions' as any)
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('sort_order');
    if (!error && data) {
      const qs = data as any[];
      setQuestions(qs);
      const cats = new Set(qs.map((q: any) => q.category));
      setExpandedCategories(cats);

      // Check for client responses
      const sentQs = qs.filter((q: any) => q.sent_to_client);
      if (sentQs.length > 0) {
        const answeredQs = sentQs.filter((q: any) => q.status === 'answered');
        if (answeredQs.length > 0) {
          const latestAnswer = answeredQs.reduce((latest: any, q: any) =>
            new Date(q.updated_at) > new Date(latest.updated_at) ? q : latest
          );
          setClientResponseInfo({
            answeredAt: latestAnswer.updated_at,
            answered: answeredQs.length,
            total: sentQs.length,
          });
        }
      }
    }
    setLoading(false);
  }, [assessmentId]);

  const checkCompleteness = useCallback(async () => {
    const [assessmentRes, stRes, scopeRes, intRes, artRes, notesRes] = await Promise.all([
      supabase.from('roi_assessments').select('form_data, discovery_ready').eq('id', assessmentId).single(),
      supabase.from('straight_talk_responses').select('id').eq('assessment_id', assessmentId).limit(1),
      supabase.from('scoping_responses').select('id').eq('assessment_id', assessmentId).limit(1),
      supabase.from('client_interviews').select('id, transcript, content, call_completed').eq('assessment_id', assessmentId),
      supabase.from('client_artifacts').select('id, artifact_type').eq('assessment_id', assessmentId),
      supabase.from('lead_notes').select('id').eq('assessment_id', assessmentId),
    ]);

    const assessment = assessmentRes.data as { form_data?: unknown; discovery_ready?: boolean | null } | null;
    const interviews = intRes.data || [];
    const artifacts = artRes.data || [];
    const notes = notesRes.data || [];
    const hasTranscript = interviews.some((i: any) => Boolean(i.transcript?.trim()));
    const hasInterviewContent = interviews.some((i: any) => i.call_completed || Boolean(i.transcript?.trim()) || Boolean(i.content?.trim()));
    const realityCheckCaptured = hasMeaningfulData(assessment?.form_data) || (scopeRes.data?.length || 0) > 0;
    const straightTalkCaptured = (stRes.data?.length || 0) > 0 || assessment?.discovery_ready === true || hasInterviewContent;

    const artifactCounts = artifacts.reduce((acc: Record<string, number>, artifact: any) => {
      const key = artifact.artifact_type || 'other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const artifactDetailParts = [
      artifactCounts.text ? formatCount(artifactCounts.text, 'note') : null,
      artifactCounts.link ? formatCount(artifactCounts.link, 'link') : null,
      artifactCounts.file ? formatCount(artifactCounts.file, 'file') : null,
    ].filter(Boolean);

    setCompleteness({
      'Reality Check™': {
        present: realityCheckCaptured,
        detail: realityCheckCaptured
          ? (scopeRes.data?.length || 0) > 0
            ? 'Industry questionnaire responses found'
            : 'Assessment form data found'
          : 'No assessment or industry responses found',
      },
      'Straight Talk™ / Call': {
        present: straightTalkCaptured,
        detail: hasTranscript
          ? 'Transcript found, so the call is treated as completed'
          : (stRes.data?.length || 0) > 0
            ? 'Straight Talk™ responses found'
            : hasInterviewContent
              ? 'Interview record found'
              : 'No questionnaire or call record found',
      },
      'Transcripts': {
        present: hasTranscript,
        detail: hasTranscript
          ? formatCount(interviews.filter((i: any) => Boolean(i.transcript?.trim())).length, 'transcript')
          : 'No transcript attached yet',
      },
      'Artifacts': {
        present: artifacts.length > 0,
        detail: artifacts.length > 0
          ? artifactDetailParts.join(' • ')
          : 'No notes, links, or files added',
      },
      'Internal Notes': {
        present: notes.length > 0,
        detail: notes.length > 0 ? formatCount(notes.length, 'note') : 'No internal notes yet',
      },
    });
  }, [assessmentId]);

  useEffect(() => {
    loadQuestions();
    checkCompleteness();
  }, [loadQuestions, checkCompleteness]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('scope-refinement', {
        body: { assessmentId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSummary(data.summary);
      setReadiness(data.build_readiness_percent);
      setReviewedSources(data.reviewed_sources ?? null);
      await loadQuestions();
      await checkCompleteness();
      toast({ title: `Scope refinement complete — ${data.questions_count} gaps identified` });
    } catch (err: any) {
      toast({ title: 'Analysis failed', description: err.message, variant: 'destructive' });
    }
    setAnalyzing(false);
  };

  const clearAndRerun = async () => {
    // Delete existing questions first
    await supabase.from('refinement_questions' as any).delete().eq('assessment_id', assessmentId);
    setQuestions([]);
    setSummary(null);
    setReadiness(null);
    setReviewedSources(null);
    await runAnalysis();
  };

  const updateQuestionStatus = async (id: string, status: string) => {
    await supabase.from('refinement_questions' as any).update({ status }).eq('id', id);
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, status } : q));
  };

  const saveAnswer = async (id: string) => {
    const status = answerDraft.trim() ? 'answered' : 'unanswered';
    await supabase.from('refinement_questions' as any).update({ answer: answerDraft, status }).eq('id', id);
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, answer: answerDraft, status } : q));
    setEditingAnswer(null);
    setAnswerDraft('');
  };

  const saveQuestionText = async (id: string) => {
    if (!questionDraft.trim()) return;
    await supabase.from('refinement_questions' as any).update({ question: questionDraft.trim() } as any).eq('id', id);
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, question: questionDraft.trim() } : q));
    setEditingQuestionId(null);
    setQuestionDraft('');
    toast({ title: 'Question updated' });
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  // Compute stats
  const totalQ = questions.length;
  const answeredQ = questions.filter(q => q.status === 'answered').length;
  const naQ = questions.filter(q => q.status === 'not_applicable').length;
  const blockers = questions.filter(q => q.priority === 'blocker' && q.status === 'unanswered').length;
  const resolvedPercent = totalQ > 0 ? Math.round(((answeredQ + naQ) / totalQ) * 100) : 0;
  const buildReadiness = readiness ?? (totalQ > 0 ? resolvedPercent : null);

  // Group & filter
  const filtered = questions.filter(q => {
    if (filterPriority !== 'all' && q.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && q.status !== filterStatus) return false;
    return true;
  });
  const grouped: Record<string, RefinementQuestion[]> = {};
  for (const q of filtered) {
    if (!grouped[q.category]) grouped[q.category] = [];
    grouped[q.category].push(q);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllUnanswered = () => {
    const unanswered = questions.filter(q => q.status === 'unanswered').map(q => q.id);
    setSelectedIds(new Set(unanswered));
  };

  const addCustomQuestion = async () => {
    if (!customQuestion.trim()) return;
    const sortOrder = questions.length;
    const { data, error } = await supabase.from('refinement_questions' as any).insert({
      assessment_id: assessmentId,
      question: customQuestion.trim(),
      category: customCategory.trim() || 'General',
      priority: 'important',
      status: 'unanswered',
      source_type: 'manual',
      sort_order: sortOrder,
    } as any).select().single();
    if (!error && data) {
      setQuestions(prev => [...prev, data as any]);
      setCustomQuestion('');
      setAddingCustom(false);
      toast({ title: 'Custom question added' });
    }
  };

  const sendToClient = async () => {
    if (selectedIds.size === 0) {
      toast({ title: 'Select at least one question', variant: 'destructive' });
      return;
    }
    if (!contactEmail) {
      toast({ title: 'No client email on file', variant: 'destructive' });
      return;
    }
    setSendingToClient(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-refinement-invite', {
        body: {
          assessmentId,
          questionIds: Array.from(selectedIds),
          contactEmail,
          contactName: contactName || 'there',
          businessName: businessName || '',
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await supabase.from('refinement_questions' as any)
        .update({ sent_to_client: true } as any)
        .in('id', Array.from(selectedIds));
      setQuestions(prev => prev.map(q => selectedIds.has(q.id) ? { ...q, sent_to_client: true } : q));
      setSelectedIds(new Set());
      toast({ title: `Sent ${selectedIds.size} questions to ${contactEmail}` });
    } catch (err: any) {
      toast({ title: 'Failed to send', description: err.message, variant: 'destructive' });
    }
    setSendingToClient(false);
  };

  return (
    <div className="space-y-6">
      {/* Data Completeness Audit */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" /> Data Completeness Audit
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(completeness).map(([label, item]) => (
            <div key={label} className={`rounded-lg p-3 border text-center ${item.present ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {item.present ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
              </div>
              <p className="text-[10px] font-medium text-foreground">{label}</p>
              <p className={`text-[9px] ${item.present ? 'text-green-600' : 'text-red-400'}`}>
                {item.present ? 'Available' : 'Missing'}
              </p>
              <p className="mt-1 text-[9px] leading-snug text-muted-foreground">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Client Response Banner */}
      {clientResponseInfo && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Client responded — {clientResponseInfo.answered}/{clientResponseInfo.total} questions answered
              </p>
              <p className="text-[11px] text-muted-foreground">
                Received {new Date(clientResponseInfo.answeredAt).toLocaleDateString('en-AU', { dateStyle: 'medium' })} at {new Date(clientResponseInfo.answeredAt).toLocaleTimeString('en-AU', { timeStyle: 'short' })}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={runAnalysis} disabled={analyzing}>
            <Sparkles className="w-3.5 h-3.5" /> Re-analyse with answers
          </Button>
        </div>
      )}

      {/* Build Readiness + Actions */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" /> Build Readiness
          </h3>
          <div className="flex gap-2">
            {questions.length > 0 && (
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={clearAndRerun} disabled={analyzing}>
                <Sparkles className="w-3.5 h-3.5" /> Re-analyse
              </Button>
            )}
            <Button size="sm" className="text-xs gap-1.5" onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {questions.length > 0 ? 'Refresh Analysis' : 'Run Gap Analysis'}
            </Button>
          </div>
        </div>

        {buildReadiness !== null && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {answeredQ + naQ} of {totalQ} questions resolved
                {blockers > 0 && <span className="text-red-500 ml-2">· {blockers} blockers remaining</span>}
              </span>
              <span className="font-bold text-foreground">{buildReadiness}%</span>
            </div>
            <Progress value={buildReadiness} className="h-2" />
          </div>
        )}

        {summary && (
          <div className="rounded-lg bg-secondary/50 p-4 border border-border">
            <p className="text-xs text-foreground/80 leading-relaxed">{summary}</p>
            {reviewedSources && (
              <div className="mt-3 rounded-lg border border-border bg-background/60 p-3 text-[11px] text-muted-foreground">
                Reviewed {formatCount(reviewedSources.transcripts, 'transcript')}, {formatCount(reviewedSources.notes, 'internal note')}, {formatCount(reviewedSources.artifacts.total, 'artifact')}
                {reviewedSources.artifacts.total > 0 && (
                  <span>
                    {` (${reviewedSources.artifacts.text} notes, ${reviewedSources.artifacts.links} links, ${reviewedSources.artifacts.files} files`}
                    {reviewedSources.artifacts.link_previews > 0 ? `, ${reviewedSources.artifacts.link_previews} fetched link previews` : ''}
                    {reviewedSources.artifacts.text_file_previews > 0 ? `, ${reviewedSources.artifacts.text_file_previews} text-file previews` : ''}
                    {reviewedSources.artifacts.images_reviewed > 0 ? `, ${reviewedSources.artifacts.images_reviewed} images reviewed` : ''}
                    )
                  </span>
                )}
                .
              </div>
            )}
          </div>
        )}

        {analyzing && (
          <div className="flex items-center gap-3 py-6 justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analysing all client data for scope gaps…</p>
          </div>
        )}
      </div>

      {/* Questions Board */}
      {questions.length > 0 && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="blocker">Blockers</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="nice_to_know">Nice to Know</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unanswered">Unanswered</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="not_applicable">N/A</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">
                {filtered.length} of {totalQ} shown
              </span>
              {selectedIds.size > 0 && (
                <Button size="sm" className="h-7 text-[10px] gap-1 px-3" onClick={sendToClient} disabled={sendingToClient}>
                  {sendingToClient ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Send {selectedIds.size} to Client
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={selectAllUnanswered}>
                Select Unanswered
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 gap-1" onClick={() => setAddingCustom(true)}>
                + Custom Q
              </Button>
            </div>
          </div>

          {/* Add custom question inline */}
          {addingCustom && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Add Custom Question</span>
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setAddingCustom(false)}>Cancel</Button>
              </div>
              <Textarea
                placeholder="Type your question…"
                value={customQuestion}
                onChange={e => setCustomQuestion(e.target.value)}
                rows={2}
                className="text-xs"
              />
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Category (e.g. Workflow)"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="h-7 text-xs w-48"
                />
                <Button size="sm" className="h-7 text-[10px] gap-1" onClick={addCustomQuestion} disabled={!customQuestion.trim()}>
                  <CheckCircle2 className="w-3 h-3" /> Add
                </Button>
              </div>
            </div>
          )}

          {/* Grouped Questions */}
          {Object.entries(grouped).map(([category, catQuestions]) => {
            const isExpanded = expandedCategories.has(category);
            const catBlockers = catQuestions.filter(q => q.priority === 'blocker' && q.status === 'unanswered').length;
            const catAnswered = catQuestions.filter(q => q.status === 'answered' || q.status === 'not_applicable').length;

            return (
              <div key={category} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <h4 className="text-sm font-bold text-foreground flex-1 text-left">{category}</h4>
                  <div className="flex items-center gap-2">
                    {catBlockers > 0 && (
                      <Badge variant="outline" className="text-[9px] text-red-500 border-red-500/30">
                        {catBlockers} blockers
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {catAnswered}/{catQuestions.length} resolved
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {catQuestions.map((q) => {
                      const pri = PRIORITY_CONFIG[q.priority] || PRIORITY_CONFIG.important;
                      const stat = STATUS_CONFIG[q.status] || STATUS_CONFIG.unanswered;
                      const PriIcon = pri.icon;
                      const SourceIcon = SOURCE_ICONS[q.source_type] || SOURCE_ICONS.ai_detected;
                      const isEditing = editingAnswer === q.id;

                      return (
                        <div key={q.id} className="px-5 py-4 space-y-2">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedIds.has(q.id)}
                              onCheckedChange={() => toggleSelect(q.id)}
                              className="mt-1 shrink-0"
                            />
                            <PriIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${q.priority === 'blocker' ? 'text-red-500' : q.priority === 'important' ? 'text-amber-500' : 'text-blue-500'}`} />
                            <div className="flex-1 min-w-0">
                              {editingQuestionId === q.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={questionDraft}
                                    onChange={e => setQuestionDraft(e.target.value)}
                                    rows={2}
                                    className="text-sm bg-secondary border-border resize-none"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" className="h-6 text-[10px] gap-1" onClick={() => saveQuestionText(q.id)}>
                                      <CheckCircle2 className="w-3 h-3" /> Save
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => { setEditingQuestionId(null); setQuestionDraft(''); }}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p
                                  className="text-sm text-foreground font-medium leading-snug cursor-pointer hover:text-primary transition-colors"
                                  onDoubleClick={() => { setEditingQuestionId(q.id); setQuestionDraft(q.question); }}
                                  title="Double-click to edit"
                                >
                                  {q.question}
                                </p>
                              )}
                              {q.sent_to_client && (
                                <Badge variant="outline" className="text-[8px] mt-1 text-primary border-primary/30">Sent to Client</Badge>
                              )}
                              {q.source_context && (
                                <div className="mt-1.5 flex items-start gap-1.5">
                                  <SourceIcon className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                                  <p className="text-[11px] text-muted-foreground italic leading-snug">"{q.source_context}"</p>
                                </div>
                              )}

                              {/* Answer area */}
                              {q.status === 'answered' && q.answer && !isEditing && (
                                <div className="mt-2 rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                                  <p className="text-xs text-foreground/80">{q.answer}</p>
                                </div>
                              )}

                              {isEditing && (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    placeholder="Enter the answer…"
                                    value={answerDraft}
                                    onChange={(e) => setAnswerDraft(e.target.value)}
                                    rows={3}
                                    className="text-xs bg-secondary border-border resize-none"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => saveAnswer(q.id)}>
                                      <CheckCircle2 className="w-3 h-3" /> Save Answer
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => { setEditingAnswer(null); setAnswerDraft(''); }}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant="outline" className={`text-[9px] ${pri.color}`}>{pri.label}</Badge>
                              <Badge variant="outline" className={`text-[9px] ${stat.color}`}>{stat.label}</Badge>
                            </div>
                          </div>

                          {/* Action buttons */}
                          {!isEditing && (
                            <div className="flex items-center gap-2 pl-7">
                              {q.status !== 'answered' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px] gap-1 px-2"
                                  onClick={() => { setEditingAnswer(q.id); setAnswerDraft(q.answer || ''); }}
                                >
                                  <MessageSquare className="w-3 h-3" /> Answer
                                </Button>
                              )}
                              {q.status === 'answered' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-[10px] gap-1 px-2"
                                  onClick={() => { setEditingAnswer(q.id); setAnswerDraft(q.answer || ''); }}
                                >
                                  Edit
                                </Button>
                              )}
                              {q.status !== 'not_applicable' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-[10px] px-2 text-muted-foreground"
                                  onClick={() => updateQuestionStatus(q.id, 'not_applicable')}
                                >
                                  Mark N/A
                                </Button>
                              )}
                              {q.status === 'not_applicable' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-[10px] px-2"
                                  onClick={() => updateQuestionStatus(q.id, 'unanswered')}
                                >
                                  Reopen
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!analyzing && questions.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-1">No scope gaps identified yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Run the AI gap analysis to review all collected data and identify questions that need answering before building.
          </p>
          <Button onClick={runAnalysis} disabled={analyzing} className="gap-1.5">
            <Sparkles className="w-4 h-4" /> Run Gap Analysis
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScopeRefinement;
