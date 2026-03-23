import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, Users, Building2, DollarSign, ClipboardCheck, Loader2 } from 'lucide-react';

interface Lead {
  id: string;
  contact_name: string;
  business_name: string | null;
  pipeline_stage: string;
  roi_results: any;
  industry_id: string | null;
  industry: string | null;
  discovery_checklist: any;
}

interface CallGuideProps {
  leads: Lead[];
  onUpdateChecklist: (id: string, checklist: Record<string, boolean>) => void;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  sort_order: number;
  phase: string;
}

interface Question {
  id: string;
  category_id: string;
  question: string;
  detail_prompt: string;
  sort_order: number;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const CallGuide = ({ leads, onUpdateChecklist }: CallGuideProps) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Filter leads in Straight Talk–relevant stages
  const eligibleLeads = useMemo(() =>
    leads.filter(l => ['discovery_call', 'qualified'].includes(l.pipeline_stage)),
    [leads]
  );

  const selectedLead = eligibleLeads.find(l => l.id === selectedLeadId) || null;

  // Load industry-specific Straight Talk questions when a lead is selected
  useEffect(() => {
    if (!selectedLead?.industry_id) {
      setCategories([]);
      setQuestions([]);
      return;
    }

    const loadQuestions = async () => {
      setLoading(true);
      const [catRes, qRes] = await Promise.all([
        supabase.from('scoping_categories').select('*').eq('industry_id', selectedLead.industry_id!).eq('phase', 'straight_talk').order('sort_order'),
        supabase.from('scoping_questions').select('*').order('sort_order'),
      ]);

      const cats = (catRes.data || []) as Category[];
      const allQ = (qRes.data || []) as Question[];
      const catIds = cats.map(c => c.id);
      setCategories(cats);
      setQuestions(allQ.filter(q => catIds.includes(q.category_id)));
      setLoading(false);
    };

    loadQuestions();
  }, [selectedLead?.industry_id]);

  const checklist: Record<string, boolean> = selectedLead?.discovery_checklist && typeof selectedLead.discovery_checklist === 'object' && !Array.isArray(selectedLead.discovery_checklist)
    ? selectedLead.discovery_checklist as Record<string, boolean>
    : {};

  const handleToggle = async (questionId: string, checked: boolean) => {
    if (!selectedLead) return;
    const updated = { ...checklist, [questionId]: checked };
    onUpdateChecklist(selectedLead.id, updated);

    await supabase
      .from('roi_assessments')
      .update({ discovery_checklist: JSON.parse(JSON.stringify(updated)) })
      .eq('id', selectedLead.id);
  };

  const handleCheckAll = async () => {
    if (!selectedLead) return;
    const updated: Record<string, boolean> = {};
    questions.forEach(q => updated[q.id] = true);
    onUpdateChecklist(selectedLead.id, updated);

    await supabase
      .from('roi_assessments')
      .update({ discovery_checklist: JSON.parse(JSON.stringify(updated)) })
      .eq('id', selectedLead.id);
  };

  const checkedCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Straight Talk™ Call Guide
          </h2>
          <p className="text-sm text-muted-foreground">Use during calls to track which Straight Talk™ questions have been covered.</p>
        </div>
      </div>

      {/* Lead selector */}
      <div className="rounded-lg border border-border bg-card p-4">
        <label className="text-xs text-muted-foreground mb-2 block">Select Lead</label>
        <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue placeholder="Choose a lead for this call..." />
          </SelectTrigger>
          <SelectContent>
            {eligibleLeads.length === 0 ? (
              <SelectItem value="none" disabled>No leads in Straight Talk™ stage</SelectItem>
            ) : (
              eligibleLeads.map(lead => (
                <SelectItem key={lead.id} value={lead.id}>
                  <span className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    {lead.contact_name}
                    {lead.business_name && <span className="text-muted-foreground">— {lead.business_name}</span>}
                    {lead.industry && <span className="text-muted-foreground text-xs">({lead.industry})</span>}
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Selected lead info + checklist */}
      {selectedLead && (
        <>
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{selectedLead.contact_name}</span>
            </div>
            {selectedLead.business_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">{selectedLead.business_name}</span>
              </div>
            )}
            {selectedLead.industry && (
              <Badge variant="outline" className="text-xs">{selectedLead.industry}</Badge>
            )}
            {(selectedLead.roi_results as any)?.totalAnnualImpact && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency((selectedLead.roi_results as any).totalAnnualImpact)} annual impact
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No Straight Talk™ questions configured</p>
              <p className="text-xs">Add questions for this lead's industry in the Scoping Q's tab.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Straight Talk™ Checklist</h3>
                  <Badge variant="outline" className="text-xs">
                    {checkedCount}/{questions.length} covered
                  </Badge>
                </div>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handleCheckAll}>
                  <ClipboardCheck className="w-3 h-3" /> Mark All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => {
                  const catQuestions = questions.filter(q => q.category_id === cat.id);
                  const catChecked = catQuestions.filter(q => checklist[q.id]).length;
                  return (
                    <div key={cat.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{cat.label}</h4>
                        <Badge variant={catChecked === catQuestions.length ? 'default' : 'outline'} className="text-[10px]">
                          {catChecked}/{catQuestions.length}
                        </Badge>
                      </div>
                      <div className="space-y-2.5">
                        {catQuestions.map(q => (
                          <label key={q.id} className="flex items-start gap-3 cursor-pointer group p-1.5 rounded-md hover:bg-secondary/50 transition-colors">
                            <Checkbox
                              checked={!!checklist[q.id]}
                              onCheckedChange={(checked) => handleToggle(q.id, !!checked)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <span className={`text-sm leading-tight block ${checklist[q.id] ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>
                                {q.question}
                              </span>
                              {q.detail_prompt && (
                                <span className="text-xs text-muted-foreground block mt-0.5">{q.detail_prompt}</span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {!selectedLead && eligibleLeads.length > 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Phone className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Select a lead to start</p>
          <p className="text-sm">Pick a lead from the dropdown above to see the Straight Talk™ checklist.</p>
        </div>
      )}
    </div>
  );
};

export default CallGuide;
