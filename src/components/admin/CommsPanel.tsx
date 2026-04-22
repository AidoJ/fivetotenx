import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Send, Loader2, FileText, Sparkles, ChevronDown, ChevronUp,
  Mail, CheckCircle2, Edit3, RefreshCw, Clock, Handshake, Target, Rocket, Save,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link2, Unlink,
  Heading1, Heading2, Quote, AlignLeft, AlignCenter, AlignRight, Eraser, Undo2, Redo2, Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CommsPanelProps {
  assessmentId: string;
  lead: any;
}

type EmailTemplate = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  templateKey: string;
  stage: string;
};

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'post_interview_thanks',
    label: 'Post-Interview Thank You',
    description: 'Thank the client for their time, summarise key discussion points, and list commitments from both parties.',
    icon: Handshake,
    templateKey: 'post_interview_thanks',
    stage: 'discovery_call',
  },
  {
    id: 'key_findings_proposal',
    label: 'Key Findings & Phase 1 Proposal',
    description: 'Highlight items identified from the transcript that matter to the client, then present the primary goal and Phase 1 build.',
    icon: Target,
    templateKey: 'key_findings_proposal',
    stage: 'proposal',
  },
  {
    id: 'project_kickoff',
    label: 'Project Kickoff',
    description: 'Confirm agreed scope, timeline, team assignments, and next steps to get the build moving.',
    icon: Rocket,
    templateKey: 'project_kickoff',
    stage: 'signed',
  },
  {
    id: 'progress_update',
    label: 'Progress Update',
    description: 'Milestone check-in — what\'s been delivered, what\'s next, and any blockers or decisions needed from the client.',
    icon: Clock,
    templateKey: 'progress_update',
    stage: 'build_refinement',
  },
];

interface DraftEmail {
  subject: string;
  body: string;
  templateKey: string;
}

interface SentEmail {
  templateKey: string;
  subject: string;
  sentAt: string;
  to: string;
  body?: string;
  providerId?: string;
}

type SavedDraftPayload = DraftEmail & {
  savedAt?: string;
};

