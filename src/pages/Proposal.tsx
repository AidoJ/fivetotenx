// Proposal page — strict mode model
// =================================
// MODES:
//   admin   → logged-in admin or ?admin=1. Full edit + Save + Print + Open client view.
//   view    → client default. Full read-only proposal + Edit Scope / Accept & Sign buttons.
//   edit    → client clicked Edit. Build scope checklist + live totals + "Send Me This Revised Proposal".
//             Nothing else (no legal text, no payment % editor, no Print).
//   accept  → client clicked Accept. Same as view + signing modal opens automatically.
//
// The proposal email contains ONE "View Proposal" button. The client picks Edit or Accept
// from inside this page — never from the email.

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2, Printer, CheckCircle2, Clock, DollarSign, Pencil, Save, X,
  Lock, AlertTriangle, Send, ExternalLink, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo-5to10x-color.webp';
import SigningModal from '@/components/proposal/SigningModal';
import JuliaProposalView from '@/components/proposal/JuliaProposalView';

type Mode = 'admin' | 'view' | 'edit' | 'accept';

interface ProposalRow {
  id: string;
  assessment_id: string;
  proposal_data: any;
  client_selection: any;
  sent_at: string;
  delivered_at: string | null;
  accepted: boolean;
  accepted_at: string | null;
  client_revision_requested_at?: string | null;
  countersigned_at?: string | null;
  revision?: number;
  superseded_by?: string | null;
}

interface ProposalItem {
  title: string;
  impact_category?: string;
  estimated_annual_impact?: number;
  difficulty?: string;
  explanation?: string;
  recommendation?: string;
  cost?: number;
  weeks?: number;
  _type?: 'big_hit' | 'quick_win';
  locked?: boolean;
}

interface TechStackItem {
  name: string;
  category: string;
  purpose: string;
  status: 'keep' | 'replace' | 'integrate';
}

interface AssessmentRow {
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  business_name: string | null;
  roi_results: any;
  industry: string | null;
  tech_stack: any;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v || 0);

const formatDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

// Map the rich tech_stack JSON (existing_tools_audit + recommended_tools) into
// a flat list of {name, category, purpose, status} rows that admins can edit
// and clients can read.
const deriveTechStackRows = (techStack: any): TechStackItem[] => {
  if (!techStack || typeof techStack !== 'object') return [];
  // If already in the simplified shape, use it directly.
  if (Array.isArray(techStack.proposal_rows)) {
    return (techStack.proposal_rows as TechStackItem[]).filter(r => r && r.name);
  }
  const rows: TechStackItem[] = [];
  const audit = Array.isArray(techStack.existing_tools_audit) ? techStack.existing_tools_audit : [];
  audit.forEach((t: any) => {
    const verdict = String(t.verdict || 'keep').toLowerCase();
    const status: TechStackItem['status'] =
      verdict === 'replace' ? 'replace' : verdict === 'integrate' ? 'integrate' : 'keep';
    rows.push({
      name: t.tool_name || 'Unnamed tool',
      category: t.category || 'Existing Tool',
      purpose: t.current_use || t.reasoning || '',
      status,
    });
  });
  const recs = Array.isArray(techStack.recommended_tools) ? techStack.recommended_tools : [];
  recs.forEach((r: any) => {
    rows.push({
      name: r.primary_recommendation || r.category || 'Recommended tool',
      category: r.category || 'New',
      purpose: r.alternatives ? `Alternatives: ${r.alternatives}` : '',
      status: 'integrate',
    });
  });
  return rows;
};

const techStatusBadge: Record<TechStackItem['status'], { label: string; cls: string }> = {
  keep: { label: 'Keep', cls: 'bg-green-500/10 text-green-700 border-green-500/30' },
  replace: { label: 'Replace', cls: 'bg-red-500/10 text-red-700 border-red-500/30' },
  integrate: { label: 'Integrate', cls: 'bg-blue-500/10 text-blue-700 border-blue-500/30' },
};

