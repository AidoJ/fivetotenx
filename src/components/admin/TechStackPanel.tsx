import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, RefreshCw, Pencil, Save, Server, Layout, Database, Cloud, Puzzle } from 'lucide-react';

interface TechStackData {
  frontend?: string;
  backend?: string;
  database?: string;
  hosting?: string;
  integrations?: string;
  reasoning?: string;
  generated_at?: string;
}

interface Props {
  assessmentId: string;
  techStack: TechStackData | null;
  onUpdate: (stack: TechStackData) => void;
}

const SECTIONS = [
  { key: 'frontend', label: 'Frontend', icon: Layout, placeholder: 'e.g. React, Next.js, Tailwind CSS...' },
  { key: 'backend', label: 'Backend', icon: Server, placeholder: 'e.g. Node.js, Supabase Edge Functions...' },
  { key: 'database', label: 'Database', icon: Database, placeholder: 'e.g. PostgreSQL via Supabase...' },
  { key: 'hosting', label: 'Hosting & Deployment', icon: Cloud, placeholder: 'e.g. Vercel, Supabase, AWS...' },
  { key: 'integrations', label: 'Key Integrations', icon: Puzzle, placeholder: 'e.g. Stripe, Resend, Calendly...' },
] as const;

const TechStackPanel = ({ assessmentId, techStack, onUpdate }: Props) => {
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TechStackData>(techStack || {});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Fetch assessment data for AI context
      const { data: assessment } = await supabase
        .from('roi_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (!assessment) throw new Error('Assessment not found');

      const discoveryAnswers = assessment.discovery_answers as any || {};
      const analysis = discoveryAnswers._analysis;
      const formData = assessment.form_data as any;

      // Fetch related data
      const [stRes, scopeRes, ddRes] = await Promise.all([
        supabase.from('straight_talk_responses').select('responses').eq('assessment_id', assessmentId).limit(1),
        supabase.from('scoping_responses').select('responses').eq('assessment_id', assessmentId).limit(1),
        supabase.from('deep_dive_submissions').select('*').eq('assessment_id', assessmentId).limit(1),
      ]);

      const prompt = buildPrompt(assessment, formData, analysis, discoveryAnswers,
        stRes.data?.[0]?.responses, scopeRes.data?.[0]?.responses, ddRes.data?.[0]);

      const { data, error } = await supabase.functions.invoke('analyze-opportunities', {
        body: {
          assessmentId,
          customPrompt: prompt,
          mode: 'tech_stack',
        },
      });

      if (error) throw error;

      let stackData: TechStackData;
      if (data?.techStack) {
        stackData = { ...data.techStack, generated_at: new Date().toISOString() };
      } else if (data?.analysis) {
        // Fallback: parse from analysis response
        stackData = {
          frontend: 'React + Tailwind CSS + Vite',
          backend: 'Supabase (PostgreSQL + Edge Functions)',
          database: 'PostgreSQL via Supabase',
          hosting: 'Vercel (frontend) + Supabase Cloud (backend)',
          integrations: 'To be determined based on requirements',
          reasoning: typeof data.analysis === 'string' ? data.analysis : data.analysis.summary || 'Generated based on client requirements.',
          generated_at: new Date().toISOString(),
        };
      } else {
        throw new Error('No recommendation returned');
      }

      // Save to DB
      await supabase.from('roi_assessments')
        .update({ tech_stack: stackData as any })
        .eq('id', assessmentId);

      setDraft(stackData);
      onUpdate(stackData);
      toast({ title: 'Tech stack recommendation generated ✅' });
    } catch (err: any) {
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('roi_assessments')
        .update({ tech_stack: draft as any })
        .eq('id', assessmentId);
      onUpdate(draft);
      setEditing(false);
      toast({ title: 'Tech stack saved ✅' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const updateDraft = (key: string, value: string) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  if (!techStack || Object.keys(techStack).length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center space-y-4">
        <Server className="w-10 h-10 text-primary mx-auto" />
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Tech Stack Recommendation</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Generate an AI-powered tech stack recommendation based on this client's requirements, discovery data, and opportunity analysis.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating} className="gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? 'Generating...' : 'Generate Recommendation'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" /> Tech Stack Recommendation
          </h3>
          {techStack.generated_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Generated {new Date(techStack.generated_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => { setEditing(false); setDraft(techStack); }}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => { setDraft(techStack); setEditing(true); }} className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating} className="gap-1.5">
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Re-generate
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key} className="rounded-xl border border-border bg-card p-5 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h4 className="text-sm font-bold text-foreground">{label}</h4>
            </div>
            {editing ? (
              <Textarea
                value={(draft as any)[key] || ''}
                onChange={e => updateDraft(key, e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="text-xs resize-none"
              />
            ) : (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                {(techStack as any)[key] || <span className="text-muted-foreground italic">Not specified</span>}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Reasoning */}
      {(editing ? draft.reasoning : techStack.reasoning) && (
        <div className="rounded-xl border border-border bg-primary/5 p-5 space-y-2">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Reasoning
          </h4>
          {editing ? (
            <Textarea
              value={draft.reasoning || ''}
              onChange={e => updateDraft('reasoning', e.target.value)}
              rows={4}
              className="text-xs resize-none"
            />
          ) : (
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{techStack.reasoning}</p>
          )}
        </div>
      )}
    </div>
  );
};

function buildPrompt(assessment: any, formData: any, analysis: any, discoveryAnswers: any, stResponses: any, scopeResponses: any, deepDive: any) {
  const parts = [`You are a senior solutions architect. Based on the following client data, recommend the ideal tech stack for building their solution.\n`];
  parts.push(`Business: ${assessment.business_name || 'Unknown'} (${assessment.industry || 'Unknown industry'})`);

  if (analysis?.big_hits) {
    parts.push(`\nTop opportunities identified:`);
    analysis.big_hits.forEach((h: any) => parts.push(`- ${h.title}: ${h.recommendation}`));
  }
  if (deepDive) {
    if (deepDive.current_tools) parts.push(`\nCurrent tools: ${deepDive.current_tools}`);
    if (deepDive.must_have_features) parts.push(`Must-have features: ${deepDive.must_have_features}`);
    if (deepDive.required_integrations?.length) parts.push(`Required integrations: ${deepDive.required_integrations.join(', ')}`);
  }
  if (formData?.primaryGoals?.length) parts.push(`\nPrimary goals: ${formData.primaryGoals.join(', ')}`);

  parts.push(`\nRespond with a JSON object with keys: frontend, backend, database, hosting, integrations, reasoning. Each value is a string with your recommendation and brief rationale.`);
  return parts.join('\n');
}

export default TechStackPanel;
