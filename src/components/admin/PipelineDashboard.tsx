import { Tables } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { 
  Radar, MessageCircle, Puzzle, FileText, Rocket,
  ArrowRight, TrendingDown, Users, Zap
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

// Phase accent colors (cool → warm progression) — now 5 phases
const phaseAccents = [
  { bg: 'from-blue-500/10 to-indigo-500/10', border: 'border-blue-500/30', text: 'text-blue-600', icon: 'bg-blue-500/15 text-blue-600' },
  { bg: 'from-violet-500/10 to-purple-500/10', border: 'border-violet-500/30', text: 'text-violet-600', icon: 'bg-violet-500/15 text-violet-600' },
  { bg: 'from-pink-500/10 to-rose-500/10', border: 'border-pink-500/30', text: 'text-pink-600', icon: 'bg-pink-500/15 text-pink-600' },
  { bg: 'from-orange-500/10 to-amber-500/10', border: 'border-orange-500/30', text: 'text-orange-600', icon: 'bg-orange-500/15 text-orange-600' },
  { bg: 'from-emerald-500/10 to-green-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600', icon: 'bg-emerald-500/15 text-emerald-600' },
];

interface CardConfig {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  metrics: { label: string; value: number; color?: string }[];
  leads: Assessment[];
  stages: PipelineStage[];
  nextAction?: string;
  question: string;
}

const PipelineDashboard = ({ leads, deepDives, interviews, proposals, scopingResponses, onStageClick }: PipelineDashboardProps) => {
  const totalAssessments = leads.length;
  const qualifiedCount = leads.filter(l => l.is_qualified).length;

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
      id: 'reality_check',
      label: 'Reality Check™',
      subtitle: 'Phase 1 — Assess',
      icon: Radar,
      stages: ['assessment', 'qualified'],
      leads: leads.filter(l => l.pipeline_stage === 'assessment' || l.pipeline_stage === 'qualified'),
      metrics: [
        { label: 'Signals', value: totalAssessments },
        { label: 'Qualified', value: qualifiedCount, color: 'text-green-500' },
      ],
      nextAction: 'Schedule Straight Talk',
      question: 'What\'s actually going on?',
    },
    {
      id: 'straight_talk',
      label: 'Straight Talk™',
      subtitle: 'Phase 2 — Discuss',
      icon: MessageCircle,
      stages: ['discovery_call' as PipelineStage],
      leads: leads.filter(l => l.pipeline_stage === ('discovery_call' as PipelineStage)),
      metrics: [
        { label: 'Booked', value: discoveryBookedCount },
        { label: 'Agreed', value: discoveryCompletedCount, color: 'text-green-500' },
      ],
      nextAction: 'Send Game Plan',
      question: 'What\'s worth fixing first?',
    },
    {
      id: 'game_plan',
      label: 'Game Plan™',
      subtitle: 'Phase 3 — Plan',
      icon: Puzzle,
      stages: ['discovery_call' as PipelineStage, 'proposal'],
      leads: leads.filter(l => (l as any).scoping_sent && !scopingResponses.find(s => s.assessment_id === l.id && s.completed)),
      metrics: [
        { label: 'Sent', value: scopingSentCount },
        { label: 'Completed', value: scopingCompleteCount, color: 'text-green-500' },
      ],
      nextAction: 'Prepare Green Light',
      question: 'How will this work in your business?',
    },
    {
      id: 'green_light',
      label: 'Green Light™',
      subtitle: 'Phase 4 — Sign Off',
      icon: FileText,
      stages: ['proposal'],
      leads: leads.filter(l => l.pipeline_stage === 'proposal'),
      metrics: [
        { label: 'Generated', value: proposalGeneratedCount },
        { label: 'Sent', value: proposalSentCount },
        { label: 'Signed', value: signedCount, color: 'text-green-500' },
      ],
      nextAction: 'Send & Follow Up',
      question: 'Clear scope. Clear cost. Clear outcome.',
    },
    {
      id: 'build_launch',
      label: 'Build & Launch™',
      subtitle: 'Phase 5 — Build',
      icon: Rocket,
      stages: ['signed', 'build_refinement' as PipelineStage, 'completed' as PipelineStage],
      leads: leads.filter(l => l.pipeline_stage === 'signed' || l.pipeline_stage === ('build_refinement' as PipelineStage) || l.pipeline_stage === ('completed' as PipelineStage)),
      metrics: [
        { label: 'Approved', value: buildApproved },
        { label: 'Building', value: buildInProgress, color: 'text-blue-500' },
        { label: 'Gone Live', value: buildCompleted, color: 'text-green-500' },
      ],
      question: 'Less admin. More time. Smoother operations.',
    },
  ];

  // Funnel data — streamlined 8-step funnel
  const funnelSteps = [
    { label: 'Reality Checked', value: totalAssessments },
    { label: 'Qualified', value: qualifiedCount },
    { label: 'Talk Booked', value: discoveryBookedCount },
    { label: 'Agreed', value: discoveryCompletedCount },
    { label: 'Game Plan Sent', value: scopingSentCount },
    { label: 'Game Plan Done', value: scopingCompleteCount },
    { label: 'Green Light Sent', value: proposalSentCount },
    { label: 'Signed Off', value: signedCount },
    { label: 'Gone Live ✅', value: buildCompleted },
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
      {/* Clarity Path Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground font-display">The 5to10x Clarity Path™</h2>
          <p className="text-[11px] text-muted-foreground">Assess → Discuss → Plan → Sign Off → Build</p>
        </div>
      </div>

      {/* Top summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{leads.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Signals</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{signedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Activated</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <p className="text-3xl font-bold text-foreground">{slaGreen}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">On Track</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <p className="text-3xl font-bold text-foreground">{slaAmber}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Needs Attention</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <p className="text-3xl font-bold text-foreground">{slaRed}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">At Risk</p>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-primary" /> Clarity Path™ Funnel
        </h3>
        <div className="space-y-2">
          {funnelSteps.map((step, i) => {
            const width = Math.max((step.value / maxFunnel) * 100, 4);
            const prevValue = i > 0 ? funnelSteps[i - 1].value : null;
            const convRate = prevValue && prevValue > 0 ? Math.round((step.value / prevValue) * 100) : null;
            return (
              <div key={step.label} className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-28 text-right shrink-0">{step.label}</span>
                <div className="flex-1 h-6 bg-secondary/50 rounded-md overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-md"
                    style={{
                      width: `${width}%`,
                      animation: `funnel-fill 0.8s ease-out ${i * 0.08}s both`,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-[11px] font-bold text-white drop-shadow-sm"
                    style={{ animation: `fade-in 0.4s ease-out ${0.4 + i * 0.08}s both` }}
                  >
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

      {/* 5 Phase Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const cardLeads = card.leads;
          const accent = phaseAccents[index];
          const isTerminal = card.id === 'build_activate';
          const worstSla = cardLeads.some(l => getSlaStatus(l) === 'red') ? 'red' : cardLeads.some(l => getSlaStatus(l) === 'amber') ? 'amber' : 'green';

          return (
            <div key={card.id} className="flex items-stretch gap-1"
              style={{ animation: `scale-in 0.4s ease-out ${index * 0.08}s both` }}
            >
              <div
                onClick={() => card.stages[0] && onStageClick?.(card.stages[0])}
                className={`flex-1 rounded-xl border-2 ${isTerminal ? accent.border : worstSla === 'red' ? 'border-red-500/30' : worstSla === 'amber' ? 'border-amber-500/30' : accent.border} bg-gradient-to-br ${accent.bg} p-4 space-y-3 cursor-pointer hover:scale-[1.02] transition-all hover:shadow-lg`}
              >
                {/* Phase Header */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent.icon}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">{card.subtitle}</p>
                      <h3 className="text-sm font-bold text-foreground leading-tight truncate">{card.label}</h3>
                    </div>
                  </div>
                  <p className="text-[10px] italic text-muted-foreground">"{card.question}"</p>
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

                {/* Active leads */}
                {cardLeads.length > 0 && (
                  <div className="border-t border-border/50 pt-2 space-y-1 max-h-20 overflow-y-auto">
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

                {/* Next action */}
                {card.nextAction && (
                  <div className="pt-1">
                    <span className={`text-[9px] ${accent.text} font-medium flex items-center gap-1`}>
                      <ArrowRight className="w-3 h-3" /> {card.nextAction}
                    </span>
                  </div>
                )}
              </div>

              {/* Arrow between cards */}
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
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> On Track</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Needs Attention (24-48h)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> At Risk (48h+)</span>
      </div>
    </div>
  );
};

export default PipelineDashboard;
