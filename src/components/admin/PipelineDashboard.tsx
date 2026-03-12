import { Tables } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Users, AlertCircle } from 'lucide-react';

type Assessment = Tables<'roi_assessments'>;
type PipelineStage = Assessment['pipeline_stage'];

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'assessment', label: 'Assessment' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'deep_dive_sent', label: 'Deep Dive Sent' },
  { key: 'deep_dive_complete', label: 'Deep Dive Done' },
  { key: 'discovery_call' as PipelineStage, label: 'Discovery Call' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'signed', label: 'Signed ✅' },
  { key: 'build_refinement' as PipelineStage, label: 'Build Refinement' },
];

const getSlaStatus = (lead: Assessment): 'green' | 'amber' | 'red' => {
  const now = Date.now();
  // Use the most recent timestamp as "last action"
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

const slaBgColors = {
  green: 'border-green-500/30 bg-green-500/5',
  amber: 'border-amber-500/30 bg-amber-500/5',
  red: 'border-red-500/30 bg-red-500/5',
};

interface PipelineDashboardProps {
  leads: Assessment[];
  onStageClick?: (stage: PipelineStage) => void;
}

const PipelineDashboard = ({ leads, onStageClick }: PipelineDashboardProps) => {
  const grouped = STAGES.map(stage => {
    const stageLeads = leads.filter(l => l.pipeline_stage === stage.key);
    const slaBreakdown = { green: 0, amber: 0, red: 0 };
    stageLeads.forEach(l => {
      if (stage.key === 'signed' || stage.key === ('build_refinement' as PipelineStage)) {
        slaBreakdown.green++;
      } else {
        slaBreakdown[getSlaStatus(l)]++;
      }
    });
    return { ...stage, leads: stageLeads, slaBreakdown };
  });

  const totalGreen = grouped.reduce((s, g) => s + g.slaBreakdown.green, 0);
  const totalAmber = grouped.reduce((s, g) => s + g.slaBreakdown.amber, 0);
  const totalRed = grouped.reduce((s, g) => s + g.slaBreakdown.red, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{leads.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Leads</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <p className="text-3xl font-bold text-foreground">{totalGreen}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Current (&lt;24h)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <p className="text-3xl font-bold text-foreground">{totalAmber}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Needs Attention (24-48h)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <p className="text-3xl font-bold text-foreground">{totalRed}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Overdue (&gt;48h)</p>
        </div>
      </div>

      {/* Per-stage breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {grouped.map(stage => {
          const worstSla = stage.slaBreakdown.red > 0 ? 'red' : stage.slaBreakdown.amber > 0 ? 'amber' : 'green';
          return (
            <div key={stage.key} onClick={() => onStageClick?.(stage.key)} className={`rounded-xl border-2 p-4 space-y-3 cursor-pointer hover:scale-[1.02] transition-transform ${slaBgColors[worstSla]}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground">{stage.label}</h3>
                <span className="text-2xl font-bold text-foreground">{stage.leads.length}</span>
              </div>
              {stage.leads.length > 0 && (
                <div className="space-y-1.5">
                  {stage.leads.map(lead => {
                    const sla = stage.key === 'signed' ? 'green' : getSlaStatus(lead);
                    return (
                      <div key={lead.id} className="flex items-center gap-2 text-[11px]">
                        <span className={`w-2 h-2 rounded-full ${slaColors[sla]} shrink-0`} />
                        <span className="text-foreground truncate">{lead.contact_name}</span>
                        {lead.business_name && (
                          <span className="text-muted-foreground truncate hidden sm:inline">({lead.business_name})</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {stage.leads.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">No clients</p>
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
