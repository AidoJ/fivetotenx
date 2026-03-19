import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import AdminLogin from '@/components/AdminLogin';
import type { Session } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Mail, Phone, Building2, Calendar, DollarSign, ChevronDown, ChevronUp,
  Loader2, Send, FileText, ExternalLink, Copy, Check, Save, Eye, Code,
  MessageSquare, Plus, ClipboardList, Target, Wrench, Clock, AlertCircle, Pencil,
  Mic, Upload, Trash2, LayoutDashboard, CheckSquare, Circle, CircleDot, ListTodo, Brain, ClipboardCheck, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import logo from '@/assets/logo-5to10x-color.webp';
import PipelineDashboard from '@/components/admin/PipelineDashboard';
import AdminTasks from '@/components/admin/AdminTasks';
import LeadCard from '@/components/admin/LeadCard';
import DiscoveryAnswersViewer from '@/components/admin/DiscoveryAnswersViewer';
import DiscoveryChecklist from '@/components/admin/DiscoveryChecklist';
import CallGuide from '@/components/admin/CallGuide';
import ScopingQuestionEditor from '@/components/admin/ScopingQuestionEditor';

type Assessment = Tables<'roi_assessments'>;
type PipelineStage = Assessment['pipeline_stage'];

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  from_name: string;
  from_email: string;
  html_body: string;
  description: string | null;
  trigger_description: string | null;
  updated_at: string;
}

interface DeepDiveSubmission {
  id: string;
  assessment_id: string;
  current_website: string | null;
  current_tools: string | null;
  pain_points: string | null;
  primary_goals: string[] | null;
  timeline: string | null;
  budget_comfort: string | null;
  decision_maker_name: string | null;
  decision_maker_role: string | null;
  decision_timeline: string | null;
  required_integrations: string[] | null;
  must_have_features: string | null;
  nice_to_have_features: string | null;
  competitors: string | null;
  additional_notes: string | null;
  created_at: string;
}

interface LeadNote {
  id: string;
  assessment_id: string;
  note_type: string;
  content: string;
  created_at: string;
}

interface AdminTask {
  id: string;
  action: string;
  status: string;
  due_date: string | null;
  owner: string;
  assessment_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientInterview {
  id: string;
  assessment_id: string;
  interview_type: string;
  title: string;
  content: string | null;
  audio_file_url: string | null;
  transcript: string | null;
  interviewed_at: string;
  created_at: string;
  zoom_link: string | null;
  call_completed: boolean;
  calendly_event_id: string | null;
  scheduled_at: string | null;
}

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'assessment', label: 'Reality Check™' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'discovery_call' as PipelineStage, label: 'Straight Talk™' },
  { key: 'proposal', label: 'Green Light™' },
  { key: 'signed', label: 'Signed ✅' },
  { key: 'build_refinement' as PipelineStage, label: 'Go Live™' },
  { key: 'completed' as PipelineStage, label: 'Completed ✅' },
];

const CALENDLY_URL = 'https://calendly.com/aidan-rejuvenators/discovery';

// Stage index helper for comparing pipeline progression
const stageIndex = (stage: string) => STAGES.findIndex(s => s.key === stage);

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ─────────── Calendly Webhook Setup Component ─────────── */

