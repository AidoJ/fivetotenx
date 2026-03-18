import { Tables } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, Phone, FileText, Send, Hammer, CheckCircle2,
  ArrowRight, TrendingDown, Users, Eye
} from 'lucide-react';

type Assessment = Tables<'roi_assessments'>;
type PipelineStage = Assessment['pipeline_stage'];

interface ClientInterview {
  id: string;
  assessment_id: string;
  call_completed: boolean;
  scheduled_at: string | null;
}

interface DeepDiveSubmission {
  id: string;
  assessment_id: string;
}

interface ProposalRecord {
  id: string;
  assessment_id: string;
  accepted: boolean | null;
  sent_at: string;
}

interface ScopingResponse {
  id: string;
  assessment_id: string;
  completed: boolean | null;
}

interface PipelineDashboardProps {
  leads: Assessment[];
  deepDives: DeepDiveSubmission[];
  interviews: ClientInterview[];
  proposals: ProposalRecord[];
  scopingResponses: ScopingResponse[];
  onStageClick?: (stage: PipelineStage) => void;
}

const getSlaStatus = (lead: Assessment): 'green' | 'amber' | 'red' => {
  const now = Date.now();
  const timestamps = [
    lead.created_at,
    lead.qualified_at,
    lead.invite_sent_at,
    lead.follow_up_scheduled_at,
    lead.proposal_sent_at,
    lead.proposal_follow_up_scheduled_at,
  ].filter(Boolean).map(t => new Date(t!).getTime());

  const lastAction = Math.max(...timestamps);
  const hoursSince = (now - lastAction) / (1000 * 60 * 60);

  if (hoursSince >= 48) return 'red';
  if (hoursSince >= 24) return 'amber';
  return 'green';
};

const slaColors = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

interface CardConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  metrics: { label: string; value: number; color?: string }[];
  leads: Assessment[];
  stages: PipelineStage[];
  nextAction?: string;
}

