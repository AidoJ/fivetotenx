import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Printer, CheckCircle2, Clock, DollarSign, Target, Wrench, Calendar, Pencil, Save, X } from 'lucide-react';
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
  business_name: string | null;
  roi_results: any;
  form_data: any;
}

interface DeepDiveData {
  pain_points: string | null;
  primary_goals: string[] | null;
  timeline: string | null;
  budget_comfort: string | null;
  must_have_features: string | null;
  nice_to_have_features: string | null;
  required_integrations: string[] | null;
}

interface EditableContent {
  executiveSummary: string;
  scopeNotes: string;
  investmentNotes: string;
  timelinePhases: { phase: string; duration: string; desc: string }[];
  terms: string[];
  customSections: { title: string; body: string }[];
}

const DEFAULT_TIMELINE = [
  { phase: 'Discovery & Planning', duration: '1–2 weeks', desc: 'Finalize scope, wireframes, and technical architecture' },
  { phase: 'Design & Prototyping', duration: '1–2 weeks', desc: 'UI/UX design, interactive prototypes, and feedback rounds' },
  { phase: 'Development', duration: '4–8 weeks', desc: 'Core feature build, integrations, and iterative testing' },
  { phase: 'Launch & Support', duration: '1–2 weeks', desc: 'Final QA, deployment, training, and handoff' },
];

