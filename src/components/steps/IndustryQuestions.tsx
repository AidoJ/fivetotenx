import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Sparkles, Calendar, Users, CreditCard, Settings, MessageSquare,
  UserCircle, Plug, Shield, Rocket, Hammer, Briefcase,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, Calendar, Users, CreditCard, Settings, MessageSquare,
  UserCircle, Plug, Shield, Rocket, Hammer, Briefcase,
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
  sort_order: number;
}

interface Props {
  industryId: string;
  phase: 'reality_check' | 'straight_talk';
  responses: Record<string, string>;
  onResponseChange: (questionId: string, value: string) => void;
  title?: string;
  subtitle?: string;
}

const IndustryQuestions = ({ industryId, phase, responses, onResponseChange, title, subtitle }: Props) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [catRes, qRes] = await Promise.all([
        supabase
          .from('scoping_categories' as any)
          .select('*')
          .eq('industry_id', industryId)
          .eq('phase', phase)
          .order('sort_order'),
        supabase
          .from('scoping_questions' as any)
          .select('*')
          .order('sort_order'),
      ]);

      const cats = (catRes.data as any) || [];
      const allQuestions = (qRes.data as any) || [];
      const catIds = cats.map((c: Category) => c.id);
      const filtered = allQuestions.filter((q: Question) => catIds.includes(q.category_id));

      setCategories(cats);
      setQuestions(filtered);
      setLoading(false);
    };
    load();
  }, [industryId, phase]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-muted-foreground text-sm">
          No {phase === 'reality_check' ? 'Reality Check' : 'Straight Talk'} questions configured for this industry yet.
        </p>
        <p className="text-xs text-muted-foreground">
          The generic assessment will be used instead.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {title && (
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">{title}</h2>
          {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
        </div>
      )}

      {categories.map((cat) => {
        const Icon = ICON_MAP[cat.icon] || Sparkles;
        const catQuestions = questions.filter((q) => q.category_id === cat.id);
        if (catQuestions.length === 0) return null;

        return (
          <div key={cat.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{cat.label}</h3>
            </div>

            <div className="space-y-3 pl-10">
              {catQuestions.map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <Label className="text-sm font-medium">{q.question}</Label>
                  {q.detail_prompt && (
                    <p className="text-xs text-muted-foreground">{q.detail_prompt}</p>
                  )}
                  {q.question_type === 'text' ? (
                    <Textarea
                      placeholder="Your answer..."
                      value={responses[q.id] || ''}
                      onChange={(e) => onResponseChange(q.id, e.target.value)}
                      rows={2}
                      className="bg-secondary border-border resize-none"
                    />
                  ) : (
                    <Input
                      placeholder="Your answer..."
                      value={responses[q.id] || ''}
                      onChange={(e) => onResponseChange(q.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IndustryQuestions;
