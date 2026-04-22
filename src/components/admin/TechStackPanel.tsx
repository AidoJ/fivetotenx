import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { maybeAutoRegenerateProposal } from '@/lib/proposalBuilder';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, RefreshCw, Pencil, Save, Server, Layout, Database, Cloud, Puzzle, Shield, Scale, Eye, Clock, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, ArrowRightLeft, Wrench, Crown, Award, Wallet, Star } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TechStackData {
  existing_tools_audit?: Array<{
    tool_name: string;
    current_use?: string;
    verdict: 'keep' | 'replace' | 'integrate' | 'enhance';
    reasoning: string;
    integration_notes?: string;
  }>;
  recommended_tools?: Array<{
    category: string;
    primary_recommendation: string;
    alternatives: string;
    estimated_cost?: string;
    integration_complexity?: 'low' | 'medium' | 'high';
  }>;
  compliance?: {
    aml_strategy?: string;
    privacy_requirements?: string;
    industry_regulations?: string;
    audit_trail?: string;
  };
  data_security?: {
    pii_handling?: string;
    data_residency?: string;
    encryption?: string;
    ai_document_pipeline?: string;
    rbac_strategy?: string;
    dlp_strategy?: string;
  };
  architecture?: {
    frontend?: string;
    backend?: string;
    database?: string;
    hosting?: string;
    integrations?: string;
    ai_ml_pipeline?: string;
  };
  implementation_roadmap?: {
    phase_1_quick_wins?: string;
    phase_2_core_build?: string;
    phase_3_advanced?: string;
    migration_strategy?: string;
  };
  reasoning?: string;
  generated_at?: string;
  tiered_stacks?: {
    premier?: TierData;
    gold?: TierData;
    entry?: TierData;
    recommended_tier?: 'premier' | 'gold' | 'entry';
    summary?: string;
  };
  // Legacy flat fields
  frontend?: string;
  backend?: string;
  database?: string;
  hosting?: string;
  integrations?: string;
}

interface TierData {
  headline?: string;
  best_for?: string;
  tradeoffs?: string;
  monthly_cost_range?: string;
  one_off_setup_range?: string;
  tools?: Array<{ name: string; role: string; monthly_cost: string; justification: string }>;
}

interface Props {
  assessmentId: string;
  techStack: TechStackData | null;
  onUpdate: (stack: TechStackData) => void;
}

