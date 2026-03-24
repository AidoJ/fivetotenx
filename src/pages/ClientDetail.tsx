import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, Loader2, Building2, Users, DollarSign, Target,
  Clock, Globe, TrendingUp, ShoppingCart, BarChart3, Zap, Mail, Phone,
  MessageSquare, Radar, Puzzle, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import logo from '@/assets/logo-5to10x-color.webp';

type Assessment = Tables<'roi_assessments'>;

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

/* ── Editable field component ── */
const EditField = ({ label, value, onChange, type = 'text', icon: Icon, rows }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; icon?: any; rows?: number;
}) => (
  <div className="space-y-1">
    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
      {Icon && <Icon className="w-3 h-3" />} {label}
    </Label>
    {rows ? (
      <Textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="text-xs bg-secondary border-border resize-none" />
    ) : (
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} className="h-8 text-xs bg-secondary border-border" />
    )}
  </div>
);

/* ── Read-only stat ── */
const Stat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`rounded-lg p-3 ${highlight ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/50'}`}>
    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
    <p className={`text-sm font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
  </div>
);

/* ══════════ MAIN PAGE ══════════ */

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lead, setLead] = useState<Assessment | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [roiResults, setRoiResults] = useState<any>(null);
  const [straightTalk, setStraightTalk] = useState<any>(null);
  const [scopingResponse, setScopingResponse] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [leadRes, stRes, scopeRes, catRes, qRes, intRes] = await Promise.all([
        supabase.from('roi_assessments').select('*').eq('id', id).single(),
        supabase.from('straight_talk_responses').select('*').eq('assessment_id', id).order('created_at', { ascending: false }).limit(1),
        supabase.from('scoping_responses').select('*').eq('assessment_id', id).order('created_at', { ascending: false }).limit(1),
        supabase.from('scoping_categories').select('*').order('sort_order'),
        supabase.from('scoping_questions').select('*').order('sort_order'),
        supabase.from('client_interviews').select('*').eq('assessment_id', id).order('created_at', { ascending: false }),
      ]);

      if (leadRes.error) {
        console.error('ClientDetail load error:', leadRes.error);
        toast({ title: 'Lead not found', description: leadRes.error.message, variant: 'destructive' });
        navigate('/admin');
        return;
      }
      if (!leadRes.data) {
        console.error('ClientDetail: no data returned for id', id);
        toast({ title: 'Lead not found', variant: 'destructive' });
        navigate('/admin');
        return;
      }

      const assessment = leadRes.data;
      setLead(assessment);
      setFormData({ ...(assessment.form_data as any) });
      setRoiResults(assessment.roi_results);
      setStraightTalk(stRes.data?.[0] || null);
      setScopingResponse(scopeRes.data?.[0] || null);
      setCategories((catRes.data as any) || []);
      setQuestions((qRes.data as any) || []);
      setInterviews((intRes.data as any) || []);
      setLoading(false);
    };
    load();
  }, [id]);

  const updateFormField = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const updateStraightTalkResponse = (questionId: string, value: string) => {
    setStraightTalk((prev: any) => ({
      ...prev,
      responses: { ...(prev?.responses || {}), [questionId]: value },
    }));
    setDirty(true);
  };

  const updateScopingResponse = (questionId: string, value: string) => {
    setScopingResponse((prev: any) => ({
      ...prev,
      responses: { ...(prev?.responses || {}), [questionId]: value },
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!id || !lead) return;
    setSaving(true);
    try {
      // Save form_data back to assessment
      const { error: assessError } = await supabase.from('roi_assessments')
        .update({ form_data: JSON.parse(JSON.stringify(formData)) })
        .eq('id', id);
      if (assessError) throw assessError;

      // Save straight talk responses
      if (straightTalk?.id) {
        const { error: stError } = await supabase.from('straight_talk_responses')
          .update({ responses: JSON.parse(JSON.stringify(straightTalk.responses)) })
          .eq('id', straightTalk.id);
        if (stError) throw stError;
      }

      // Save scoping responses
      if (scopingResponse?.id) {
        const { error: scError } = await supabase.from('scoping_responses')
          .update({ responses: JSON.parse(JSON.stringify(scopingResponse.responses)) })
          .eq('id', scopingResponse.id);
        if (scError) throw scError;
      }

      setDirty(false);
      toast({ title: 'All changes saved ✅' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead || !formData) return null;

  const roi = roiResults as any;
  const stResponses = straightTalk?.responses || {};
  const scResponses = scopingResponse?.responses || {};
  const industryId = lead.industry_id || formData.selectedIndustryId;

  // Filter categories/questions by industry
  const stCategories = categories.filter((c: any) => c.industry_id === industryId && c.phase === 'straight_talk');
  const gpCategories = categories.filter((c: any) => c.industry_id === industryId && c.phase === 'game_plan');
  const stCatIds = stCategories.map((c: any) => c.id);
  const gpCatIds = gpCategories.map((c: any) => c.id);
  const stQuestions = questions.filter((q: any) => stCatIds.includes(q.category_id));
  const gpQuestions = questions.filter((q: any) => gpCatIds.includes(q.category_id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4" /> Pipeline
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-display font-bold text-foreground truncate">{lead.contact_name}</h1>
              {lead.business_name && (
                <span className="text-sm text-muted-foreground">· {lead.business_name}</span>
              )}
              <Badge variant="outline" className="text-[10px] capitalize">
                {lead.pipeline_stage.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.contact_email}</span>
              {lead.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.contact_phone}</span>}
              {lead.industry && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {lead.industry}</span>}
            </div>
          </div>
          {dirty && (
            <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Changes
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="reality_check" className="space-y-6">
          <TabsList className="bg-secondary/50 p-1">
            <TabsTrigger value="reality_check" className="gap-1.5 text-xs">
              <Radar className="w-3.5 h-3.5" /> Reality Check™
            </TabsTrigger>
            <TabsTrigger value="straight_talk" className="gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5" /> Straight Talk™
              {!straightTalk && <Badge variant="secondary" className="text-[8px] h-3.5 ml-1">Empty</Badge>}
            </TabsTrigger>
            <TabsTrigger value="game_plan" className="gap-1.5 text-xs">
              <Puzzle className="w-3.5 h-3.5" /> Game Plan™
              {!scopingResponse && <Badge variant="secondary" className="text-[8px] h-3.5 ml-1">Empty</Badge>}
            </TabsTrigger>
            <TabsTrigger value="roi_summary" className="gap-1.5 text-xs">
              <DollarSign className="w-3.5 h-3.5" /> ROI Summary
            </TabsTrigger>
          </TabsList>

          {/* ── REALITY CHECK TAB ── */}
          <TabsContent value="reality_check">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Business Snapshot */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Business Snapshot
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <EditField label="Business Name" value={formData.businessName || ''} onChange={v => updateFormField('businessName', v)} icon={Building2} />
                  <EditField label="Industry" value={formData.industry || ''} onChange={v => updateFormField('industry', v)} />
                  <EditField label="Business Type" value={formData.businessType || ''} onChange={v => updateFormField('businessType', v)} />
                  <EditField label="Monthly Revenue" value={formData.monthlyRevenue || ''} onChange={v => updateFormField('monthlyRevenue', v)} icon={DollarSign} />
                  <EditField label="Full-Time Staff" value={formData.staffFullTime || ''} onChange={v => updateFormField('staffFullTime', v)} icon={Users} />
                  <EditField label="Part-Time Staff" value={formData.staffPartTime || ''} onChange={v => updateFormField('staffPartTime', v)} />
                  <EditField label="Casual Staff" value={formData.staffCasual || ''} onChange={v => updateFormField('staffCasual', v)} />
                  <EditField label="Subcontractors" value={formData.staffSubcontractors || ''} onChange={v => updateFormField('staffSubcontractors', v)} />
                </div>
              </div>

              {/* Customer Metrics */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Customer Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <EditField label="Monthly Visitors" value={formData.monthlyVisitors || ''} onChange={v => updateFormField('monthlyVisitors', v)} icon={Globe} />
                  <EditField label="Monthly Leads" value={formData.monthlyLeads || ''} onChange={v => updateFormField('monthlyLeads', v)} />
                  <EditField label="Conversion Rate (%)" value={formData.conversionRate || ''} onChange={v => updateFormField('conversionRate', v)} icon={BarChart3} />
                  <EditField label="New Customers / Month" value={formData.monthlyNewCustomers || ''} onChange={v => updateFormField('monthlyNewCustomers', v)} />
                  <EditField label="Avg Purchase Value ($)" value={formData.avgPurchaseValue || ''} onChange={v => updateFormField('avgPurchaseValue', v)} icon={ShoppingCart} />
                  <EditField label="Purchases / Year" value={formData.avgPurchasesPerYear || ''} onChange={v => updateFormField('avgPurchasesPerYear', v)} />
                  <EditField label="Avg Retention (years)" value={formData.avgRetentionYears || ''} onChange={v => updateFormField('avgRetentionYears', v)} />
                  <EditField label="No-Show Rate (%)" value={formData.noShowRate || ''} onChange={v => updateFormField('noShowRate', v)} />
                  <EditField label="Monthly Marketing Spend ($)" value={formData.monthlyMarketingSpend || ''} onChange={v => updateFormField('monthlyMarketingSpend', v)} />
                  <EditField label="Customer Acquisition Cost ($)" value={formData.customerAcquisitionCost || ''} onChange={v => updateFormField('customerAcquisitionCost', v)} />
                  <EditField label="Upsell Revenue (%)" value={formData.upsellRevenuePercent || ''} onChange={v => updateFormField('upsellRevenuePercent', v)} />
                </div>
              </div>

              {/* Operations */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Weekly Time Spend
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <EditField label="Admin (hrs)" value={formData.hoursAdmin || ''} onChange={v => updateFormField('hoursAdmin', v)} />
                  <EditField label="Booking (hrs)" value={formData.hoursBooking || ''} onChange={v => updateFormField('hoursBooking', v)} />
                  <EditField label="Follow-ups (hrs)" value={formData.hoursFollowUps || ''} onChange={v => updateFormField('hoursFollowUps', v)} />
                  <EditField label="Invoicing (hrs)" value={formData.hoursInvoicing || ''} onChange={v => updateFormField('hoursInvoicing', v)} />
                  <EditField label="Hourly Staff Cost ($)" value={formData.hourlyStaffCost || ''} onChange={v => updateFormField('hourlyStaffCost', v)} icon={DollarSign} />
                </div>
              </div>

              {/* Growth & Goals */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Growth & Goals
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Lost Sales Reasons</Label>
                    <div className="flex flex-wrap gap-1">
                      {(formData.lostSalesReasons || []).map((r: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{r}</Badge>
                      ))}
                      {(!formData.lostSalesReasons || formData.lostSalesReasons.length === 0) && (
                        <span className="text-xs text-muted-foreground italic">None specified</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Primary Goals</Label>
                    <div className="flex flex-wrap gap-1">
                      {(formData.primaryGoals || []).map((g: string, i: number) => (
                        <Badge key={i} className="text-[10px] bg-primary/10 text-primary border-primary/20">{g}</Badge>
                      ))}
                      {(!formData.primaryGoals || formData.primaryGoals.length === 0) && (
                        <span className="text-xs text-muted-foreground italic">None specified</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Current Features</Label>
                    <div className="flex flex-wrap gap-1">
                      {(formData.currentFeatures || []).map((f: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                      ))}
                      {(!formData.currentFeatures || formData.currentFeatures.length === 0) && (
                        <span className="text-xs text-muted-foreground italic">None specified</span>
                      )}
                    </div>
                  </div>
                  <EditField label="Current Website" value={formData.currentWebsite || ''} onChange={v => updateFormField('currentWebsite', v)} icon={Globe} />
                  <EditField label="Conversion Impact" value={formData.conversionImpactAnswer || ''} onChange={v => updateFormField('conversionImpactAnswer', v)} rows={2} />
                  <EditField label="Additional Notes" value={formData.additionalNotes || ''} onChange={v => updateFormField('additionalNotes', v)} rows={3} />
                </div>
              </div>

              {/* Industry-specific Reality Check responses */}
              {formData.industryResponses && Object.keys(formData.industryResponses).length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-4 lg:col-span-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> Industry-Specific Responses
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(formData.industryResponses).map(([qId, answer]) => {
                      const q = questions.find((q: any) => q.id === qId);
                      return (
                        <EditField
                          key={qId}
                          label={q?.question || qId}
                          value={String(answer || '')}
                          onChange={v => {
                            const updated = { ...formData.industryResponses, [qId]: v };
                            updateFormField('industryResponses', updated);
                          }}
                          rows={2}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── STRAIGHT TALK TAB ── */}
          <TabsContent value="straight_talk">
            {/* Show transcripts from uploaded recordings */}
            {interviews.filter((i: any) => i.transcript).length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Interview Transcripts
                </h3>
                {interviews.filter((i: any) => i.transcript).map((interview: any) => (
                  <div key={interview.id} className="rounded-xl border border-border bg-card p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">{interview.title}</h4>
                      <span className="text-[10px] text-muted-foreground">{new Date(interview.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-foreground/80 whitespace-pre-wrap max-h-64 overflow-y-auto">{interview.transcript}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Show AI-extracted discovery answers */}
            {lead.discovery_answers && Object.keys(lead.discovery_answers as any).length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Radar className="w-4 h-4 text-primary" /> AI-Extracted Discovery Answers
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(lead.discovery_answers as Record<string, any>).map(([key, val]) => {
                    const answer = typeof val === 'object' ? val : { answer: val };
                    const q = questions.find((q: any) => q.id === key);
                    return (
                      <div key={key} className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{q?.question || key}</p>
                        <p className="text-xs text-foreground">{answer.answer || String(val)}</p>
                        {answer.confidence && (
                          <Badge variant="outline" className={`text-[8px] ${answer.confidence === 'high' ? 'text-green-600 border-green-500/30' : answer.confidence === 'medium' ? 'text-amber-600 border-amber-500/30' : 'text-red-600 border-red-500/30'}`}>
                            {answer.confidence} confidence
                          </Badge>
                        )}
                        {answer.source_quote && (
                          <p className="text-[10px] text-muted-foreground italic">"{answer.source_quote}"</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formal ST questionnaire responses */}
            {!straightTalk && interviews.filter((i: any) => i.transcript).length === 0 && (!lead.discovery_answers || Object.keys(lead.discovery_answers as any).length === 0) ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">No Straight Talk™ responses yet</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a Zoom recording or wait for the client to complete the questionnaire.
                </p>
              </div>
            ) : straightTalk ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Straight Talk™ Questionnaire Responses</h3>
                    <p className="text-xs text-muted-foreground">
                      Industry: {straightTalk.industry} · Submitted: {new Date(straightTalk.created_at).toLocaleDateString()}
                      {straightTalk.completed && <Badge className="ml-2 text-[8px] h-4 bg-green-500/10 text-green-700 border-green-500/20">Complete</Badge>}
                    </p>
                  </div>
                </div>

                {stCategories.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {stCategories.map((cat: any) => {
                      const catQuestions = stQuestions.filter((q: any) => q.category_id === cat.id);
                      if (catQuestions.length === 0) return null;
                      return (
                        <div key={cat.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
                          <h3 className="text-sm font-bold text-foreground">{cat.label}</h3>
                          <div className="space-y-3">
                            {catQuestions.map((q: any) => (
                              <EditField
                                key={q.id}
                                label={q.question}
                                value={stResponses[q.id] || ''}
                                onChange={v => updateStraightTalkResponse(q.id, v)}
                                rows={2}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <h3 className="text-sm font-bold text-foreground">Responses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(stResponses).map(([qId, answer]) => {
                        const q = questions.find((q: any) => q.id === qId);
                        return (
                          <EditField
                            key={qId}
                            label={q?.question || qId}
                            value={String(answer || '')}
                            onChange={v => updateStraightTalkResponse(qId, v)}
                            rows={2}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </TabsContent>

          {/* ── GAME PLAN TAB ── */}
          <TabsContent value="game_plan">
            {!scopingResponse ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <Puzzle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">No Game Plan™ responses yet</h3>
                <p className="text-sm text-muted-foreground">
                  The client hasn't completed the Game Plan™ questionnaire yet.
                  Responses will appear here once submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Game Plan™ Responses</h3>
                    <p className="text-xs text-muted-foreground">
                      Industry: {scopingResponse.industry} · Submitted: {new Date(scopingResponse.created_at).toLocaleDateString()}
                      {scopingResponse.completed && <Badge className="ml-2 text-[8px] h-4 bg-green-500/10 text-green-700 border-green-500/20">Complete</Badge>}
                    </p>
                  </div>
                </div>

                {gpCategories.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {gpCategories.map((cat: any) => {
                      const catQuestions = gpQuestions.filter((q: any) => q.category_id === cat.id);
                      if (catQuestions.length === 0) return null;
                      const isSkipped = (scopingResponse.skipped_categories || []).includes(cat.id);
                      return (
                        <div key={cat.id} className={`rounded-xl border bg-card p-5 space-y-4 ${isSkipped ? 'border-amber-500/30 opacity-60' : 'border-border'}`}>
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-foreground">{cat.label}</h3>
                            {isSkipped && <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-500/30">Skipped</Badge>}
                          </div>
                          <div className="space-y-3">
                            {catQuestions.map((q: any) => (
                              <EditField
                                key={q.id}
                                label={q.question}
                                value={scResponses[q.id] || ''}
                                onChange={v => updateScopingResponse(q.id, v)}
                                rows={2}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <h3 className="text-sm font-bold text-foreground">Responses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(scResponses).map(([qId, answer]) => {
                        const q = questions.find((q: any) => q.id === qId);
                        return (
                          <EditField
                            key={qId}
                            label={q?.question || qId}
                            value={String(answer || '')}
                            onChange={v => updateScopingResponse(qId, v)}
                            rows={2}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── ROI SUMMARY TAB ── */}
          <TabsContent value="roi_summary">
            {roi ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Stat label="Total Annual Impact" value={formatCurrency(roi.totalAnnualImpact)} highlight />
                  <Stat label="ROI" value={`${Math.round(roi.roiPercentage)}%`} highlight />
                  <Stat label="Break-even" value={`${Math.round(roi.breakEvenMonths)} months`} />
                  {roi.revenueLift > 0 && <Stat label="Revenue Lift" value={`${formatCurrency(roi.revenueLift)}/yr`} />}
                  {roi.operationalSavings > 0 && <Stat label="Op. Savings" value={`${formatCurrency(roi.operationalSavings)}/yr`} />}
                  {roi.retentionImprovement > 0 && <Stat label="Retention" value={`${formatCurrency(roi.retentionImprovement)}/yr`} />}
                  {roi.noShowRecovery > 0 && <Stat label="No-Show Recovery" value={`${formatCurrency(roi.noShowRecovery)}/yr`} />}
                  {roi.upsellLift > 0 && <Stat label="Upsell Lift" value={`${formatCurrency(roi.upsellLift)}/yr`} />}
                  {roi.marketingEfficiency > 0 && <Stat label="Marketing Eff." value={`${formatCurrency(roi.marketingEfficiency)}/yr`} />}
                </div>

                {roi.pricing && (
                  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" /> Pricing
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Stat label="Build Cost (Low)" value={formatCurrency(roi.pricing.buildCostLow)} />
                      <Stat label="Build Cost (High)" value={formatCurrency(roi.pricing.buildCostHigh)} />
                      <Stat label="Tier" value={roi.pricing.tierLabel} />
                      <Stat label="Annual Maintenance" value={formatCurrency(roi.pricing.annualMaintenance)} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Stat label="CLV" value={formatCurrency(roi.clv)} />
                  <Stat label="Active Customers" value={String(roi.activeCustomers)} />
                  <Stat label="Weekly Admin Hours" value={`${roi.weeklyAdminHours} hrs`} />
                  <Stat label="Weekly Savings" value={`${Math.round(roi.weeklySavingsHours)} hrs`} />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">No ROI data available</h3>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientDetail;
