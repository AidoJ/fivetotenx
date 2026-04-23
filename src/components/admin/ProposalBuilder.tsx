import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { maybeAutoRerunTechStack } from '@/lib/proposalBuilder';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Save, DollarSign, Clock, FileText,
  Calculator, CheckCircle2, Sparkles, AlertTriangle, RotateCcw, Lock, Unlock,
  History, Plus, Eye, ExternalLink, Printer, ArrowUp, ArrowDown, Trash2,
} from 'lucide-react';
import SignedAgreementCard from '@/components/admin/SignedAgreementCard';
import JuliaNarrativeEditor, { JuliaNarrativeFields } from '@/components/admin/JuliaNarrativeEditor';

interface Opportunity {
  title: string;
  impact_category: string;
  estimated_annual_impact: number;
  difficulty: string;
  explanation: string;
  recommendation: string;
}

interface BuildItem extends Opportunity {
  included: boolean;
  estimatedCost: number;
  estimatedWeeks: number;
  manualCost: string;
  manualWeeks: string;
  // _type kept on the object for grouping/timeline math
  _type?: 'big_hit' | 'quick_win';
  // If true, client cannot deselect this item on the proposal page
  locked?: boolean;
}

interface Props {
  assessmentId: string;
  analysis: { big_hits: Opportunity[]; quick_wins: Opportunity[]; summary: string; total_potential_impact: number; generated_at?: string } | null;
  roiResults: any;
  contactName: string;
  businessName: string;
  contactEmail: string;
  techStack?: any;
}

const GST_RATE = 0.10;
const DEPOSIT_PCT = 0.10;
const MVP_PCT = 0.50;
const FINAL_PCT = 0.40;

const difficultyWeeks: Record<string, number> = { easy: 2, medium: 4, hard: 8 };
const difficultyLabel: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v);

const autoEstimateCost = (opp: Opportunity, totalImpact: number, buildCostMid: number): number => {
  if (totalImpact <= 0) return 5000;
  const share = opp.estimated_annual_impact / totalImpact;
  return Math.max(2000, Math.round(share * buildCostMid / 500) * 500);
};


