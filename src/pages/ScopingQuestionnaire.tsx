import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sparkles, Calendar, Users, CreditCard, Settings, MessageSquare, UserCircle,
  Plug, Shield, Rocket, CheckCircle, Loader2, ArrowRight, ArrowLeft, SkipForward,
  Hammer, Briefcase, Check, X,
} from 'lucide-react';
import logo from '@/assets/logo-5to10x-color.png';
import {
  INDUSTRY_QUESTION_BANKS,
  type IndustryQuestionBank,
  type QuestionCategory,
  type ScopingQuestion,
} from '@/lib/scopingQuestions';

// Icon map for dynamic rendering
const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, Calendar, Users, CreditCard, Settings, MessageSquare,
  UserCircle, Plug, Shield, Rocket, Hammer, Briefcase,
};

const ScopingQuestionnaire = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const assessmentId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');

  // Flow state
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryQuestionBank | null>(null);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, { answer: boolean; details: string }>>({});
  const [skippedCategories, setSkippedCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Detail dialog state
  const [detailDialog, setDetailDialog] = useState<{ question: ScopingQuestion; open: boolean } | null>(null);
  const [detailText, setDetailText] = useState('');

  useEffect(() => {
    if (!assessmentId) { setLoading(false); return; }
    const fetch = async () => {
      const { data, error } = await supabase
        .from('roi_assessments')
        .select('business_name, contact_name, industry')
        .eq('id', assessmentId)
        .single();
      if (error || !data) {
        toast({ title: 'Invalid link', description: 'Assessment not found.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      setBusinessName(data.business_name || '');
      setContactName(data.contact_name || '');
      // Auto-select industry if we know it
      if (data.industry) {
        const match = INDUSTRY_QUESTION_BANKS.find(b =>
          b.id === data.industry || b.label.toLowerCase().includes((data.industry || '').toLowerCase())
        );
        if (match) setSelectedIndustry(match);
      }
      setLoading(false);
    };
    fetch();
  }, [assessmentId, toast]);

  const categories = selectedIndustry?.categories || [];
  const activeCategory = categories[activeCategoryIndex];
  const totalCategories = categories.length;
  const progressPercent = totalCategories > 0 ? ((activeCategoryIndex) / totalCategories) * 100 : 0;

  const handleYes = (q: ScopingQuestion) => {
    setDetailDialog({ question: q, open: true });
    setDetailText(responses[q.id]?.details || '');
  };

  const handleNo = (q: ScopingQuestion) => {
    setResponses(prev => ({ ...prev, [q.id]: { answer: false, details: '' } }));
  };

  const saveDetail = () => {
    if (!detailDialog) return;
    setResponses(prev => ({
      ...prev,
      [detailDialog.question.id]: { answer: true, details: detailText },
    }));
    setDetailDialog(null);
    setDetailText('');
  };

  const skipCategory = () => {
    if (activeCategory) {
      setSkippedCategories(prev => [...prev, activeCategory.id]);
    }
    goNext();
  };

  const goNext = () => {
    if (activeCategoryIndex < totalCategories - 1) {
      setActiveCategoryIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const goPrev = () => {
    if (activeCategoryIndex > 0) setActiveCategoryIndex(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!assessmentId || !selectedIndustry) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('scoping_responses' as any).insert([{
        assessment_id: assessmentId,
        industry: selectedIndustry.id,
        responses: JSON.parse(JSON.stringify(responses)),
        skipped_categories: skippedCategories,
        completed: true,
      }]);
      if (error) throw error;

      // Advance pipeline stage
      await supabase.from('roi_assessments')
        .update({ pipeline_stage: 'proposal' as any })
        .eq('id', assessmentId);

      setSubmitted(true);
      toast({ title: 'Submitted! 🎉', description: 'Your scoping questionnaire has been received.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to submit. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Error / Submitted states ──
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
          <h1 className="text-2xl font-bold text-foreground">Invalid Link</h1>
          <p className="text-muted-foreground">This link is missing an assessment ID.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ backgroundImage: 'var(--gradient-primary)' }}>
            <CheckCircle className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Thank You, {contactName}!</h1>
          <p className="text-muted-foreground">
            Your scoping questionnaire has been received. Our team will use your answers to prepare a detailed proposal tailored to your needs.
          </p>
          <p className="text-sm text-muted-foreground">We'll be in touch within 24–48 hours.</p>
        </motion.div>
      </div>
    );
  }

  // ── INDUSTRY SELECTION ──
  if (!selectedIndustry) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <img src={logo} alt="5to10x" className="h-8" />
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{businessName}</p>
              <p className="text-xs text-muted-foreground">Project Scoping</p>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-foreground">Select Your Industry</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              This helps us ask the right questions for your specific business type.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {INDUSTRY_QUESTION_BANKS.map(bank => (
              <motion.button
                key={bank.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedIndustry(bank)}
                className="rounded-xl border-2 border-border bg-card p-6 text-left space-y-3 hover:border-primary transition-colors"
              >
                <h3 className="font-bold text-foreground text-lg">{bank.label}</h3>
                <p className="text-sm text-muted-foreground">{bank.description}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  {bank.categories.length} sections
                  <ArrowRight className="w-3 h-3" />
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTIONNAIRE FLOW ──
  const CategoryIcon = ICON_MAP[activeCategory?.icon || 'Sparkles'] || Sparkles;
  const categoryQuestions = activeCategory?.questions || [];
  const answeredInCategory = categoryQuestions.filter(q => responses[q.id] !== undefined).length;
  const isCategoryComplete = answeredInCategory === categoryQuestions.length;
  const isLastCategory = activeCategoryIndex === totalCategories - 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={logo} alt="5to10x" className="h-8" />
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{businessName}</p>
            <p className="text-xs text-muted-foreground">{selectedIndustry.label} — Scoping</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Section {activeCategoryIndex + 1} of {totalCategories}</span>
            <span>{Math.round(progressPercent)}% complete</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Category tabs (scrollable) */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat, i) => {
            const Icon = ICON_MAP[cat.icon] || Sparkles;
            const isActive = i === activeCategoryIndex;
            const isSkipped = skippedCategories.includes(cat.id);
            const allAnswered = cat.questions.every(q => responses[q.id] !== undefined);
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryIndex(i)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isSkipped
                    ? 'bg-muted text-muted-foreground line-through'
                    : allAnswered
                    ? 'bg-primary/15 text-primary'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active category content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory?.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-border bg-card p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <CategoryIcon className="w-5 h-5 text-primary" />
                {activeCategory?.label}
              </h2>
              <span className="text-xs text-muted-foreground">
                {answeredInCategory}/{categoryQuestions.length} answered
              </span>
            </div>

            <div className="space-y-3">
              {categoryQuestions.map(q => {
                const resp = responses[q.id];
                const answered = resp !== undefined;
                return (
                  <div
                    key={q.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                      answered
                        ? resp.answer
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border bg-secondary/50'
                        : 'border-border bg-card hover:border-primary/20'
                    }`}
                  >
                    <p className="flex-1 text-sm text-foreground leading-relaxed">{q.question}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={answered && resp.answer ? 'default' : 'outline'}
                        className="h-8 px-3 text-xs"
                        onClick={() => handleYes(q)}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Yes
                      </Button>
                      <Button
                        size="sm"
                        variant={answered && !resp.answer ? 'secondary' : 'outline'}
                        className="h-8 px-3 text-xs"
                        onClick={() => handleNo(q)}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        No
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={goPrev} disabled={activeCategoryIndex === 0}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button variant="ghost" size="sm" onClick={skipCategory} className="text-muted-foreground">
                <SkipForward className="w-4 h-4 mr-1" /> Skip Section
              </Button>
              <Button
                size="sm"
                onClick={goNext}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : isLastCategory ? (
                  <>Submit <CheckCircle className="w-4 h-4 ml-1" /></>
                ) : (
                  <>Next <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailDialog?.open} onOpenChange={(open) => !open && setDetailDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{detailDialog?.question.question}</DialogTitle>
            <DialogDescription>{detailDialog?.question.detailPrompt}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={detailText}
            onChange={e => setDetailText(e.target.value)}
            placeholder="Tell us more..."
            rows={5}
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(null)}>Cancel</Button>
            <Button onClick={saveDetail}>
              <Check className="w-4 h-4 mr-1" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScopingQuestionnaire;
