import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, ArrowRight, CheckCircle, Loader2, Sparkles,
  CreditCard, Users, Target, Send,
  Calendar, Settings, MessageSquare, UserCircle, Plug, Shield, Rocket, Hammer, Briefcase,
} from 'lucide-react';
import logo from '@/assets/logo-5to10x-color.webp';

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, Calendar, Users, CreditCard, Settings, MessageSquare,
  UserCircle, Plug, Shield, Rocket, Hammer, Briefcase, Target,
};

interface Category {
  id: string;
  label: string;
  icon: string;
  sort_order: number;
}

interface Question {
  id: string;
  category_id: string;
  question: string;
  detail_prompt: string;
  question_type: string;
  options: any[];
  sort_order: number;
}

const BUDGET_OPTIONS = [
  { value: 'comfortable', label: 'Comfortable with the quoted range' },
  { value: 'stretch', label: "It's a stretch but doable" },
  { value: 'need-lower', label: 'Need to explore lower options' },
  { value: 'unsure', label: 'Need more info before deciding' },
];

const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'ASAP — ready to start now' },
  { value: '1-3months', label: '1–3 months' },
  { value: '3-6months', label: '3–6 months' },
  { value: '6plus', label: '6+ months — just exploring' },
];

const DECISION_TIMELINE_OPTIONS = [
  { value: 'this-week', label: 'This week' },
  { value: '2-4weeks', label: '2–4 weeks' },
  { value: '1-3months', label: '1–3 months' },
  { value: 'no-timeline', label: 'No set timeline' },
];

