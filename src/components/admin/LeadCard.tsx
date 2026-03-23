import { useState } from 'react';
import { Tables } from '@/integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mail, DollarSign, ChevronDown, Send, FileText, ExternalLink, Copy, Check,
  Clock, AlertCircle, Pencil, Eye, ClipboardList, ClipboardCheck, Plus,
  MessageSquare, Phone, Building2, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type Assessment = Tables<'roi_assessments'>;
type PipelineStage = Assessment['pipeline_stage'];

const PIPELINE_STEPS: { key: string; label: string; short: string }[] = [
  { key: 'assessment', label: 'Reality Check™', short: 'CHECK' },
  { key: 'qualified', label: 'Qualified', short: 'QUAL' },
  { key: 'discovery_call', label: 'Straight Talk™', short: 'TALK' },
  { key: 'proposal', label: 'Green Light™', short: 'GREEN' },
  { key: 'signed', label: 'Signed', short: 'SIGNED' },
  { key: 'build_refinement', label: 'Build™', short: 'BUILD' },
  { key: 'completed', label: 'Go Live™', short: 'LIVE' },
];

const stageIdx = (stage: string) => PIPELINE_STEPS.findIndex(s => s.key === stage);

const CALENDLY_URL = 'https://calendly.com/aidan-rejuvenators/discovery';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ── SLA helper ── */
const getSlaColor = (lead: Assessment) => {
  const now = Date.now();
  const timestamps = [
    lead.created_at, lead.qualified_at, lead.invite_sent_at,
    lead.follow_up_scheduled_at, lead.proposal_sent_at,
  ].filter(Boolean).map(t => new Date(t!).getTime());
  const last = Math.max(...timestamps);
  const hours = (now - last) / 3_600_000;
  if (hours >= 48) return 'bg-red-500';
  if (hours >= 24) return 'bg-amber-500';
  return 'bg-green-500';
};

