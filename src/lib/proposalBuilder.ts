// Shared proposal-build math used by ProposalBuilder UI and auto-regenerate flow.
import { supabase } from '@/integrations/supabase/client';

export interface Opportunity {
  title: string;
  impact_category: string;
  estimated_annual_impact: number;
  difficulty: string;
  explanation: string;
  recommendation: string;
}

export interface Analysis {
  big_hits: Opportunity[];
  quick_wins: Opportunity[];
  summary: string;
  total_potential_impact: number;
  generated_at?: string;
}

const GST_RATE = 0.10;
const DEPOSIT_PCT = 0.10;
const MVP_PCT = 0.50;
const FINAL_PCT = 0.40;

const difficultyWeeks: Record<string, number> = { easy: 2, medium: 4, hard: 8 };

export const autoEstimateCost = (opp: Opportunity, totalImpact: number, buildCostMid: number): number => {
  if (totalImpact <= 0) return 5000;
  const share = opp.estimated_annual_impact / totalImpact;
  return Math.max(2000, Math.round(share * buildCostMid / 500) * 500);
};

export const buildProposalData = (analysis: Analysis, roiResults: any) => {
  const buildCostMid = roiResults?.pricing?.buildCost || 15000;
  const totalImpact = analysis.total_potential_impact || roiResults?.totalAnnualImpact || 0;

  const allOpps = [
    ...(analysis.big_hits || []).map(o => ({ ...o, _type: 'big_hit' as const })),
    ...(analysis.quick_wins || []).map(o => ({ ...o, _type: 'quick_win' as const })),
  ];

  const items = allOpps.map(opp => ({
    title: opp.title,
    impact_category: opp.impact_category,
    estimated_annual_impact: opp.estimated_annual_impact,
    difficulty: opp.difficulty,
    explanation: opp.explanation,
    recommendation: opp.recommendation,
    cost: autoEstimateCost(opp, totalImpact, buildCostMid),
    weeks: difficultyWeeks[opp.difficulty] || 4,
    _type: opp._type,
  }));

  const subtotalExGst = items.reduce((sum, i) => sum + i.cost, 0);
  const gst = Math.round(subtotalExGst * GST_RATE);
  const totalIncGst = subtotalExGst + gst;
  const deposit = Math.round(subtotalExGst * DEPOSIT_PCT);
  const mvp = Math.round(subtotalExGst * MVP_PCT);
  const final = subtotalExGst - deposit - mvp;

  let maxBigHit = 0;
  let quickWinWeeks = 0;
  items.forEach(i => {
    if (i._type === 'big_hit') maxBigHit = Math.max(maxBigHit, i.weeks);
    else quickWinWeeks += i.weeks * 0.5;
  });
  const totalWeeks = Math.ceil(maxBigHit + quickWinWeeks) || 0;

  return {
    keyFindings: analysis.summary || '',
    items: items.map(({ _type, ...rest }) => rest),
    totals: { subtotalExGst, gst, totalIncGst, deposit, mvp, final, totalWeeks },
    feeStructure: {
      deposit: { percent: DEPOSIT_PCT * 100, amount: deposit, label: 'On Commencement' },
      mvp: { percent: MVP_PCT * 100, amount: mvp, label: 'On MVP Achieved & Reviewed' },
      final: { percent: FINAL_PCT * 100, amount: final, label: 'On Handover of Final Build' },
    },
    regenerated_at: new Date().toISOString(),
  };
};

/**
 * If auto-regen is enabled AND a proposal already exists for the assessment,
 * rebuild proposal_data from the latest analysis + ROI results.
 * Returns true if a regeneration happened.
 */
export const maybeAutoRegenerateProposal = async (assessmentId: string): Promise<boolean> => {
  try {
    const { data: settings } = await supabase
      .from('automation_settings')
      .select('auto_regenerate_proposal_on_analysis_update')
      .limit(1)
      .single();
    if (!settings?.auto_regenerate_proposal_on_analysis_update) return false;

    const { data: proposal } = await supabase
      .from('proposals')
      .select('id')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!proposal) return false;

    const { data: assessment } = await supabase
      .from('roi_assessments')
      .select('roi_results, discovery_answers')
      .eq('id', assessmentId)
      .single();
    if (!assessment) return false;

    const analysis = (assessment.discovery_answers as any)?._analysis as Analysis | undefined;
    if (!analysis) return false;

    const newProposalData = buildProposalData(analysis, assessment.roi_results);
    await supabase
      .from('proposals')
      .update({ proposal_data: newProposalData as any, created_at: new Date().toISOString() })
      .eq('id', proposal.id);
    return true;
  } catch (err) {
    console.error('Auto-regenerate proposal failed:', err);
    return false;
  }
};
