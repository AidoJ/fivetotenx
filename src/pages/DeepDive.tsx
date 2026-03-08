import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Sparkles, Building2, Target, Wrench, Users, Send } from 'lucide-react';
import logo from '@/assets/logo-5to10x-color.png';

const GOAL_OPTIONS = [
  'Increase revenue / sales',
  'Reduce manual admin work',
  'Improve customer retention',
  'Better booking / scheduling',
  'Automate follow-ups & reminders',
  'Launch loyalty / rewards program',
  'Mobile app for customers',
  'Internal staff tools',
  'E-commerce / online sales',
  'Data & analytics dashboard',
];

const INTEGRATION_OPTIONS = [
  'Payment gateway (Stripe, Square, etc.)',
  'Accounting (Xero, MYOB, QuickBooks)',
  'Email marketing (Mailchimp, Klaviyo)',
  'CRM (HubSpot, Salesforce)',
  'Social media platforms',
  'POS system',
  'Calendar / booking system',
  'SMS notifications',
  'Inventory management',
  'Shipping / logistics',
];

const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'ASAP — ready to start now' },
  { value: '1-3months', label: '1–3 months' },
  { value: '3-6months', label: '3–6 months' },
  { value: '6plus', label: '6+ months — just exploring' },
];

const BUDGET_OPTIONS = [
  { value: 'comfortable', label: 'Comfortable with the quoted range' },
  { value: 'stretch', label: 'It\'s a stretch but doable' },
  { value: 'need-lower', label: 'Need to explore lower options' },
  { value: 'unsure', label: 'Need more info before deciding' },
];

const DECISION_TIMELINE_OPTIONS = [
  { value: 'this-week', label: 'This week' },
  { value: '2-4weeks', label: '2–4 weeks' },
  { value: '1-3months', label: '1–3 months' },
  { value: 'no-timeline', label: 'No set timeline' },
];

interface DeepDiveForm {
  currentWebsite: string;
  currentTools: string;
  painPoints: string;
  primaryGoals: string[];
  timeline: string;
  budgetComfort: string;
  decisionMakerName: string;
  decisionMakerRole: string;
  decisionTimeline: string;
  requiredIntegrations: string[];
  mustHaveFeatures: string;
  niceToHaveFeatures: string;
  competitors: string;
  additionalNotes: string;
}

const initialForm: DeepDiveForm = {
  currentWebsite: '',
  currentTools: '',
  painPoints: '',
  primaryGoals: [],
  timeline: '',
  budgetComfort: '',
  decisionMakerName: '',
  decisionMakerRole: '',
  decisionTimeline: '',
  requiredIntegrations: [],
  mustHaveFeatures: '',
  niceToHaveFeatures: '',
  competitors: '',
  additionalNotes: '',
};

const STEPS = [
  { icon: Building2, label: 'Current Setup' },
  { icon: Target, label: 'Goals & Timeline' },
  { icon: Wrench, label: 'Requirements' },
  { icon: Users, label: 'Decision & Notes' },
];