const ProposalBuilder: React.FC<Props> = ({ assessmentId, analysis, roiResults, contactName, businessName, contactEmail, techStack }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<BuildItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [keyFindings, setKeyFindings] = useState('');
  const [projectOverview, setProjectOverview] = useState('');
  
  const [legalDoc, setLegalDoc] = useState<{ content: string; version: string } | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [creatingRevision, setCreatingRevision] = useState(false);
  const [autoFillingNarrative, setAutoFillingNarrative] = useState(false);
  const emptyNarrative: JuliaNarrativeFields = {
    proposal_title: '',
    what_we_heard: '',
    highlight_box: { headline: '', body: '' },
    what_this_means: [],
    out_of_scope: [],
    what_we_need_from_you: [],
    delivery_phases: [],
    oversight_note: '',
    closing_paragraph: '',
  };
  const [narrative, setNarrative] = useState<JuliaNarrativeFields>(emptyNarrative);
  // Manual override for the Investment Summary timeline. Empty string = use auto.
  const [manualTotalWeeks, setManualTotalWeeks] = useState<string>('');

  // The currently-loaded proposal row (selected via dropdown).
  const existingProposal = useMemo(
    () => revisions.find(r => r.id === selectedRevisionId) || null,
    [revisions, selectedRevisionId],
  );

  // Latest revision = highest revision number, regardless of superseded.
  const latestRevision = useMemo(() => {
    if (revisions.length === 0) return null;
    return [...revisions].sort((a, b) => (b.revision || 1) - (a.revision || 1))[0];
  }, [revisions]);

  const isLatestSelected = !!existingProposal && !!latestRevision && existingProposal.id === latestRevision.id;
  const isReadOnly = !!existingProposal && (!isLatestSelected || !!existingProposal.superseded_by);
  const latestIsDelivered = !!latestRevision?.delivered_at;

  const buildCostMid = roiResults?.pricing?.buildCost || 15000;
  const totalImpact = analysis?.total_potential_impact || roiResults?.totalAnnualImpact || 0;

  // Build a fresh items list from the latest analysis (used as a fallback or via Reset)
  const buildItemsFromAnalysis = () => {
    if (!analysis) return [] as BuildItem[];
    const allOpps = [
      ...(analysis.big_hits || []).map(o => ({ ...o, _type: 'big_hit' as const })),
      ...(analysis.quick_wins || []).map(o => ({ ...o, _type: 'quick_win' as const })),
    ];
    return allOpps.map(opp => ({
      ...opp,
      included: true,
      estimatedCost: autoEstimateCost(opp, totalImpact, buildCostMid),
      estimatedWeeks: difficultyWeeks[opp.difficulty] || 4,
      manualCost: '',
      manualWeeks: '',
      locked: false,
    })) as BuildItem[];
  };

  // Load all revisions for this assessment, hydrate the latest by default.
  const loadRevisions = async (preferredId?: string | null) => {
    const { data: rows } = await supabase
      .from('proposals')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('revision', { ascending: false })
      .order('created_at', { ascending: false });
    const list = rows || [];
    setRevisions(list);
    if (list.length === 0) {
      setSelectedRevisionId(null);
      return null;
    }
    const targetId = preferredId && list.some(r => r.id === preferredId)
      ? preferredId
      : list[0].id; // newest by revision
    setSelectedRevisionId(targetId);
    return list.find(r => r.id === targetId) || list[0];
  };

  const hydrateFromProposalRow = (row: any) => {
    const pData = (row?.proposal_data as any) || {};
    setProjectOverview(
      typeof pData.projectOverview === 'string' && pData.projectOverview.trim().length > 0
        ? pData.projectOverview
        : `Based on your Reality Check™ assessment and Straight Talk™ conversation, we have prepared a Phase 1 build for ${businessName || 'this client'}, focused on the highest-leverage opportunities identified in the analysis.`
    );
    if (Array.isArray(pData.items) && pData.items.length > 0) {
      setKeyFindings(pData.keyFindings || analysis?.summary || '');
      setItems((pData.items as any[]).map((i: any) => ({
        title: i.title,
        impact_category: i.impact_category,
        estimated_annual_impact: i.estimated_annual_impact,
        difficulty: i.difficulty,
        explanation: i.explanation,
        recommendation: i.recommendation,
        included: true,
        estimatedCost: typeof i.cost === 'number' ? i.cost : autoEstimateCost(i, totalImpact, buildCostMid),
        estimatedWeeks: typeof i.weeks === 'number' ? i.weeks : (difficultyWeeks[i.difficulty] || 4),
        manualCost: '',
        manualWeeks: '',
        _type: i._type || 'big_hit',
        locked: !!i.locked,
      })));
    }
    // Hydrate manual timeline override if previously saved
    const savedManualWeeks = pData?.totals?.manualTotalWeeks;
    setManualTotalWeeks(
      typeof savedManualWeeks === 'number' && savedManualWeeks > 0 ? String(savedManualWeeks) : '',
    );
    // Hydrate Julia narrative blocks (with safe defaults if missing)
    setNarrative({
      proposal_title: pData.proposal_title || '',
      what_we_heard: pData.what_we_heard || '',
      highlight_box: {
        headline: pData.highlight_box?.headline || '',
        body: pData.highlight_box?.body || '',
      },
      what_this_means: Array.isArray(pData.what_this_means) ? pData.what_this_means : [],
      out_of_scope: Array.isArray(pData.out_of_scope) ? pData.out_of_scope : [],
      what_we_need_from_you: Array.isArray(pData.what_we_need_from_you) ? pData.what_we_need_from_you : [],
      delivery_phases: Array.isArray(pData.delivery_phases) ? pData.delivery_phases : [],
      oversight_note: pData.oversight_note || '',
      closing_paragraph: pData.closing_paragraph || '',
    });
  };

  // Initial load: revisions + hydrate the selected one (or fall back to analysis).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [target, legalRes] = await Promise.all([
        loadRevisions(),
        supabase
          .from('legal_documents')
          .select('content, version')
          .eq('key', 'initial-engagement')
          .eq('is_current', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (legalRes.data) setLegalDoc(legalRes.data as { content: string; version: string });
      if (target && target.proposal_data && Array.isArray((target.proposal_data as any).items) && (target.proposal_data as any).items.length > 0) {
        hydrateFromProposalRow(target);
      } else if (analysis) {
        setItems(buildItemsFromAnalysis());
        setKeyFindings(analysis.summary || '');
        setProjectOverview(`Based on your Reality Check™ assessment and Straight Talk™ conversation, we have prepared a Phase 1 build for ${businessName || 'this client'}, focused on the highest-leverage opportunities identified in the analysis.`);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId, analysis, businessName, techStack]);

  // When the user picks a different revision in the dropdown, re-hydrate the editor.
  useEffect(() => {
    if (existingProposal) hydrateFromProposalRow(existingProposal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRevisionId]);

  const handleCreateNewRevision = async () => {
    if (!latestRevision) return;
    const newRev = (latestRevision.revision || 1) + 1;
    if (!window.confirm(`Create revision v${newRev}? It will be cloned from the latest revision and become an editable draft. The previous revision will be marked as superseded.`)) return;
    setCreatingRevision(true);
    try {
      const { data: newRow, error } = await supabase
        .from('proposals')
        .insert({
          assessment_id: assessmentId,
          proposal_data: latestRevision.proposal_data || {},
          client_selection: {},
          revision: newRev,
          accepted: false,
          accepted_at: null,
        })
        .select()
        .single();
      if (error || !newRow) throw new Error(error?.message || 'Failed to create revision');
      await supabase.from('proposals').update({ superseded_by: newRow.id }).eq('id', latestRevision.id);
      await loadRevisions(newRow.id);
      toast({ title: `Revision v${newRev} created`, description: 'Edit and Save, then send from the Comms tab.' });
    } catch (err: any) {
      toast({ title: 'Failed to create revision', description: err.message, variant: 'destructive' });
    }
    setCreatingRevision(false);
  };

  const handleResetToDefaults = () => {
    if (!analysis) return;
    if (!window.confirm('Reset all items, costs, weeks and key findings to the latest AI defaults? Your manual edits will be lost.')) return;
    setItems(buildItemsFromAnalysis());
    setKeyFindings(analysis.summary || '');
    toast({ title: 'Reset to AI defaults', description: 'Click Save Proposal to persist.' });
  };

  const toggleLocked = (idx: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, locked: !it.locked } : it));
  };

  const included = useMemo(() => items.filter(i => i.included), [items]);

  const totalExGst = useMemo(() =>
    included.reduce((sum, i) => sum + (i.manualCost ? parseFloat(i.manualCost) || 0 : i.estimatedCost), 0),
  [included]);

  const gst = Math.round(totalExGst * GST_RATE);
  const totalIncGst = totalExGst + gst;
  const deposit = Math.round(totalExGst * DEPOSIT_PCT);
  const mvp = Math.round(totalExGst * MVP_PCT);
  const final = totalExGst - deposit - mvp;

  const autoTotalWeeks = useMemo(() => {
    // Parallel tracks: big hits run concurrently, quick wins overlap
    let maxBigHit = 0;
    let quickWinWeeks = 0;
    included.forEach(i => {
      const w = i.manualWeeks ? parseFloat(i.manualWeeks) || 0 : i.estimatedWeeks;
      if ((i as any)._type === 'big_hit') maxBigHit = Math.max(maxBigHit, w);
      else quickWinWeeks += w * 0.5; // overlap
    });
    return Math.ceil(maxBigHit + quickWinWeeks) || 0;
  }, [included]);

  // Effective timeline shown in Investment Summary: manual override wins if set.
  const totalWeeks = useMemo(() => {
    const m = parseFloat(manualTotalWeeks);
    return Number.isFinite(m) && m > 0 ? m : autoTotalWeeks;
  }, [manualTotalWeeks, autoTotalWeeks]);

  const toggleItem = (idx: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, included: !it.included } : it));
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    setItems(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const removeItemAt = (idx: number) => {
    if (!window.confirm('Remove this scope item from the proposal? You can re-add it manually or hit Reset to restore AI defaults.')) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const addCustomItem = () => {
    setItems(prev => [
      ...prev,
      {
        title: 'New custom build item',
        impact_category: 'custom',
        estimated_annual_impact: 0,
        difficulty: 'medium',
        explanation: '',
        recommendation: '',
        included: true,
        estimatedCost: 5000,
        estimatedWeeks: 4,
        manualCost: '',
        manualWeeks: '',
        _type: 'big_hit',
        locked: false,
      } as BuildItem,
    ]);
  };

  const updateItem = (
    idx: number,
    field: 'manualCost' | 'manualWeeks' | 'title' | 'explanation' | 'recommendation',
    value: string,
  ) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };


  const handleAutoFillNarrative = async () => {
    setAutoFillingNarrative(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-proposal-narrative', {
        body: { assessmentId },
      });
      if (error) throw error;
      const n = (data as any)?.narrative;
      if (!n) throw new Error('No narrative returned');
      setNarrative({
        proposal_title: n.proposal_title || narrative.proposal_title,
        what_we_heard: n.what_we_heard || narrative.what_we_heard,
        highlight_box: {
          headline: n.highlight_box?.headline || narrative.highlight_box.headline,
          body: n.highlight_box?.body || narrative.highlight_box.body,
        },
        what_this_means: Array.isArray(n.what_this_means) && n.what_this_means.length > 0 ? n.what_this_means : narrative.what_this_means,
        out_of_scope: Array.isArray(n.out_of_scope) && n.out_of_scope.length > 0 ? n.out_of_scope : narrative.out_of_scope,
        what_we_need_from_you: Array.isArray(n.what_we_need_from_you) && n.what_we_need_from_you.length > 0 ? n.what_we_need_from_you : narrative.what_we_need_from_you,
        delivery_phases: Array.isArray(n.delivery_phases) && n.delivery_phases.length > 0 ? n.delivery_phases : narrative.delivery_phases,
        oversight_note: n.oversight_note || narrative.oversight_note,
        closing_paragraph: n.closing_paragraph || narrative.closing_paragraph,
      });
      toast({ title: 'Narrative auto-filled ✨', description: 'Review the blocks below, then click Save Proposal.' });
    } catch (err: any) {
      toast({ title: 'Auto-fill failed', description: err.message, variant: 'destructive' });
    }
    setAutoFillingNarrative(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Preserve any client-facing narrative/legal fields already saved on this proposal
      const existingData = (existingProposal?.proposal_data as any) || {};
      const proposalData = {
        ...existingData,
        keyFindings,
        projectOverview,
        
        items: included.map(i => ({
          title: i.title,
          impact_category: i.impact_category,
          estimated_annual_impact: i.estimated_annual_impact,
          difficulty: i.difficulty,
          explanation: i.explanation,
          recommendation: i.recommendation,
          cost: i.manualCost ? parseFloat(i.manualCost) : i.estimatedCost,
          weeks: i.manualWeeks ? parseFloat(i.manualWeeks) : i.estimatedWeeks,
          _type: i._type || 'big_hit',
          locked: !!i.locked,
        })),
        totals: {
          subtotalExGst: totalExGst,
          gst,
          totalIncGst,
          deposit,
          mvp,
          final,
          totalWeeks,
          // Persist whether the timeline was manually overridden so it
          // survives reloads and re-saves without falling back to auto-calc.
          manualTotalWeeks: (() => {
            const m = parseFloat(manualTotalWeeks);
            return Number.isFinite(m) && m > 0 ? m : null;
          })(),
        },
        feeStructure: {
          deposit: { percent: DEPOSIT_PCT * 100, amount: deposit, label: 'Commitment Deposit', when: 'On commencement — kicks off discovery session and build' },
          mvp: { percent: MVP_PCT * 100, amount: mvp, label: 'MVP Payment', when: 'On MVP working in test environment with real data' },
          final: { percent: FINAL_PCT * 100, amount: final, label: 'Final Balance', when: 'On go-live — system in production, signed off, legacy workflow retired' },
        },
        // Julia-pixel narrative blocks (editable above)
        proposal_title: narrative.proposal_title,
        what_we_heard: narrative.what_we_heard,
        highlight_box: narrative.highlight_box,
        what_this_means: narrative.what_this_means,
        out_of_scope: narrative.out_of_scope,
        what_we_need_from_you: narrative.what_we_need_from_you,
        delivery_phases: narrative.delivery_phases,
        oversight_note: narrative.oversight_note,
        closing_paragraph: narrative.closing_paragraph,
        manually_edited_at: new Date().toISOString(),
      };

      let savedId: string | null = null;
      if (existingProposal) {
        await supabase.from('proposals').update({ proposal_data: proposalData as any }).eq('id', existingProposal.id);
        savedId = existingProposal.id;
      } else {
        const { data } = await supabase.from('proposals').insert({
          assessment_id: assessmentId,
          proposal_data: proposalData as any,
          revision: 1,
        }).select().single();
        if (data) savedId = data.id;
      }
      // Re-pull all revisions so dropdown reflects latest state.
      await loadRevisions(savedId);
      toast({ title: 'Proposal saved ✅' });
      const reran = await maybeAutoRerunTechStack(assessmentId);
      if (reran) {
        toast({ title: 'Tech Stack analysis re-running…', description: 'Refresh the Tech Stack tab in a moment to see the updated recommendations.' });
      }
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  if (!analysis) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-1">No analysis data</h3>
        <p className="text-sm text-muted-foreground">Run the opportunity analysis first from the Analysis tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Signed Agreement card (shown once client has signed) */}
      {existingProposal?.agreement_accepted_at && (
        <SignedAgreementCard
          proposal={existingProposal}
          onCountersigned={() => loadRevisions(existingProposal.id)}
        />
      )}

      {/* Revisions toolbar */}
      {revisions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <History className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground">Revisions</span>
            <span>· {revisions.length} total</span>
          </div>
          <Select value={selectedRevisionId || ''} onValueChange={(v) => setSelectedRevisionId(v)}>
            <SelectTrigger className="h-8 w-[280px] text-xs bg-secondary border-border">
              <SelectValue placeholder="Select revision" />
            </SelectTrigger>
            <SelectContent>
              {revisions.map((r) => {
                const isLatest = latestRevision?.id === r.id;
                const sent = r.delivered_at ? new Date(r.delivered_at).toLocaleDateString('en-AU') : null;
                const accepted = r.accepted ? ' · accepted' : '';
                return (
                  <SelectItem key={r.id} value={r.id} className="text-xs">
                    v{r.revision || 1}
                    {isLatest ? ' (current)' : ''}
                    {sent ? ` · sent ${sent}` : ' · draft'}
                    {accepted}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {existingProposal && (
              <a
                href={`/proposal/${existingProposal.id}?client=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline"
            >
                <ExternalLink className="w-3 h-3" /> Open client preview
            </a>
          )}
          <div className="ml-auto flex items-center gap-2">
            {isReadOnly && (
              <Badge variant="outline" className="text-[10px] gap-1 border-amber-400/50 text-amber-700 bg-amber-500/5">
                <Eye className="w-3 h-3" /> Read only — superseded
              </Badge>
            )}
            {isLatestSelected && latestIsDelivered && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={handleCreateNewRevision}
                disabled={creatingRevision}
                title="Clone this revision into an editable v(n+1) draft. The current version becomes superseded."
              >
                {creatingRevision ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create new revision
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Read-only banner for superseded / non-latest revisions */}
      {isReadOnly && existingProposal && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-700">
              Viewing v{existingProposal.revision || 1} — read only
            </p>
            <p className="text-amber-700/80 mt-0.5">
              This revision has been superseded by a newer version. Switch to the current revision in the dropdown above to edit, or click <strong>Create new revision</strong> on the latest to start a new draft.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> 1. Project Overview
        </h3>
        <Textarea
          value={projectOverview}
          onChange={e => setProjectOverview(e.target.value)}
          rows={5}
          className="text-xs bg-secondary border-border resize-none"
          placeholder="Write the client-facing project overview…"
          disabled={isReadOnly}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Annual Impact</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(roiResults?.totalAnnualImpact || 0)}</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Projected ROI</p>
            <p className="text-sm font-bold text-foreground">{Math.round(roiResults?.roiPercentage || 0)}%</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Break-even</p>
            <p className="text-sm font-bold text-foreground">{Math.round(roiResults?.breakEvenMonths || 0)} months</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Prepared For</p>
            <p className="text-sm font-bold text-foreground">{businessName || contactName}</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Key Findings</p>
          <Textarea
            value={keyFindings}
            onChange={e => setKeyFindings(e.target.value)}
            rows={4}
            className="text-xs bg-background border-border resize-none"
            placeholder="Summary of key findings from the analysis…"
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* Build Scope Selector */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> 2. Build Scope
          </h3>
          <Badge variant="outline" className="text-[10px]">
            {included.length} of {items.length} included
          </Badge>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => {
            const cost = item.manualCost ? parseFloat(item.manualCost) || 0 : item.estimatedCost;
            const weeks = item.manualWeeks ? parseFloat(item.manualWeeks) || 0 : item.estimatedWeeks;
            return (
              <div
                key={idx}
                className={`rounded-lg border p-3 transition-all ${item.included ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/30 opacity-60'}`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.included}
                    onCheckedChange={() => toggleItem(idx)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <Badge variant="outline" className="text-[9px]">
                        {(item as any)._type === 'big_hit' ? '🎯 Big Hit' : '⚡ Quick Win'}
                      </Badge>
                      <Badge variant="outline" className="text-[9px]">
                        {difficultyLabel[item.difficulty] || 'Medium'}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] text-green-700">
                        {formatCurrency(item.estimated_annual_impact)}/yr impact
                      </Badge>
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveItem(idx, -1)}
                          disabled={isReadOnly || idx === 0}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 1)}
                          disabled={isReadOnly || idx === items.length - 1}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItemAt(idx)}
                          disabled={isReadOnly}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <Input
                      value={item.title}
                      onChange={e => updateItem(idx, 'title', e.target.value)}
                      placeholder="Scope item title"
                      className="h-8 text-xs font-bold bg-background border-border"
                      disabled={isReadOnly}
                    />
                    <Textarea
                      value={item.explanation}
                      onChange={e => updateItem(idx, 'explanation', e.target.value)}
                      rows={2}
                      placeholder="What this scope item delivers (shown to client)…"
                      className="text-[11px] bg-background border-border resize-none"
                      disabled={isReadOnly}
                    />
                    <Textarea
                      value={item.recommendation || ''}
                      onChange={e => updateItem(idx, 'recommendation', e.target.value)}
                      rows={2}
                      placeholder="Recommendation / how we'll build it (optional)…"
                      className="text-[11px] bg-background border-border resize-none"
                      disabled={isReadOnly}
                    />

                    {item.included && (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Cost $</Label>
                          <Input
                            type="number"
                            placeholder={String(item.estimatedCost)}
                            value={item.manualCost}
                            onChange={e => updateItem(idx, 'manualCost', e.target.value)}
                            className="h-7 w-24 text-xs bg-background border-border"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Weeks</Label>
                          <Input
                            type="number"
                            placeholder={String(item.estimatedWeeks)}
                            value={item.manualWeeks}
                            onChange={e => updateItem(idx, 'manualWeeks', e.target.value)}
                            className="h-7 w-16 text-xs bg-background border-border"
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          = {formatCurrency(cost)} · {weeks}w
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleLocked(idx)}
                          className={`ml-auto inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors ${item.locked ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
                          title={item.locked ? 'Mandatory — client cannot deselect' : 'Optional — client can deselect on the proposal page'}
                        >
                          {item.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          {item.locked ? 'Mandatory' : 'Client can deselect'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomItem}
            disabled={isReadOnly}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add custom build item
          </Button>
        </div>
      </div>


      {/* Totals & Fee Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Investment Summary */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" /> 3. Investment Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal (ex GST)</span>
              <span className="font-bold text-foreground">{formatCurrency(totalExGst)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">GST (10%)</span>
              <span className="font-bold text-foreground">{formatCurrency(gst)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-sm">
              <span className="font-bold text-foreground">Total (inc GST)</span>
              <span className="font-bold text-primary text-lg">{formatCurrency(totalIncGst)}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Estimated timeline (weeks)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step={0.5}
                value={manualTotalWeeks}
                onChange={e => setManualTotalWeeks(e.target.value)}
                placeholder={`Auto: ${autoTotalWeeks}`}
                className="h-8 text-xs bg-background border-border w-28"
              />
              <span className="text-xs text-muted-foreground">
                {manualTotalWeeks && parseFloat(manualTotalWeeks) > 0
                  ? <>Showing <strong className="text-foreground">{totalWeeks} weeks</strong> (manual override · auto would be {autoTotalWeeks})</>
                  : <>Showing <strong className="text-foreground">{autoTotalWeeks} weeks</strong> (auto from item difficulty)</>}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Leave blank to auto-calculate from item difficulty. Set a value to match your Delivery Phases narrative.
            </p>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> 3. Payment Schedule
          </h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-foreground">10% — Commitment Deposit</p>
                  <p className="text-[10px] text-muted-foreground">On commencement — kicks off discovery & build</p>
                </div>
                <span className="text-sm font-bold text-primary">{formatCurrency(deposit)}</span>
              </div>
            </div>
            <div className="rounded-lg bg-secondary/50 border border-border p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-foreground">50% — MVP Payment</p>
                  <p className="text-[10px] text-muted-foreground">On MVP working in test environment with real data</p>
                </div>
                <span className="text-sm font-bold text-foreground">{formatCurrency(mvp)}</span>
              </div>
            </div>
            <div className="rounded-lg bg-secondary/50 border border-border p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-foreground">40% — Final Balance</p>
                  <p className="text-[10px] text-muted-foreground">On go-live — system in production, signed off</p>
                </div>
                <span className="text-sm font-bold text-foreground">{formatCurrency(final)}</span>
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>All amounts ex GST</span>
              <span>GST of {formatCurrency(gst)} applies</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> 4. Initial Engagement Agreement
        </h3>
        <p className="text-xs text-muted-foreground">
          This proposal uses the current master agreement from the legal documents table{legalDoc?.version ? ` (v${legalDoc.version})` : ''}.
        </p>
        <div className="max-h-[320px] overflow-y-auto rounded-lg border border-border bg-secondary/20 p-4 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
          {legalDoc?.content || 'No current agreement found.'}
        </div>
      </div>

      {/* Julia-pixel narrative editor — editable blocks shown in client proposal + email */}
      <JuliaNarrativeEditor
        value={narrative}
        onChange={setNarrative}
        disabled={isReadOnly}
        onAutoFill={handleAutoFillNarrative}
        autoFilling={autoFillingNarrative}
      />

      {/* Stale warning */}
      {existingProposal && (() => {
        const proposalSavedAt = new Date(existingProposal.created_at).getTime();
        const analysisAt = analysis?.generated_at ? new Date(analysis.generated_at).getTime() : 0;
        const techAt = techStack?.generated_at ? new Date(techStack.generated_at).getTime() : 0;
        const newest = Math.max(analysisAt, techAt);
        if (!newest || newest <= proposalSavedAt) return null;
        const what: string[] = [];
        if (analysisAt > proposalSavedAt) what.push('Opportunity Analysis');
        if (techAt > proposalSavedAt) what.push('Tech Stack');
        return (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 text-xs">
              <p className="font-bold text-amber-700">Proposal is out of date</p>
              <p className="text-amber-700/80 mt-0.5">
                {what.join(' & ')} {what.length > 1 ? 'have' : 'has'} been updated since this proposal was last saved
                ({new Date(newest).toLocaleString('en-AU')}). Click <strong>Save Proposal</strong> to refresh, then re-send.
              </p>
            </div>
          </div>
        );
      })()}

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end flex-wrap">
        {existingProposal && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Last saved {new Date(existingProposal.created_at).toLocaleDateString('en-AU')}
          </Badge>
        )}
        {existingProposal && (
          <a href={`/proposal/${existingProposal.id}?admin=1`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Printer className="w-4 h-4" /> Open admin / print
            </Button>
          </a>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={handleResetToDefaults}
          disabled={saving || !analysis || isReadOnly}
          title="Discard your manual edits and rebuild items, costs and weeks from the latest AI analysis"
        >
          <RotateCcw className="w-4 h-4" /> Reset to AI defaults
        </Button>
        <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving || isReadOnly}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isReadOnly ? 'Read only' : 'Save Proposal'}
        </Button>
      </div>
    </div>
  );
};

export default ProposalBuilder;