const CalendlyWebhookSetup = () => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const { toast } = useToast();

  const handleRegister = async () => {
    if (!token.trim()) {
      toast({ title: 'Token Required', description: 'Please paste your Calendly Personal Access Token', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('register-calendly-webhook', {
        body: { calendlyToken: token.trim() },
      });

      if (error) throw error;
      
      if (data?.success) {
        setResult({ success: true, message: data.message });
        toast({ title: 'Success!', description: data.message });
      } else {
        setResult({ success: false, error: data?.error || 'Unknown error' });
        toast({ title: 'Registration Failed', description: data?.error, variant: 'destructive' });
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to register webhook';
      setResult({ success: false, error: msg });
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Calendly Personal Access Token</Label>
        <Input
          type="password"
          placeholder="Paste your token here..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="text-xs"
        />
        <p className="text-[10px] text-muted-foreground">
          Get your token from <a href="https://calendly.com/integrations/api_webhooks" target="_blank" rel="noopener" className="text-primary hover:underline">Calendly API & Webhooks</a>
        </p>
      </div>

      <Button
        onClick={handleRegister}
        disabled={loading || !token.trim()}
        className="w-full"
        size="sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
        {loading ? 'Registering...' : 'Register Webhook'}
      </Button>

      {result && (
        <div className={`p-3 rounded-lg text-xs ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {result.success ? result.message : result.error}
        </div>
      )}
    </div>
  );
};

/* ─────────── Pattern Map Viewer ─────────── */

const DeepDiveField = ({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: any }) => {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className="text-xs text-foreground whitespace-pre-wrap">{value}</p>
    </div>
  );
};

const DeepDiveArrayField = ({ label, items, icon: Icon }: { label: string; items: string[] | null | undefined; icon?: any }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const DeepDiveViewer = ({ submission }: { submission: DeepDiveSubmission }) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    className="space-y-4 border-t border-border pt-3"
  >
    <div className="flex items-center gap-2">
      <ClipboardList className="w-4 h-4 text-primary" />
      <h4 className="text-xs font-bold text-foreground">Pattern Map Responses</h4>
      <span className="text-[10px] text-muted-foreground">Submitted {formatDate(submission.created_at)}</span>
    </div>

    <div className="grid grid-cols-1 gap-3 bg-secondary/50 rounded-lg p-3">
      <DeepDiveField label="Current Website" value={submission.current_website} icon={ExternalLink} />
      <DeepDiveField label="Current Tools & Software" value={submission.current_tools} icon={Wrench} />
      <DeepDiveField label="Biggest Pain Points" value={submission.pain_points} icon={AlertCircle} />
      <DeepDiveArrayField label="Primary Goals" items={submission.primary_goals} icon={Target} />
      <DeepDiveField label="Timeline" value={submission.timeline} icon={Clock} />
      <DeepDiveField label="Budget Comfort" value={submission.budget_comfort} icon={DollarSign} />
      <DeepDiveArrayField label="Required Integrations" items={submission.required_integrations} icon={Wrench} />
      <DeepDiveField label="Must-Have Features" value={submission.must_have_features} />
      <DeepDiveField label="Nice-to-Have Features" value={submission.nice_to_have_features} />
      <DeepDiveField label="Competitors" value={submission.competitors} />
      <DeepDiveField label="Decision Maker" value={
        [submission.decision_maker_name, submission.decision_maker_role].filter(Boolean).join(' — ') || null
      } icon={Users} />
      <DeepDiveField label="Decision Timeline" value={submission.decision_timeline} icon={Calendar} />
      <DeepDiveField label="Additional Notes" value={submission.additional_notes} icon={MessageSquare} />
    </div>
  </motion.div>
);

/* ─────────── Client Interview Section ─────────── */

const ClientInterviewSection = ({ assessmentId, interviews, onAdd, onDelete, onToggleComplete, onUpdateZoomLink }: {
  assessmentId: string;
  interviews: ClientInterview[];
  onAdd: (assessmentId: string, title: string, content: string, audioFile?: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onUpdateZoomLink: (id: string, zoomLink: string) => Promise<void>;
}) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('Client Interview');
  const [notes, setNotes] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingZoom, setEditingZoom] = useState<string | null>(null);
  const [zoomInput, setZoomInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = interviews.filter(i => i.assessment_id === assessmentId);

  // Sort: scheduled (upcoming) first, then by date
  const sorted = [...filtered].sort((a, b) => {
    if (a.scheduled_at && !b.scheduled_at) return -1;
    if (!a.scheduled_at && b.scheduled_at) return 1;
    return new Date(b.interviewed_at).getTime() - new Date(a.interviewed_at).getTime();
  });

  const handleAdd = async () => {
    if (!notes.trim() && !audioFile) return;
    setAdding(true);
    await onAdd(assessmentId, title, notes.trim(), audioFile || undefined);
    setTitle('Client Interview');
    setNotes('');
    setAudioFile(null);
    setShowForm(false);
    setAdding(false);
  };

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground">Straight Talk™ Calls</h4>
          {filtered.length > 0 && (
            <Badge variant="outline" className="text-[9px] h-4">{filtered.length}</Badge>
          )}
        </div>
        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3 h-3" /> Add Interview
        </Button>
      </div>

      {/* Existing interviews */}
      {sorted.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {sorted.map(interview => (
            <div key={interview.id} className={`rounded-lg p-2.5 space-y-1.5 border ${interview.call_completed ? 'bg-primary/5 border-primary/20' : interview.scheduled_at ? 'bg-amber-500/5 border-amber-500/20' : 'bg-secondary/50 border-transparent'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Completed checkbox */}
                  <input
                    type="checkbox"
                    checked={!!interview.call_completed}
                    onChange={(e) => onToggleComplete(interview.id, e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
                    title={interview.call_completed ? 'Mark as incomplete' : 'Mark as completed'}
                  />
                  <p className={`text-[11px] font-semibold ${interview.call_completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {interview.title}
                  </p>
                  {interview.interview_type === 'scheduled' && !interview.call_completed && (
                    <Badge variant="outline" className="text-[8px] h-4 px-1 bg-amber-500/10 text-amber-700 border-amber-500/20">Scheduled</Badge>
                  )}
                  {interview.call_completed && (
                    <Badge variant="outline" className="text-[8px] h-4 px-1 bg-primary/10 text-primary border-primary/20">Done ✓</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground">
                    {interview.scheduled_at ? formatDate(interview.scheduled_at) : formatDate(interview.interviewed_at)}
                  </span>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive" onClick={() => onDelete(interview.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Zoom link */}
              {interview.zoom_link && editingZoom !== interview.id && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[8px] h-4 px-1 gap-1 bg-blue-500/10 text-blue-700 border-blue-500/20">
                    <ExternalLink className="w-2.5 h-2.5" /> Zoom
                  </Badge>
                  <a href={interview.zoom_link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline truncate max-w-[180px]">
                    {interview.zoom_link.replace('https://', '')}
                  </a>
                  <Button size="sm" variant="ghost" className="h-4 w-4 p-0" onClick={() => { setEditingZoom(interview.id); setZoomInput(interview.zoom_link || ''); }}>
                    <Pencil className="w-2.5 h-2.5" />
                  </Button>
                </div>
              )}
              {!interview.zoom_link && editingZoom !== interview.id && (
                <Button size="sm" variant="ghost" className="h-5 text-[9px] px-1 gap-1 text-muted-foreground" onClick={() => { setEditingZoom(interview.id); setZoomInput(''); }}>
                  <Plus className="w-2.5 h-2.5" /> Add Zoom Link
                </Button>
              )}
              {editingZoom === interview.id && (
                <div className="flex items-center gap-1">
                  <Input value={zoomInput} onChange={e => setZoomInput(e.target.value)} placeholder="https://zoom.us/j/..." className="h-6 text-[10px] flex-1" />
                  <Button size="sm" className="h-6 text-[9px] px-2" onClick={() => { onUpdateZoomLink(interview.id, zoomInput); setEditingZoom(null); }}>Save</Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[9px] px-1" onClick={() => setEditingZoom(null)}>✕</Button>
                </div>
              )}

              {interview.content && (
                <p className="text-[11px] text-foreground whitespace-pre-wrap">{interview.content}</p>
              )}
              {interview.audio_file_url && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[8px] h-4 px-1 gap-1"><Mic className="w-2.5 h-2.5" /> Audio</Badge>
                  <audio controls className="h-6 flex-1" style={{ maxWidth: '200px' }}>
                    <source src={interview.audio_file_url} />
                  </audio>
                </div>
              )}
              {interview.transcript && (
                <div className="bg-card rounded p-2 border border-border">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Transcript</p>
                  <p className="text-[11px] text-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">{interview.transcript}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="space-y-2 bg-secondary/30 rounded-lg p-2.5">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Interview title" className="h-7 text-[10px]" />
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Interview notes, observations, key points discussed..." className="text-[10px] min-h-[60px]" />
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3 h-3" /> {audioFile ? audioFile.name.slice(0, 20) : 'Upload Audio'}
              </Button>
              <div className="flex-1" />
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={handleAdd} disabled={adding || (!notes.trim() && !audioFile)}>
                {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────── Lead Notes ─────────── */

const LeadNotes = ({ assessmentId, notes, onAdd }: {
  assessmentId: string;
  notes: LeadNote[];
  onAdd: (assessmentId: string, content: string, noteType: string) => Promise<void>;
}) => {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('comment');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setAdding(true);
    await onAdd(assessmentId, newNote.trim(), noteType);
    setNewNote('');
    setAdding(false);
  };

  const filteredNotes = notes.filter(n => n.assessment_id === assessmentId);
  const typeColors: Record<string, string> = {
    comment: 'bg-secondary text-foreground',
    question: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    action: 'bg-primary/10 text-primary border-primary/20',
  };

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h4 className="text-xs font-bold text-foreground">Notes & Comments</h4>
        {filteredNotes.length > 0 && (
          <Badge variant="outline" className="text-[9px] h-4">{filteredNotes.length}</Badge>
        )}
      </div>

      {filteredNotes.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {filteredNotes.map(note => (
            <div key={note.id} className={`text-[11px] px-2.5 py-1.5 rounded-md border ${typeColors[note.note_type] || typeColors.comment}`}>
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <Badge variant="outline" className="text-[8px] h-3.5 px-1 capitalize">{note.note_type}</Badge>
                <span className="text-[9px] text-muted-foreground">{formatDate(note.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        <select
          value={noteType}
          onChange={e => setNoteType(e.target.value)}
          className="h-7 text-[10px] rounded-md border border-border bg-secondary px-1.5 text-foreground"
        >
          <option value="comment">💬 Comment</option>
          <option value="question">❓ Question</option>
          <option value="action">⚡ Action</option>
        </select>
        <Input
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAdd()}
          placeholder="Add a note..."
          className="h-7 text-[10px] flex-1"
        />
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={handleAdd} disabled={adding || !newNote.trim()}>
          {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
};

interface ProposalRecord {
  id: string;
  assessment_id: string;
  proposal_data: any;
  sent_at: string;
  accepted: boolean;
  accepted_at: string | null;
}

/* ─────────── Template Editor ─────────── */

const TemplateEditor = ({ template, onSave }: { template: EmailTemplate; onSave: (t: EmailTemplate) => Promise<void> }) => {
  const [editing, setEditing] = useState({ ...template });
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [dirty, setDirty] = useState(false);

  const update = (field: keyof EmailTemplate, value: string) => {
    setEditing(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(editing);
    setSaving(false);
    setDirty(false);
  };

  const previewHtml = editing.html_body
    .replace(/\{\{contactName\}\}/g, 'John Smith')
    .replace(/\{\{businessName\}\}/g, 'Acme Corp')
    .replace(/\{\{deepDiveUrl\}\}/g, `${window.location.origin}/deep-dive?id=sample`);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              {template.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{template.trigger_description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{template.template_key}</Badge>
            {dirty && (
              <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs gap-1">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px]">From Name</Label>
            <Input className="h-8 text-xs" value={editing.from_name} onChange={e => update('from_name', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">From Email</Label>
            <Input className="h-8 text-xs" value={editing.from_email} onChange={e => update('from_email', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Subject Line</Label>
            <Input className="h-8 text-xs" value={editing.subject} onChange={e => update('subject', e.target.value)} />
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-2">
          Variables: <code className="bg-secondary px-1 rounded">{'{{contactName}}'}</code> <code className="bg-secondary px-1 rounded">{'{{businessName}}'}</code> <code className="bg-secondary px-1 rounded">{'{{deepDiveUrl}}'}</code>
        </p>
      </div>

      <div className="border-b border-border">
        <div className="flex">
          <button onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${viewMode === 'preview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={() => setViewMode('html')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${viewMode === 'html' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <Code className="w-3.5 h-3.5" /> HTML
          </button>
        </div>
      </div>

      {viewMode === 'preview' ? (
        <div className="bg-muted/30 p-4">
          <div className="mx-auto max-w-[640px] bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <iframe srcDoc={previewHtml} sandbox="allow-same-origin" className="w-full border-0" style={{ minHeight: 500 }} title={`Preview: ${template.name}`} />
          </div>
        </div>
      ) : (
        <div className="p-4">
          <Textarea value={editing.html_body} onChange={e => update('html_body', e.target.value)} className="font-mono text-xs min-h-[400px] leading-relaxed" />
        </div>
      )}
    </div>
  );
};

const ROI_REPORT_INFO = {
  name: 'ROI Report Email',
  trigger: 'Sent when assessment is completed and "Send Report" is clicked',
  from: 'grow@5to10x.app',
  subject: 'Strategic Growth Report – {Business Name}',
  description: 'Full ROI breakdown with business data, coaching, pricing, and Straight Talk™ CTA. This template is code-managed due to its complexity (dynamic pricing tables, conditional sections). Edit via the send-report edge function.',
};

/* ─────────── Main Admin ─────────── */

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [leads, setLeads] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pipelineFilter, setPipelineFilter] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [deepDives, setDeepDives] = useState<DeepDiveSubmission[]>([]);
  const [scopingResponses, setScopingResponses] = useState<any[]>([]);
  const [leadNotes, setLeadNotes] = useState<LeadNote[]>([]);
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [interviews, setInterviews] = useState<ClientInterview[]>([]);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [trainingRegs, setTrainingRegs] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchLeads = async () => {
    const [leadsRes, deepDivesRes, notesRes, proposalsRes, interviewsRes, tasksRes, trainingRes, scopingRes] = await Promise.all([
      supabase.from('roi_assessments').select('*').order('created_at', { ascending: false }),
      supabase.from('deep_dive_submissions').select('*'),
      supabase.from('lead_notes').select('*').order('created_at', { ascending: true }),
      supabase.from('proposals').select('*').order('created_at', { ascending: false }),
      supabase.from('client_interviews').select('*').order('interviewed_at', { ascending: true }),
      supabase.from('admin_tasks' as any).select('*').order('created_at', { ascending: false }),
      supabase.from('training_registrations' as any).select('*').order('created_at', { ascending: false }),
      supabase.from('scoping_responses' as any).select('*').order('created_at', { ascending: false }),
    ]);

    if (leadsRes.error) toast({ title: 'Error', description: leadsRes.error.message, variant: 'destructive' });
    else setLeads(leadsRes.data || []);

    if (!deepDivesRes.error) setDeepDives((deepDivesRes.data as DeepDiveSubmission[]) || []);
    if (!notesRes.error) setLeadNotes((notesRes.data as LeadNote[]) || []);
    if (!proposalsRes.error) setProposals((proposalsRes.data as ProposalRecord[]) || []);
    if (!interviewsRes.error) setInterviews((interviewsRes.data as ClientInterview[]) || []);
    if (!tasksRes.error) setTasks((tasksRes.data as unknown as AdminTask[]) || []);
    if (!trainingRes.error) setTrainingRegs(trainingRes.data || []);
    if (!scopingRes.error) setScopingResponses(scopingRes.data || []);

    setLoading(false);
  };

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: true });
    if (error) toast({ title: 'Error loading templates', description: error.message, variant: 'destructive' });
    else setTemplates((data as EmailTemplate[]) || []);
    setTemplatesLoading(false);
  };

  useEffect(() => { if (session) fetchLeads(); }, [session]);

  const handleMove = async (id: string, newStage: PipelineStage) => {
    const updates: any = { pipeline_stage: newStage };
    if (newStage === 'qualified') {
      updates.qualified_at = new Date().toISOString();
      updates.is_qualified = true;
    }
    const { error } = await supabase.from('roi_assessments').update(updates).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      toast({ title: 'Moved', description: `Lead moved to ${newStage.replace(/_/g, ' ')}` });
    }
  };

  const handleSendDiscoveryFromQualified = async (lead: Assessment) => {
    // Qualifying now goes straight to Straight Talk™
    handleSendDiscoveryInvite(lead);
  };

  const handleScheduleReminder = async (id: string, days: number | null, scheduledAt: string | null) => {
    const updates: any = { stage_reminder_sent: false };
    if (scheduledAt) {
      updates.stage_reminder_scheduled_at = scheduledAt;
    } else if (days) {
      updates.stage_reminder_days = days;
      updates.stage_reminder_scheduled_at = new Date(Date.now() + days * 60 * 60 * 1000).toISOString();
    }
    const { error } = await supabase.from('roi_assessments').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      toast({ title: 'Reminder scheduled', description: scheduledAt ? `Set for ${formatDate(scheduledAt)}` : `Auto-send in ${days} hours` });
    }
  };

  const handleUpdateFollowUp = async (id: string, days: number) => {
    const followUpAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('roi_assessments').update({
      follow_up_days: days,
      follow_up_scheduled_at: followUpAt,
      follow_up_sent: false,
    }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, follow_up_days: days, follow_up_scheduled_at: followUpAt, follow_up_sent: false } : l));
      toast({ title: 'Follow-up updated', description: `Reminder set for ${days} days` });
    }
  };

  const handleSendReminder = async (lead: Assessment) => {
    const stage = lead.pipeline_stage;
    const validStages = ['qualified', 'deep_dive_sent', 'discovery_call', 'proposal'];
    if (!validStages.includes(stage)) {
      toast({ title: 'No reminder available', description: `No reminder template for the "${stage}" stage.`, variant: 'destructive' });
      return;
    }
    toast({ title: 'Sending reminder...', description: `Sending nudge email to ${lead.contact_email}` });
    try {
      const { data, error } = await supabase.functions.invoke('send-stage-reminder', {
        body: { assessmentId: lead.id },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: 'Reminder sent ✅', description: `Nudge email sent to ${lead.contact_name}` });
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (err: any) {
      toast({ title: 'Failed to send reminder', description: err.message, variant: 'destructive' });
    }
  };

  const handlePrepareProposal = async (lead: Assessment) => {
    try {
      const roi = lead.roi_results as any;
      const dd = deepDives.find(d => d.assessment_id === lead.id);
      const leadInterviews = interviews.filter(i => i.assessment_id === lead.id);
      const formData = lead.form_data as any;
      const bName = lead.business_name || 'your business';
      const industry = lead.industry || formData?.industry || '';

      // Calculate fixed investment from ROI midpoint
      const buildMid = roi?.pricing ? Math.round((roi.pricing.buildCostLow + roi.pricing.buildCostHigh) / 2) : 0;

      // ── Build rich Project Overview from ALL sources ──
      const overviewParts: string[] = [];
      overviewParts.push(`Thank you for the opportunity to work with ${bName}.`);
      
      const dataSources = ['ROI assessment'];
      if (dd) dataSources.push('deep dive questionnaire');
      if (leadInterviews.length > 0) dataSources.push(`client interview${leadInterviews.length > 1 ? 's' : ''}`);
      overviewParts.push(`\nBased on the information gathered during the ${dataSources.join(', ')}, this proposal outlines the development of a custom application and automation solution${industry ? ` for the ${industry} sector` : ''}.`);

      if (dd?.pain_points) {
        overviewParts.push(`\nKey challenges identified during discovery:\n${dd.pain_points}`);
      }
      if (dd?.primary_goals && dd.primary_goals.length > 0) {
        overviewParts.push(`\nPrimary objectives:\n${dd.primary_goals.map(g => `• ${g}`).join('\n')}`);
      }
      // Include interview insights in overview
      if (leadInterviews.length > 0) {
        const interviewInsights = leadInterviews
          .filter(i => i.content || i.transcript)
          .map(i => {
            const text = i.content || i.transcript || '';
            return text.length > 200 ? text.substring(0, 200) + '...' : text;
          });
        if (interviewInsights.length > 0) {
          overviewParts.push(`\nKey points from client conversations:\n${interviewInsights.map(t => `• ${t}`).join('\n')}`);
        }
      }
      overviewParts.push(`\nThe objective is to deliver a scalable digital platform that supports the ongoing growth and efficiency of ${bName}.`);

      // ── Proposed Solution narrative ──
      const solutionParts: string[] = [];
      solutionParts.push(`Based on the discovery process, the proposed solution addresses ${bName}'s core needs:`);
      if (dd?.pain_points) {
        solutionParts.push(`\nThe application will directly tackle the identified pain points by automating manual processes and providing streamlined digital workflows.`);
      }
      if (dd?.current_tools) {
        solutionParts.push(`\nCurrently, ${bName} uses: ${dd.current_tools}. The new system will either replace or integrate with these tools to create a unified platform.`);
      }
      if (dd?.current_website) {
        solutionParts.push(`\nExisting web presence (${dd.current_website}) will be considered in the solution architecture.`);
      }
      if (dd?.competitors) {
        solutionParts.push(`\nCompetitive landscape noted: ${dd.competitors}. The solution will be designed to provide a competitive advantage in this market.`);
      }
      if (formData?.lostSalesReasons && formData.lostSalesReasons.length > 0) {
        solutionParts.push(`\nThe application will specifically address the following friction points that currently contribute to lost sales:\n${formData.lostSalesReasons.map((r: string) => `• ${r}`).join('\n')}`);
      }

      // ── App Features from deep dive must-have + nice-to-have + assessment ──
      const appFeatures: string[] = [];
      if (dd?.must_have_features) {
        dd.must_have_features.split(/[,\n]/).filter(Boolean).forEach(f => appFeatures.push(f.trim()));
      }
      if (dd?.nice_to_have_features) {
        dd.nice_to_have_features.split(/[,\n]/).filter(Boolean).forEach(f => appFeatures.push(`${f.trim()} (nice-to-have)`));
      }
      // Add features implied by assessment data
      if (formData?.currentFeatures) {
        const missing = (formData.currentFeatures as string[]).filter((f: string) => 
          !appFeatures.some(af => af.toLowerCase().includes(f.toLowerCase()))
        );
        missing.forEach(f => appFeatures.push(f));
      }
      if (appFeatures.length === 0) {
        // Only use generic defaults if we truly have no data
        appFeatures.push(
          'Custom web/mobile application interface',
          'Secure database architecture',
          'User authentication and permissions',
          'Customer or staff dashboards',
          'Workflow automation',
          'Reporting and analytics'
        );
      }

      // ── Integrations from deep dive + assessment ──
      const integrations: string[] = [];
      if (dd?.required_integrations && dd.required_integrations.length > 0) {
        dd.required_integrations.forEach(i => integrations.push(i));
      }
      if (dd?.current_tools) {
        // Extract tool names that might need integration
        const toolNames = dd.current_tools.split(/[,\n;]/).map(t => t.trim()).filter(Boolean);
        toolNames.forEach(t => {
          if (!integrations.some(i => i.toLowerCase().includes(t.toLowerCase()))) {
            integrations.push(`${t} (existing tool — integrate or migrate)`);
          }
        });
      }
      if (integrations.length === 0) {
        integrations.push('CRM platforms', 'Payment systems', 'Scheduling platforms', 'API-based services');
      }

      // ── UX Design informed by pain points ──
      let uxDesign = 'Creation of an intuitive user interface designed to reduce friction for users, simplify operational processes, and improve engagement and retention.';
      if (dd?.pain_points) {
        uxDesign += `\n\nThe UX design will specifically address the usability challenges identified: ${dd.pain_points.substring(0, 200)}${dd.pain_points.length > 200 ? '...' : ''}.`;
      }
      if (formData?.lostSalesReasons?.includes('Poor mobile experience')) {
        uxDesign += '\n\nMobile-first design is a priority given the identified impact of poor mobile experience on conversions.';
      }

      // ── Expected Impact with real numbers from ROI ──
      const expectedImpact: string[] = [];
      if (roi?.revenueLift) expectedImpact.push(`Revenue lift from improved conversion — projected ${formatCurrency(roi.revenueLift)}/year`);
      if (roi?.operationalSavings) expectedImpact.push(`Operational savings from automation — projected ${formatCurrency(roi.operationalSavings)}/year (${Math.round(roi.weeklySavingsHours || 0)} hrs/week saved)`);
      if (roi?.retentionImprovement) expectedImpact.push(`Customer retention improvement — projected ${formatCurrency(roi.retentionImprovement)}/year`);
      if (roi?.lostSalesRecovery) expectedImpact.push(`Lost sales recovery — projected ${formatCurrency(roi.lostSalesRecovery)}/year`);
      if (roi?.noShowRecovery) expectedImpact.push(`No-show recovery — projected ${formatCurrency(roi.noShowRecovery)}/year`);
      if (roi?.upsellLift) expectedImpact.push(`Upsell/cross-sell lift — projected ${formatCurrency(roi.upsellLift)}/year`);
      if (roi?.marketingEfficiency) expectedImpact.push(`Marketing efficiency gains — projected ${formatCurrency(roi.marketingEfficiency)}/year`);
      if (expectedImpact.length === 0) {
        expectedImpact.push('Operational time savings', 'Improved conversion rates', 'Improved customer retention', 'Reduced administrative overhead', 'Increased scalability');
      }

      // ── Deliverables ──
      const deliverables = [
        'Application architecture design',
        'UI/UX interface design',
        'Development of agreed features',
        ...(integrations.length > 0 ? ['System integration development and testing'] : []),
        'Testing and bug resolution',
        'Deployment support',
        'Documentation for core functionality',
        ...(formData?.lostSalesReasons?.length > 0 ? ['Conversion optimisation implementation'] : []),
      ];

      // ── Timeline using deep dive timeline + decision timeline ──
      let devDuration = '4–8 weeks';
      if (dd?.timeline) {
        devDuration = dd.timeline;
      }
      const timelinePhases = [
        { phase: 'Discovery & Specification', duration: '1–2 weeks', desc: 'Finalising technical scope, architecture, and detailed feature specifications.' },
        { phase: 'Design & Development', duration: devDuration, desc: `Building the application, integrations${integrations.length > 0 ? ` (including ${integrations.slice(0, 2).join(', ')})` : ''}, and core features.` },
        { phase: 'Testing & Refinement', duration: '1–2 weeks', desc: 'User acceptance testing, bug resolution, and performance optimisation.' },
        { phase: 'Deployment & Handover', duration: '1 week', desc: 'Launch, hosting configuration, documentation, and training.' },
      ];

      // ── Deployment support ──
      let deploymentSupport = 'Assistance with application deployment, hosting configuration, launch support, and initial user onboarding.';
      if (dd?.decision_timeline) {
        deploymentSupport += `\n\nNote: Client has indicated a decision timeline of "${dd.decision_timeline}". Project scheduling will accommodate this.`;
      }

      // ── Budget context note ──
      let investmentNote = '';
      if (dd?.budget_comfort) {
        investmentNote = `Client budget indication: ${dd.budget_comfort}. `;
      }

      const proposalData = {
        projectOverview: overviewParts.join('\n'),
        proposedSolution: solutionParts.join('\n'),
        appFeatures,
        integrations,
        uxDesign,
        deploymentSupport,
        expectedImpact,
        deliverables,
        timelinePhases,
        investmentAmount: buildMid,
        investmentNote,
        paymentStructure: [
          { label: 'Deposit', percentage: 40, description: 'Payable upon acceptance of this proposal to commence work.' },
          { label: 'Development Milestone', percentage: 30, description: 'Payable at agreed development milestone.' },
          { label: 'Completion', percentage: 30, description: 'Prior to deployment or delivery of the final application.' },
        ],
        clientResponsibilities: [
          'Provide accurate business information during intake',
          'Supply required content, assets, and documentation',
          `Nominate a primary project contact${dd?.decision_maker_name ? ` (nominated: ${dd.decision_maker_name}${dd.decision_maker_role ? `, ${dd.decision_maker_role}` : ''})` : ''}`,
          'Provide timely approvals and feedback within 5 business days',
          'Ensure they hold rights to any materials supplied',
        ],
        variations: 'Requests for additional features or changes to scope after development has begun may require revised timelines and additional development costs. All variations will be confirmed with the Client before work proceeds.',
        thirdPartyServices: 'Applications may rely on external services including hosting providers, payment systems, messaging services, or APIs. The Developer is not responsible for outages of third-party platforms, changes to third-party pricing, or service disruptions outside the Developer\'s control. The Client may be required to maintain accounts with these services.',
        intellectualProperty: 'Upon full payment of the project, the Client will own the custom application code developed specifically for this project. The Developer retains ownership of proprietary frameworks, reusable code libraries, and development tools. These may be used in future projects.',
        confidentiality: 'Both parties agree to maintain confidentiality regarding business operations, technical systems, financial information, and customer data. This obligation continues after the completion of the project.',
        dataProtection: 'Where personal information is involved, both parties agree to comply with the obligations of the Privacy Act 1988. The Client is responsible for ensuring their business complies with relevant privacy obligations including obtaining user consent where required and maintaining a privacy policy where applicable.',
        limitationOfLiability: 'To the maximum extent permitted by law, the Developer\'s liability is limited to the value of the services provided under this agreement. The Developer will not be liable for loss of profits, business interruption, or indirect or consequential losses. Nothing in this agreement excludes rights under the Australian Consumer Law.',
        roiDisclaimer: 'Any revenue forecasts, automation savings calculations, or return-on-investment projections provided during the intake or proposal process are indicative only. Actual business outcomes depend on many variables including market conditions, marketing activity, internal processes, and user adoption. The Developer does not guarantee financial outcomes.',
        termination: 'Either party may terminate this agreement if the other party materially breaches the agreement and does not remedy the breach within 14 days. If the project is terminated, work completed to date will be invoiced and all outstanding invoices become payable immediately.',
        governingLaw: 'This agreement is governed by the laws of Australia under the Competition and Consumer Act 2010 and relevant State or Territory legislation.',
        customSections: [],
      };

      const { data, error } = await supabase.from('proposals').insert({
        assessment_id: lead.id,
        proposal_data: JSON.parse(JSON.stringify(proposalData)),
      }).select().single();
      if (error) throw error;
      setProposals(prev => [...prev, data as ProposalRecord]);
      toast({ title: 'Proposal Draft Created ✅', description: 'Synthesised from assessment, deep dive & interviews. Opening for review and editing...' });
      window.open(`${window.location.origin}/proposal/${data.id}?admin=1`, '_blank');
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to create proposal.', variant: 'destructive' });
    }
  };

  const handleSendProposal = async (lead: Assessment) => {
    const existingProposal = proposals.find(p => p.assessment_id === lead.id);
    if (!existingProposal) {
      toast({ title: 'Error', description: 'Please prepare the proposal first.', variant: 'destructive' });
      return;
    }
    try {
      const res = await supabase.functions.invoke('send-proposal', {
        body: { assessmentId: lead.id, proposalId: existingProposal.id },
      });
      if (res.error) throw res.error;
      const now = new Date().toISOString();
      const followUpDays = (lead as any).proposal_follow_up_days || 3;
      const followUpAt = new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('roi_assessments').update({
        pipeline_stage: 'proposal' as any,
        proposal_sent_at: now,
        proposal_follow_up_scheduled_at: followUpAt,
        proposal_follow_up_days: followUpDays,
      }).eq('id', lead.id);
      setLeads(prev => prev.map(l => l.id === lead.id ? {
        ...l,
        pipeline_stage: 'proposal' as PipelineStage,
        proposal_sent_at: now,
        proposal_follow_up_scheduled_at: followUpAt,
        proposal_follow_up_days: followUpDays,
      } as any : l));
      toast({ title: 'Proposal Sent ✅', description: `Proposal sent to ${lead.contact_email}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to send proposal.', variant: 'destructive' });
    }
  };

  const handleUpdateProposalFollowUp = async (id: string, days: number) => {
    const followUpAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('roi_assessments').update({
      proposal_follow_up_days: days,
      proposal_follow_up_scheduled_at: followUpAt,
      proposal_follow_up_sent: false,
    }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, proposal_follow_up_days: days, proposal_follow_up_scheduled_at: followUpAt, proposal_follow_up_sent: false } as any : l));
      toast({ title: 'Follow-up updated', description: `Proposal reminder set for ${days} days` });
    }
  };

  const handleAddNote = async (assessmentId: string, content: string, noteType: string) => {
    const { data, error } = await supabase.from('lead_notes').insert([{
      assessment_id: assessmentId,
      content,
      note_type: noteType,
    }]).select().single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setLeadNotes(prev => [...prev, data as LeadNote]);
    }
  };

  const handleAddInterview = async (assessmentId: string, title: string, content: string, audioFile?: File) => {
    let audioUrl: string | null = null;

    if (audioFile) {
      const fileName = `${assessmentId}/${Date.now()}-${audioFile.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('interview-audio')
        .upload(fileName, audioFile);
      if (uploadErr) {
        toast({ title: 'Error uploading audio', description: uploadErr.message, variant: 'destructive' });
        return;
      }
      const { data: urlData } = supabase.storage.from('interview-audio').getPublicUrl(fileName);
      audioUrl = urlData.publicUrl;
    }

    const { data, error } = await supabase.from('client_interviews').insert([{
      assessment_id: assessmentId,
      interview_type: audioFile ? 'audio' : 'text',
      title,
      content: content || null,
      audio_file_url: audioUrl,
    }]).select().single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setInterviews(prev => [...prev, data as ClientInterview]);
      toast({ title: 'Interview saved ✅' });

      // Auto-transcribe if audio was uploaded
      if (audioUrl && data) {
        toast({ title: 'Transcribing audio...', description: 'This may take a moment.' });
        try {
          const { data: transcribeResult, error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
            body: { interviewId: data.id, audioUrl },
          });
          if (transcribeError) throw transcribeError;
          if (transcribeResult?.error) throw new Error(transcribeResult.error);
          
          // Update local state with transcript
          setInterviews(prev => prev.map(i => 
            i.id === data.id ? { ...i, transcript: transcribeResult.transcript } : i
          ));
          toast({ title: 'Audio transcribed ✅', description: 'Transcript saved. Extracting discovery answers...' });
          
          // The transcribe function auto-triggers extraction. Refresh answers after a delay.
          setTimeout(async () => {
            const { data: refreshed } = await supabase.from('roi_assessments').select('discovery_answers').eq('id', assessmentId).single();
            if (refreshed?.discovery_answers) {
              handleUpdateDiscoveryAnswers(assessmentId, refreshed.discovery_answers);
              toast({ title: 'Discovery answers extracted ✅', description: 'AI-extracted answers are ready for review.' });
            }
          }, 15000);
        } catch (err: any) {
          console.error('Transcription failed:', err);
          toast({ title: 'Transcription failed', description: err.message || 'You can still use the audio file manually.', variant: 'destructive' });
        }
      }
    }
  };

  const handleDeleteInterview = async (id: string) => {
    const { error } = await supabase.from('client_interviews').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setInterviews(prev => prev.filter(i => i.id !== id));
      toast({ title: 'Interview deleted' });
    }
  };

  const handleSendDiscoveryInvite = async (lead: Assessment) => {
    try {
      const { error } = await supabase.functions.invoke('send-discovery-invite', {
        body: {
          contactName: lead.contact_name,
          contactEmail: lead.contact_email,
          businessName: lead.business_name,
          assessmentId: lead.id,
          calendlyUrl: CALENDLY_URL,
        },
      });
      if (error) throw error;
      // Move to discovery_call stage if not already there
      if (lead.pipeline_stage === 'deep_dive_complete') {
        await supabase.from('roi_assessments').update({
          pipeline_stage: 'discovery_call' as any,
        }).eq('id', lead.id);
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, pipeline_stage: 'discovery_call' as PipelineStage } : l));
      }
      toast({ title: 'Discovery Invite Sent ✅', description: `Calendly booking link sent to ${lead.contact_email}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to send discovery invite.', variant: 'destructive' });
    }
  };

  const handleUpdateDiscoveryAnswers = (id: string, answers: any) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, discovery_answers: answers } : l));
  };

  const handleUpdateChecklist = (id: string, checklist: Record<string, boolean>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, discovery_checklist: checklist } : l));
  };

  const handleToggleComplete = async (interviewId: string, completed: boolean) => {
    const { error } = await supabase.from('client_interviews').update({ call_completed: completed }).eq('id', interviewId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setInterviews(prev => prev.map(i => i.id === interviewId ? { ...i, call_completed: completed } : i));
    }
  };

  const handleUpdateZoomLink = async (interviewId: string, zoomLink: string) => {
    const { error } = await supabase.from('client_interviews').update({ zoom_link: zoomLink || null }).eq('id', interviewId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setInterviews(prev => prev.map(i => i.id === interviewId ? { ...i, zoom_link: zoomLink || null } : i));
      toast({ title: 'Zoom link saved ✅' });
    }
  };

  const handleMarkDiscoveryReady = async (id: string, ready: boolean) => {
    const updates: any = { discovery_ready: ready };
    if (ready) {
      // Auto-move to proposal stage
      updates.pipeline_stage = 'proposal';
    }
    const { error } = await supabase.from('roi_assessments').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      toast({ title: ready ? 'Discovery marked complete ✅' : 'Discovery reopened', description: ready ? 'Lead moved to Proposal stage.' : 'Lead returned to Discovery Call.' });
    }
  };

  const handleSaveTemplate = async (updated: EmailTemplate) => {
    const { error } = await supabase.from('email_templates')
      .update({
        subject: updated.subject,
        from_name: updated.from_name,
        from_email: updated.from_email,
        html_body: updated.html_body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updated.id);
    if (error) toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    else {
      setTemplates(prev => prev.map(t => t.id === updated.id ? { ...updated, updated_at: new Date().toISOString() } : t));
      toast({ title: 'Template saved ✅' });
    }
  };

  const getDeepDive = (assessmentId: string) => deepDives.find(d => d.assessment_id === assessmentId) || null;
  const getProposal = (assessmentId: string) => proposals.find(p => p.assessment_id === assessmentId) || null;
  const getScopingResponse = (assessmentId: string) => scopingResponses.find((s: any) => s.assessment_id === assessmentId) || null;

  // Mirror dashboard's 6 consolidated stages
  const PIPELINE_GROUPS: { id: string; label: string; icon: any; stages: string[]; filter?: (l: Assessment) => boolean }[] = [
    { id: 'assessment', label: 'Signal Capture™', icon: ClipboardList, stages: ['assessment', 'qualified'] },
    { id: 'discovery', label: 'Alignment Dialogue™', icon: Phone, stages: ['discovery_call'] },
    { id: 'scoping', label: 'System Blueprint™', icon: Eye, stages: ['discovery_call', 'proposal'], filter: (l) => !!(l as any).scoping_sent && !scopingResponses.find((s: any) => s.assessment_id === l.id && s.completed) },
    { id: 'proposal', label: 'Commercial Clarity™', icon: FileText, stages: ['proposal'] },
    { id: 'build', label: 'Build & Activate™', icon: Wrench, stages: ['signed', 'build_refinement', 'completed'] },
  ];

  const grouped = PIPELINE_GROUPS.map(group => ({
    ...group,
    leads: group.filter
      ? leads.filter(group.filter)
      : leads.filter(l => group.stages.includes(l.pipeline_stage)),
  }));
  const totalImpact = leads.reduce((sum, l) => sum + ((l.roi_results as any)?.totalAnnualImpact || 0), 0);
  const qualifiedCount = leads.filter(l => l.is_qualified).length;

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!session) {
    return <AdminLogin onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="5to10X" className="h-12 w-auto" />
            <div>
              <h1 className="text-base font-display font-bold text-foreground">Pipeline Dashboard</h1>
              <p className="text-xs text-muted-foreground">{leads.length} leads · {qualifiedCount} qualified · {formatCurrency(totalImpact)} total pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{session.user.email}</span>
            <Button variant="outline" size="sm" onClick={fetchLeads}>Refresh</Button>
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPipelineFilter(null); if (v === 'emails' && templates.length === 0) fetchTemplates(); }} className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="w-4 h-4" />Dashboard</TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2"><Users className="w-4 h-4" />Pipeline</TabsTrigger>
            <TabsTrigger value="call-guide" className="gap-2"><ClipboardCheck className="w-4 h-4" />Call Guide</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2"><ListTodo className="w-4 h-4" />Tasks</TabsTrigger>
            <TabsTrigger value="emails" className="gap-2"><FileText className="w-4 h-4" />Email Templates</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2"><Wrench className="w-4 h-4" />Settings</TabsTrigger>
            <TabsTrigger value="scoping" className="gap-2"><ClipboardList className="w-4 h-4" />Scoping Q's</TabsTrigger>
            <TabsTrigger value="training" className="gap-2"><GraduationCap className="w-4 h-4" />Training</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <PipelineDashboard leads={leads} deepDives={deepDives} interviews={interviews} proposals={proposals} scopingResponses={scopingResponses} onStageClick={(stage) => { const groupId = PIPELINE_GROUPS.find(g => g.stages.includes(stage))?.id || stage; setPipelineFilter(groupId); setActiveTab('pipeline'); }} />
          </TabsContent>

          <TabsContent value="pipeline">
            {pipelineFilter && (
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="gap-1.5 text-sm">
                 Filtered: {PIPELINE_GROUPS.find(g => g.id === pipelineFilter)?.label || STAGES.find(s => s.key === pipelineFilter)?.label}
                  <button onClick={() => setPipelineFilter(null)} className="ml-1 hover:text-destructive">✕</button>
                </Badge>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : leads.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No leads yet</p>
                <p className="text-sm">Leads will appear here after assessments are completed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {(pipelineFilter ? grouped.filter(s => s.id === pipelineFilter) : grouped).map(stage => (
                  <div key={stage.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-display font-bold text-foreground">{stage.label}</h2>
                      <Badge variant="outline" className="text-[10px]">{stage.leads.length}</Badge>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {stage.leads.map(lead => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onMove={handleMove}
                          onSendDeepDive={handleSendDiscoveryFromQualified}
                          onUpdateFollowUp={handleUpdateFollowUp}
                          onPrepareProposal={handlePrepareProposal}
                          onSendProposal={handleSendProposal}
                          onUpdateProposalFollowUp={handleUpdateProposalFollowUp}
                          deepDive={getDeepDive(lead.id)}
                          proposal={getProposal(lead.id)}
                          notes={leadNotes}
                          onAddNote={handleAddNote}
                          interviews={interviews}
                          onAddInterview={handleAddInterview}
                          onDeleteInterview={handleDeleteInterview}
                          onSendReminder={handleSendReminder}
                          onScheduleReminder={handleScheduleReminder}
                          onSendDiscoveryInvite={handleSendDiscoveryInvite}
                          onMarkDiscoveryReady={handleMarkDiscoveryReady}
                          onUpdateDiscoveryAnswers={handleUpdateDiscoveryAnswers}
                          onUpdateChecklist={handleUpdateChecklist}
                          onToggleComplete={handleToggleComplete}
                          onUpdateZoomLink={handleUpdateZoomLink}
                          scopingResponse={getScopingResponse(lead.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="call-guide">
            <CallGuide leads={leads as any} onUpdateChecklist={handleUpdateChecklist} />
          </TabsContent>

          <TabsContent value="tasks">
            <AdminTasks tasks={tasks} setTasks={setTasks} />
          </TabsContent>

          <TabsContent value="emails">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Email Templates</h2>
                <p className="text-sm text-muted-foreground">Edit subject lines, content, and styling. Changes apply immediately to all future emails.</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-2 opacity-80">
                <div className="flex items-start justify-between">
                  <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    {ROI_REPORT_INFO.name}
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">Code-managed</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{ROI_REPORT_INFO.trigger}</p>
                <div className="bg-secondary rounded-lg p-3 text-xs space-y-1">
                  <p><span className="text-muted-foreground font-medium">From:</span> <span className="text-foreground">{ROI_REPORT_INFO.from}</span></p>
                  <p><span className="text-muted-foreground font-medium">Subject:</span> <span className="text-foreground font-medium">{ROI_REPORT_INFO.subject}</span></p>
                </div>
                <p className="text-xs text-muted-foreground">{ROI_REPORT_INFO.description}</p>
              </div>

              {templatesLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                templates.map(t => (
                  <TemplateEditor key={t.id} template={t} onSave={handleSaveTemplate} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Integrations</h2>
                <p className="text-sm text-muted-foreground">Configure third-party service connections.</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Calendly Webhook
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Register your webhook to auto-populate bookings when clients schedule discovery calls.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Setup Required</Badge>
                </div>

                <CalendlyWebhookSetup />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="scoping">
            <ScopingQuestionEditor />
          </TabsContent>
          <TabsContent value="training">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">Training Registrations</h2>
                <p className="text-sm text-muted-foreground">{trainingRegs.length} registration{trainingRegs.length !== 1 ? 's' : ''} from the website free training form.</p>
              </div>

              {trainingRegs.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No registrations yet</p>
                  <p className="text-sm">Registrations will appear here when people sign up via the website.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Name</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Email</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Business</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Industry</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingRegs.map((reg: any) => (
                        <tr key={reg.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 text-foreground font-medium">{reg.name}</td>
                          <td className="px-4 py-3">
                            <a href={`mailto:${reg.email}`} className="text-primary hover:underline">{reg.email}</a>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{reg.business_name || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{reg.industry || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(reg.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