const verdictConfig = {
  keep: { label: 'Keep', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
  replace: { label: 'Replace', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: AlertTriangle },
  integrate: { label: 'Integrate', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: ArrowRightLeft },
  enhance: { label: 'Enhance', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Wrench },
};

const complexityColors = {
  low: 'bg-green-500/10 text-green-600',
  medium: 'bg-amber-500/10 text-amber-600',
  high: 'bg-red-500/10 text-red-600',
};

const TechStackPanel = ({ assessmentId, techStack, onUpdate }: Props) => {
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const isRichFormat = !!(techStack?.existing_tools_audit || techStack?.compliance || techStack?.data_security);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-opportunities', {
        body: { assessmentId, mode: 'tech_stack' },
      });

      if (error) throw error;
      if (!data?.techStack) throw new Error('No recommendation returned');

      const stackData = { ...data.techStack, generated_at: new Date().toISOString() };
      onUpdate(stackData);
      const regenerated = await maybeAutoRegenerateProposal(assessmentId);
      toast({
        title: 'Tech stack analysis generated ✅',
        description: regenerated ? 'Proposal auto-regenerated with new tech stack.' : undefined,
      });
    } catch (err: any) {
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    }
    setGenerating(false);
  };

  const handleInlineEdit = async (path: string, value: string) => {
    setSaving(true);
    try {
      const updated = JSON.parse(JSON.stringify(techStack || {}));
      const keys = path.split('.');
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;

      await supabase.from('roi_assessments')
        .update({ tech_stack: updated as any })
        .eq('id', assessmentId);
      onUpdate(updated);
      setEditField(null);
      toast({ title: 'Saved ✅' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const EditableText = ({ value, path, rows = 3 }: { value: string; path: string; rows?: number }) => {
    const isEditing = editField === path;
    return isEditing ? (
      <div className="space-y-2">
        <Textarea value={editValue} onChange={e => setEditValue(e.target.value)} rows={rows} className="text-xs resize-none" />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditField(null)}>Cancel</Button>
          <Button size="sm" onClick={() => handleInlineEdit(path, editValue)} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
          </Button>
        </div>
      </div>
    ) : (
      <div className="group relative">
        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{value || <span className="italic text-muted-foreground">Not specified</span>}</p>
        <button
          onClick={() => { setEditField(path); setEditValue(value || ''); }}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    );
  };

  if (!techStack || Object.keys(techStack).length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center space-y-4">
        <Server className="w-10 h-10 text-primary mx-auto" />
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Tech Stack Analysis</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Generate a comprehensive analysis covering existing tools audit, market alternatives, compliance (AML/KYC), PII protection, secure AI document pipelines, and implementation roadmap.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating} className="gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? 'Analysing (this may take 30-60s)...' : 'Generate Full Analysis'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" /> Tech Stack Analysis
          </h3>
          {techStack.generated_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Generated {new Date(techStack.generated_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          className="gap-1.5"
          title="Re-run analysis based on the latest proposal scope, opportunities, and discovery data"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Re-run from latest scope
        </Button>
      </div>

      {/* Executive Summary */}
      {techStack.reasoning && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-2">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Executive Summary
          </h4>
          <EditableText value={techStack.reasoning} path="reasoning" rows={4} />
        </div>
      )}

      {/* Existing Tools Audit */}
      {techStack.existing_tools_audit && techStack.existing_tools_audit.length > 0 && (
        <CollapsibleSection
          title="Existing Tools Audit"
          icon={Wrench}
          isOpen={expandedSections['tools'] !== false}
          onToggle={() => toggleSection('tools')}
          badge={`${techStack.existing_tools_audit.length} tools`}
        >
          <div className="space-y-3">
            {techStack.existing_tools_audit.map((tool, i) => {
              const vc = verdictConfig[tool.verdict] || verdictConfig.keep;
              const VIcon = vc.icon;
              return (
                <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-sm text-foreground">{tool.tool_name}</h5>
                    <Badge variant="outline" className={`text-xs ${vc.color}`}>
                      <VIcon className="w-3 h-3 mr-1" /> {vc.label}
                    </Badge>
                  </div>
                  {tool.current_use && <p className="text-xs text-muted-foreground">{tool.current_use}</p>}
                  <p className="text-sm text-foreground/80">{tool.reasoning}</p>
                  {tool.integration_notes && (
                    <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
                      <span className="font-medium">Integration:</span> {tool.integration_notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Market Tool Recommendations */}
      {techStack.recommended_tools && techStack.recommended_tools.length > 0 && (
        <CollapsibleSection
          title="Market Tool Recommendations"
          icon={Puzzle}
          isOpen={expandedSections['market'] !== false}
          onToggle={() => toggleSection('market')}
          badge={`${techStack.recommended_tools.length} categories`}
        >
          <div className="space-y-3">
            {techStack.recommended_tools.map((tool, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-sm text-foreground">{tool.category}</h5>
                  <div className="flex gap-2">
                    {tool.integration_complexity && (
                      <Badge variant="outline" className={`text-xs ${complexityColors[tool.integration_complexity]}`}>
                        {tool.integration_complexity} complexity
                      </Badge>
                    )}
                    {tool.estimated_cost && (
                      <Badge variant="outline" className="text-xs">{tool.estimated_cost}</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm font-medium text-primary">{tool.primary_recommendation}</p>
                <p className="text-sm text-foreground/70"><span className="font-medium">Alternatives:</span> {tool.alternatives}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Compliance & Regulatory */}
      {techStack.compliance && (
        <CollapsibleSection
          title="Compliance & Regulatory"
          icon={Scale}
          isOpen={expandedSections['compliance'] !== false}
          onToggle={() => toggleSection('compliance')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {techStack.compliance.aml_strategy && (
              <InfoCard title="AML / KYC Strategy" icon={Shield}>
                <EditableText value={techStack.compliance.aml_strategy} path="compliance.aml_strategy" />
              </InfoCard>
            )}
            {techStack.compliance.privacy_requirements && (
              <InfoCard title="Privacy Requirements" icon={Eye}>
                <EditableText value={techStack.compliance.privacy_requirements} path="compliance.privacy_requirements" />
              </InfoCard>
            )}
            {techStack.compliance.industry_regulations && (
              <InfoCard title="Industry Regulations" icon={Scale}>
                <EditableText value={techStack.compliance.industry_regulations} path="compliance.industry_regulations" />
              </InfoCard>
            )}
            {techStack.compliance.audit_trail && (
              <InfoCard title="Audit Trail" icon={Clock}>
                <EditableText value={techStack.compliance.audit_trail} path="compliance.audit_trail" />
              </InfoCard>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Data Security & PII */}
      {techStack.data_security && (
        <CollapsibleSection
          title="Data Security & PII Protection"
          icon={Shield}
          isOpen={expandedSections['security'] !== false}
          onToggle={() => toggleSection('security')}
        >
          <div className="space-y-4">
            {techStack.data_security.pii_handling && (
              <InfoCard title="PII Handling with AI Tools" icon={Eye}>
                <EditableText value={techStack.data_security.pii_handling} path="data_security.pii_handling" />
              </InfoCard>
            )}
            {techStack.data_security.ai_document_pipeline && (
              <InfoCard title="Secure AI Document Pipeline" icon={Server}>
                <EditableText value={techStack.data_security.ai_document_pipeline} path="data_security.ai_document_pipeline" />
              </InfoCard>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {techStack.data_security.data_residency && (
                <InfoCard title="Data Residency" icon={Cloud}>
                  <EditableText value={techStack.data_security.data_residency} path="data_security.data_residency" />
                </InfoCard>
              )}
              {techStack.data_security.encryption && (
                <InfoCard title="Encryption" icon={Shield}>
                  <EditableText value={techStack.data_security.encryption} path="data_security.encryption" />
                </InfoCard>
              )}
              {techStack.data_security.rbac_strategy && (
                <InfoCard title="Access Control (RBAC)" icon={Shield}>
                  <EditableText value={techStack.data_security.rbac_strategy} path="data_security.rbac_strategy" />
                </InfoCard>
              )}
              {techStack.data_security.dlp_strategy && (
                <InfoCard title="Data Loss Prevention" icon={Shield}>
                  <EditableText value={techStack.data_security.dlp_strategy} path="data_security.dlp_strategy" />
                </InfoCard>
              )}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Architecture */}
      {techStack.architecture && (
        <CollapsibleSection
          title="Recommended Architecture"
          icon={Layout}
          isOpen={expandedSections['arch'] !== false}
          onToggle={() => toggleSection('arch')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'frontend', label: 'Frontend', icon: Layout },
              { key: 'backend', label: 'Backend', icon: Server },
              { key: 'database', label: 'Database', icon: Database },
              { key: 'hosting', label: 'Hosting', icon: Cloud },
              { key: 'integrations', label: 'Integrations', icon: Puzzle },
              { key: 'ai_ml_pipeline', label: 'AI/ML Pipeline', icon: Sparkles },
            ].map(({ key, label, icon }) => {
              const val = (techStack.architecture as any)?.[key];
              if (!val) return null;
              return (
                <InfoCard key={key} title={label} icon={icon}>
                  <EditableText value={val} path={`architecture.${key}`} />
                </InfoCard>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Implementation Roadmap */}
      {techStack.implementation_roadmap && (
        <CollapsibleSection
          title="Implementation Roadmap"
          icon={Clock}
          isOpen={expandedSections['roadmap'] !== false}
          onToggle={() => toggleSection('roadmap')}
        >
          <div className="space-y-4">
            {[
              { key: 'phase_1_quick_wins', label: 'Phase 1 — Quick Wins (Weeks)', color: 'border-l-green-500' },
              { key: 'phase_2_core_build', label: 'Phase 2 — Core Platform Build', color: 'border-l-blue-500' },
              { key: 'phase_3_advanced', label: 'Phase 3 — Advanced Automation & AI', color: 'border-l-purple-500' },
              { key: 'migration_strategy', label: 'Migration Strategy', color: 'border-l-amber-500' },
            ].map(({ key, label, color }) => {
              const val = (techStack.implementation_roadmap as any)?.[key];
              if (!val) return null;
              return (
                <div key={key} className={`rounded-lg border border-border border-l-4 ${color} bg-card p-4 space-y-2`}>
                  <h5 className="text-sm font-bold text-foreground">{label}</h5>
                  <EditableText value={val} path={`implementation_roadmap.${key}`} />
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Legacy flat format fallback */}
      {!isRichFormat && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'frontend', label: 'Frontend', icon: Layout },
            { key: 'backend', label: 'Backend', icon: Server },
            { key: 'database', label: 'Database', icon: Database },
            { key: 'hosting', label: 'Hosting', icon: Cloud },
            { key: 'integrations', label: 'Integrations', icon: Puzzle },
          ].map(({ key, label, icon: Icon }) => {
            const val = (techStack as any)[key];
            if (!val) return null;
            return (
              <InfoCard key={key} title={label} icon={Icon}>
                <EditableText value={val} path={key} />
              </InfoCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

function CollapsibleSection({ title, icon: Icon, isOpen, onToggle, badge, children }: {
  title: string; icon: any; isOpen: boolean; onToggle: () => void; badge?: string; children: React.ReactNode;
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            <h4 className="text-sm font-bold text-foreground">{title}</h4>
            {badge && <Badge variant="outline" className="text-xs ml-2">{badge}</Badge>}
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-4">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function InfoCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <h5 className="text-xs font-bold text-foreground">{title}</h5>
      </div>
      {children}
    </div>
  );
}

export default TechStackPanel;
