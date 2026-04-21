import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Printer, CheckCircle2, Clock, DollarSign, Target, Wrench, Pencil, Save, X, Shield, FileText, Scale, Lock, AlertTriangle, Gavel, Users, BookOpen, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo-5to10x-color.webp';
import SigningModal from '@/components/proposal/SigningModal';

interface ProposalData {
  id: string;
  assessment_id: string;
  proposal_data: any;
  client_selection: any;
  sent_at: string;
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

interface AssessmentData {
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  business_name: string | null;
  roi_results: any;
  form_data: any;
  industry: string | null;
}

interface DeepDiveData {
  pain_points: string | null;
  primary_goals: string[] | null;
  timeline: string | null;
  budget_comfort: string | null;
  must_have_features: string | null;
  nice_to_have_features: string | null;
  required_integrations: string[] | null;
  current_website: string | null;
  current_tools: string | null;
  competitors: string | null;
  decision_maker_name: string | null;
  decision_maker_role: string | null;
  decision_timeline: string | null;
  additional_notes: string | null;
}

interface InterviewData {
  id: string;
  title: string;
  content: string | null;
  transcript: string | null;
  interviewed_at: string;
}

interface EditableContent {
  projectOverview: string;
  proposedSolution: string;
  appFeatures: string[];
  integrations: string[];
  uxDesign: string;
  deploymentSupport: string;
  expectedImpact: string[];
  deliverables: string[];
  timelinePhases: { phase: string; duration: string; desc: string }[];
  investmentAmount: number;
  investmentNote: string;
  paymentStructure: { label: string; percentage: number; description: string }[];
  clientResponsibilities: string[];
  variations: string;
  thirdPartyServices: string;
  intellectualProperty: string;
  confidentiality: string;
  dataProtection: string;
  limitationOfLiability: string;
  roiDisclaimer: string;
  termination: string;
  governingLaw: string;
  customSections: { title: string; body: string }[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });

const SectionTitle = ({ icon: Icon, number, title }: { icon: any; number: number; title: string }) => (
  <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-3">
    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">{number}</span>
    <Icon className="w-5 h-5 text-primary" />
    {title}
  </h2>
);

const EditableList = ({ items, onChange, placeholder }: { items: string[]; onChange: (items: string[]) => void; placeholder: string }) => (
  <div className="space-y-1.5">
    {items.map((item, i) => (
      <div key={i} className="flex gap-2 items-start">
        <span className="text-muted-foreground mt-2 text-xs">•</span>
        <Input value={item} onChange={e => { const u = [...items]; u[i] = e.target.value; onChange(u); }} className="text-sm flex-1" placeholder={placeholder} />
        <Button size="sm" variant="ghost" onClick={() => onChange(items.filter((_, j) => j !== i))} className="h-8 w-8 p-0 text-destructive"><X className="w-3 h-3" /></Button>
      </div>
    ))}
    <Button variant="ghost" size="sm" onClick={() => onChange([...items, ''])} className="text-xs">+ Add Item</Button>
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5">
    {items.filter(Boolean).map((item, i) => (
      <li key={i} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
        <span className="text-primary mt-1">•</span> {item}
      </li>
    ))}
  </ul>
);

const ProposalStageTracker = ({ proposal, editMode }: { proposal: ProposalData; editMode: boolean }) => {
  const activeStage = proposal.countersigned_at
    ? 4
    : proposal.accepted
      ? 3
      : proposal.superseded_by || proposal.client_revision_requested_at || (proposal.revision || 1) > 1 || editMode
        ? 2
        : 1;

  const stages = [
    { key: 'sent', label: 'Proposal sent', helper: `v${proposal.revision || 1}` },
    { key: 'scope', label: 'Scope review', helper: proposal.superseded_by ? 'Revised' : 'Select items' },
    { key: 'sign', label: 'Ready to sign', helper: proposal.accepted ? 'Signed' : 'Awaiting signature' },
    { key: 'done', label: 'Fully executed', helper: proposal.countersigned_at ? 'Completed' : 'Countersign pending' },
  ];

  return (
    <div className="mb-8 rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proposal status</p>
          <p className="text-sm text-foreground">Track exactly where this proposal is in the review and sign-off flow.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {stages.map((stage, index) => {
          const stageNumber = index + 1;
          const isComplete = stageNumber < activeStage;
          const isCurrent = stageNumber === activeStage;
          return (
            <div
              key={stage.key}
              className={`rounded-lg border p-4 ${isComplete || isCurrent ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/20'}`}
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold border border-border bg-background text-foreground">
                {stageNumber}
              </div>
              <p className="text-sm font-semibold text-foreground">{stage.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{stage.helper}</p>
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
  const initialAction = searchParams.get('action');
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [deepDive, setDeepDive] = useState<DeepDiveData | null>(null);
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestingRevision, setRequestingRevision] = useState(false);
  const [signingOpen, setSigningOpen] = useState(false);
  const [content, setContent] = useState<EditableContent | null>(null);
  // Client-selectable items: indices of items the client has chosen to include
  const [selectedItemIdx, setSelectedItemIdx] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1') {
      setIsAdmin(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setIsAdmin(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsAdmin(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Validate proposal access token (admins bypass)
  useEffect(() => {
    if (!id) return;
    if (isAdmin) {
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
      if (data && new Date(data.expires_at) > new Date()) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
      }
    })();
  }, [id, urlToken, isAdmin]);


  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data: prop } = await supabase.from('proposals').select('*').eq('id', id).single();
      if (!prop) { setLoading(false); return; }
      
      setProposal(prop as ProposalData);
      const pData = (prop as ProposalData).proposal_data || {};

      const { data: assess } = await supabase
        .from('roi_assessments')
        .select('contact_name, contact_email, contact_phone, business_name, roi_results, form_data, industry')
        .eq('id', prop.assessment_id)
        .single();
      if (assess) setAssessment(assess as AssessmentData);

      const { data: dd } = await supabase
        .from('deep_dive_submissions')
        .select('*')
        .eq('assessment_id', prop.assessment_id)
        .single();
      if (dd) setDeepDive(dd as DeepDiveData);

      const { data: intData } = await supabase
        .from('client_interviews')
        .select('id, title, content, transcript, interviewed_at')
        .eq('assessment_id', prop.assessment_id)
        .order('interviewed_at', { ascending: true });
      if (intData) setInterviews(intData as InterviewData[]);

      // Initialize content from saved proposal_data
      setContent({
        projectOverview: pData.projectOverview || '',
        proposedSolution: pData.proposedSolution || '',
        appFeatures: pData.appFeatures || [],
        integrations: pData.integrations || [],
        uxDesign: pData.uxDesign || '',
        deploymentSupport: pData.deploymentSupport || '',
        expectedImpact: pData.expectedImpact || [],
        deliverables: pData.deliverables || [],
        timelinePhases: pData.timelinePhases || [],
        investmentAmount: pData.investmentAmount || 0,
        investmentNote: pData.investmentNote || '',
        paymentStructure: pData.paymentStructure || [
          { label: 'Deposit', percentage: 40, description: 'Payable upon acceptance of this proposal to commence work.' },
          { label: 'Development Milestone', percentage: 30, description: 'Payable at agreed development milestone.' },
          { label: 'Completion', percentage: 30, description: 'Prior to deployment or delivery of the final application.' },
        ],
        clientResponsibilities: pData.clientResponsibilities || [],
        variations: pData.variations || '',
        thirdPartyServices: pData.thirdPartyServices || '',
        intellectualProperty: pData.intellectualProperty || '',
        confidentiality: pData.confidentiality || '',
        dataProtection: pData.dataProtection || '',
        limitationOfLiability: pData.limitationOfLiability || '',
        roiDisclaimer: pData.roiDisclaimer || '',
        termination: pData.termination || '',
        governingLaw: pData.governingLaw || '',
        customSections: pData.customSections || [],
      });

      // Initialize selectable items: prefer the client's prior saved selection,
      // otherwise default to all items selected.
      const items: ProposalItem[] = Array.isArray(pData.items) ? pData.items : [];
      const cs = (prop as any).client_selection || {};
      if (Array.isArray(cs.selected_indexes) && cs.selected_indexes.length > 0) {
        setSelectedItemIdx(new Set(cs.selected_indexes as number[]));
      } else {
        setSelectedItemIdx(new Set(items.map((_, i) => i)));
      }

      setLoading(false);
    };
    fetchData();
  }, [id]);

  // ----- Client-selectable items helpers -----
  const proposalItems: ProposalItem[] = useMemo(() => {
    const pData = proposal?.proposal_data || {};
    return Array.isArray(pData.items) ? (pData.items as ProposalItem[]) : [];
  }, [proposal]);

  const hasSelectableItems = proposalItems.length > 0;

  const toggleSelectedItem = (idx: number) => {
    if (proposal?.accepted) return;
    const item = proposalItems[idx];
    if (item?.locked) return;
    setSelectedItemIdx(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const selectionTotals = useMemo(() => {
    const GST_RATE = 0.10;
    const DEPOSIT_PCT = 0.10;
    const MVP_PCT = 0.50;
    const subtotalExGst = proposalItems
      .filter((_, i) => selectedItemIdx.has(i))
      .reduce((sum, i) => sum + (typeof i.cost === 'number' ? i.cost : 0), 0);
    const gst = Math.round(subtotalExGst * GST_RATE);
    const totalIncGst = subtotalExGst + gst;
    const deposit = Math.round(subtotalExGst * DEPOSIT_PCT);
    const mvp = Math.round(subtotalExGst * MVP_PCT);
    const final = subtotalExGst - deposit - mvp;
    let maxBigHit = 0;
    let quickWinWeeks = 0;
    proposalItems.forEach((i, idx) => {
      if (!selectedItemIdx.has(idx)) return;
      const w = typeof i.weeks === 'number' ? i.weeks : 0;
      if (i._type === 'big_hit') maxBigHit = Math.max(maxBigHit, w);
      else quickWinWeeks += w * 0.5;
    });
    const totalWeeks = Math.ceil(maxBigHit + quickWinWeeks) || 0;
    return { subtotalExGst, gst, totalIncGst, deposit, mvp, final, totalWeeks };
  }, [proposalItems, selectedItemIdx]);

  const handleSave = async () => {
    if (!proposal || !content) return;
    setSaving(true);
    const newData = { ...(proposal.proposal_data || {}), ...content };
    const { error } = await supabase.from('proposals').update({ proposal_data: newData }).eq('id', proposal.id);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      setProposal(prev => prev ? { ...prev, proposal_data: newData } : null);
      toast({ title: 'Proposal saved ✅' });
      setEditing(false);
    }
    setSaving(false);
  };

  const refreshProposal = async () => {
    if (!id) return;
    const { data } = await supabase.from('proposals').select('*').eq('id', id).single();
    if (data) setProposal(data as ProposalData);
  };

  const openSigning = () => {
    if (!proposal) return;
    if (hasSelectableItems && selectedItemIdx.size === 0) {
      toast({
        title: 'Select at least one item',
        description: 'Tick the items you want to proceed with before accepting.',
        variant: 'destructive',
      });
      return;
    }
    setSigningOpen(true);
  };

  const handleRequestRevision = async () => {
    if (!proposal || !id) return;
    if (!urlToken && !isAdmin) {
      toast({ title: 'Missing access token', description: 'Please open this proposal from the email link we sent you.', variant: 'destructive' });
      return;
    }
    setRequestingRevision(true);
    const selectedIndexes = Array.from(selectedItemIdx).sort((a, b) => a - b);
    const selectedItems = selectedIndexes.map(i => proposalItems[i]).filter(Boolean).map(i => ({
      title: i.title,
      cost: i.cost ?? 0,
      weeks: i.weeks ?? 0,
      _type: i._type,
      estimated_annual_impact: i.estimated_annual_impact ?? 0,
    }));

    const { data, error } = await supabase.functions.invoke('request-proposal-revision', {
      body: {
        proposalId: id,
        token: urlToken || 'admin-bypass',
        selectedIndexes,
        selectedItems,
        totals: selectionTotals,
      },
    });
    setRequestingRevision(false);
    if (error || !(data as any)?.success) {
      toast({
        title: 'Could not send revision request',
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
  };

  const updateTimeline = (index: number, field: string, value: string) => {
    if (!content) return;
    const updated = [...content.timelinePhases];
    updated[index] = { ...updated[index], [field]: value };
    setContent({ ...content, timelinePhases: updated });
  };

  const updatePayment = (index: number, field: string, value: string | number) => {
    if (!content) return;
    const updated = [...content.paymentStructure];
    updated[index] = { ...updated[index], [field]: value };
    setContent({ ...content, paymentStructure: updated });
  };

  // Auto-open signing modal when ?action=accept arrives via the email CTA.
  useEffect(() => {
    if (initialAction === 'accept' && tokenValid && !loading && proposal && !proposal.accepted && !proposal.superseded_by) {
      setSigningOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction, tokenValid, loading, proposal?.id]);

  if (loading || tokenValid === null) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!proposal || !assessment || !content) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Proposal not found.</p></div>;
  }
  if (!isAdmin && tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center space-y-3">
          <Lock className="w-10 h-10 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Access link required</h1>
          <p className="text-sm text-muted-foreground">
            This proposal can only be opened from the personalised link we emailed you. If your link has expired or you can't find the email, please reply to <a href="mailto:grow@5to10x.app" className="underline">grow@5to10x.app</a> and we'll send you a fresh one.
          </p>
        </div>
      </div>
    );
  }

  const roi = assessment.roi_results as any;
  const businessName = assessment.business_name || 'your business';
  const showClientEditFlow = !isAdmin && !proposal.accepted && !proposal.superseded_by && initialAction !== 'accept';
  const showClientAcceptFlow = !isAdmin && !proposal.accepted && !proposal.superseded_by && initialAction === 'accept';

  return (
    <>
      {/* Action buttons */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        {isAdmin && !editing && (
          <Button variant="outline" onClick={() => setEditing(true)} className="gap-2 shadow-lg"><Pencil className="w-4 h-4" /> Edit</Button>
        )}
        {editing && (
          <>
            <Button variant="outline" onClick={() => setEditing(false)} className="gap-2 shadow-lg"><X className="w-4 h-4" /> Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </Button>
          </>
        )}
        <Button onClick={() => window.print()} className="gap-2 shadow-lg"><Printer className="w-4 h-4" /> Print / PDF</Button>
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .page-break { break-before: page; }
          @page { margin: 0.6in; size: A4; }
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground [--muted-foreground:230_20%_25%]">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {proposal.superseded_by && (
            <div className="print:hidden mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-bold text-amber-700">This proposal has been replaced by a newer version</p>
                <p className="text-amber-700/80 mt-1">
                  You're viewing v{proposal.revision || 1}. A revised proposal has been sent — please check your inbox for the latest version, or{' '}
                  <a href={`/proposal/${proposal.superseded_by}`} className="underline font-medium">view the latest revision</a>.
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <img src={logo} alt="5to10X" className="h-14" />
            <div className="text-right text-sm text-muted-foreground">
              <p>Proposal #{proposal.id.slice(0, 8).toUpperCase()}</p>
              <p>{formatDate(proposal.sent_at)}</p>
            </div>
          </div>

          {/* Title Block */}
          <div className="mb-8 pb-8 border-b border-border">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">App Development & Automation Proposal</h1>
            <p className="text-sm text-muted-foreground mb-1">Including Terms of Engagement</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Prepared for:</span> <strong className="text-foreground">{assessment.contact_name}</strong>{assessment.business_name && <> at <strong className="text-foreground">{assessment.business_name}</strong></>}</div>
              <div><span className="text-muted-foreground">Prepared by:</span> <strong className="text-foreground">5to10X</strong></div>
              <div><span className="text-muted-foreground">Date:</span> <strong className="text-foreground">{formatDate(proposal.sent_at)}</strong></div>
              {assessment.industry && <div><span className="text-muted-foreground">Industry:</span> <strong className="text-foreground">{assessment.industry}</strong></div>}
            </div>
          </div>

          {/* Accepted banner */}
          {proposal.accepted && (
            <div className="flex items-center gap-3 bg-primary/10 text-primary border border-primary/20 rounded-lg px-5 py-3 mb-8">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm">Proposal Accepted</p>
                {proposal.accepted_at && <p className="text-xs opacity-80">{formatDate(proposal.accepted_at)}</p>}
              </div>
            </div>
          )}

          <ProposalStageTracker proposal={proposal} editMode={showClientEditFlow} />

          {/* 1. Project Overview */}
          <section className="mb-10">
            <SectionTitle icon={Target} number={1} title="Project Overview" />
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              {editing ? (
                <Textarea value={content.projectOverview} onChange={e => setContent({ ...content, projectOverview: e.target.value })}
                  className="text-sm min-h-[200px]" />
              ) : (
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {content.projectOverview || 'No project overview generated. Please re-prepare this proposal from the admin dashboard.'}
                </div>
              )}
              {/* ROI summary stats */}
              {roi?.totalAnnualImpact && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{formatCurrency(roi.totalAnnualImpact)}</p>
                    <p className="text-xs text-muted-foreground">Projected Annual Impact</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{Math.round(roi.roiPercentage || 0)}%</p>
                    <p className="text-xs text-muted-foreground">Projected ROI</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{Math.round(roi.breakEvenMonths || 0)} mo</p>
                    <p className="text-xs text-muted-foreground">Break-even</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{roi.pricing?.tierLabel || '—'}</p>
                    <p className="text-xs text-muted-foreground">Recommended Tier</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2. Proposed Solution */}
          <section className="mb-10">
            <SectionTitle icon={Wrench} number={2} title="Proposed Solution" />
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              {/* Solution narrative */}
              {(content.proposedSolution || editing) && (
                <div>
                  {editing ? (
                    <Textarea value={content.proposedSolution} onChange={e => setContent({ ...content, proposedSolution: e.target.value })}
                      className="text-sm min-h-[120px]" />
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mb-4">{content.proposedSolution}</p>
                  )}
                </div>
              )}

              {/* Application Features */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Application Development</h3>
                {editing ? (
                  <EditableList items={content.appFeatures} onChange={items => setContent({ ...content, appFeatures: items })} placeholder="Feature description" />
                ) : (
                  <BulletList items={content.appFeatures} />
                )}
              </div>

              {/* Integrations */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">System Integrations</h3>
                {editing ? (
                  <EditableList items={content.integrations} onChange={items => setContent({ ...content, integrations: items })} placeholder="Integration" />
                ) : (
                  <BulletList items={content.integrations} />
                )}
              </div>

              {/* UX Design */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">User Experience Design</h3>
                {editing ? (
                  <Textarea value={content.uxDesign} onChange={e => setContent({ ...content, uxDesign: e.target.value })}
                    className="text-sm min-h-[80px]" />
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{content.uxDesign}</p>
                )}
              </div>

              {/* Deployment */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">Deployment Support</h3>
                {editing ? (
                  <Textarea value={content.deploymentSupport} onChange={e => setContent({ ...content, deploymentSupport: e.target.value })}
                    className="text-sm min-h-[80px]" />
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{content.deploymentSupport}</p>
                )}
              </div>
            </div>
          </section>

          {/* 3. Expected Business Impact */}
          <section className="mb-10">
            <SectionTitle icon={Target} number={3} title="Expected Business Impact" />
            <div className="bg-card border border-border rounded-lg p-6">
              {editing ? (
                <EditableList items={content.expectedImpact} onChange={items => setContent({ ...content, expectedImpact: items })} placeholder="Impact area" />
              ) : (
                <>
                  <BulletList items={content.expectedImpact} />
                  {roi?.totalAnnualImpact && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm font-semibold text-foreground">Total Projected Annual Impact: <span className="text-primary">{formatCurrency(roi.totalAnnualImpact)}</span></p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    These projections are indicative only and rely on the accuracy of data provided during intake.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* 4. Project Deliverables */}
          <section className="mb-10">
            <SectionTitle icon={FileText} number={4} title="Project Deliverables" />
            <div className="bg-card border border-border rounded-lg p-6">
              {editing ? (
                <EditableList items={content.deliverables} onChange={items => setContent({ ...content, deliverables: items })} placeholder="Deliverable" />
              ) : (
                <>
                  <BulletList items={content.deliverables} />
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    Specific features and technical specifications will be confirmed prior to development.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* 4b. Build Scope Selector — client picks which items to include */}
          {hasSelectableItems && (isAdmin || showClientEditFlow || proposal.accepted) && (
            <section className="mb-10">
              <SectionTitle icon={Sparkles} number={5} title="Choose Your Build Scope" />
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We've recommended {proposalItems.length} items based on your assessment.
                  {proposal.accepted
                    ? ' You selected the following scope at acceptance:'
                    : ' Tick the items you want to proceed with — your investment, payment schedule and timeline below will update live.'}
                </p>

                <div className="space-y-2">
                  {proposalItems.map((item, idx) => {
                    const isSelected = selectedItemIdx.has(idx);
                    const isLocked = !!item.locked;
                    const disabled = !!proposal.accepted || isLocked;
                    return (
                      <label
                        key={idx}
                        htmlFor={`scope-item-${idx}`}
                        className={`block rounded-lg border p-3 transition-all ${disabled ? 'cursor-default' : 'cursor-pointer'} ${isSelected ? 'border-primary/40 bg-primary/5' : 'border-border bg-secondary/20 opacity-70'}`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`scope-item-${idx}`}
                            checked={isSelected}
                            disabled={disabled}
                            onCheckedChange={() => toggleSelectedItem(idx)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-foreground">{item.title}</span>
                              {item._type && (
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                                  {item._type === 'big_hit' ? 'Big Hit' : 'Quick Win'}
                                </span>
                              )}
                              {isLocked && (
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

                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 mt-2">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Your selection</p>
                      <p className="text-sm font-bold text-foreground">{selectedItemIdx.size} of {proposalItems.length} items · ~{selectionTotals.totalWeeks} weeks</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Investment (inc GST)</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(selectionTotals.totalIncGst)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatCurrency(selectionTotals.subtotalExGst)} ex GST + {formatCurrency(selectionTotals.gst)} GST</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 5. Project Timeline */}
          <section className="mb-10 page-break">
            <SectionTitle icon={Clock} number={5} title="Project Timeline" />
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="space-y-3">
                {content.timelinePhases.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                    {editing ? (
                      <div className="flex-1 space-y-1">
                        <div className="flex gap-2">
                          <Input value={step.phase} onChange={e => updateTimeline(i, 'phase', e.target.value)} className="text-sm font-semibold" />
                          <Input value={step.duration} onChange={e => updateTimeline(i, 'duration', e.target.value)} className="text-sm w-32" />
                          <Button size="sm" variant="ghost" onClick={() => setContent({ ...content, timelinePhases: content.timelinePhases.filter((_, j) => j !== i) })} className="h-8 w-8 p-0 text-destructive"><X className="w-3 h-3" /></Button>
                        </div>
                        <Input value={step.desc} onChange={e => updateTimeline(i, 'desc', e.target.value)} className="text-xs" />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-foreground">{step.phase} <span className="text-muted-foreground font-normal">({step.duration})</span></p>
                        <p className="text-xs text-muted-foreground">{step.desc}</p>
                      </div>
                    )}
                  </div>
                ))}
                {editing && (
                  <Button variant="ghost" size="sm" onClick={() => setContent({ ...content, timelinePhases: [...content.timelinePhases, { phase: 'New Phase', duration: '1–2 weeks', desc: '' }] })} className="text-xs ml-12">+ Add Phase</Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-6 italic">
                Project timelines are estimates and may vary depending on scope changes, client feedback timelines, integration complexity, and third-party platform availability.
              </p>
            </div>
          </section>

          {/* 6. Investment */}
          <section className="mb-10">
            <SectionTitle icon={DollarSign} number={6} title="Investment" />
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="text-center bg-primary/5 rounded-lg p-6 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-2">
                  {hasSelectableItems ? 'Total Project Investment (inc GST, based on your selection)' : 'Total Project Investment'}
                </p>
                {hasSelectableItems ? (
                  <p className="text-3xl font-bold text-primary">{formatCurrency(selectionTotals.totalIncGst)}</p>
                ) : editing ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-primary">$</span>
                    <Input type="number" value={content.investmentAmount} onChange={e => setContent({ ...content, investmentAmount: parseInt(e.target.value) || 0 })}
                      className="text-2xl font-bold text-primary w-40 text-center" />
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-primary">{formatCurrency(content.investmentAmount)}</p>
                )}
              </div>

              {/* Budget context note */}
              {content.investmentNote && (
                <div className="bg-secondary/30 rounded-lg p-3">
                  {editing ? (
                    <Input value={content.investmentNote} onChange={e => setContent({ ...content, investmentNote: e.target.value })} className="text-xs" />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">{content.investmentNote}</p>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-bold text-foreground mb-3">Payment Structure</p>
                <div className="space-y-3">
                  {content.paymentStructure.map((ps, i) => (
                    <div key={i} className="flex items-start gap-4 bg-secondary/30 rounded-lg p-3">
                      {editing ? (
                        <div className="flex-1 space-y-1">
                          <div className="flex gap-2 items-center">
                            <Input value={ps.label} onChange={e => updatePayment(i, 'label', e.target.value)} className="text-sm font-semibold flex-1" />
                            <Input type="number" value={ps.percentage} onChange={e => updatePayment(i, 'percentage', parseInt(e.target.value) || 0)} className="text-sm w-20 text-center" />
                            <span className="text-sm text-muted-foreground">%</span>
                            <Button size="sm" variant="ghost" onClick={() => setContent({ ...content, paymentStructure: content.paymentStructure.filter((_, j) => j !== i) })} className="h-8 w-8 p-0 text-destructive"><X className="w-3 h-3" /></Button>
                          </div>
                          <Input value={ps.description} onChange={e => updatePayment(i, 'description', e.target.value)} className="text-xs" />
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">{ps.percentage}%</div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{ps.label} – {formatCurrency((hasSelectableItems ? selectionTotals.subtotalExGst : content.investmentAmount) * ps.percentage / 100)}</p>
                            <p className="text-xs text-muted-foreground">{ps.description}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {editing && (
                    <Button variant="ghost" size="sm" onClick={() => setContent({ ...content, paymentStructure: [...content.paymentStructure, { label: 'New Payment', percentage: 0, description: '' }] })} className="text-xs">+ Add Payment Stage</Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">Invoices are payable within 7 days unless otherwise agreed. Late payments may delay project progress.</p>
            </div>
          </section>

          {/* 7. Client Responsibilities */}
          <section className="mb-10">
            <SectionTitle icon={Users} number={7} title="Client Responsibilities" />
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-3">To ensure successful delivery, the Client agrees to:</p>
              {editing ? (
                <EditableList items={content.clientResponsibilities} onChange={items => setContent({ ...content, clientResponsibilities: items })} placeholder="Responsibility" />
              ) : (
                <BulletList items={content.clientResponsibilities} />
              )}
              <p className="text-xs text-muted-foreground mt-4 italic">Delays in providing required information may result in project timeline adjustments.</p>
            </div>
          </section>

          {/* Custom Sections */}
          {content.customSections.map((section, i) => (
            <section key={`custom-${i}`} className="mb-10">
              {editing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input value={section.title} onChange={e => { const u = [...content.customSections]; u[i] = { ...u[i], title: e.target.value }; setContent({ ...content, customSections: u }); }} className="text-xl font-bold" />
                    <Button size="sm" variant="destructive" onClick={() => setContent({ ...content, customSections: content.customSections.filter((_, j) => j !== i) })} className="h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
                  </div>
                  <Textarea value={section.body} onChange={e => { const u = [...content.customSections]; u[i] = { ...u[i], body: e.target.value }; setContent({ ...content, customSections: u }); }} className="text-sm min-h-[80px]" />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">{section.title}</h2>
                  <div className="bg-card border border-border rounded-lg p-6">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{section.body}</p>
                  </div>
                </>
              )}
            </section>
          ))}
          {editing && (
            <div className="mb-10">
              <Button variant="outline" onClick={() => setContent({ ...content, customSections: [...content.customSections, { title: 'New Section', body: '' }] })} className="gap-2 text-sm">+ Add Custom Section</Button>
            </div>
          )}

          {/* 8-17: Legal / Terms Sections */}
          {[
            { num: 8, icon: Wrench, title: 'Variations', field: 'variations' as const },
            { num: 9, icon: Shield, title: 'Third-Party Services', field: 'thirdPartyServices' as const },
            { num: 10, icon: BookOpen, title: 'Intellectual Property', field: 'intellectualProperty' as const },
            { num: 11, icon: Lock, title: 'Confidentiality', field: 'confidentiality' as const },
            { num: 12, icon: Shield, title: 'Data Protection', field: 'dataProtection' as const },
            { num: 13, icon: AlertTriangle, title: 'Limitation of Liability', field: 'limitationOfLiability' as const },
            { num: 14, icon: DollarSign, title: 'ROI Estimates', field: 'roiDisclaimer' as const },
            { num: 15, icon: Gavel, title: 'Termination', field: 'termination' as const },
            { num: 16, icon: Scale, title: 'Governing Law', field: 'governingLaw' as const },
          ].map(({ num, icon, title, field }) => (
            <section key={field} className="mb-8">
              <SectionTitle icon={icon} number={num} title={title} />
              <div className="bg-card border border-border rounded-lg p-6">
                {editing ? (
                  <Textarea value={content[field]} onChange={e => setContent({ ...content, [field]: e.target.value })} className="text-sm min-h-[80px]" />
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{content[field]}</p>
                )}
              </div>
            </section>
          ))}

          {/* 17. Acceptance */}
          <section className="mb-10 page-break">
            <SectionTitle icon={CheckCircle2} number={17} title="Acceptance of Proposal" />
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                By accepting this proposal, the Client confirms they understand the scope and investment, agree to the terms outlined in this document, and authorise the Developer to commence work upon receipt of the deposit.
              </p>

              {proposal.accepted ? (
                <div className="flex items-center gap-3 bg-green-500/10 text-green-700 border border-green-500/20 rounded-lg px-5 py-4">
                  <CheckCircle2 className="w-6 h-6" />
                  <div>
                    <p className="font-bold">Accepted by {assessment.contact_name}</p>
                    {proposal.accepted_at && <p className="text-sm opacity-80">{formatDate(proposal.accepted_at)}</p>}
                  </div>
                </div>
              ) : (
                <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Client</p>
                    <p className="text-sm text-foreground font-semibold">{assessment.contact_name}</p>
                    <p className="text-sm text-muted-foreground">{businessName}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Developer</p>
                    <p className="text-sm text-foreground font-semibold">5to10X</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {!proposal.accepted && !proposal.superseded_by && showClientEditFlow && (
            <div className="print:hidden text-center py-8 space-y-4">
              <Button
                size="lg"
                variant="outline"
                onClick={handleRequestRevision}
                disabled={requestingRevision}
                className="gap-2 text-base px-8 py-6"
              >
                {requestingRevision ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Send Me This Revised Proposal
              </Button>
              <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                We’ll generate a new revision from your selected scope and email the updated proposal back to you.
              </p>
            </div>
          )}
          {!proposal.accepted && !proposal.superseded_by && showClientAcceptFlow && (
            <div className="print:hidden text-center py-8 space-y-4">
              <Button
                size="lg"
                onClick={openSigning}
                className="gap-2 text-base px-10 py-6"
              >
                <CheckCircle2 className="w-5 h-5" />
                Accept &amp; Sign Proposal
              </Button>
              <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                This opens the engagement agreement and signature flow for this proposal version.
              </p>
            </div>
          )}
          {!proposal.accepted && proposal.superseded_by && (
            <div className="print:hidden text-center py-8">
              <p className="text-sm text-muted-foreground">
                Acceptance is disabled — a revised proposal has been issued. Please use the latest version.
              </p>
            </div>
          )}

          {/* Footer */}
          <footer className="border-t border-border pt-6 mt-10 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <img src={logo} alt="5to10X" className="h-6 opacity-50" />
              <span>5to10X — App Development &amp; Automation</span>
            </div>
            <span>grow@5to10x.app</span>
          </footer>
        </div>
      </div>

      {/* DocuSign-style signing modal */}
      <SigningModal
        open={signingOpen}
        onClose={() => setSigningOpen(false)}
        proposalId={proposal.id}
        assessmentId={proposal.assessment_id}
        token={urlToken || 'admin-bypass'}
        clientName={assessment.contact_name}
        clientEmail={assessment.contact_email}
        businessName={businessName}
        selectedItems={(hasSelectableItems
          ? Array.from(selectedItemIdx).sort((a, b) => a - b).map(i => proposalItems[i]).filter(Boolean)
          : []
        ).map(i => ({
          title: i.title,
          cost: i.cost ?? 0,
          weeks: i.weeks ?? 0,
          estimated_annual_impact: i.estimated_annual_impact ?? 0,
        }))}
        totals={{
          subtotalExGst: hasSelectableItems ? selectionTotals.subtotalExGst : (content?.investmentAmount || 0),
          gst: hasSelectableItems ? selectionTotals.gst : Math.round((content?.investmentAmount || 0) * 0.10),
          totalIncGst: hasSelectableItems ? selectionTotals.totalIncGst : Math.round((content?.investmentAmount || 0) * 1.10),
          totalWeeks: hasSelectableItems ? selectionTotals.totalWeeks : 0,
        }}
        onAccepted={refreshProposal}
      />
    </>
  );
};

export default Proposal;