const SectionTitle = ({ icon: Icon, number, title }: { icon: any; number: number; title: string }) => (
  <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-3">
    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
      {number}
    </span>
    <Icon className="w-5 h-5 text-primary" />
    {title}
  </h2>
);

const StageTracker = ({
  proposal, mode,
}: { proposal: ProposalRow; mode: Mode }) => {
  // 1=Sent, 2=Reviewing/Revised, 3=Signed, 4=Fully executed
  const active = proposal.countersigned_at
    ? 4
    : proposal.accepted
      ? 3
      : proposal.superseded_by || proposal.client_revision_requested_at || (proposal.revision || 1) > 1 || mode === 'edit'
        ? 2
        : 1;
  const stages = [
    { label: 'Proposal sent', helper: `v${proposal.revision || 1}` },
    { label: 'Scope review', helper: proposal.superseded_by ? 'Revised' : (mode === 'edit' ? 'Editing' : 'In review') },
    { label: 'Ready to sign', helper: proposal.accepted ? 'Signed' : 'Awaiting signature' },
    { label: 'Fully executed', helper: proposal.countersigned_at ? 'Completed' : 'Countersign pending' },
  ];
  return (
    <div className="mb-8 rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Proposal status</p>
      <p className="text-sm text-foreground mb-4">Track exactly where this proposal is in the review and sign-off flow.</p>
      <div className="grid gap-3 sm:grid-cols-4">
        {stages.map((s, i) => {
          const n = i + 1;
          const on = n <= active;
          return (
            <div key={s.label} className={`rounded-lg border p-4 ${on ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/20'}`}>
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold border border-border bg-background text-foreground">
                {n}
              </div>
              <p className="text-sm font-semibold text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.helper}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Proposal = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('t') || '';
  const initialAction = searchParams.get('action'); // 'edit' | 'accept' | null
  const isAdminQuery = searchParams.get('admin') === '1';
  // Anyone opening a tokenised client link sees the client view, even if they're
  // signed in as an admin (e.g. Eoghan opening the email he was CC'd on).
  // To get the admin editor, use ?admin=1 explicitly.
  const forceClientView = searchParams.get('client') === '1' || (!!urlToken && !isAdminQuery);

  const { toast } = useToast();
  const [proposal, setProposal] = useState<ProposalRow | null>(null);
  const [assessment, setAssessment] = useState<AssessmentRow | null>(null);
  const [legalDoc, setLegalDoc] = useState<{ content: string; version: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Client mode state
  const [clientMode, setClientMode] = useState<'view' | 'edit' | 'accept'>(
    initialAction === 'edit' ? 'edit' : initialAction === 'accept' ? 'accept' : 'view',
  );

  // (Admin editing now happens entirely in ProposalBuilder; this page is render-only for narrative)

  // Selection / signing state
  const [selectedItemIdx, setSelectedItemIdx] = useState<Set<number>>(new Set());
  const [signingOpen, setSigningOpen] = useState(false);
  const [requestingRevision, setRequestingRevision] = useState(false);

  // Auth detection
  useEffect(() => {
    if (isAdminQuery) setIsAdminUser(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setIsAdminUser(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsAdminUser(true);
    });
    return () => subscription.unsubscribe();
  }, [isAdminQuery]);

  // Token validation
  useEffect(() => {
    if (!id) return;
    if (isAdminUser) {
      setTokenValid(true);
      return;
    }
    if (!urlToken) {
      setTokenValid(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('proposal_tokens')
        .select('proposal_id, expires_at')
        .eq('token', urlToken)
        .eq('proposal_id', id)
        .maybeSingle();
      setTokenValid(!!(data && new Date(data.expires_at) > new Date()));
    })();
  }, [id, urlToken, isAdminUser]);

  // Load proposal + assessment + legal doc + tech stack rows
  const refreshProposal = async () => {
    if (!id) return null;
    const { data } = await supabase.from('proposals').select('*').eq('id', id).single();
    if (data) setProposal(data as ProposalRow);
    return data as ProposalRow | null;
  };

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [{ data: prop }, { data: legal }] = await Promise.all([
        supabase.from('proposals').select('*').eq('id', id).single(),
        supabase
          .from('legal_documents')
          .select('content, version')
          .eq('key', 'initial-engagement')
          .eq('is_current', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (!prop) { setLoading(false); return; }
      setProposal(prop as ProposalRow);
      if (legal) setLegalDoc(legal as any);

      const { data: assess } = await supabase
        .from('roi_assessments')
        .select('contact_name, contact_email, contact_phone, business_name, roi_results, industry, tech_stack')
        .eq('id', (prop as ProposalRow).assessment_id)
        .single();
      if (assess) setAssessment(assess as AssessmentRow);

      // Initial selections
      const pData = (prop as ProposalRow).proposal_data || {};
      const items: ProposalItem[] = Array.isArray(pData.items) ? pData.items : [];
      const cs = (prop as any).client_selection || {};
      if (Array.isArray(cs.selected_indexes) && cs.selected_indexes.length > 0) {
        setSelectedItemIdx(new Set(cs.selected_indexes as number[]));
      } else {
        setSelectedItemIdx(new Set(items.map((_, i) => i)));
      }

      // Initial overview + tech stack rows (proposal_data wins, otherwise derive from assessment)
      setProjectOverview(typeof pData.projectOverview === 'string' ? pData.projectOverview : '');
      const savedRows = Array.isArray(pData.techStackRows) ? pData.techStackRows as TechStackItem[] : null;
      setTechRows(savedRows && savedRows.length > 0 ? savedRows : deriveTechStackRows(assess?.tech_stack));

      setLoading(false);
    })();
  }, [id]);

  // Items + totals
  const proposalItems: ProposalItem[] = useMemo(() => {
    const pData = proposal?.proposal_data || {};
    return Array.isArray(pData.items) ? (pData.items as ProposalItem[]) : [];
  }, [proposal]);

  const hasSelectableItems = proposalItems.length > 0;

  const totals = useMemo(() => {
    const GST_RATE = 0.10;
    const DEPOSIT_PCT = 0.10;
    const MVP_PCT = 0.50;
    const sub = proposalItems
      .filter((_, i) => selectedItemIdx.has(i))
      .reduce((s, i) => s + (typeof i.cost === 'number' ? i.cost : 0), 0);
    const gst = Math.round(sub * GST_RATE);
    const totalIncGst = sub + gst;
    const deposit = Math.round(sub * DEPOSIT_PCT);
    const mvp = Math.round(sub * MVP_PCT);
    const final = sub - deposit - mvp;
    let maxBigHit = 0;
    let quickWinWeeks = 0;
    proposalItems.forEach((it, idx) => {
      if (!selectedItemIdx.has(idx)) return;
      const w = typeof it.weeks === 'number' ? it.weeks : 0;
      if (it._type === 'big_hit') maxBigHit = Math.max(maxBigHit, w);
      else quickWinWeeks += w * 0.5;
    });
    const totalWeeks = Math.ceil(maxBigHit + quickWinWeeks) || 0;
    return { subtotalExGst: sub, gst, totalIncGst, deposit, mvp, final, totalWeeks };
  }, [proposalItems, selectedItemIdx]);

  // Determine the active mode
  const mode: Mode = !forceClientView && isAdminUser ? 'admin' : clientMode;

  // Auto-open signing modal in accept mode
  useEffect(() => {
    if (
      mode === 'accept' &&
      tokenValid &&
      !loading &&
      proposal &&
      !proposal.accepted &&
      !proposal.superseded_by
    ) {
      setSigningOpen(true);
    }
  }, [mode, tokenValid, loading, proposal]);

  // ---------- Handlers ----------
  const toggleItem = (idx: number) => {
    if (proposal?.accepted) return;
    if (proposalItems[idx]?.locked) return;
    setSelectedItemIdx(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const handleAdminSave = async () => {
    if (!proposal) return;
    setSaving(true);
    const newData = {
      ...(proposal.proposal_data || {}),
      projectOverview,
      techStackRows: techRows,
    };
    const { error } = await supabase.from('proposals').update({ proposal_data: newData }).eq('id', proposal.id);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      setProposal(p => p ? { ...p, proposal_data: newData } : null);
      toast({ title: 'Proposal saved ✅' });
      setEditing(false);
    }
    setSaving(false);
  };

  const handleRefreshTechFromTab = () => {
    if (!assessment) return;
    setTechRows(deriveTechStackRows(assessment.tech_stack));
    toast({ title: 'Tech stack refreshed from analysis', description: 'Click Save to persist.' });
  };

  const updateTechRow = (i: number, patch: Partial<TechStackItem>) => {
    setTechRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };
  const addTechRow = () => setTechRows(prev => [...prev, { name: '', category: '', purpose: '', status: 'keep' }]);
  const removeTechRow = (i: number) => setTechRows(prev => prev.filter((_, idx) => idx !== i));

  const handleRequestRevision = async () => {
    if (!proposal || !id) return;
    if (!urlToken && !isAdminUser) {
      toast({ title: 'Missing access link', description: 'Please open this proposal from the email we sent you.', variant: 'destructive' });
      return;
    }
    if (selectedItemIdx.size === 0) {
      toast({ title: 'Select at least one item', variant: 'destructive' });
      return;
    }
    setRequestingRevision(true);
    const selectedIndexes = Array.from(selectedItemIdx).sort((a, b) => a - b);
    const selectedItems = selectedIndexes.map(i => proposalItems[i]).filter(Boolean).map(i => ({
      title: i.title, cost: i.cost ?? 0, weeks: i.weeks ?? 0, _type: i._type,
      estimated_annual_impact: i.estimated_annual_impact ?? 0,
    }));
    const { data, error } = await supabase.functions.invoke('request-proposal-revision', {
      body: { proposalId: id, token: urlToken || 'admin-bypass', selectedIndexes, selectedItems, totals },
    });
    setRequestingRevision(false);
    if (error || !(data as any)?.success) {
      toast({
        title: 'Could not send revision',
        description: (data as any)?.error || error?.message || 'Please try again.',
        variant: 'destructive',
      });
      return;
    }
    await refreshProposal();
    toast({
      title: 'Revised proposal sent ✅',
      description: 'A new version has been emailed to you. Please check your inbox for the latest link.',
    });
    setClientMode('view');
  };

  // ---------- Loading / access guards ----------
  if (loading || tokenValid === null) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!proposal || !assessment) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Proposal not found.</p></div>;
  }
  if (!isAdminUser && tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center space-y-3">
          <Lock className="w-10 h-10 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Access link required</h1>
          <p className="text-sm text-muted-foreground">
            This proposal can only be opened from the personalised link we emailed you. If your link has expired, please reply to <a href="mailto:grow@5to10x.app" className="underline">grow@5to10x.app</a> and we'll send you a fresh one.
          </p>
        </div>
      </div>
    );
  }

  const roi = assessment.roi_results as any;
  const businessName = assessment.business_name || 'your business';
  const isClientLocked = !!proposal.accepted || !!proposal.superseded_by;

  // ============ EDIT MODE (client) — scope checklist only ============
  if (mode === 'edit' && !isClientLocked) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-6">
            <img src={logo} alt="5to10X" className="h-10" />
            <Button variant="ghost" size="sm" onClick={() => setClientMode('view')} className="gap-2">
              <X className="w-4 h-4" /> Back to proposal
            </Button>
          </div>

          <StageTracker proposal={proposal} mode="edit" />

          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-1">Adjust your build scope</h1>
              <p className="text-sm text-muted-foreground">
                Tick the items you want to proceed with. Your investment, payment schedule and timeline below update live. When you're happy, click <strong>Send Me This Revised Proposal</strong> and we'll email you the updated version.
              </p>
            </div>

            <div className="space-y-2">
              {proposalItems.map((item, idx) => {
                const sel = selectedItemIdx.has(idx);
                const locked = !!item.locked;
                return (
                  <label
                    key={idx}
                    className={`block rounded-lg border p-3 transition-all ${locked ? 'cursor-default' : 'cursor-pointer'} ${sel ? 'border-primary/40 bg-primary/5' : 'border-border bg-secondary/20 opacity-70'}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox checked={sel} disabled={locked} onCheckedChange={() => toggleItem(idx)} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground">{item.title}</span>
                          {locked && (
                            <span className="text-[10px] uppercase tracking-wider text-primary border border-primary/30 bg-primary/10 rounded px-1.5 py-0.5 inline-flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Included
                            </span>
                          )}
                        </div>
                        {item.explanation && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.explanation}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="font-semibold text-foreground">{formatCurrency(item.cost ?? 0)}</span>
                          {typeof item.weeks === 'number' && item.weeks > 0 && (
                            <span className="text-muted-foreground inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {item.weeks}w
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Your selection</p>
                  <p className="text-sm font-bold text-foreground">{selectedItemIdx.size} of {proposalItems.length} items · ~{totals.totalWeeks} weeks</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Investment (inc GST)</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totals.totalIncGst)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatCurrency(totals.subtotalExGst)} ex GST + {formatCurrency(totals.gst)} GST</p>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <Button size="lg" onClick={handleRequestRevision} disabled={requestingRevision} className="gap-2 px-8 py-6">
                {requestingRevision ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Send Me This Revised Proposal
              </Button>
              <p className="text-xs text-muted-foreground mt-3 max-w-md mx-auto">
                We'll generate a new version from your selected scope and email the updated proposal back to you.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ VIEW / ACCEPT / ADMIN — full proposal ============
  const proposalData = (proposal.proposal_data || {}) as any;
  return (
    <>
      {/* Floating action bar — admin only gets print, clients get nothing here */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        {mode === 'admin' && (
          <Button onClick={() => window.print()} className="gap-2 shadow-lg">
            <Printer className="w-4 h-4" /> Print / PDF
          </Button>
        )}
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .page-break { break-before: page; }
          @page { margin: 0.6in; size: A4; }
        }
      `}</style>

      <div className="min-h-screen bg-[#f8fafc] text-foreground">
        <div className="max-w-[760px] mx-auto px-6 py-10">
          {proposal.superseded_by && (
            <div className="print:hidden mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-bold text-amber-700">This proposal has been replaced by a newer version</p>
                <p className="text-amber-700/80 mt-1">
                  You're viewing v{proposal.revision || 1}. A revised proposal has been sent — please check your inbox for the latest version, or{' '}
                  {forceClientView && isAdminUser ? (
                    <a href={`/proposal/${proposal.superseded_by}?client=1`} className="underline font-medium">view the latest revision</a>
                  ) : (
                    'use the latest link from your email'
                  )}.
                </p>
              </div>
            </div>
          )}

          {/* Top utility bar */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <img src={logo} alt="5to10X" className="h-10" />
            <div className="text-right text-xs text-muted-foreground">
              <p>Proposal #{proposal.id.slice(0, 8).toUpperCase()}</p>
              {(proposal.revision || 1) > 1 && <p className="mt-0.5">Revision v{proposal.revision}</p>}
            </div>
          </div>

          {proposal.accepted && (
            <div className="flex items-center gap-3 bg-green-500/10 text-green-700 border border-green-500/30 rounded-lg px-5 py-3 mb-6">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm">Proposal Accepted</p>
                {proposal.accepted_at && <p className="text-xs opacity-80">{formatDate(proposal.accepted_at)}</p>}
              </div>
            </div>
          )}

          <StageTracker proposal={proposal} mode={mode} />

          {/* Julia-pixel proposal body */}
          <JuliaProposalView
            proposalData={proposalData}
            contactName={assessment.contact_name}
            businessName={businessName}
            preparedBy="Aidan Leonard & Eoghan"
            proposalDate={formatDate(proposal.sent_at)}
            industry={assessment.industry}
            roiAnnualImpact={roi?.totalAnnualImpact || 0}
          />

          {/* Initial Engagement Agreement (kept inline before sign-off) */}
          <section className="mt-10 page-break">
            <h2 style={{
              fontFamily: 'Georgia, serif',
              fontSize: '20px',
              fontWeight: 700,
              color: '#1e3a5f',
              margin: '36px 0 14px',
              paddingBottom: '8px',
              borderBottom: '2px solid #e2e8f0',
            }}>
              Initial Engagement Agreement
            </h2>
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 space-y-3">
              <p className="text-sm text-[#475569]" style={{ fontFamily: 'Georgia, serif' }}>
                The full Initial AI Consultancy Engagement Agreement (v{legalDoc?.version || '—'}) governs this proposal. By accepting and signing below, you confirm you've read and agree to this document in full.
              </p>
              {legalDoc?.content ? (
                <div className="max-h-[400px] overflow-y-auto rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 text-xs leading-relaxed whitespace-pre-wrap text-[#1e293b]">
                  {legalDoc.content}
                </div>
              ) : (
                <p className="text-sm text-[#64748b] italic">Agreement document not yet available. Please contact grow@5to10x.app.</p>
              )}
            </div>
          </section>

          {/* Action area */}
          {!proposal.accepted && !proposal.superseded_by && (mode === 'view' || mode === 'accept') && (
            <div className="print:hidden text-center py-8 space-y-4 mt-8 border-t border-[#e2e8f0]">
              <p className="text-sm text-[#475569] max-w-md mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
                Happy with the scope? Accept and sign below. Want to change what's included? Click Edit Scope.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setClientMode('edit')}
                  className="gap-2 px-6 py-5"
                >
                  <Pencil className="w-4 h-4" /> Edit Scope
                </Button>
                <Button
                  size="lg"
                  onClick={() => setSigningOpen(true)}
                  className="gap-2 px-8 py-5"
                >
                  <CheckCircle2 className="w-5 h-5" /> Accept & Sign
                </Button>
              </div>
            </div>
          )}

          {!proposal.accepted && proposal.superseded_by && (
            <div className="print:hidden text-center py-8 border-t border-[#e2e8f0]">
              <p className="text-sm text-[#64748b]">
                Acceptance is disabled — a revised proposal has been issued. Please use the latest version we emailed you.
              </p>
            </div>
          )}

          {mode === 'admin' && (
            <div className="print:hidden text-center py-6 border-t border-[#e2e8f0]">
              <a
                href={`/proposal/${proposal.id}?admin=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
              </a>
            </div>
          )}

          {/* Footer */}
          <footer className="border-t border-[#e2e8f0] pt-6 mt-10 flex items-center justify-between text-xs text-[#94a3b8]" style={{ fontFamily: '-apple-system, sans-serif' }}>
            <div className="flex items-center gap-2">
              <img src={logo} alt="5to10X" className="h-6 opacity-60" />
              <span>5to10X — App Development &amp; Automation</span>
            </div>
            <span>grow@5to10x.app</span>
          </footer>
        </div>
      </div>


      <SigningModal
        open={signingOpen}
        onClose={() => setSigningOpen(false)}
        proposalId={proposal.id}
        assessmentId={proposal.assessment_id}
        token={urlToken || 'admin-bypass'}
        clientName={assessment.contact_name}
        clientEmail={assessment.contact_email}
        businessName={businessName}
        selectedItems={Array.from(selectedItemIdx).sort((a, b) => a - b).map(i => proposalItems[i]).filter(Boolean).map(i => ({
          title: i.title,
          cost: i.cost ?? 0,
          weeks: i.weeks ?? 0,
          estimated_annual_impact: i.estimated_annual_impact ?? 0,
        }))}
        totals={{
          subtotalExGst: totals.subtotalExGst,
          gst: totals.gst,
          totalIncGst: totals.totalIncGst,
          totalWeeks: totals.totalWeeks,
        }}
        onAccepted={refreshProposal}
      />
    </>
  );
};

export default Proposal;