/* ── Stage Tracker Dots ── */
const StageTracker = ({ currentStage }: { currentStage: string }) => {
  const current = stageIdx(currentStage);
  return (
    <div className="flex items-center gap-0.5 w-full">
      {PIPELINE_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-0.5 w-full">
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 transition-all shrink-0 ${
                  done ? 'bg-primary border-primary' :
                  active ? 'bg-primary border-primary ring-2 ring-primary/30' :
                  'bg-muted border-border'
                }`}
              />
              {active && (
                <span className="text-[8px] font-bold text-primary leading-none whitespace-nowrap">
                  {step.short}
                </span>
              )}
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 min-w-1 ${i < current ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── Next Action CTA ── */
const getNextAction = (
  lead: Assessment,
  deepDive: any,
  proposal: any,
  scopingResponse: any,
  hasInterviews: boolean,
  isStraightTalkComplete: boolean,
) => {
  const stage = lead.pipeline_stage;
  if (stage === 'assessment' && !lead.is_qualified)
    return { label: 'Qualify Signal', icon: Check, action: 'qualify' };
  if (stage === 'qualified' && !hasInterviews)
    return { label: 'Send Straight Talk Invite', icon: Send, action: 'send_discovery' };
  if (stage === 'qualified' && hasInterviews)
    return { label: 'Move to Straight Talk', icon: Check, action: 'move_discovery' };
  // discovery_call = Straight Talk stage: CTA is Send Game Plan Link once complete
  if (stage === 'discovery_call' && !isStraightTalkComplete)
    return { label: 'Send Game Plan Link', icon: Send, action: 'send_scoping' };
  if (stage === 'discovery_call' && isStraightTalkComplete && !scopingResponse)
    return { label: 'Send Game Plan Link', icon: Send, action: 'send_scoping' };
  if (stage === 'discovery_call' && isStraightTalkComplete && scopingResponse)
    return { label: 'Move to Green Light', icon: FileText, action: 'move_proposal' };
  if (stage === 'proposal' && !proposal)
    return { label: 'Prepare Green Light Doc', icon: FileText, action: 'prepare_proposal' };
  if (stage === 'proposal' && proposal && !lead.proposal_sent_at)
    return { label: 'Send Green Light Doc', icon: Send, action: 'send_proposal' };
  if (stage === 'proposal' && lead.proposal_sent_at)
    return { label: 'Awaiting Signature', icon: Clock, action: 'waiting' };
  if (stage === 'signed')
    return { label: 'Start Build', icon: Check, action: 'move_build' };
  if (stage === 'build_refinement')
    return { label: 'Mark Go Live', icon: Check, action: 'move_completed' };
  return null;
};

/* ── Completion Chips ── */
const CompletionChips = ({
  lead, deepDive, hasInterviews, isStraightTalkComplete, scopingResponse, proposal,
}: {
  lead: Assessment; deepDive: any; hasInterviews: boolean; isStraightTalkComplete: boolean; scopingResponse: any; proposal: any;
}) => {
  const chips: { label: string; done: boolean }[] = [
    { label: 'Qualified', done: lead.is_qualified },
    { label: 'Talked', done: isDiscoveryReady },
    { label: 'Game Plan', done: !!scopingResponse?.completed },
    { label: 'Green Light', done: !!proposal },
    { label: 'Gone Live', done: ['completed'].includes(lead.pipeline_stage) },
  ];
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {chips.map(c => (
        <span
          key={c.label}
          className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
            c.done ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}
        >
          {c.done ? '✓ ' : ''}{c.label}
        </span>
      ))}
    </div>
  );
};

/* ── Collapsible Section Wrapper ── */
const Section = ({ label, icon: Icon, children, defaultOpen = false, badge }: {
  label: string; icon: any; children: React.ReactNode; defaultOpen?: boolean; badge?: string;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-md hover:bg-secondary/50 transition-colors">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-foreground flex-1">{label}</span>
        {badge && <Badge variant="outline" className="text-[8px] h-4">{badge}</Badge>}
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 pr-2 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ═══════ MAIN LEAD CARD ═══════ */

export interface LeadCardProps {
  lead: Assessment;
  onMove: (id: string, stage: PipelineStage) => void;
  onSendDeepDive: (lead: Assessment) => void;
  onUpdateFollowUp: (id: string, days: number) => void;
  deepDive: any;
  notes: any[];
  onAddNote: (assessmentId: string, content: string, noteType: string) => Promise<void>;
  onPrepareProposal: (lead: Assessment) => void;
  onSendProposal: (lead: Assessment) => void;
  onUpdateProposalFollowUp: (id: string, days: number) => void;
  proposal: any;
  interviews: any[];
  onAddInterview: (assessmentId: string, title: string, content: string, audioFile?: File) => Promise<void>;
  onDeleteInterview: (id: string) => Promise<void>;
  onSendReminder: (lead: Assessment) => void;
  onScheduleReminder: (id: string, days: number | null, scheduledAt: string | null) => void;
  onSendDiscoveryInvite: (lead: Assessment) => void;
  onMarkDiscoveryReady: (id: string, ready: boolean) => void;
  onUpdateDiscoveryAnswers: (id: string, answers: any) => void;
  onUpdateChecklist: (id: string, checklist: Record<string, boolean>) => void;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onUpdateZoomLink: (id: string, zoomLink: string) => Promise<void>;
  scopingResponse: any;
  // Render props for heavy sub-components to avoid circular deps
  renderInterviews?: (assessmentId: string) => React.ReactNode;
  renderChecklist?: (assessmentId: string) => React.ReactNode;
  renderAnswers?: (assessmentId: string) => React.ReactNode;
}

const LeadCard = ({
  lead, onMove, onSendDeepDive, onUpdateFollowUp, deepDive, notes, onAddNote,
  onPrepareProposal, onSendProposal, onUpdateProposalFollowUp, proposal,
  interviews, onAddInterview, onDeleteInterview, onSendReminder, onScheduleReminder,
  onSendDiscoveryInvite, onMarkDiscoveryReady, onUpdateDiscoveryAnswers,
  onUpdateChecklist, onToggleComplete, onUpdateZoomLink, scopingResponse,
}: LeadCardProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedScoping, setCopiedScoping] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('comment');
  const [addingNote, setAddingNote] = useState(false);

  const roi = lead.roi_results as any;
  const hasInterviews = interviews.filter(i => i.assessment_id === lead.id).length > 0;
  const isDiscoveryReady = (lead as any).discovery_ready === true;
  const deepDiveUrl = `${window.location.origin}/deep-dive?id=${lead.id}`;
  const scopingUrl = `${window.location.origin}/scoping?id=${lead.id}`;
  const straightTalkUrl = `${window.location.origin}/straight-talk?id=${lead.id}`;
  const slaColor = getSlaColor(lead);

  const nextAction = getNextAction(lead, deepDive, proposal, scopingResponse, hasInterviews, isDiscoveryReady);

  const handleCopyScoping = async () => {
    await navigator.clipboard.writeText(scopingUrl);
    setCopiedScoping(true);
    setTimeout(() => setCopiedScoping(false), 2000);
  };

  const handleNextAction = () => {
    if (!nextAction) return;
    switch (nextAction.action) {
      case 'qualify': onMove(lead.id, 'qualified'); break;
      case 'send_deep_dive': onSendDeepDive(lead); break;
      case 'send_discovery': onSendDiscoveryInvite(lead); break;
      case 'move_discovery': onMove(lead.id, 'discovery_call' as PipelineStage); break;
      case 'mark_discovery': onMarkDiscoveryReady(lead.id, true); break;
      case 'copy_scoping': handleCopyScoping(); break;
      case 'move_proposal': onMove(lead.id, 'proposal'); break;
      case 'prepare_proposal': onPrepareProposal(lead); break;
      case 'send_proposal': onSendProposal(lead); break;
      case 'move_build': onMove(lead.id, 'build_refinement' as PipelineStage); break;
      case 'move_completed': onMove(lead.id, 'completed' as PipelineStage); break;
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    await onAddNote(lead.id, newNote, noteType);
    setNewNote('');
    setAddingNote(false);
  };

  const STAGES_FOR_MOVE: { key: PipelineStage; label: string }[] = [
    { key: 'assessment', label: 'Reality Check' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'discovery_call' as PipelineStage, label: 'Straight Talk' },
    { key: 'proposal', label: 'Green Light' },
    { key: 'signed', label: 'Signed' },
    { key: 'build_refinement' as PipelineStage, label: 'Build' },
    { key: 'completed' as PipelineStage, label: 'Go Live' },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
    >
      {/* ── ROW 1: Header ── */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${slaColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="font-bold text-sm text-primary truncate cursor-pointer hover:underline"
              onClick={() => navigate(`/admin/client/${lead.id}`)}
            >
              {lead.contact_name}
            </p>
            {lead.business_name && (
              <span className="text-xs text-muted-foreground truncate">· {lead.business_name}</span>
            )}
          </div>
        </div>
        {roi?.totalAnnualImpact && (
          <span className="text-xs font-bold text-primary shrink-0">
            {formatCurrency(roi.totalAnnualImpact)}
          </span>
        )}
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground shrink-0">
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* ── ROW 2: Stage Tracker ── */}
      <div className="px-4 pb-2">
        <StageTracker currentStage={lead.pipeline_stage} />
      </div>

      {/* ── ROW 3: Completion Chips ── */}
      <div className="px-4 pb-2">
        <CompletionChips
          lead={lead}
          deepDive={deepDive}
          hasInterviews={hasInterviews}
          isDiscoveryReady={isDiscoveryReady}
          scopingResponse={scopingResponse}
          proposal={proposal}
        />
      </div>

      {/* ── ROW 4: Next Action CTA ── */}
      {nextAction && (
        <div className="px-4 pb-3">
           {nextAction.action === 'waiting' ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
              <Clock className="w-3.5 h-3.5" />
              <span>{nextAction.label}</span>
              {lead.pipeline_stage === 'proposal' && lead.proposal_follow_up_sent && (
                <Badge variant="outline" className="text-[8px] h-4 bg-green-500/10 text-green-700 border-green-500/20 ml-auto">Follow-up Sent ✓</Badge>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full h-8 text-xs gap-2"
              onClick={handleNextAction}
            >
              <nextAction.icon className="w-3.5 h-3.5" />
              {nextAction.label}
            </Button>
          )}
        </div>
      )}

      {/* ── EXPANDED SECTIONS ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border"
          >
            <div className="px-3 py-2 space-y-0.5">
              {/* Contact Details */}
              <Section label="Contact Details" icon={Mail}>
                <div className="space-y-1.5 text-xs text-muted-foreground py-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    <a href={`mailto:${lead.contact_email}`} className="hover:text-primary">{lead.contact_email}</a>
                  </div>
                  {lead.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" /> {lead.contact_phone}
                    </div>
                  )}
                  {lead.industry && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3 h-3" /> {lead.industry}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> {formatDate(lead.created_at)}
                  </div>
                  {roi?.pricing && (
                    <div className="mt-2 bg-secondary rounded-md p-2 space-y-0.5">
                      <p><strong>Build:</strong> {formatCurrency(roi.pricing.buildCostLow)} – {formatCurrency(roi.pricing.buildCostHigh)}</p>
                      <p><strong>Tier:</strong> {roi.pricing.tierLabel} · <strong>ROI:</strong> {Math.round(roi.roiPercentage)}% · <strong>Break-even:</strong> {Math.round(roi.breakEvenMonths)}mo</p>
                    </div>
                  )}
                </div>
              </Section>

              {/* Stage Actions */}
              <Section label="Actions & Tools" icon={ClipboardList} defaultOpen>
                <div className="space-y-2 py-1">
                  {/* Discovery tools */}

                  {/* Straight Talk tools */}
                  {['qualified', 'discovery_call'].includes(lead.pipeline_stage) && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
                        onClick={() => window.open(CALENDLY_URL, '_blank')}>
                        <ExternalLink className="w-3 h-3" /> Calendly
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
                        onClick={() => onSendDiscoveryInvite(lead)}>
                        <Send className="w-3 h-3" /> Send Booking Link
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
                        onClick={() => {
                          navigator.clipboard.writeText(straightTalkUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}>
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Straight Talk Link'}
                      </Button>
                    </div>
                  )}

                  {/* Game Plan tools */}
                  {['discovery_call', 'proposal'].includes(lead.pipeline_stage) && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
                        onClick={handleCopyScoping}>
                        {copiedScoping ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedScoping ? 'Copied!' : 'Game Plan Link'}
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
                        onClick={() => window.open(scopingUrl, '_blank')}>
                        <ExternalLink className="w-3 h-3" /> Open Game Plan
                      </Button>
                    </div>
                  )}

                  {/* Green Light tools */}
                  {lead.pipeline_stage === 'proposal' && proposal && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
                        onClick={() => window.open(`${window.location.origin}/proposal/${proposal.id}?admin=1`, '_blank')}>
                        <Pencil className="w-3 h-3" /> Edit Green Light Doc
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
                        onClick={() => onSendProposal(lead)}>
                        <Send className="w-3 h-3" /> {lead.proposal_sent_at ? 'Resend' : 'Send'}
                      </Button>
                    </div>
                  )}

                  {/* Signed — view doc */}
                  {lead.pipeline_stage === 'signed' && proposal && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
                      onClick={() => window.open(`${window.location.origin}/proposal/${proposal.id}`, '_blank')}>
                      <Eye className="w-3 h-3" /> View Green Light Doc
                    </Button>
                  )}

                  {/* Build stage */}
                  {lead.pipeline_stage === ('build_refinement' as PipelineStage) && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
                        onClick={() => window.open(CALENDLY_URL, '_blank')}>
                        <ExternalLink className="w-3 h-3" /> Schedule Build Call
                      </Button>
                    </div>
                  )}

                  {/* Follow-up timers */}
                  {lead.pipeline_stage === 'proposal' && (
                    <div className="flex items-center gap-2 bg-secondary/50 rounded-md px-2 py-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Proposal follow up</span>
                      <Input type="number" min={1} max={30} defaultValue={lead.proposal_follow_up_days || 3}
                        className="h-6 w-14 text-[10px] text-center"
                        onBlur={(e) => onUpdateProposalFollowUp(lead.id, parseInt(e.target.value) || 3)} />
                      <span className="text-[10px] text-muted-foreground">days</span>
                    </div>
                  )}

                  {/* Stage reminder */}
                  {['qualified', 'discovery_call', 'proposal'].includes(lead.pipeline_stage) && (
                    <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 rounded-md px-2 py-1.5">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="text-[10px] text-amber-700">Reminder</span>
                      <Input type="number" min={1} max={720}
                        defaultValue={(lead as any).stage_reminder_days || 72}
                        className="h-6 w-14 text-[10px] text-center"
                        onBlur={(e) => onScheduleReminder(lead.id, parseInt(e.target.value) || 72, null)} />
                      <span className="text-[10px] text-muted-foreground">hrs</span>
                      {(lead as any).stage_reminder_sent && (
                        <Badge variant="outline" className="text-[8px] h-4 bg-green-500/10 text-green-700 border-green-500/20">Sent ✓</Badge>
                      )}
                      <Button size="sm" variant="ghost" className="h-5 text-[9px] px-1.5 text-amber-700 ml-auto"
                        onClick={() => onSendReminder(lead)}>
                        <Send className="w-3 h-3" /> Now
                      </Button>
                    </div>
                  )}

                  {/* Move to stage */}
                  <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-border">
                    <span className="text-[10px] text-muted-foreground mr-1">Move:</span>
                    {STAGES_FOR_MOVE.filter(s => s.key !== lead.pipeline_stage).map(s => (
                      <button key={s.key} onClick={() => onMove(lead.id, s.key)}
                        className="text-[9px] px-1.5 py-0.5 rounded-full border border-border hover:bg-secondary transition-colors">
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Section>

              {/* Bookings / Interviews */}
              {interviews.filter(i => i.assessment_id === lead.id).length > 0 && (
                <Section label="Bookings" icon={Calendar} badge={`${interviews.filter(i => i.assessment_id === lead.id).length}`} defaultOpen>
                  <div className="space-y-2 py-1">
                    {interviews.filter(i => i.assessment_id === lead.id).map((iv: any) => (
                      <div key={iv.id} className="bg-secondary/50 rounded-md p-2 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{iv.title}</span>
                          <Badge variant={iv.call_completed ? 'default' : 'outline'} className="text-[8px] h-4">
                            {iv.call_completed ? '✓ Completed' : 'Upcoming'}
                          </Badge>
                        </div>
                        {iv.scheduled_at && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(iv.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                        {iv.zoom_link && (
                          <div className="flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            <a href={iv.zoom_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                              Join Zoom
                            </a>
                          </div>
                        )}
                        {iv.content && (
                          <p className="text-muted-foreground">{iv.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Notes */}
              <Section label="Notes" icon={MessageSquare} badge={notes.length > 0 ? `${notes.length}` : undefined}>
                <div className="space-y-2 py-1">
                  {notes.slice(0, 5).map(n => (
                    <div key={n.id} className="flex items-start gap-2 text-[11px]">
                      <span className="shrink-0">
                        {n.note_type === 'question' ? '❓' : n.note_type === 'action' ? '⚡' : '💬'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground">{n.content}</p>
                        <p className="text-[9px] text-muted-foreground">{formatDate(n.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-1">
                    <select value={noteType} onChange={e => setNoteType(e.target.value)}
                      className="h-7 text-[10px] rounded-md border border-border bg-secondary px-1.5">
                      <option value="comment">💬</option>
                      <option value="question">❓</option>
                      <option value="action">⚡</option>
                    </select>
                    <Input value={newNote} onChange={e => setNewNote(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                      placeholder="Add note..." className="h-7 text-[10px] flex-1" />
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={handleAddNote}
                      disabled={addingNote || !newNote.trim()}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LeadCard;
