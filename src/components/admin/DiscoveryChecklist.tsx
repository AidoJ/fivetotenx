import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp, ClipboardCheck, Save, Loader2 } from 'lucide-react';

export const DISCOVERY_QUESTIONS: Record<string, { label: string; category: string; question: string }> = {
  // 1. Business Operations & Workflows
  operations_customer_journey: { label: 'Customer journey breakdown', category: 'Operations', question: 'Walk me through your current customer journey from first contact to payment — where does it break down?' },
  operations_biggest_bottleneck: { label: 'Biggest bottleneck', category: 'Operations', question: 'What\'s your biggest bottleneck right now that costs you the most time or money?' },
  operations_seasonal: { label: 'Seasonal patterns', category: 'Operations', question: 'Are there any seasonal patterns that affect staffing, bookings, or revenue?' },
  
  // 2. Technology & Systems
  systems_current_tools: { label: 'Current daily tools', category: 'Systems', question: 'What software/tools do you currently use daily (CRM, POS, accounting, scheduling)?' },
  systems_integrations: { label: 'Required integrations', category: 'Systems', question: 'Which of those would you absolutely need the app to integrate with?' },
  systems_data_migration: { label: 'Data migration needs', category: 'Systems', question: 'Do you have existing data (customer lists, product catalogues) that needs migrating?' },
  
  // 3. Users & Roles
  users_internal_roles: { label: 'Internal users & permissions', category: 'Users', question: 'Who will use the app internally? (Admin, staff, managers — what permissions differ?)' },
  users_customer_portal: { label: 'Customer portal needs', category: 'Users', question: 'Will customers/clients need their own login or portal?' },
  users_tech_proficiency: { label: 'Staff tech proficiency', category: 'Users', question: 'How tech-savvy are your staff? Do we need to design for simplicity?' },
  
  // 4. Revenue & Growth Priorities
  revenue_one_problem: { label: 'Primary problem to solve', category: 'Revenue', question: 'If this app could solve only ONE problem perfectly, what would it be?' },
  revenue_success_metrics: { label: 'Success metrics (6-12 months)', category: 'Revenue', question: 'What does success look like 6 months after launch? 12 months?' },
  revenue_new_streams: { label: 'Desired new revenue streams', category: 'Revenue', question: 'Are there revenue streams you\'ve wanted to add but couldn\'t without the right tech?' },
  
  // 5. Content & Branding
  content_brand_guidelines: { label: 'Brand assets & guidelines', category: 'Content', question: 'Do you have existing brand guidelines, logo files, and colour palettes?' },
  content_management: { label: 'Content management responsibility', category: 'Content', question: 'Who will manage ongoing content (product updates, blog, promotions)?' },
  content_multilingual: { label: 'Multi-language needs', category: 'Content', question: 'Do you need multi-language support?' },
  
  // 6. Compliance & Security
  compliance_regulations: { label: 'Industry regulations', category: 'Compliance', question: 'Are there industry regulations you need to comply with (e.g. health records, financial data)?' },
  compliance_data_residency: { label: 'Data residency requirements', category: 'Compliance', question: 'Do you need specific data residency (AU-only hosting)?' },
  compliance_payment: { label: 'Payment processing preferences', category: 'Compliance', question: 'Payment processing preferences (Stripe, Square, existing provider)?' },
  
  // 7. Budget & Decision-Making
  logistics_decision_makers: { label: 'Additional decision-makers', category: 'Logistics', question: 'Beyond the decision-maker identified in the deep dive, who else needs to sign off?' },
  logistics_hard_deadlines: { label: 'Hard deadlines', category: 'Logistics', question: 'Is there a hard deadline driving this project (e.g. busy season, funding round)?' },
  logistics_phased_rollout: { label: 'Phased vs full rollout', category: 'Logistics', question: 'What\'s your comfort level with a phased rollout vs. a full launch?' },
  
  // 8. Support & Maintenance
  support_post_launch: { label: 'Post-launch support level', category: 'Support', question: 'What level of post-launch support do you expect (self-service vs. managed)?' },
  support_updates: { label: 'Feature update frequency', category: 'Support', question: 'How often do you anticipate needing feature updates or changes?' },
  support_training: { label: 'Staff training needs', category: 'Support', question: 'Do you need training sessions for staff?' },
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
                        {DISCOVERY_QUESTIONS[key].question}
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
                        {DISCOVERY_QUESTIONS[key].question}
                      </span>
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
