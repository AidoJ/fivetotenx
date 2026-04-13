import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Send, Loader2, FileText, Sparkles, ChevronDown, ChevronUp,
  Mail, CheckCircle2, Edit3, RefreshCw, Clock, Handshake, Target, Rocket,
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
}

const CommsPanel: React.FC<CommsPanelProps> = ({ assessmentId, lead }) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftEmail | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [confirmSend, setConfirmSend] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [expandedSent, setExpandedSent] = useState<string | null>(null);

  // Load sent email history from lead_notes with note_type = 'email_sent'
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('note_type', 'email_sent')
        .order('created_at', { ascending: false });
      if (data) {
        setSentEmails(data.map((n: any) => {
          try {
            return JSON.parse(n.content);
          } catch {
            return { templateKey: 'unknown', subject: n.content, sentAt: n.created_at, to: lead?.contact_email };
          }
        }));
      }
    };
    load();
  }, [assessmentId]);

  const generateDraft = async (templateKey: string) => {
    setGenerating(true);
    setSelectedTemplate(templateKey);
    setConfirmSend(false);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-opportunities', {
        body: { assessmentId, mode: 'email_draft', templateKey },
      });
      if (error) throw error;
      if (!data?.email) throw new Error('No email content returned');
      setDraft({
        subject: data.email.subject,
        body: data.email.body,
        templateKey,
      });
    } catch (err: any) {
      toast({ title: 'Failed to generate draft', description: err.message, variant: 'destructive' });
    }
    setGenerating(false);
  };

  const sendEmail = async () => {
    if (!draft || !lead) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-report', {
        body: {
          to: lead.contact_email,
          subject: draft.subject,
          html: draft.body,
          fromName: 'Aidan Leonard',
        },
      });
      if (error) throw error;

      // Record in lead_notes
      await supabase.from('lead_notes').insert({
        assessment_id: assessmentId,
        note_type: 'email_sent',
        content: JSON.stringify({
          templateKey: draft.templateKey,
          subject: draft.subject,
          sentAt: new Date().toISOString(),
          to: lead.contact_email,
        }),
      });

      const sent: SentEmail = {
        templateKey: draft.templateKey,
        subject: draft.subject,
        sentAt: new Date().toISOString(),
        to: lead.contact_email,
      };
      setSentEmails(prev => [sent, ...prev]);
      setDraft(null);
      setSelectedTemplate(null);
      toast({ title: 'Email sent ✅', description: `Sent to ${lead.contact_email}` });
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    }
    setSending(false);
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
          Select a template to auto-generate a personalised email from the client's data, transcripts, and analysis. You can edit before sending.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EMAIL_TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const wasSent = sentEmails.some(s => s.templateKey === tmpl.id);
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
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground">{tmpl.label}</p>
                      {wasSent && (
                        <Badge variant="outline" className="text-[9px] text-green-600 border-green-300 gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Sent
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
                onClick={() => selectedTemplate && generateDraft(selectedTemplate)}
                disabled={generating}
              >
                <RefreshCw className="w-3 h-3" /> Regenerate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-[10px]"
                onClick={() => { setDraft(null); setSelectedTemplate(null); }}
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
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Subject</Label>
              <Input
                value={draft.subject}
                onChange={e => setDraft({ ...draft, subject: e.target.value })}
                className="h-8 text-xs bg-secondary border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Body (HTML)</Label>
              <Textarea
                value={draft.body}
                onChange={e => setDraft({ ...draft, body: e.target.value })}
                rows={16}
                className="text-xs bg-secondary border-border resize-y font-mono"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
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
                Emails are never sent automatically — you must review, edit, and confirm before sending.
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
              return (
                <div key={idx} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[9px]">{tmpl?.label || email.templateKey}</Badge>
                      <span className="text-[11px] text-foreground font-medium truncate max-w-[300px]">{email.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{new Date(email.sentAt).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground">→ {email.to}</span>
                    </div>
                  </div>
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
