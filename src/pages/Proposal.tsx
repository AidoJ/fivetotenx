import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Printer, CheckCircle2, Clock, DollarSign, Target, Wrench, Calendar, Pencil, Save, X, Shield, FileText, Scale, Lock, AlertTriangle, Gavel, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo-5to10x-color.png';

interface ProposalData {
  id: string;
  assessment_id: string;
  proposal_data: any;
  sent_at: string;
  accepted: boolean;
  accepted_at: string | null;
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

const Proposal = () => {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [deepDive, setDeepDive] = useState<DeepDiveData | null>(null);
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<EditableContent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setIsAdmin(!!session));
    return () => subscription.unsubscribe();
  }, []);

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

      setLoading(false);
    };
    fetchData();
  }, [id]);

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

  const handleAccept = async () => {
    if (!proposal) return;
    setAccepting(true);
    await supabase.from('proposals').update({ accepted: true, accepted_at: new Date().toISOString() }).eq('id', proposal.id);
    await supabase.from('roi_assessments').update({ pipeline_stage: 'signed' as any }).eq('id', proposal.assessment_id);
    setProposal(prev => prev ? { ...prev, accepted: true, accepted_at: new Date().toISOString() } : null);
    setAccepting(false);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!proposal || !assessment || !content) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Proposal not found.</p></div>;

  const roi = assessment.roi_results as any;
  const businessName = assessment.business_name || 'your business';

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

      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-8 py-12">

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
            <div className="flex items-center gap-3 bg-green-500/10 text-green-700 border border-green-500/20 rounded-lg px-5 py-3 mb-8">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm">Proposal Accepted</p>
                {proposal.accepted_at && <p className="text-xs opacity-80">{formatDate(proposal.accepted_at)}</p>}
              </div>
            </div>
          )}

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
                <p className="text-xs text-muted-foreground mb-2">Total Project Investment</p>
                {editing ? (
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
                            <p className="text-sm font-semibold text-foreground">{ps.label} – {formatCurrency(content.investmentAmount * ps.percentage / 100)}</p>
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

          {/* Accept CTA */}
          {!proposal.accepted && (
            <div className="print:hidden text-center py-8">
              <Button size="lg" onClick={handleAccept} disabled={accepting} className="gap-2 text-base px-10 py-6">
                {accepting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Accept Proposal
              </Button>
              <p className="text-xs text-muted-foreground mt-3">By accepting, you agree to the terms outlined above.</p>
            </div>
          )}

          {/* Footer */}
          <footer className="border-t border-border pt-6 mt-10 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <img src={logo} alt="5to10X" className="h-6 opacity-50" />
              <span>5to10X — App Development & Automation</span>
            </div>
            <span>grow@5to10x.app</span>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Proposal;