const CommsPanel: React.FC<CommsPanelProps> = ({ assessmentId, lead }) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftEmail | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingInternalDraft, setSendingInternalDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [confirmSend, setConfirmSend] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [expandedSent, setExpandedSent] = useState<string | null>(null);
  const [draftNoteId, setDraftNoteId] = useState<string | null>(null);
  const editorRef = React.useRef<HTMLDivElement | null>(null);

  // Run a contentEditable formatting command and sync the HTML back into draft state.
  const exec = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    try {
      document.execCommand(command, false, value);
    } catch {
      // execCommand is deprecated but still widely supported for contentEditable.
    }
    const html = editorRef.current.innerHTML;
    setDraft(prev => (prev ? { ...prev, body: html } : prev));
    setConfirmSend(false);
  };

  const promptLink = () => {
    const url = window.prompt('Enter URL (include https://):', 'https://');
    if (!url) return;
    exec('createLink', url);
  };

  const setBlock = (tag: string) => exec('formatBlock', tag);

  // Load sent email history + saved drafts
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('assessment_id', assessmentId)
        .in('note_type', ['email_sent', 'email_draft'])
        .order('created_at', { ascending: false });

      if (data) {
        const sent: SentEmail[] = [];
        let savedDraft: DraftEmail | null = null;
        let savedDraftNoteId: string | null = null;

        for (const n of data) {
          try {
            const parsed = JSON.parse(n.content) as SavedDraftPayload | SentEmail;
            if (n.note_type === 'email_sent') {
              sent.push(parsed as SentEmail);
            } else if (n.note_type === 'email_draft' && !savedDraft) {
              const draftPayload = parsed as SavedDraftPayload;
              savedDraft = { subject: draftPayload.subject, body: draftPayload.body, templateKey: draftPayload.templateKey };
              savedDraftNoteId = n.id;
            }
          } catch {
            if (n.note_type === 'email_sent') {
              sent.push({ templateKey: 'unknown', subject: n.content, sentAt: n.created_at, to: lead?.contact_email });
            }
          }
        }
        setSentEmails(sent);
        if (savedDraft) {
          setDraft(savedDraft);
          setSelectedTemplate(savedDraft.templateKey);
          setDraftNoteId(savedDraftNoteId);
        }
      }
    };
    load();
  }, [assessmentId]);

  const saveDraft = useCallback(async (draftToSave: DraftEmail) => {
    setSaving(true);
    try {
      const payload = JSON.stringify({
        templateKey: draftToSave.templateKey,
        subject: draftToSave.subject,
        body: draftToSave.body,
        savedAt: new Date().toISOString(),
      });

      if (draftNoteId) {
        await supabase.from('lead_notes').update({ content: payload }).eq('id', draftNoteId);
      } else {
        const { data } = await supabase.from('lead_notes').insert({
          assessment_id: assessmentId,
          note_type: 'email_draft',
          content: payload,
        }).select('id').single();
        if (data) setDraftNoteId(data.id);
      }
      toast({ title: 'Draft saved ✅', description: 'Your edits have been saved.' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  }, [assessmentId, draftNoteId, toast]);

  const deleteDraftNote = async () => {
    if (draftNoteId) {
      await supabase.from('lead_notes').delete().eq('id', draftNoteId);
      setDraftNoteId(null);
    }
  };

  const generateDraft = async (templateKey: string) => {
    setGenerating(true);
    setSelectedTemplate(templateKey);
    setConfirmSend(false);
    // Delete old saved draft
    await deleteDraftNote();
    try {
      const isProposalTemplate = templateKey === 'key_findings_proposal';
      const { data, error } = await supabase.functions.invoke(
        isProposalTemplate ? 'send-proposal' : 'analyze-opportunities',
        {
          body: isProposalTemplate
            ? { assessmentId, previewOnly: true }
            : { assessmentId, mode: 'email_draft', templateKey },
        }
      );
      if (error) throw error;
      if (!data?.email) throw new Error('No email content returned');
      const newDraft: DraftEmail = {
        subject: data.email.subject,
        body: data.email.body,
        templateKey,
      };
      setDraft(newDraft);
      // Auto-save new draft
      const payload = JSON.stringify({
        templateKey: newDraft.templateKey,
        subject: newDraft.subject,
        body: newDraft.body,
        savedAt: new Date().toISOString(),
      });
      const { data: noteData } = await supabase.from('lead_notes').insert({
        assessment_id: assessmentId,
        note_type: 'email_draft',
        content: payload,
      }).select('id').single();
      if (noteData) setDraftNoteId(noteData.id);
    } catch (err: any) {
      const timedOut = String(err?.message || '').includes('IDLE_TIMEOUT') || String(err?.message || '').includes('504');
      toast({
        title: 'Failed to generate draft',
        description: timedOut
          ? 'The old draft generator timed out. I switched this template to the direct proposal preview path — please try again.'
          : err.message,
        variant: 'destructive',
      });
    }
    setGenerating(false);
  };

  const sendEmail = async () => {
    if (!draft || !lead) return;
    setSending(true);
    try {
      let sentPayload: SentEmail;

      if (draft.templateKey === 'key_findings_proposal') {
        const { data, error } = await supabase.functions.invoke('send-proposal', {
          body: { assessmentId, cc: ['aidan@5to10x.app', 'eoghan@5to10x.app'] },
        });
        if (error) throw error;
        if (!data?.success || !data?.providerId) throw new Error(data?.error || 'Proposal email was not accepted by the mail provider');

        sentPayload = {
          templateKey: draft.templateKey,
          subject: data.email?.subject || draft.subject,
          sentAt: new Date().toISOString(),
          to: lead.contact_email,
          body: data.email?.body || draft.body,
          providerId: data.providerId,
        };
      } else {
        const { data, error } = await supabase.functions.invoke('send-report', {
          body: {
            to: lead.contact_email,
            subject: draft.subject,
            html: draft.body,
            fromName: 'Aidan Leonard',
            cc: ['aidan@5to10x.app', 'eoghan@5to10x.app'],
          },
        });
        if (error) throw error;
        if (!data?.success || !data?.id) throw new Error(data?.error || 'Email was not accepted by the mail provider');

        sentPayload = {
          templateKey: draft.templateKey,
          subject: draft.subject,
          sentAt: new Date().toISOString(),
          to: lead.contact_email,
          body: draft.body,
          providerId: data.id,
        };
      }

      await supabase.from('lead_notes').insert({
        assessment_id: assessmentId,
        note_type: 'email_sent',
        content: JSON.stringify(sentPayload),
      });

      // Delete draft note since it's been sent
      await deleteDraftNote();

      setSentEmails(prev => [sentPayload, ...prev]);
      setDraft(null);
      setSelectedTemplate(null);
      toast({ title: 'Email sent ✅', description: `Sent to ${lead.contact_email} (cc: Aidan, Eoghan)` });
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    }
    setSending(false);
  };

  // Send the proposal email to the internal team (Aidan + Eoghan) for review
  // BEFORE it goes to the client. Does NOT mark the proposal as delivered.
  const sendInternalDraft = async () => {
    if (!draft || draft.templateKey !== 'key_findings_proposal') return;
    setSendingInternalDraft(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-proposal', {
        body: { assessmentId, draftToTeamOnly: true },
      });
      if (error) throw error;
      if (!data?.success || !data?.providerId) throw new Error(data?.error || 'Internal draft was not accepted by the mail provider');
      const recipients = Array.isArray(data.sentTo) ? data.sentTo.join(', ') : 'aidan@5to10x.app, eoghan@5to10x.app';
      toast({
        title: 'Draft sent for internal review ✅',
        description: `Sent to ${recipients}. The client has NOT received this — review and then click Send Email when ready.`,
      });
    } catch (err: any) {
      toast({ title: 'Internal draft send failed', description: err.message, variant: 'destructive' });
    }
    setSendingInternalDraft(false);
  };

  const templateMeta = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" /> Email Templates
        </h3>
        <p className="text-xs text-muted-foreground">
          Select a template to auto-generate a personalised email. Drafts are saved automatically so you can navigate away and return.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EMAIL_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const wasSent = sentEmails.some(s => s.templateKey === tmpl.id);
            const hasDraft = draft?.templateKey === tmpl.id;
            const isActive = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => generateDraft(tmpl.id)}
                disabled={generating}
                className={`relative text-left rounded-xl border p-4 transition-all hover:shadow-md ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${isActive ? 'bg-primary/10' : 'bg-secondary'}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-foreground">{tmpl.label}</p>
                      {wasSent && (
                        <Badge variant="outline" className="text-[9px] text-green-600 border-green-300 gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Sent
                        </Badge>
                      )}
                      {hasDraft && !isActive && (
                        <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300 gap-0.5">
                          <Edit3 className="w-2.5 h-2.5" /> Draft
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{tmpl.description}</p>
                    <Badge variant="secondary" className="text-[9px] mt-1.5 capitalize">{tmpl.stage.replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
                {generating && isActive && (
                  <div className="absolute inset-0 rounded-xl bg-card/80 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Draft Editor */}
      {draft && (
        <div className="rounded-xl border border-primary/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" /> Draft: {templateMeta?.label}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1"
                onClick={() => saveDraft(draft)}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Draft
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1"
                onClick={() => selectedTemplate && generateDraft(selectedTemplate)}
                disabled={generating}
              >
                <RefreshCw className="w-3 h-3" /> Regenerate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-[10px]"
                onClick={async () => { await deleteDraftNote(); setDraft(null); setSelectedTemplate(null); }}
              >
                Discard
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">To</Label>
              <Input value={lead?.contact_email || ''} disabled className="h-8 text-xs bg-secondary/50" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">CC</Label>
              <Input value="aidan@5to10x.app, eoghan@5to10x.app" disabled className="h-8 text-xs bg-secondary/50" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Subject</Label>
              <Input
                value={draft.subject}
                onChange={e => setDraft({ ...draft, subject: e.target.value })}
                className="h-8 text-xs bg-secondary border-border"
              />
            </div>

            {/* Editable Preview / Raw HTML toggle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Email Body</Label>
                <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                      viewMode === 'preview'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ✏️ Visual Editor
                  </button>
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                      viewMode === 'edit'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    &lt;/&gt; HTML
                  </button>
                </div>
              </div>

              {viewMode === 'preview' ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-secondary/30 px-3 py-2 border-b border-border flex items-center gap-1 flex-wrap">
                    {/* Block / heading group */}
                    <select
                      onChange={e => { setBlock(e.target.value); e.target.value = ''; }}
                      defaultValue=""
                      className="h-7 text-[11px] rounded border border-border bg-card px-1.5"
                      title="Paragraph style"
                    >
                      <option value="" disabled>Style…</option>
                      <option value="P">Paragraph</option>
                      <option value="H1">Heading 1</option>
                      <option value="H2">Heading 2</option>
                      <option value="H3">Heading 3</option>
                      <option value="BLOCKQUOTE">Quote</option>
                      <option value="PRE">Code block</option>
                    </select>
                    <ToolbarBtn onClick={() => exec('bold')} title="Bold (⌘B)"><Bold className="w-3.5 h-3.5" /></ToolbarBtn>
                    <ToolbarBtn onClick={() => exec('italic')} title="Italic (⌘I)"><Italic className="w-3.5 h-3.5" /></ToolbarBtn>
                    <ToolbarBtn onClick={() => exec('underline')} title="Underline (⌘U)"><Underline className="w-3.5 h-3.5" /></ToolbarBtn>
                    <ToolbarBtn onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></ToolbarBtn>
                    <Sep />
                    <ToolbarBtn onClick={() => setBlock('H1')} title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></ToolbarBtn>
                    <ToolbarBtn onClick={() => setBlock('H2')} title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></ToolbarBtn>
                    <ToolbarBtn onClick={() => setBlock('BLOCKQUOTE')} title="Quote"><Quote className="w-3.5 h-3.5" /></ToolbarBtn>
                    <Sep />
                    <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List className="w-3.5 h-3.5" /></ToolbarBtn>
                    <ToolbarBtn onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered className="w-3.5 h-3.5" /></ToolbarBtn>
                    <Sep />
                    <ToolbarBtn onClick={() => exec('justifyLeft')} title="Align left"><AlignLeft className="w-3.5 h-3.5" /></ToolbarBtn>
                    <ToolbarBtn onClick={() => exec('justifyCenter')} title="Align center"><AlignCenter className="w-3.5 h-3.5" /></ToolbarBtn>
                    <ToolbarBtn onClick={() => exec('justifyRight')} title="Align right"><AlignRight className="w-3.5 h-3.5" /></ToolbarBtn>
                    <Sep />
                    <ToolbarBtn onClick={promptLink} title="Insert link"><Link2 className="w-3.5 h-3.5" /></ToolbarBtn>
                    <ToolbarBtn onClick={() => exec('unlink')} title="Remove link"><Unlink className="w-3.5 h-3.5" /></ToolbarBtn>
                    <Sep />
                    <label className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-secondary cursor-pointer relative" title="Text color">
                      <Palette className="w-3.5 h-3.5" />
                      <input
                        type="color"
                        onChange={e => exec('foreColor', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                    <ToolbarBtn onClick={() => exec('removeFormat')} title="Clear formatting"><Eraser className="w-3.5 h-3.5" /></ToolbarBtn>
                    <Sep />
                    <ToolbarBtn onClick={() => exec('undo')} title="Undo"><Undo2 className="w-3.5 h-3.5" /></ToolbarBtn>
                    <ToolbarBtn onClick={() => exec('redo')} title="Redo"><Redo2 className="w-3.5 h-3.5" /></ToolbarBtn>
                  </div>
                  <div className="bg-secondary/30 px-4 py-1.5 border-b border-border flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive/60" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
                    <div className="w-2 h-2 rounded-full bg-green-500/60" />
                    <span className="text-[10px] text-muted-foreground ml-2">Edits autosave on blur — click Save Draft to persist</span>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: draft.body }}
                    onBlur={e => {
                      const newHtml = (e.target as HTMLDivElement).innerHTML;
                      if (newHtml !== draft.body) {
                        setDraft({ ...draft, body: newHtml });
                        setConfirmSend(false);
                      }
                    }}
                    className="outline-none min-h-[400px] max-h-[600px] overflow-y-auto"
                    style={{
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#333',
                      padding: '24px 32px',
                      background: '#fff',
                    }}
                  />
                </div>
              ) : (
                <Textarea
                  value={draft.body}
                  onChange={e => setDraft({ ...draft, body: e.target.value })}
                  rows={20}
                  className="text-xs bg-secondary border-border resize-y font-mono"
                />
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            {draft.templateKey === 'key_findings_proposal' && (
              <div className="rounded-lg border border-amber-400/40 bg-amber-500/5 p-3 flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Want a final QA pass?</p>
                  <p className="text-[11px] text-amber-700/80 mt-1 leading-relaxed">
                    Send the exact proposal email to Aidan + Eoghan first (not the client). Useful for reviewing copy, totals, scope and delivery phases before it goes out.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-amber-500/50 text-amber-700 hover:bg-amber-500/10"
                  onClick={sendInternalDraft}
                  disabled={sendingInternalDraft || !draft.subject || !draft.body}
                >
                  {sendingInternalDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send draft to us first
                </Button>
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmSend}
                onChange={e => setConfirmSend(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-xs text-foreground font-medium">
                I have reviewed this email and confirm it is ready to send to {lead?.contact_name || 'the client'}
              </span>
            </label>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                A copy will be sent to aidan@5to10x.app and eoghan@5to10x.app for reference.
              </p>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={sendEmail}
                disabled={sending || !draft.subject || !draft.body || !confirmSend}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sent History */}
      {sentEmails.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" /> Sent Emails ({sentEmails.length})
          </h3>
          <div className="space-y-2">
            {sentEmails.map((email, idx) => {
              const tmpl = EMAIL_TEMPLATES.find(t => t.id === email.templateKey);
              const isExpanded = expandedSent === `${idx}`;
              return (
                <div key={idx} className="rounded-lg border border-border bg-card">
                  <button
                    className="w-full p-3 flex items-center justify-between text-left"
                    onClick={() => setExpandedSent(isExpanded ? null : `${idx}`)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[9px]">{tmpl?.label || email.templateKey}</Badge>
                      <span className="text-[11px] text-foreground font-medium truncate max-w-[300px]">{email.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{new Date(email.sentAt).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground">→ {email.to}</span>
                      {email.body ? (
                        isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      ) : null}
                    </div>
                  </button>
                  {isExpanded && email.body && (
                    <div className="border-t border-border p-4">
                      <div
                        dangerouslySetInnerHTML={{ __html: email.body }}
                        className="max-h-[500px] overflow-y-auto"
                        style={{
                          fontFamily: 'Arial, Helvetica, sans-serif',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#333',
                          background: '#fff',
                          padding: '16px',
                          borderRadius: '8px',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!draft && sentEmails.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-1">No emails sent yet</h3>
          <p className="text-sm text-muted-foreground">Select a template above to draft a personalised email using the client's data and transcripts.</p>
        </div>
      )}
    </div>
  );
};

export default CommsPanel;