const StraightTalk = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const assessmentId = searchParams.get('id');
  const mode = searchParams.get('mode') || 'self'; // 'self' or 'guide'

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [industryId, setIndustryId] = useState<string | null>(null);
  const [industryLabel, setIndustryLabel] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');

  // DB data
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Form state
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!assessmentId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      // Fetch assessment
      const { data: assessment, error } = await supabase
        .from('roi_assessments')
        .select('business_name, contact_name, contact_email, industry, industry_id, roi_results, is_qualified')
        .eq('id', assessmentId)
        .single();

      if (error || !assessment) {
        toast({ title: 'Invalid link', description: 'Assessment not found.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      setBusinessName(assessment.business_name || '');
      setContactName(assessment.contact_name || '');
      setContactEmail(assessment.contact_email || '');
      setIndustryLabel(assessment.industry || '');

      const roiResults = assessment.roi_results as any;
      if (roiResults?.pricing?.buildCostLow && roiResults?.pricing?.buildCostHigh) {
        const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
        setInvestmentAmount(`${fmt(roiResults.pricing.buildCostLow)} – ${fmt(roiResults.pricing.buildCostHigh)}`);
      }

      // Get industry ID - try industry_id first, then match by name
      let indId = (assessment as any).industry_id;
      if (!indId && assessment.industry) {
        const { data: indData } = await supabase
          .from('scoping_industries' as any)
          .select('id')
          .eq('label', assessment.industry)
          .single();
        if (indData) indId = (indData as any).id;
      }
      setIndustryId(indId);

      // Fetch straight_talk categories & questions for this industry
      if (indId) {
        const [catRes, qRes] = await Promise.all([
          supabase.from('scoping_categories' as any).select('*').eq('industry_id', indId).eq('phase', 'straight_talk').order('sort_order'),
          supabase.from('scoping_questions' as any).select('*').order('sort_order'),
        ]);
        const cats = (catRes.data as any) || [];
        const allQ = (qRes.data as any) || [];
        const catIds = cats.map((c: Category) => c.id);
        setCategories(cats);
        setQuestions(allQ.filter((q: Question) => catIds.includes(q.category_id)));
      }

      setLoading(false);
    };
    load();
  }, [assessmentId, toast]);

  const totalSteps = categories.length;
  const activeCategory = categories[step];
  const categoryQuestions = questions.filter((q) => q.category_id === activeCategory?.id).sort((a, b) => a.sort_order - b.sort_order);

  const handleSubmit = async () => {
    if (!assessmentId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('straight_talk_responses' as any).insert([{
        assessment_id: assessmentId,
        industry: industryLabel || 'unknown',
        responses: JSON.parse(JSON.stringify(responses)),
        completed: true,
      }]);
      if (error) throw error;

      // Update pipeline stage to deep_dive_complete (Straight Talk replaces deep dive)
      await supabase.from('roi_assessments')
        .update({ pipeline_stage: 'deep_dive_complete' as any })
        .eq('id', assessmentId);

      setSubmitted(true);
      toast({ title: 'Submitted! 🎉', description: 'Your responses have been received.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to submit. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (q: Question) => {
    // Check question text for select-type hints
    const isComfort = q.question.toLowerCase().includes('comfort level');
    const isTimeline = q.question.toLowerCase().includes('timeline to get started') || q.question.toLowerCase().includes('ideal timeline');
    const isDecisionTimeline = q.question.toLowerCase().includes('decision by') || q.question.toLowerCase().includes('make a decision');

    if (isComfort) {
      return (
        <Select value={responses[q.id] || ''} onValueChange={(v) => setResponses((prev) => ({ ...prev, [q.id]: v }))}>
          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            {BUDGET_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (isTimeline && !isDecisionTimeline) {
      return (
        <Select value={responses[q.id] || ''} onValueChange={(v) => setResponses((prev) => ({ ...prev, [q.id]: v }))}>
          <SelectTrigger><SelectValue placeholder="Select timeline..." /></SelectTrigger>
          <SelectContent>
            {TIMELINE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (isDecisionTimeline) {
      return (
        <Select value={responses[q.id] || ''} onValueChange={(v) => setResponses((prev) => ({ ...prev, [q.id]: v }))}>
          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            {DECISION_TIMELINE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Textarea
        placeholder="Your answer..."
        value={responses[q.id] || ''}
        onChange={(e) => setResponses((prev) => ({ ...prev, [q.id]: e.target.value }))}
        rows={3}
        className="bg-secondary border-border resize-none"
      />
    );
  };

  // Loading / Error states
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assessmentId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-display font-bold text-foreground">Invalid Link</h1>
          <p className="text-muted-foreground">This link is missing an assessment ID.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center space-y-6"
        >
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ backgroundImage: 'var(--gradient-primary)' }}>
            <CheckCircle className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Thank You, {contactName}!</h1>
          <p className="text-muted-foreground">
            Your Straight Talk™ responses have been received. Our team will analyse your answers and prepare a tailored Green Light™ proposal for your business.
          </p>
          <p className="text-sm text-muted-foreground">We'll be in touch within 24–48 hours.</p>
        </motion.div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-display font-bold text-foreground">No Questions Available</h1>
          <p className="text-muted-foreground">Straight Talk™ questions haven't been configured for this industry yet.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const CategoryIcon = ICON_MAP[activeCategory?.icon || 'Sparkles'] || Sparkles;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={logo} alt="5to10x" className="h-8" />
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{businessName}</p>
            <p className="text-xs text-muted-foreground">
              Straight Talk™ {mode === 'guide' ? '(Call Guide)' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Intro */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundImage: 'var(--gradient-vibrant)', color: 'white' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Straight Talk™ — Phase 2
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Let's Talk, {contactName}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {mode === 'guide'
              ? 'Use this guide during the call to capture key discussion points.'
              : 'Help us understand your priorities and constraints so we can build the right solution.'}
          </p>
          {investmentAmount && (
            <p className="text-sm text-muted-foreground">
              Estimated investment: <strong className="text-foreground">{investmentAmount}</strong>
            </p>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {categories.map((cat, i) => {
            const Icon = ICON_MAP[cat.icon] || Sparkles;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={cat.id}
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                    ? 'bg-primary/20 text-primary cursor-pointer'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-border bg-card p-6 space-y-5"
          >
            <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              <CategoryIcon className="w-5 h-5 text-primary" />
              {activeCategory?.label}
            </h2>

            <div className="space-y-4">
              {categoryQuestions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <Label className="text-sm font-medium">{q.question}</Label>
                  {q.detail_prompt && (
                    <p className="text-xs text-muted-foreground">{q.detail_prompt}</p>
                  )}
                  {renderQuestionInput(q)}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} className="gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StraightTalk;
