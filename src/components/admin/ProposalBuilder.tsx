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
  History, Plus, Eye, ExternalLink,
} from 'lucide-react';

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
  techStack?: { generated_at?: string } | null;
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
  const [revisions, setRevisions] = useState<any[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [creatingRevision, setCreatingRevision] = useState(false);

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
  };

  // Initial load: revisions + hydrate the selected one (or fall back to analysis).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const target = await loadRevisions();
      if (cancelled) return;
      if (target && target.proposal_data && Array.isArray((target.proposal_data as any).items) && (target.proposal_data as any).items.length > 0) {
        hydrateFromProposalRow(target);
      } else if (analysis) {
        setItems(buildItemsFromAnalysis());
        setKeyFindings(analysis.summary || '');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId, analysis]);

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

  const totalWeeks = useMemo(() => {
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

  const toggleItem = (idx: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, included: !it.included } : it));
  };

  const updateItem = (idx: number, field: 'manualCost' | 'manualWeeks', value: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Preserve any client-facing narrative/legal fields already saved on this proposal
      const existingData = (existingProposal?.proposal_data as any) || {};
      const proposalData = {
        ...existingData,
        keyFindings,
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
        },
        feeStructure: {
          deposit: { percent: DEPOSIT_PCT * 100, amount: deposit, label: 'On Commencement' },
          mvp: { percent: MVP_PCT * 100, amount: mvp, label: 'On MVP Achieved & Reviewed' },
          final: { percent: FINAL_PCT * 100, amount: final, label: 'On Handover of Final Build' },
        },
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
              href={`/proposal/${existingProposal.id}?admin=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Open client view
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

      {/* Key Findings */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Key Findings
        </h3>
        <Textarea
          value={keyFindings}
          onChange={e => setKeyFindings(e.target.value)}
          rows={4}
          className="text-xs bg-secondary border-border resize-none"
          placeholder="Summary of key findings from the analysis…"
          disabled={isReadOnly}
        />
      </div>

      {/* Build Scope Selector */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Phase 1 — Build Scope
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{item.title}</span>
                      <Badge variant="outline" className="text-[9px]">
                        {(item as any)._type === 'big_hit' ? '🎯 Big Hit' : '⚡ Quick Win'}
                      </Badge>
                      <Badge variant="outline" className="text-[9px]">
                        {difficultyLabel[item.difficulty] || 'Medium'}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] text-green-700">
                        {formatCurrency(item.estimated_annual_impact)}/yr impact
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.explanation}</p>

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
      </div>

      {/* Totals & Fee Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Investment Summary */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" /> Investment Summary
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Estimated timeline: <strong className="text-foreground">{totalWeeks} weeks</strong>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Proposed Fee Structure
          </h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-foreground">10% — Initial Deposit</p>
                  <p className="text-[10px] text-muted-foreground">On Commencement</p>
                </div>
                <span className="text-sm font-bold text-primary">{formatCurrency(deposit)}</span>
              </div>
            </div>
            <div className="rounded-lg bg-secondary/50 border border-border p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-foreground">50% — MVP Milestone</p>
                  <p className="text-[10px] text-muted-foreground">On MVP Achieved & Reviewed</p>
                </div>
                <span className="text-sm font-bold text-foreground">{formatCurrency(mvp)}</span>
              </div>
            </div>
            <div className="rounded-lg bg-secondary/50 border border-border p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-foreground">40% — Final Handover</p>
                  <p className="text-[10px] text-muted-foreground">On Handover of Final Build</p>
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