const DEFAULT_TERMS = [
  'This proposal is valid for 30 days from the date of issue.',
  'Payment terms: 50% upfront, 25% at midpoint, 25% at launch.',
  'All work includes 30 days of post-launch support and bug fixes.',
  'Client owns all custom code and assets produced during the project.',
  'Scope changes after acceptance may affect timeline and pricing.',
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const Proposal = () => {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [deepDive, setDeepDive] = useState<DeepDiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<EditableContent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const { data: prop } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .single();

      if (prop) {
        setProposal(prop as ProposalData);
        const pData = (prop as ProposalData).proposal_data || {};

        const { data: assess } = await supabase
          .from('roi_assessments')
          .select('contact_name, contact_email, business_name, roi_results, form_data')
          .eq('id', prop.assessment_id)
          .single();
        if (assess) setAssessment(assess as AssessmentData);

        const { data: dd } = await supabase
          .from('deep_dive_submissions')
          .select('pain_points, primary_goals, timeline, budget_comfort, must_have_features, nice_to_have_features, required_integrations')
          .eq('assessment_id', prop.assessment_id)
          .single();
        if (dd) setDeepDive(dd as DeepDiveData);

        // Initialize editable content from proposal_data or defaults
        setContent({
          executiveSummary: pData.executiveSummary || '',
          scopeNotes: pData.scopeNotes || '',
          investmentNotes: pData.investmentNotes || '',
          timelinePhases: pData.timelinePhases || DEFAULT_TIMELINE,
          terms: pData.terms || DEFAULT_TERMS,
          customSections: pData.customSections || [],
        });
      }

      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (!proposal || !content) return;
    setSaving(true);
    const newData = { ...(proposal.proposal_data || {}), ...content };
    const { error } = await supabase
      .from('proposals')
      .update({ proposal_data: newData })
      .eq('id', proposal.id);
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
    await supabase
      .from('proposals')
      .update({ accepted: true, accepted_at: new Date().toISOString() })
      .eq('id', proposal.id);
    await supabase
      .from('roi_assessments')
      .update({ pipeline_stage: 'signed' as any })
      .eq('id', proposal.assessment_id);
    setProposal(prev => prev ? { ...prev, accepted: true, accepted_at: new Date().toISOString() } : null);
    setAccepting(false);
  };

  const updateTimeline = (index: number, field: string, value: string) => {
    if (!content) return;
    const updated = [...content.timelinePhases];
    updated[index] = { ...updated[index], [field]: value };
    setContent({ ...content, timelinePhases: updated });
  };

  const addTimelinePhase = () => {
    if (!content) return;
    setContent({ ...content, timelinePhases: [...content.timelinePhases, { phase: 'New Phase', duration: '1 week', desc: '' }] });
  };

  const removeTimelinePhase = (index: number) => {
    if (!content) return;
    setContent({ ...content, timelinePhases: content.timelinePhases.filter((_, i) => i !== index) });
  };

  const updateTerm = (index: number, value: string) => {
    if (!content) return;
    const updated = [...content.terms];
    updated[index] = value;
    setContent({ ...content, terms: updated });
  };

  const addTerm = () => {
    if (!content) return;
    setContent({ ...content, terms: [...content.terms, ''] });
  };

  const removeTerm = (index: number) => {
    if (!content) return;
    setContent({ ...content, terms: content.terms.filter((_, i) => i !== index) });
  };

  const addCustomSection = () => {
    if (!content) return;
    setContent({ ...content, customSections: [...content.customSections, { title: 'New Section', body: '' }] });
  };

  const updateCustomSection = (index: number, field: 'title' | 'body', value: string) => {
    if (!content) return;
    const updated = [...content.customSections];
    updated[index] = { ...updated[index], [field]: value };
    setContent({ ...content, customSections: updated });
  };

  const removeCustomSection = (index: number) => {
    if (!content) return;
    setContent({ ...content, customSections: content.customSections.filter((_, i) => i !== index) });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposal || !assessment || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Proposal not found.</p>
      </div>
    );
  }

  const roi = assessment.roi_results as any;
  const defaultSummary = `Based on our ROI assessment and deep dive analysis, we've identified a significant opportunity to grow ${assessment.business_name || 'your business'} through a custom-built application.`;
  const summaryText = content.executiveSummary || defaultSummary;

  return (
    <>
      {/* Action buttons - hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        {isAdmin && !editing && (
          <Button variant="outline" onClick={() => setEditing(true)} className="gap-2 shadow-lg">
            <Pencil className="w-4 h-4" /> Edit Proposal
          </Button>
        )}
        {editing && (
          <>
            <Button variant="outline" onClick={() => setEditing(false)} className="gap-2 shadow-lg">
              <X className="w-4 h-4" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </Button>
          </>
        )}
        <Button onClick={() => window.print()} className="gap-2 shadow-lg">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .page-break { break-before: page; }
          @page { margin: 0.5in; size: A4; }
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between mb-12">
            <img src={logo} alt="5to10X" className="h-14" />
            <div className="text-right text-sm text-muted-foreground">
              <p>Proposal #{proposal.id.slice(0, 8).toUpperCase()}</p>
              <p>{formatDate(proposal.sent_at)}</p>
            </div>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Custom App Proposal</h1>
            <p className="text-lg text-muted-foreground">
              Prepared for <strong className="text-foreground">{assessment.contact_name}</strong>
              {assessment.business_name && <> at <strong className="text-foreground">{assessment.business_name}</strong></>}
            </p>
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

          {/* Executive Summary */}
          <section className="mb-10">
            <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Executive Summary
            </h2>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              {editing ? (
                <Textarea
                  value={content.executiveSummary}
                  onChange={e => setContent({ ...content, executiveSummary: e.target.value })}
                  placeholder={defaultSummary}
                  className="text-sm min-h-[80px]"
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{summaryText}</p>
              )}
              {roi?.totalAnnualImpact && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{formatCurrency(roi.totalAnnualImpact)}</p>
                    <p className="text-xs text-muted-foreground">Annual Impact</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{Math.round(roi.roiPercentage || 0)}%</p>
                    <p className="text-xs text-muted-foreground">Projected ROI</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{Math.round(roi.breakEvenMonths || 0)}</p>
                    <p className="text-xs text-muted-foreground">Break-even (months)</p>
                  </div>
                  {roi?.pricing && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{roi.pricing.tierLabel}</p>
                      <p className="text-xs text-muted-foreground">Recommended Tier</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Scope / Needs */}
          {(deepDive || editing) && (
            <section className="mb-10">
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" /> Understanding Your Needs
              </h2>
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                {deepDive?.pain_points && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Key Challenges</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{deepDive.pain_points}</p>
                  </div>
                )}
                {deepDive?.primary_goals && deepDive.primary_goals.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Primary Goals</p>
                    <div className="flex flex-wrap gap-2">
                      {deepDive.primary_goals.map((g, i) => (
                        <span key={i} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{g}</span>
                      ))}
                    </div>
                  </div>
                )}
                {deepDive?.must_have_features && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Must-Have Features</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{deepDive.must_have_features}</p>
                  </div>
                )}
                {/* Editable scope notes */}
                {editing ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Additional Scope Notes</p>
                    <Textarea
                      value={content.scopeNotes}
                      onChange={e => setContent({ ...content, scopeNotes: e.target.value })}
                      placeholder="Add custom scope notes, clarifications, or feature details..."
                      className="text-sm min-h-[60px]"
                    />
                  </div>
                ) : content.scopeNotes ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Additional Scope Notes</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{content.scopeNotes}</p>
                  </div>
                ) : null}
              </div>
            </section>
          )}

          {/* Investment */}
          <section className="mb-10 page-break">
            <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Investment
            </h2>
            <div className="bg-card border border-border rounded-lg p-6">
              {roi?.pricing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-secondary/50 rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Estimated Build Cost</p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(roi.pricing.buildCostLow)} – {formatCurrency(roi.pricing.buildCostHigh)}
                      </p>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-4 text-center border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">Recommended Package</p>
                      <p className="text-xl font-bold text-primary">{roi.pricing.tierLabel}</p>
                    </div>
                  </div>
                  {editing ? (
                    <Textarea
                      value={content.investmentNotes}
                      onChange={e => setContent({ ...content, investmentNotes: e.target.value })}
                      placeholder="Add custom investment notes, payment details, or discount info..."
                      className="text-sm min-h-[60px]"
                    />
                  ) : content.investmentNotes ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{content.investmentNotes}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Final pricing will be confirmed after scope refinement. The above range is based on your
                      assessment data, business complexity, and feature requirements.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Investment details will be discussed in our next call.</p>
              )}
            </div>
          </section>

          {/* Custom Sections */}
          {content.customSections.map((section, i) => (
            <section key={i} className="mb-10">
              {editing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={section.title}
                      onChange={e => updateCustomSection(i, 'title', e.target.value)}
                      className="text-xl font-bold"
                      placeholder="Section title"
                    />
                    <Button size="sm" variant="destructive" onClick={() => removeCustomSection(i)} className="h-8 w-8 p-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={section.body}
                    onChange={e => updateCustomSection(i, 'body', e.target.value)}
                    placeholder="Section content..."
                    className="text-sm min-h-[80px]"
                  />
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
              <Button variant="outline" onClick={addCustomSection} className="gap-2 text-sm">
                + Add Custom Section
              </Button>
            </div>
          )}

          {/* Timeline */}
          <section className="mb-10">
            <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Timeline
            </h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="space-y-3">
                {content.timelinePhases.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    {editing ? (
                      <div className="flex-1 space-y-1">
                        <div className="flex gap-2">
                          <Input value={step.phase} onChange={e => updateTimeline(i, 'phase', e.target.value)} className="text-sm font-semibold" placeholder="Phase name" />
                          <Input value={step.duration} onChange={e => updateTimeline(i, 'duration', e.target.value)} className="text-sm w-32" placeholder="Duration" />
                          <Button size="sm" variant="ghost" onClick={() => removeTimelinePhase(i)} className="h-8 w-8 p-0 text-destructive">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <Input value={step.desc} onChange={e => updateTimeline(i, 'desc', e.target.value)} className="text-xs" placeholder="Description" />
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
                  <Button variant="ghost" size="sm" onClick={addTimelinePhase} className="text-xs ml-12">+ Add Phase</Button>
                )}
              </div>
            </div>
          </section>

          {/* Terms */}
          <section className="mb-10">
            <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Terms & Conditions
            </h2>
            <div className="bg-card border border-border rounded-lg p-6 space-y-2">
              {content.terms.map((term, i) => (
                editing ? (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-xs text-muted-foreground mt-2">•</span>
                    <Input value={term} onChange={e => updateTerm(i, e.target.value)} className="text-xs flex-1" />
                    <Button size="sm" variant="ghost" onClick={() => removeTerm(i)} className="h-7 w-7 p-0 text-destructive">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <p key={i} className="text-xs text-muted-foreground leading-relaxed">• {term}</p>
                )
              ))}
              {editing && (
                <Button variant="ghost" size="sm" onClick={addTerm} className="text-xs">+ Add Term</Button>
              )}
            </div>
          </section>

          {/* Accept CTA - hidden in print */}
          {!proposal.accepted && (
            <div className="print:hidden text-center py-8">
              <Button size="lg" onClick={handleAccept} disabled={accepting} className="gap-2 text-base px-10 py-6">
                {accepting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Accept Proposal
              </Button>
              <p className="text-xs text-muted-foreground mt-3">By accepting, you agree to the terms above.</p>
            </div>
          )}

          {/* Footer */}
          <footer className="border-t border-border pt-6 mt-10 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <img src={logo} alt="5to10X" className="h-6 opacity-50" />
              <span>5to10X — Custom App Development</span>
            </div>
            <span>grow@5to10x.app</span>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Proposal;
