import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useQuestionRecorder } from '@/hooks/useQuestionRecorder';
import {
  X, Save, Loader2, Building2, Users, DollarSign, Target,
  Clock, Globe, TrendingUp, ShoppingCart, BarChart3, Zap, Mail, Phone,
  MessageSquare, Sparkles, Mic, Square, Send, FileText, Radar, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import DiscoveryAnswersViewer from '@/components/admin/DiscoveryAnswersViewer';
import OpportunityAnalysis from '@/components/admin/OpportunityAnalysis';
import TimeTracker from '@/components/admin/TimeTracker';
import TechStackPanel from '@/components/admin/TechStackPanel';
import CommsPanel from '@/components/admin/CommsPanel';
import ArtifactsPanel from '@/components/admin/ArtifactsPanel';
import ScopeRefinement from '@/components/admin/ScopeRefinement';

type Assessment = Tables<'roi_assessments'>;

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

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

const Stat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`rounded-lg p-3 ${highlight ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/50'}`}>
    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
    <p className={`text-sm font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
  </div>
);

interface ClientDetailModalProps {
  assessmentId: string;
  open: boolean;
  onClose: () => void;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ assessmentId, open, onClose }) => {
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

  const handleRecordTranscribed = useCallback((questionId: string, transcript: string) => {
    setStraightTalk((prev: any) => ({
      ...prev,
      responses: { ...(prev?.responses || {}), [questionId]: transcript },
    }));
    setDirty(true);
  }, []);

  const recorder = useQuestionRecorder({ onTranscribed: handleRecordTranscribed });

  useEffect(() => {
    if (!open || !assessmentId) return;
    setLoading(true);
    const load = async () => {
      const [leadRes, stRes, scopeRes, catRes, qRes, intRes] = await Promise.all([
        supabase.from('roi_assessments').select('*').eq('id', assessmentId).single(),
        supabase.from('straight_talk_responses').select('*').eq('assessment_id', assessmentId).order('created_at', { ascending: false }).limit(1),
        supabase.from('scoping_responses').select('*').eq('assessment_id', assessmentId).order('created_at', { ascending: false }).limit(1),
        supabase.from('scoping_categories').select('*').order('sort_order'),
        supabase.from('scoping_questions').select('*').order('sort_order'),
        supabase.from('client_interviews').select('*').eq('assessment_id', assessmentId).order('created_at', { ascending: false }),
      ]);
      if (leadRes.error || !leadRes.data) {
        toast({ title: 'Failed to load client', variant: 'destructive' });
        onClose();
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
  }, [assessmentId, open]);

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

  const handleSave = async () => {
    if (!assessmentId || !lead) return;
    setSaving(true);
    try {
      const { error: assessError } = await supabase.from('roi_assessments')
        .update({ form_data: JSON.parse(JSON.stringify(formData)) })
        .eq('id', assessmentId);
      if (assessError) throw assessError;
      if (straightTalk?.id) {
        const { error: stError } = await supabase.from('straight_talk_responses')
          .update({ responses: JSON.parse(JSON.stringify(straightTalk.responses)) })
          .eq('id', straightTalk.id);
        if (stError) throw stError;
      }
      setDirty(false);
      toast({ title: 'All changes saved ✅' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  if (!open) return null;

  const roi = roiResults as any;
  const stResponses = straightTalk?.responses || {};
  const industryId = lead?.industry_id || formData?.selectedIndustryId;
  const stCategories = categories.filter((c: any) => c.industry_id === industryId && c.phase === 'straight_talk');
  const gpCategories = categories.filter((c: any) => c.industry_id === industryId && c.phase === 'game_plan');
  const allCatIds = [...stCategories, ...gpCategories].map((c: any) => c.id);
  const stQuestions = questions.filter((q: any) => allCatIds.includes(q.category_id));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden p-0 gap-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : lead && formData ? (
          <div className="flex flex-col h-[92vh] max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground truncate">{lead.contact_name}</h2>
                  {lead.business_name && <span className="text-sm text-muted-foreground">· {lead.business_name}</span>}
                  <Badge variant="outline" className="text-[10px] capitalize">{lead.pipeline_stage.replace(/_/g, ' ')}</Badge>
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
                  Save
                </Button>
              )}
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="bg-secondary/50 p-1 mx-6 mt-4 shrink-0">
                <TabsTrigger value="overview" className="gap-1.5 text-xs">
                  <Radar className="w-3.5 h-3.5" /> Overview
                </TabsTrigger>
                <TabsTrigger value="discovery" className="gap-1.5 text-xs">
                  <MessageSquare className="w-3.5 h-3.5" /> Discovery
                </TabsTrigger>
                <TabsTrigger value="refinement" className="gap-1.5 text-xs">
                  <Search className="w-3.5 h-3.5" /> Scope Refinement
                </TabsTrigger>
                <TabsTrigger value="analysis" className="gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5" /> Analysis
                </TabsTrigger>
                <TabsTrigger value="tech_stack" className="gap-1.5 text-xs">
                  <Zap className="w-3.5 h-3.5" /> Tech Stack
                </TabsTrigger>
                <TabsTrigger value="comms" className="gap-1.5 text-xs">
                  <Send className="w-3.5 h-3.5" /> Comms
                </TabsTrigger>
                <TabsTrigger value="time" className="gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5" /> Time
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {/* ── OVERVIEW TAB ── */}
                <TabsContent value="overview" className="mt-4">
                  <div className="space-y-6">
                    {/* ROI Summary */}
                    {roi && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Stat label="Total Annual Impact" value={formatCurrency(roi.totalAnnualImpact)} highlight />
                        <Stat label="ROI" value={`${Math.round(roi.roiPercentage)}%`} highlight />
                        <Stat label="Break-even" value={`${Math.round(roi.breakEvenMonths)} months`} />
                        <Stat label="CLV" value={formatCurrency(roi.clv)} />
                      </div>
                    )}

                    {/* Business Snapshot & Customer Metrics side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" /> Business Snapshot
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <EditField label="Business Name" value={formData.businessName || ''} onChange={v => updateFormField('businessName', v)} icon={Building2} />
                          <EditField label="Industry" value={formData.industry || ''} onChange={v => updateFormField('industry', v)} />
                          <EditField label="Monthly Revenue" value={formData.monthlyRevenue || ''} onChange={v => updateFormField('monthlyRevenue', v)} icon={DollarSign} />
                          <EditField label="Staff" value={formData.staffFullTime || ''} onChange={v => updateFormField('staffFullTime', v)} icon={Users} />
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" /> Customer Metrics
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <EditField label="Monthly Visitors" value={formData.monthlyVisitors || ''} onChange={v => updateFormField('monthlyVisitors', v)} icon={Globe} />
                          <EditField label="Conversion Rate (%)" value={formData.conversionRate || ''} onChange={v => updateFormField('conversionRate', v)} icon={BarChart3} />
                          <EditField label="Avg Purchase Value" value={formData.avgPurchaseValue || ''} onChange={v => updateFormField('avgPurchaseValue', v)} icon={ShoppingCart} />
                          <EditField label="Monthly Leads" value={formData.monthlyLeads || ''} onChange={v => updateFormField('monthlyLeads', v)} />
                        </div>
                      </div>
                    </div>

                    {/* Full ROI breakdown */}
                    {roi && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {roi.revenueLift > 0 && <Stat label="Revenue Lift" value={`${formatCurrency(roi.revenueLift)}/yr`} />}
                        {roi.operationalSavings > 0 && <Stat label="Op. Savings" value={`${formatCurrency(roi.operationalSavings)}/yr`} />}
                        {roi.retentionImprovement > 0 && <Stat label="Retention" value={`${formatCurrency(roi.retentionImprovement)}/yr`} />}
                        {roi.noShowRecovery > 0 && <Stat label="No-Show Recovery" value={`${formatCurrency(roi.noShowRecovery)}/yr`} />}
                        {roi.upsellLift > 0 && <Stat label="Upsell Lift" value={`${formatCurrency(roi.upsellLift)}/yr`} />}
                        {roi.marketingEfficiency > 0 && <Stat label="Marketing Eff." value={`${formatCurrency(roi.marketingEfficiency)}/yr`} />}
                      </div>
                    )}

                    {roi?.pricing && (
                      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" /> Pricing
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <Stat label="Build (Low)" value={formatCurrency(roi.pricing.buildCostLow)} />
                          <Stat label="Build (High)" value={formatCurrency(roi.pricing.buildCostHigh)} />
                          <Stat label="Tier" value={roi.pricing.tierLabel} />
                          <Stat label="Maintenance/yr" value={formatCurrency(roi.pricing.annualMaintenance)} />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ── DISCOVERY TAB ── */}
                <TabsContent value="discovery" className="mt-4">
                  <div className="space-y-6">
                    {/* Transcripts */}
                    {interviews.filter((i: any) => i.transcript).length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" /> Interview Transcripts
                        </h3>
                        {interviews.filter((i: any) => i.transcript).map((interview: any) => {
                          const rawText: string = interview.transcript || '';
                          
                          // Split on existing newlines first
                          let chunks = rawText.split(/\n+/).map((p: string) => p.trim()).filter((p: string) => p.length > 0);
                          
                          // Then break any long chunks into ~3 sentence paragraphs
                          const formatted: string[] = [];
                          for (const chunk of chunks) {
                            if (chunk.length > 300) {
                              const sentences = chunk.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [chunk];
                              for (let i = 0; i < sentences.length; i += 3) {
                                const group = sentences.slice(i, i + 3).join('').trim();
                                if (group) formatted.push(group);
                              }
                            } else {
                              formatted.push(chunk);
                            }
                          }

                          return (
                            <div key={interview.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-foreground">{interview.title}</h4>
                                <span className="text-[10px] text-muted-foreground">{new Date(interview.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
                                {formatted.map((para: string, idx: number) => (
                                  <p key={idx} className="text-xs text-foreground/80 leading-relaxed">
                                  {para}
                                </p>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        
                      </div>
                    )}

                    {/* Artifacts */}
                    <ArtifactsPanel assessmentId={assessmentId} />

                    {/* AI-extracted answers */}
                    <DiscoveryAnswersViewer
                      assessmentId={assessmentId}
                      answers={(lead.discovery_answers && Object.keys(lead.discovery_answers as any).length > 0) ? lead.discovery_answers as any : null}
                      onUpdate={(updated) => setLead({ ...lead, discovery_answers: updated as any })}
                    />

                    {/* ST questionnaire responses */}
                    {straightTalk && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground">Straight Talk™ Responses</h3>
                        {[...stCategories, ...gpCategories].length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {[...stCategories, ...gpCategories].map((cat: any) => {
                              const catQuestions = questions.filter((q: any) => q.category_id === cat.id);
                              if (catQuestions.length === 0) return null;
                              return (
                                <div key={cat.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
                                  <h4 className="text-sm font-bold text-foreground">{cat.label}</h4>
                                  <div className="space-y-4">
                                    {catQuestions.map((q: any) => {
                                      const isRecording = recorder.recordingQuestionId === q.id;
                                      const isTranscribing = recorder.transcribingId === q.id;
                                      return (
                                        <div key={q.id} className="space-y-2">
                                          <EditField
                                            label={q.question}
                                            value={stResponses[q.id] || ''}
                                            onChange={v => updateStraightTalkResponse(q.id, v)}
                                            rows={2}
                                          />
                                          <div className="flex items-center gap-2">
                                            {isTranscribing ? (
                                              <Badge variant="secondary" className="text-[10px] gap-1">
                                                <Loader2 className="w-3 h-3 animate-spin" /> Transcribing…
                                              </Badge>
                                            ) : isRecording ? (
                                              <Button size="sm" variant="destructive" className="h-7 text-[10px] gap-1" onClick={recorder.stopRecording}>
                                                <Square className="w-3 h-3" /> Stop {recorder.formatTime(recorder.recordingTime)}
                                              </Button>
                                            ) : (
                                              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => recorder.startRecording(q.id, q.question)}>
                                                <Mic className="w-3 h-3" /> {stResponses[q.id] ? 'Re-record' : 'Record'}
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-border bg-card p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {Object.entries(stResponses).filter(([k]) => !k.startsWith('_')).map(([qId, answer]) => {
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
                    )}

                    {!straightTalk && interviews.length === 0 && (
                      <div className="rounded-xl border border-border bg-card p-12 text-center">
                        <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-foreground mb-1">No discovery data yet</h3>
                        <p className="text-sm text-muted-foreground">Upload a recording, send a self-interview, or wait for the client to complete the questionnaire.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ── SCOPE REFINEMENT TAB ── */}
                <TabsContent value="refinement" className="mt-4">
                  <ScopeRefinement
                    assessmentId={assessmentId}
                    contactEmail={lead?.contact_email}
                    contactName={lead?.contact_name}
                    businessName={lead?.business_name || ''}
                  />
                </TabsContent>

                {/* ── ANALYSIS TAB ── */}
                <TabsContent value="analysis" className="mt-4">
                  <OpportunityAnalysis
                    assessmentId={assessmentId}
                    existingAnalysis={((lead.discovery_answers as any)?._analysis) || null}
                    onUpdate={(analysis) => {
                      const updated = { ...(lead.discovery_answers as any || {}), _analysis: analysis };
                      setLead({ ...lead, discovery_answers: updated as any });
                    }}
                  />
                </TabsContent>

                {/* ── TECH STACK TAB ── */}
                <TabsContent value="tech_stack" className="mt-4">
                  <TechStackPanel
                    assessmentId={assessmentId}
                    techStack={((lead as any).tech_stack && Object.keys((lead as any).tech_stack).length > 0) ? (lead as any).tech_stack : null}
                    onUpdate={(stack) => setLead({ ...lead, tech_stack: stack } as any)}
                  />
                </TabsContent>

                {/* ── COMMS TAB ── */}
                <TabsContent value="comms" className="mt-4">
                  <CommsPanel assessmentId={assessmentId} lead={lead} />
                </TabsContent>

                {/* ── TIME TAB ── */}
                <TabsContent value="time" className="mt-4">
                  <TimeTracker assessmentId={assessmentId} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailModal;