const DeepDive = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const assessmentId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<DeepDiveForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!assessmentId) {
      setLoading(false);
      return;
    }
    const fetchAssessment = async () => {
      const { data, error } = await supabase
        .from('roi_assessments')
        .select('business_name, contact_name, is_qualified')
        .eq('id', assessmentId)
        .single();

      if (error || !data) {
        toast({ title: 'Invalid link', description: 'This assessment was not found.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      if (!data.is_qualified) {
        toast({ title: 'Not qualified', description: 'This assessment does not qualify for a deep dive.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      setBusinessName(data.business_name || '');
      setContactName(data.contact_name || '');
      setLoading(false);
    };
    fetchAssessment();
  }, [assessmentId, toast]);

  const updateField = <K extends keyof DeepDiveForm>(key: K, value: DeepDiveForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: 'primaryGoals' | 'requiredIntegrations', item: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(item) ? prev[key].filter((i) => i !== item) : [...prev[key], item],
    }));
  };

  const handleSubmit = async () => {
    if (!assessmentId) return;
    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('deep_dive_submissions').insert([{
        assessment_id: assessmentId,
        current_website: form.currentWebsite || null,
        current_tools: form.currentTools || null,
        pain_points: form.painPoints || null,
        primary_goals: form.primaryGoals,
        timeline: form.timeline || null,
        budget_comfort: form.budgetComfort || null,
        decision_maker_name: form.decisionMakerName || null,
        decision_maker_role: form.decisionMakerRole || null,
        decision_timeline: form.decisionTimeline || null,
        required_integrations: form.requiredIntegrations,
        must_have_features: form.mustHaveFeatures || null,
        nice_to_have_features: form.niceToHaveFeatures || null,
        competitors: form.competitors || null,
        additional_notes: form.additionalNotes || null,
      }]);
      if (insertError) throw insertError;

      // Update pipeline stage
      await supabase.from('roi_assessments')
        .update({ pipeline_stage: 'deep_dive_complete' as any })
        .eq('id', assessmentId);

      setSubmitted(true);
      toast({ title: 'Submitted! 🎉', description: 'Your deep dive has been received. We\'ll be in touch soon.' });
    } catch (err) {
      console.error('Submit error:', err);
      toast({ title: 'Error', description: 'Failed to submit. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

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
          <p className="text-muted-foreground">This deep dive link is missing an assessment ID.</p>
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
            Your deep dive questionnaire has been submitted. Our team will review your responses and prepare a tailored proposal for <strong>{businessName}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">We'll be in touch within 24–48 hours.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={logo} alt="5to10x" className="h-8" />
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{businessName}</p>
            <p className="text-xs text-muted-foreground">Deep Dive Questionnaire</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Intro */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundImage: 'var(--gradient-vibrant)', color: 'white' }}>
            <Sparkles className="w-3.5 h-3.5" />
            Qualified for Custom Build
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Let's Go Deeper, {contactName}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            This helps us scope the perfect solution for your business. Takes about 5 minutes.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={i}
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
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-border bg-card p-6 space-y-5"
          >
            {step === 0 && (
              <>
                <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Current Setup
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current website URL (if any)</Label>
                    <Input
                      placeholder="https://yourbusiness.com"
                      value={form.currentWebsite}
                      onChange={(e) => updateField('currentWebsite', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>What tools / software do you currently use?</Label>
                    <Textarea
                      placeholder="e.g. Square for POS, Calendly for bookings, Excel for invoicing..."
                      value={form.currentTools}
                      onChange={(e) => updateField('currentTools', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>What are your biggest pain points right now?</Label>
                    <Textarea
                      placeholder="e.g. Too much time on admin, losing customers to competitors, no way to track repeat visits..."
                      value={form.painPoints}
                      onChange={(e) => updateField('painPoints', e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Goals & Timeline
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>What are your primary goals? (select all that apply)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {GOAL_OPTIONS.map((goal) => (
                        <label
                          key={goal}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            form.primaryGoals.includes(goal)
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-secondary hover:border-primary/30'
                          }`}
                        >
                          <Checkbox
                            checked={form.primaryGoals.includes(goal)}
                            onCheckedChange={() => toggleArrayItem('primaryGoals', goal)}
                          />
                          <span className="text-sm text-foreground">{goal}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Ideal timeline to get started</Label>
                    <Select value={form.timeline} onValueChange={(v) => updateField('timeline', v)}>
                      <SelectTrigger><SelectValue placeholder="Select timeline..." /></SelectTrigger>
                      <SelectContent>
                        {TIMELINE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>How do you feel about the investment range?</Label>
                    <Select value={form.budgetComfort} onValueChange={(v) => updateField('budgetComfort', v)}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {BUDGET_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  Technical Requirements
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Integrations needed (select all that apply)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {INTEGRATION_OPTIONS.map((item) => (
                        <label
                          key={item}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            form.requiredIntegrations.includes(item)
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-secondary hover:border-primary/30'
                          }`}
                        >
                          <Checkbox
                            checked={form.requiredIntegrations.includes(item)}
                            onCheckedChange={() => toggleArrayItem('requiredIntegrations', item)}
                          />
                          <span className="text-sm text-foreground">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Must-have features</Label>
                    <Textarea
                      placeholder="Features that are absolutely essential..."
                      value={form.mustHaveFeatures}
                      onChange={(e) => updateField('mustHaveFeatures', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nice-to-have features</Label>
                    <Textarea
                      placeholder="Features you'd love but could live without..."
                      value={form.niceToHaveFeatures}
                      onChange={(e) => updateField('niceToHaveFeatures', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Decision Making & Final Notes
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Decision maker name</Label>
                      <Input
                        placeholder="Who signs off?"
                        value={form.decisionMakerName}
                        onChange={(e) => updateField('decisionMakerName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Their role</Label>
                      <Input
                        placeholder="e.g. Owner, Director, Manager"
                        value={form.decisionMakerRole}
                        onChange={(e) => updateField('decisionMakerRole', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Decision timeline</Label>
                    <Select value={form.decisionTimeline} onValueChange={(v) => updateField('decisionTimeline', v)}>
                      <SelectTrigger><SelectValue placeholder="When will you decide?" /></SelectTrigger>
                      <SelectContent>
                        {DECISION_TIMELINE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Competitors or examples you admire</Label>
                    <Textarea
                      placeholder="Any apps, websites, or competitors whose experience you like..."
                      value={form.competitors}
                      onChange={(e) => updateField('competitors', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Anything else we should know?</Label>
                    <Textarea
                      placeholder="Additional context, concerns, or questions..."
                      value={form.additionalNotes}
                      onChange={(e) => updateField('additionalNotes', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} className="gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Deep Dive
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeepDive;