const PipelineDashboard = ({ leads, deepDives, interviews, proposals, scopingResponses, onStageClick }: PipelineDashboardProps) => {
  // Compute metrics
  const totalAssessments = leads.length;
  const qualifiedCount = leads.filter(l => l.is_qualified).length;

  const deepDiveSentCount = leads.filter(l => l.invite_sent).length;
  const deepDiveCompletedIds = new Set(deepDives.map(d => d.assessment_id));
  const deepDiveCompleteCount = deepDiveCompletedIds.size;

  const bookedInterviews = interviews.filter(i => i.scheduled_at);
  const completedInterviews = interviews.filter(i => i.call_completed);
  const discoveryBookedCount = new Set(bookedInterviews.map(i => i.assessment_id)).size;
  const discoveryCompletedCount = new Set(completedInterviews.map(i => i.assessment_id)).size;

  const scopingSentCount = leads.filter(l => (l as any).scoping_sent).length;
  const scopingCompleteCount = scopingResponses.filter(s => s.completed).length;

  const proposalGeneratedCount = proposals.length;
  const proposalSentCount = leads.filter(l => l.proposal_sent_at).length;
  const signedCount = leads.filter(l => l.pipeline_stage === 'signed' || l.pipeline_stage === ('build_refinement' as PipelineStage) || l.pipeline_stage === ('completed' as PipelineStage)).length;

  const buildApproved = leads.filter(l => l.pipeline_stage === 'signed').length;
  const buildInProgress = leads.filter(l => l.pipeline_stage === ('build_refinement' as PipelineStage)).length;
  const buildCompleted = leads.filter(l => l.pipeline_stage === ('completed' as PipelineStage)).length;

  const cards: CardConfig[] = [
    {
      id: 'assessment',
      label: 'Assessment',
      icon: ClipboardList,
      stages: ['assessment', 'qualified'],
      leads: leads.filter(l => l.pipeline_stage === 'assessment' || l.pipeline_stage === 'qualified'),
      metrics: [
        { label: 'Total', value: totalAssessments },
        { label: 'Qualified', value: qualifiedCount, color: 'text-green-500' },
      ],
      nextAction: 'Qualify & Send Deep Dive',
    },
    {
      id: 'deep_dive',
      label: 'Deep Dive',
      icon: Send,
      stages: ['deep_dive_sent', 'deep_dive_complete'],
      leads: leads.filter(l => l.pipeline_stage === 'deep_dive_sent' || l.pipeline_stage === 'deep_dive_complete'),
      metrics: [
        { label: 'Sent', value: deepDiveSentCount },
        { label: 'Completed', value: deepDiveCompleteCount, color: 'text-green-500' },
      ],
      nextAction: 'Schedule Discovery Call',
    },
    {
      id: 'discovery',
      label: 'Discovery',
      icon: Phone,
      stages: ['discovery_call' as PipelineStage],
      leads: leads.filter(l => l.pipeline_stage === ('discovery_call' as PipelineStage)),
      metrics: [
        { label: 'Booked', value: discoveryBookedCount },
        { label: 'Completed', value: discoveryCompletedCount, color: 'text-green-500' },
      ],
      nextAction: 'Send Scoping Questionnaire',
    },
    {
      id: 'scoping',
      label: 'Scoping',
      icon: Eye,
      stages: ['discovery_call' as PipelineStage, 'proposal'],
      leads: leads.filter(l => (l as any).scoping_sent && !scopingResponses.find(s => s.assessment_id === l.id && s.completed)),
      metrics: [
        { label: 'Links Sent', value: scopingSentCount },
        { label: 'Completed', value: scopingCompleteCount, color: 'text-green-500' },
      ],
      nextAction: 'Generate Proposal',
    },
    {
      id: 'proposal',
      label: 'Proposals',
      icon: FileText,
      stages: ['proposal'],
      leads: leads.filter(l => l.pipeline_stage === 'proposal'),
      metrics: [
        { label: 'Generated', value: proposalGeneratedCount },
        { label: 'Sent', value: proposalSentCount },
        { label: 'Signed', value: signedCount, color: 'text-green-500' },
      ],
      nextAction: 'Send & Follow Up',
    },
    {
      id: 'build',
      label: 'Build',
      icon: Hammer,
      stages: ['signed', 'build_refinement' as PipelineStage, 'completed' as PipelineStage],
      leads: leads.filter(l => l.pipeline_stage === 'signed' || l.pipeline_stage === ('build_refinement' as PipelineStage) || l.pipeline_stage === ('completed' as PipelineStage)),
      metrics: [
        { label: 'Approved', value: buildApproved },
        { label: 'In Progress', value: buildInProgress, color: 'text-blue-500' },
        { label: 'Completed', value: buildCompleted, color: 'text-green-500' },
      ],
    },
  ];

  // Funnel data
  const funnelSteps = [
    { label: 'Assessments', value: totalAssessments },
    { label: 'Qualified', value: qualifiedCount },
    { label: 'Deep Dives', value: deepDiveCompleteCount },
    { label: 'Discovery', value: discoveryCompletedCount },
    { label: 'Proposals', value: proposalSentCount },
    { label: 'Signed', value: signedCount },
  ];
  const maxFunnel = Math.max(...funnelSteps.map(s => s.value), 1);

  // SLA summary
  const activePipelineLeads = leads.filter(l => 
    !['signed', 'build_refinement', 'completed'].includes(l.pipeline_stage)
  );
  const slaGreen = activePipelineLeads.filter(l => getSlaStatus(l) === 'green').length;
  const slaAmber = activePipelineLeads.filter(l => getSlaStatus(l) === 'amber').length;
  const slaRed = activePipelineLeads.filter(l => getSlaStatus(l) === 'red').length;

  return (
    <div className="space-y-6">
      {/* Top summary: SLA + Total Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{leads.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Leads</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{signedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Won</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <p className="text-3xl font-bold text-foreground">{slaGreen}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">&lt;24h</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <p className="text-3xl font-bold text-foreground">{slaAmber}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">24-48h</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <p className="text-3xl font-bold text-foreground">{slaRed}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">&gt;48h</p>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-primary" /> Conversion Funnel
        </h3>
        <div className="space-y-2">
          {funnelSteps.map((step, i) => {
            const width = Math.max((step.value / maxFunnel) * 100, 4);
            const prevValue = i > 0 ? funnelSteps[i - 1].value : null;
            const convRate = prevValue && prevValue > 0 ? Math.round((step.value / prevValue) * 100) : null;
            return (
              <div key={step.label} className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-20 text-right shrink-0">{step.label}</span>
                <div className="flex-1 h-6 bg-secondary/50 rounded-md overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-md transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-[11px] font-bold text-foreground">
                    {step.value}
                  </span>
                </div>
                {convRate !== null && (
                  <span className={`text-[10px] font-medium w-10 shrink-0 ${convRate >= 50 ? 'text-green-500' : convRate >= 25 ? 'text-amber-500' : 'text-red-500'}`}>
                    {convRate}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6 Pipeline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const cardLeads = card.leads;
          const worstSla = cardLeads.some(l => getSlaStatus(l) === 'red') ? 'red' : cardLeads.some(l => getSlaStatus(l) === 'amber') ? 'amber' : 'green';
          const isTerminal = card.id === 'build';
          const borderColor = isTerminal ? 'border-green-500/30' : worstSla === 'red' ? 'border-red-500/30' : worstSla === 'amber' ? 'border-amber-500/30' : 'border-border';

          return (
            <div key={card.id} className="flex items-stretch gap-1">
              <div
                onClick={() => card.stages[0] && onStageClick?.(card.stages[0])}
                className={`flex-1 rounded-xl border-2 ${borderColor} bg-card p-4 space-y-3 cursor-pointer hover:scale-[1.02] transition-transform`}
              >
                {/* Card Header */}
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{card.label}</h3>
                </div>

                {/* Metrics */}
                <div className="space-y-1.5">
                  {card.metrics.map(m => (
                    <div key={m.label} className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{m.label}</span>
                      <span className={`text-lg font-bold ${m.color || 'text-foreground'}`}>{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Active leads in this card */}
                {cardLeads.length > 0 && (
                  <div className="border-t border-border pt-2 space-y-1 max-h-20 overflow-y-auto">
                    {cardLeads.slice(0, 4).map(lead => {
                      const sla = isTerminal ? 'green' : getSlaStatus(lead);
                      return (
                        <div key={lead.id} className="flex items-center gap-1.5 text-[10px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${slaColors[sla]} shrink-0`} />
                          <span className="text-foreground truncate">{lead.contact_name}</span>
                          {lead.business_name && (
                            <span className="text-muted-foreground truncate">· {lead.business_name}</span>
                          )}
                        </div>
                      );
                    })}
                    {cardLeads.length > 4 && (
                      <p className="text-[9px] text-muted-foreground italic">+{cardLeads.length - 4} more</p>
                    )}
                  </div>
                )}

                {/* Next action hint */}
                {card.nextAction && (
                  <div className="pt-1">
                    <span className="text-[9px] text-primary/70 font-medium flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> {card.nextAction}
                    </span>
                  </div>
                )}
              </div>

              {/* Arrow between cards (desktop only) */}
              {index < cards.length - 1 && (
                <div className="hidden xl:flex items-center text-muted-foreground/40">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Action within 24h</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> No action 24-48h</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> No action 48h+</span>
      </div>
    </div>
  );
};

export default PipelineDashboard;
