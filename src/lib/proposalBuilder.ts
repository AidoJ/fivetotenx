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

// ---- Julia-pixel narrative defaults ----
// Every section below is editable in the admin Proposal Builder. These
// defaults are only used when the LLM hasn't generated a richer narrative yet.

export interface NarrativeBlock { heading: string; body: string }

export const buildDefaultNarrative = (
  analysis: Analysis,
  roiResults: any,
  contactName: string,
  businessName: string,
) => {
  const top = analysis.big_hits?.[0];
  const second = analysis.big_hits?.[1];
  const annual = roiResults?.totalAnnualImpact || analysis.total_potential_impact || 0;
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n || 0);

  const proposal_title = top
    ? `${top.title} for ${businessName || 'your business'}`
    : `Phase 1 Proposal for ${businessName || 'your business'}`;

  const what_we_heard = analysis.summary
    ? analysis.summary
    : `Based on our Reality Check™ assessment and Straight Talk™ conversation, we have identified the highest-leverage opportunities for ${businessName || 'your business'}. The pain points you described are quantifiable, and the destination you want to reach is clear.`;

  const highlight_box = {
    headline: top ? top.title : 'A focused Phase 1 build',
    body: top?.recommendation || top?.explanation || 'A targeted Phase 1 build that delivers measurable value within weeks, not months.',
  };

  const what_this_means: NarrativeBlock[] = [];
  if (annual > 0) {
    what_this_means.push({
      heading: 'Quantified value',
      body: `Projected annual impact of ${fmt(annual)} from this Phase 1 build alone — recovered hours, faster turnaround, and reduced manual error.`,
    });
  }
  if (second) {
    what_this_means.push({
      heading: second.title,
      body: second.recommendation || second.explanation || '',
    });
  }
  what_this_means.push({
    heading: 'Oversight stays in place',
    body: 'We are removing the data-entry and repetitive workload — not the human review and compliance gates that protect your business.',
  });

  const what_we_need_from_you = [
    'A 1-hour discovery session with the operational owner to walk through current workflows on screen.',
    'API or admin access to the systems we will integrate with (read/write where required).',
    'Sample documents from a recent transaction (redacted is fine) to verify field mapping before build.',
    'A nominated reviewer for sign-off during the parallel-run phase.',
  ];

  const delivery_phases = [
    { weeks: 'Week 1', title: 'Discovery & Specification', body: 'Working session with you and the nominated reviewer to confirm the workflow we are automating, verify field mapping against live data, and finalise the compliance checklist. We produce a signed-off field specification before any build begins.' },
    { weeks: 'Weeks 2–3', title: 'Core Build', body: 'Automation layer configured and connected to the agreed inputs. Integration with your existing systems built and tested against real sample data from your environment.' },
    { weeks: 'Weeks 4–5', title: 'Validation & Review Interface', body: 'Validation rules implemented (missing fields flagged before review). Reviewer interface built and deployed — audit log live, notifications configured. End-to-end tested with real data.' },
    { weeks: 'Weeks 6–8', title: 'Parallel Run & Go-Live', body: 'The automated system runs alongside the existing manual process. You and the reviewer validate output accuracy on real cases. Edge cases are resolved as they appear. When you sign off, the system goes live and the manual workflow is retired.' },
  ];

  const oversight_note = 'The automated system produces drafts for your team to review. Nothing is sent to a customer or counterparty without human approval. During the parallel run, exception handling stays manual until you have validated accuracy on real cases. We are replacing the data-entry burden — not the compliance review.';

  const closing_paragraph = `Any questions before you decide, reply directly to this email. We can begin discovery within a week of sign-off.`;

  return {
    proposal_title,
    what_we_heard,
    highlight_box,
    what_this_means,
    what_we_need_from_you,
    delivery_phases,
    oversight_note,
    closing_paragraph,
  };
};

export const buildProposalData = (
  analysis: Analysis,
  roiResults: any,
  contactName: string = '',
  businessName: string = '',
) => {
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

  const narrative = buildDefaultNarrative(analysis, roiResults, contactName, businessName);

  return {
    keyFindings: analysis.summary || '',
    items: items.map(({ _type, ...rest }) => rest),
    totals: { subtotalExGst, gst, totalIncGst, deposit, mvp, final, totalWeeks },
    feeStructure: {
      deposit: {
        percent: DEPOSIT_PCT * 100,
        amount: deposit,
        label: 'Commitment Deposit',
        when: 'On commencement — kicks off discovery session and build',
      },
      mvp: {
        percent: MVP_PCT * 100,
        amount: mvp,
        label: 'MVP Payment',
        when: 'On MVP working in test environment with real data',
      },
      final: {
        percent: FINAL_PCT * 100,
        amount: final,
        label: 'Final Balance',
        when: 'On go-live — system in production, signed off, legacy workflow retired',
      },
    },
    // New Julia-pixel narrative fields (all editable in admin)
    ...narrative,
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

    // Only auto-regenerate the latest non-superseded, undelivered draft.
    // Once a proposal has been delivered, edits should create a new revision via Send.
    const { data: proposal } = await supabase
      .from('proposals')
      .select('id, delivered_at, superseded_by')
      .eq('assessment_id', assessmentId)
      .is('superseded_by', null)
      .order('revision', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!proposal) return false;
    if (proposal.delivered_at) return false; // never overwrite a sent revision

    const { data: assessment } = await supabase
      .from('roi_assessments')
      .select('roi_results, discovery_answers, contact_name, business_name')
      .eq('id', assessmentId)
      .single();
    if (!assessment) return false;

    const analysis = (assessment.discovery_answers as any)?._analysis as Analysis | undefined;
    if (!analysis) return false;

    const newProposalData = buildProposalData(
      analysis,
      assessment.roi_results,
      assessment.contact_name || '',
      assessment.business_name || '',
    );
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

/**
 * If the auto-rerun-tech-stack toggle is enabled, invoke the analyze-opportunities
 * edge function in tech_stack mode. Returns true if a rerun was triggered.
 */
export const maybeAutoRerunTechStack = async (assessmentId: string): Promise<boolean> => {
  try {
    const { data: settings } = await supabase
      .from('automation_settings')
      .select('auto_rerun_tech_stack_on_proposal_save')
      .limit(1)
      .single();
    if (!settings?.auto_rerun_tech_stack_on_proposal_save) return false;

    const { error } = await supabase.functions.invoke('analyze-opportunities', {
      body: { assessmentId, mode: 'tech_stack' },
    });
    if (error) {
      console.error('Auto-rerun tech stack failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Auto-rerun tech stack failed:', err);
    return false;
  }
};
