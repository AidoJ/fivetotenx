import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { motion } from 'framer-motion';
import {
  Mail, DollarSign, ChevronDown, Send, FileText, ExternalLink, Copy, Check,
  Clock, AlertCircle, Eye, Plus, Phone, Building2, Calendar, Upload, Mic, Loader2, RefreshCw,
  Trash2, FolderOpen, MessageSquare, Mic2, CalendarDays, Shuffle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
              <div className={`w-2 h-2 rounded-full border-2 transition-all shrink-0 ${
                done ? 'bg-primary border-primary' :
                active ? 'bg-primary border-primary ring-2 ring-primary/30' :
                'bg-muted border-border'
              }`} />
              {active && (
                <span className="text-[7px] font-bold text-primary leading-none whitespace-nowrap">
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
  if (stage === 'discovery_call' && !isStraightTalkComplete)
    return null;
  if (stage === 'discovery_call' && isStraightTalkComplete)
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
  onSendSelfInterview: (lead: Assessment) => void;
  onMarkDiscoveryReady: (id: string, ready: boolean) => void;
  onUpdateDiscoveryAnswers: (id: string, answers: any) => void;
  onUpdateChecklist: (id: string, checklist: Record<string, boolean>) => void;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onUpdateZoomLink: (id: string, zoomLink: string) => Promise<void>;
  scopingResponse: any;
  renderInterviews?: (assessmentId: string) => React.ReactNode;
  renderChecklist?: (assessmentId: string) => React.ReactNode;
  renderAnswers?: (assessmentId: string) => React.ReactNode;
  stProgress?: { answered: number; total: number } | null;
  onOpenDetail: (id: string) => void;
  onDeleteProject: (id: string) => void;
}

const LeadCard = React.forwardRef<HTMLDivElement, LeadCardProps>(({
  lead, onMove, onSendDeepDive, onUpdateFollowUp, deepDive, notes, onAddNote,
  onPrepareProposal, onSendProposal, onUpdateProposalFollowUp, proposal,
  interviews, onAddInterview, onDeleteInterview, onSendReminder, onScheduleReminder,
  onSendDiscoveryInvite, onSendSelfInterview, onMarkDiscoveryReady, onUpdateDiscoveryAnswers,
  onUpdateChecklist, onToggleComplete, onUpdateZoomLink, scopingResponse, stProgress,
  onOpenDetail, onDeleteProject,
}, _ref) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [refinementStatus, setRefinementStatus] = useState<{ answered: number; total: number } | null>(null);

  const roi = lead.roi_results as any;
  const hasInterviews = interviews.filter(i => i.assessment_id === lead.id).length > 0;
  const isStraightTalkComplete = (lead as any).discovery_ready === true;
  const slaColor = getSlaColor(lead);

  // Check refinement question status
  React.useEffect(() => {
    const checkRefinement = async () => {
      const { data } = await supabase
        .from('refinement_questions' as any)
        .select('status, sent_to_client')
        .eq('assessment_id', lead.id)
        .eq('sent_to_client', true);
      if (data && (data as any[]).length > 0) {
        const answered = (data as any[]).filter((q: any) => q.status === 'answered').length;
        setRefinementStatus({ answered, total: (data as any[]).length });
      }
    };
    checkRefinement();
  }, [lead.id]);

  const nextAction = getNextAction(lead, deepDive, proposal, hasInterviews, isStraightTalkComplete);

  const handleNextAction = () => {
    if (!nextAction) return;
    switch (nextAction.action) {
      case 'qualify': onMove(lead.id, 'qualified'); break;
      case 'send_discovery': onSendDiscoveryInvite(lead); break;
      case 'move_discovery': onMove(lead.id, 'discovery_call' as PipelineStage); break;
      case 'move_proposal': onMove(lead.id, 'proposal'); break;
      case 'prepare_proposal': onPrepareProposal(lead); break;
      case 'send_proposal': onSendProposal(lead); break;
      case 'move_build': onMove(lead.id, 'build_refinement' as PipelineStage); break;
      case 'move_completed': onMove(lead.id, 'completed' as PipelineStage); break;
    }
  };

  // Audio status
  const leadInterviews = interviews.filter(i => i.assessment_id === lead.id);
  const withAudio = leadInterviews.filter(i => i.audio_file_url);
  const allTranscribed = withAudio.length > 0 && withAudio.every(i => i.transcript);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
    >
      {/* Header row */}
      <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full shrink-0 ${slaColor}`} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{lead.contact_name}</p>
          {lead.business_name && (
            <p className="text-[10px] text-muted-foreground truncate">{lead.business_name}</p>
          )}
        </div>
        {roi?.totalAnnualImpact && (
          <span className="text-[10px] font-bold text-primary shrink-0">
            {formatCurrency(roi.totalAnnualImpact)}
          </span>
        )}
      </div>

      {/* Stage tracker */}
      <div className="px-4 pb-1.5">
        <StageTracker currentStage={lead.pipeline_stage} />
      </div>

      {/* Progress chips */}
      <div className="px-4 pb-1.5 flex items-center gap-1 flex-wrap">
        {[
          { label: 'Qualified', done: lead.is_qualified },
          { label: 'Talked', done: isStraightTalkComplete },
          { label: 'Green Light', done: !!proposal },
          { label: 'Live', done: ['completed'].includes(lead.pipeline_stage) },
        ].map(c => (
          <span key={c.label} className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${c.done ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {c.done ? '✓ ' : ''}{c.label}
          </span>
        ))}
        {stProgress && stProgress.total > 0 && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium bg-secondary text-foreground ml-auto">
            📝 {stProgress.answered}/{stProgress.total}
          </span>
        )}
      </div>

      {/* Refinement status */}
      {refinementStatus && (
        <div className="px-4 pb-1.5">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium ${
            refinementStatus.answered === refinementStatus.total
              ? 'bg-emerald-500/10 text-emerald-600'
              : refinementStatus.answered > 0
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-muted text-muted-foreground'
          }`}>
            <MessageSquare className="w-2.5 h-2.5" />
            Refinement: {refinementStatus.answered}/{refinementStatus.total} answered
          </div>
        </div>
      )}

      {/* Audio status */}
      {withAudio.length > 0 && (
        <div className="px-4 pb-1.5">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium ${
            allTranscribed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
          }`}>
            {allTranscribed ? <Check className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
            {allTranscribed ? 'Transcribed ✓' : `${withAudio.length - leadInterviews.filter(i => i.transcript).length} pending`}
          </div>
        </div>
      )}

      {/* Next action */}
      {nextAction && (
        <div className="px-4 pb-2">
          {nextAction.action === 'waiting' ? (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary/50 rounded-lg px-2 py-1.5">
              <Clock className="w-3 h-3" /> {nextAction.label}
            </div>
          ) : (
            <Button size="sm" className="w-full h-7 text-[10px] gap-1.5" onClick={handleNextAction}>
              <nextAction.icon className="w-3 h-3" /> {nextAction.label}
            </Button>
          )}
        </div>
      )}

      {/* Manual stage selector — move backward or forward to ANY stage */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-1.5">
          <Shuffle className="w-3 h-3 text-muted-foreground shrink-0" />
          <Select
            value={lead.pipeline_stage}
            onValueChange={(v) => onMove(lead.id, v as PipelineStage)}
          >
            <SelectTrigger className="h-7 text-[10px] flex-1">
              <SelectValue placeholder="Move to stage…" />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STEPS.map(s => (
                <SelectItem key={s.key} value={s.key} className="text-[11px]">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Persistent manual invite buttons — always available regardless of stage */}
      <div className="px-3 pb-2 grid grid-cols-2 gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[9px] gap-1 px-1"
          onClick={() => onSendSelfInterview(lead)}
          title="Send Self-Interview + Calendly choice email"
        >
          <Mic2 className="w-3 h-3" /> ST Invite (Both)
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[9px] gap-1 px-1"
          onClick={() => onSendDiscoveryInvite(lead)}
          title="Send Calendly booking link only"
        >
          <CalendarDays className="w-3 h-3" /> Calendly Only
        </Button>
      </div>

      {/* Action buttons row */}
      <div className="px-3 pb-3 flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-[10px] gap-1"
          onClick={() => onOpenDetail(lead.id)}
        >
          <FolderOpen className="w-3 h-3" /> Open Details
        </Button>

        {/* Upload audio - only in discovery */}
        {lead.pipeline_stage === 'discovery_call' && (
          <>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.mp4"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                await onAddInterview(lead.id, 'Straight Talk Interview', '', file);
                setUploading(false);
                if (audioInputRef.current) audioInputRef.current.value = '';
                if (!isStraightTalkComplete) onMarkDiscoveryReady(lead.id, true);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => audioInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={() => onDeleteProject(lead.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
});
LeadCard.displayName = 'LeadCard';

export default LeadCard;
