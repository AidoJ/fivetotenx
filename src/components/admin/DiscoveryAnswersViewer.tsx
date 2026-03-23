import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Brain, ChevronDown, ChevronUp, Loader2, RefreshCw, Save, Pencil,
  CheckCircle, AlertCircle, HelpCircle, XCircle,
} from 'lucide-react';

interface DiscoveryAnswer {
  answer: string;
  confidence: 'high' | 'medium' | 'low' | 'not_found';
  source_quote?: string;
}

type DiscoveryAnswers = Record<string, DiscoveryAnswer>;

const QUESTION_LABELS: Record<string, { label: string; category: string }> = {
  operations_workflows: { label: 'Daily/weekly workflows', category: 'Operations' },
  operations_bottlenecks: { label: 'Bottlenecks & time-wasters', category: 'Operations' },
  operations_seasonal: { label: 'Seasonal patterns', category: 'Operations' },
  systems_crm_pos: { label: 'CRM/POS systems in use', category: 'Systems' },
  systems_data_migration: { label: 'Data migration needs', category: 'Systems' },
  systems_pain_points: { label: 'Current system pain points', category: 'Systems' },
  users_internal_roles: { label: 'Internal user roles', category: 'Users' },
  users_customer_portal: { label: 'Customer portal needs', category: 'Users' },
  users_tech_proficiency: { label: 'Team tech proficiency', category: 'Users' },
  revenue_success_metrics: { label: 'Success metrics / KPIs', category: 'Revenue' },
  revenue_new_streams: { label: 'New revenue streams', category: 'Revenue' },
  revenue_pricing_model: { label: 'Pricing/billing model', category: 'Revenue' },
  compliance_regulations: { label: 'Industry regulations', category: 'Compliance' },
  compliance_data_residency: { label: 'Data residency requirements', category: 'Compliance' },
  logistics_decision_makers: { label: 'Key decision-makers', category: 'Logistics' },
  logistics_hard_deadlines: { label: 'Hard deadlines', category: 'Logistics' },
  logistics_support_expectations: { label: 'Post-launch support expectations', category: 'Logistics' },
  logistics_budget_constraints: { label: 'Budget constraints', category: 'Logistics' },
};

const confidenceConfig = {
  high: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-500/10 border-green-500/20', label: 'High' },
  medium: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Medium' },
  low: { icon: HelpCircle, color: 'text-orange-600', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Low' },
  not_found: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-secondary/50 border-border', label: 'Not found' },
};

interface Props {
  assessmentId: string;
  answers: DiscoveryAnswers | null;
  onUpdate: (answers: DiscoveryAnswers) => void;
}

const DiscoveryAnswersViewer = ({ assessmentId, answers, onUpdate }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleExtract = async () => {
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-discovery-answers', {
        body: { assessmentId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.answers) {
        onUpdate(data.answers);
        toast({ title: 'Answers extracted ✅', description: 'AI has parsed the transcripts and extracted structured answers.' });
      }
    } catch (err: any) {
      toast({ title: 'Extraction failed', description: err.message, variant: 'destructive' });
    }
    setExtracting(false);
  };

  const handleSaveEdit = async (key: string) => {
    if (!answers) return;
    setSaving(true);
    const updated = { ...answers, [key]: { ...answers[key], answer: editValue, confidence: 'high' as const } };
    const { error } = await supabase
      .from('roi_assessments')
      .update({ discovery_answers: JSON.parse(JSON.stringify(updated)) })
      .eq('id', assessmentId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      onUpdate(updated);
      setEditingKey(null);
      toast({ title: 'Answer updated ✅' });
    }
    setSaving(false);
  };

  // Group answers by category
  const categories = new Map<string, string[]>();
  for (const key of Object.keys(QUESTION_LABELS)) {
    const cat = QUESTION_LABELS[key].category;
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(key);
  }

  const answeredCount = answers
    ? Object.values(answers).filter(a => a.confidence !== 'not_found' && a.answer).length
    : 0;
  const totalQuestions = Object.keys(QUESTION_LABELS).length;

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground">Extracted Answers</h4>
          {answers && (
            <Badge variant="outline" className="text-[9px] h-4">
              {answeredCount}/{totalQuestions} answered
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={answers ? 'outline' : 'default'}
            className="h-6 text-[10px] px-2 gap-1"
            onClick={handleExtract}
            disabled={extracting}
          >
            {extracting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {answers ? 'Re-extract' : 'Extract from Transcripts'}
          </Button>
          {answers && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          )}
        </div>
      </div>

      {!answers && !extracting && (
        <p className="text-[10px] text-muted-foreground italic">
          Upload and transcribe discovery call recordings, then click "Extract from Transcripts" to auto-fill.
        </p>
      )}

      <AnimatePresence>
        {expanded && answers && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 max-h-[500px] overflow-y-auto pr-1"
          >
            {Array.from(categories.entries()).map(([category, keys]) => {
              const catAnswered = keys.filter(k => answers[k]?.confidence !== 'not_found' && answers[k]?.answer).length;
              return (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{category}</h5>
                    <span className="text-[9px] text-muted-foreground">{catAnswered}/{keys.length}</span>
                  </div>
                  {keys.map(key => {
                    const a = answers[key];
                    if (!a) return null;
                    const conf = confidenceConfig[a.confidence] || confidenceConfig.not_found;
                    const ConfIcon = conf.icon;
                    const isEditing = editingKey === key;

                    return (
                      <div key={key} className={`rounded-md border p-2 space-y-1 ${conf.bg}`}>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold text-foreground">{QUESTION_LABELS[key]?.label}</p>
                          <div className="flex items-center gap-1">
                            <ConfIcon className={`w-3 h-3 ${conf.color}`} />
                            <span className={`text-[8px] ${conf.color}`}>{conf.label}</span>
                            {!isEditing && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => { setEditingKey(key); setEditValue(a.answer || ''); }}
                              >
                                <Pencil className="w-2.5 h-2.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="space-y-1">
                            <Textarea
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="text-[10px] min-h-[40px]"
                            />
                            <div className="flex gap-1">
                              <Button size="sm" className="h-5 text-[9px] px-2 gap-1" onClick={() => handleSaveEdit(key)} disabled={saving}>
                                {saving ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Save className="w-2.5 h-2.5" />} Save
                              </Button>
                              <Button size="sm" variant="ghost" className="h-5 text-[9px] px-2" onClick={() => setEditingKey(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {a.answer ? (
                              <p className="text-[11px] text-foreground whitespace-pre-wrap">{a.answer}</p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground italic">Not mentioned in transcripts</p>
                            )}
                            {a.source_quote && (
                              <p className="text-[9px] text-muted-foreground italic border-l-2 border-muted-foreground/30 pl-1.5 mt-1">
                                "{a.source_quote}"
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiscoveryAnswersViewer;
