import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp, ClipboardCheck, Save, Loader2 } from 'lucide-react';

export const DISCOVERY_QUESTIONS: Record<string, { label: string; category: string; question: string }> = {
  operations_workflows: { label: 'Daily/weekly workflows', category: 'Operations', question: 'What are the main daily/weekly workflows and processes in the business?' },
  operations_bottlenecks: { label: 'Bottlenecks & time-wasters', category: 'Operations', question: 'What are the biggest bottlenecks or time-wasters in current operations?' },
  operations_seasonal: { label: 'Seasonal patterns', category: 'Operations', question: 'Are there seasonal patterns or peak periods that affect operations?' },
  systems_crm_pos: { label: 'CRM/POS systems in use', category: 'Systems', question: 'What CRM, POS, or core business systems are currently in use?' },
  systems_data_migration: { label: 'Data migration needs', category: 'Systems', question: 'Is there existing data that needs to be migrated to the new system?' },
  systems_pain_points: { label: 'Current system pain points', category: 'Systems', question: 'What doesn\'t work well with current systems/tools?' },
  users_internal_roles: { label: 'Internal user roles', category: 'Users', question: 'What internal user roles will need access to the system?' },
  users_customer_portal: { label: 'Customer portal needs', category: 'Users', question: 'Do customers need their own portal or self-service features?' },
  users_tech_proficiency: { label: 'Team tech proficiency', category: 'Users', question: 'What is the general technical proficiency of the team?' },
  revenue_success_metrics: { label: 'Success metrics / KPIs', category: 'Revenue', question: 'What does success look like? What specific metrics or KPIs should improve?' },
  revenue_new_streams: { label: 'New revenue streams', category: 'Revenue', question: 'Are there new revenue streams or services the platform should enable?' },
  revenue_pricing_model: { label: 'Pricing/billing model', category: 'Revenue', question: 'Is there a specific pricing or billing model the system needs to support?' },
  compliance_regulations: { label: 'Industry regulations', category: 'Compliance', question: 'Are there industry-specific regulations or compliance requirements?' },
  compliance_data_residency: { label: 'Data residency requirements', category: 'Compliance', question: 'Are there data residency or privacy requirements?' },
  logistics_decision_makers: { label: 'Key decision-makers', category: 'Logistics', question: 'Who are the key decision-makers and stakeholders for this project?' },
  logistics_hard_deadlines: { label: 'Hard deadlines', category: 'Logistics', question: 'Are there any hard deadlines or launch dates to work towards?' },
  logistics_support_expectations: { label: 'Post-launch support expectations', category: 'Logistics', question: 'What ongoing support and maintenance expectations are there post-launch?' },
  logistics_budget_constraints: { label: 'Budget constraints', category: 'Logistics', question: 'Are there specific budget constraints or approval processes?' },
};

type ChecklistState = Record<string, boolean>;

interface DiscoveryChecklistProps {
  assessmentId: string;
  checklist: ChecklistState | null;
  onUpdate: (checklist: ChecklistState) => void;
  /** Compact mode for in-card display */
  compact?: boolean;
  /** Show full question text */
  showQuestions?: boolean;
}

const DiscoveryChecklist = ({ assessmentId, checklist, onUpdate, compact = false, showQuestions = false }: DiscoveryChecklistProps) => {
  const [expanded, setExpanded] = useState(!compact);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const state: ChecklistState = checklist || {};
  const checkedCount = Object.values(state).filter(Boolean).length;
  const totalQuestions = Object.keys(DISCOVERY_QUESTIONS).length;

  const handleToggle = async (key: string, checked: boolean) => {
    const updated = { ...state, [key]: checked };
    onUpdate(updated);

    // Persist to DB
    const { error } = await supabase
      .from('roi_assessments')
      .update({ discovery_checklist: JSON.parse(JSON.stringify(updated)) })
      .eq('id', assessmentId);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    }
  };

  const handleCheckAll = async () => {
    setSaving(true);
    const updated: ChecklistState = {};
    Object.keys(DISCOVERY_QUESTIONS).forEach(k => updated[k] = true);
    onUpdate(updated);
    const { error } = await supabase
      .from('roi_assessments')
      .update({ discovery_checklist: JSON.parse(JSON.stringify(updated)) })
      .eq('id', assessmentId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setSaving(false);
  };

  // Group by category
  const categories = new Map<string, string[]>();
  for (const key of Object.keys(DISCOVERY_QUESTIONS)) {
    const cat = DISCOVERY_QUESTIONS[key].category;
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(key);
  }

  if (compact) {
    return (
      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground">Call Checklist</h4>
            <Badge variant="outline" className="text-[9px] h-4">
              {checkedCount}/{totalQuestions}
            </Badge>
          </div>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 max-h-[400px] overflow-y-auto pr-1"
            >
              {Array.from(categories.entries()).map(([category, keys]) => (
                <div key={category} className="space-y-1">
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{category}</h5>
                  {keys.map(key => (
                    <label key={key} className="flex items-start gap-2 cursor-pointer group">
                      <Checkbox
                        checked={!!state[key]}
                        onCheckedChange={(checked) => handleToggle(key, !!checked)}
                        className="mt-0.5"
                      />
                      <span className={`text-[11px] leading-tight ${state[key] ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {DISCOVERY_QUESTIONS[key].label}
                      </span>
                    </label>
                  ))}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full-size mode (for Call Guide tab)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Discovery Checklist</h3>
          <Badge variant="outline" className="text-xs">
            {checkedCount}/{totalQuestions} covered
          </Badge>
        </div>
        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handleCheckAll} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <ClipboardCheck className="w-3 h-3" />}
          Mark All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from(categories.entries()).map(([category, keys]) => {
          const catChecked = keys.filter(k => state[k]).length;
          return (
            <div key={category} className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{category}</h4>
                <Badge variant={catChecked === keys.length ? 'default' : 'outline'} className="text-[10px]">
                  {catChecked}/{keys.length}
                </Badge>
              </div>
              <div className="space-y-2.5">
                {keys.map(key => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group p-1.5 rounded-md hover:bg-secondary/50 transition-colors">
                    <Checkbox
                      checked={!!state[key]}
                      onCheckedChange={(checked) => handleToggle(key, !!checked)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <span className={`text-sm leading-tight block ${state[key] ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>
                        {DISCOVERY_QUESTIONS[key].label}
                      </span>
                      {showQuestions && (
                        <span className="text-xs text-muted-foreground mt-0.5 block">
                          {DISCOVERY_QUESTIONS[key].question}
                        </span>
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
  );
};

export default DiscoveryChecklist;
