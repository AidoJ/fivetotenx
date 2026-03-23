import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, Save,
  GripVertical, ArrowUp, ArrowDown, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Industry {
  id: string;
  slug: string;
  label: string;
  description: string;
  examples: string[];
  available: boolean;
  sort_order: number;
}

interface Category {
  id: string;
  industry_id: string;
  slug: string;
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
  question_type: string;
  options: any[];
}

const PHASE_OPTIONS = [
  { value: 'reality_check', label: 'Reality Check™', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'straight_talk', label: 'Straight Talk™', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'game_plan', label: 'Game Plan™', color: 'bg-purple-100 text-purple-800 border-purple-200' },
];

const QUESTION_TYPE_OPTIONS = ['text', 'number', 'select', 'multi_select', 'scale'];

const ICON_OPTIONS = ['Sparkles', 'Calendar', 'Users', 'CreditCard', 'Settings', 'MessageSquare', 'UserCircle', 'Plug', 'Shield', 'Rocket', 'Hammer', 'Briefcase'];

const ScopingQuestionEditor = () => {
  const { toast } = useToast();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [editDialog, setEditDialog] = useState<{
    type: 'industry' | 'category' | 'question';
    mode: 'add' | 'edit';
    data: any;
  } | null>(null);

  const fetchAll = async () => {
    const [indRes, catRes, qRes] = await Promise.all([
      supabase.from('scoping_industries' as any).select('*').order('sort_order'),
      supabase.from('scoping_categories' as any).select('*').order('sort_order'),
      supabase.from('scoping_questions' as any).select('*').order('sort_order'),
    ]);
    if (!indRes.error) setIndustries(indRes.data as any || []);
    if (!catRes.error) setCategories(catRes.data as any || []);
    if (!qRes.error) setQuestions(qRes.data as any || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const selectedInd = industries.find(i => i.id === selectedIndustry);
  const industryCats = categories.filter(c => c.industry_id === selectedIndustry).sort((a, b) => a.sort_order - b.sort_order);
  const categoryQuestions = questions.filter(q => q.category_id === selectedCategory).sort((a, b) => a.sort_order - b.sort_order);

  // ── CRUD ──
  const saveIndustry = async (data: Partial<Industry> & { id?: string }) => {
    setSaving(true);
    if (data.id) {
      await supabase.from('scoping_industries' as any).update({
        label: data.label, description: data.description,
        examples: data.examples, available: data.available,
      } as any).eq('id', data.id);
    } else {
      const slug = (data.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await supabase.from('scoping_industries' as any).insert({
        slug, label: data.label, description: data.description,
        examples: data.examples || [], available: data.available ?? false,
        sort_order: industries.length,
      } as any);
    }
    setSaving(false);
    setEditDialog(null);
    fetchAll();
    toast({ title: 'Industry saved' });
  };

  const saveCategory = async (data: Partial<Category> & { id?: string }) => {
    setSaving(true);
    if (data.id) {
      await supabase.from('scoping_categories' as any).update({
        label: data.label, icon: data.icon, phase: data.phase || 'game_plan',
      } as any).eq('id', data.id);
    } else {
      const slug = (data.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await supabase.from('scoping_categories' as any).insert({
        industry_id: selectedIndustry, slug, label: data.label,
        icon: data.icon || 'Sparkles', sort_order: industryCats.length,
        phase: data.phase || 'game_plan',
      } as any);
    }
    setSaving(false);
    setEditDialog(null);
    fetchAll();
    toast({ title: 'Category saved' });
  };

  const saveQuestion = async (data: Partial<Question> & { id?: string }) => {
    setSaving(true);
    if (data.id) {
      await supabase.from('scoping_questions' as any).update({
        question: data.question, detail_prompt: data.detail_prompt,
        question_type: data.question_type || 'text',
      } as any).eq('id', data.id);
    } else {
      await supabase.from('scoping_questions' as any).insert({
        category_id: selectedCategory, question: data.question,
        detail_prompt: data.detail_prompt || '', sort_order: categoryQuestions.length,
        question_type: data.question_type || 'text',
      } as any);
    }
    setSaving(false);
    setEditDialog(null);
    fetchAll();
    toast({ title: 'Question saved' });
  };

  const deleteItem = async (table: string, id: string) => {
    await supabase.from(table as any).delete().eq('id', id);
    fetchAll();
    toast({ title: 'Deleted' });
  };

  const moveItem = async (table: string, items: any[], index: number, direction: -1 | 1) => {
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const a = items[index];
    const b = items[swapIdx];
    await Promise.all([
      supabase.from(table as any).update({ sort_order: b.sort_order } as any).eq('id', a.id),
      supabase.from(table as any).update({ sort_order: a.sort_order } as any).eq('id', b.id),
    ]);
    fetchAll();
  };

  const toggleAvailable = async (ind: Industry) => {
    await supabase.from('scoping_industries' as any).update({ available: !ind.available } as any).eq('id', ind.id);
    fetchAll();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Scoping Question Bank</h2>
        <Button size="sm" onClick={() => setEditDialog({ type: 'industry', mode: 'add', data: { label: '', description: '', examples: [], available: false } })}>
          <Plus className="w-4 h-4 mr-1" /> Add Industry
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Industries */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Industries</p>
          {industries.map((ind, i) => {
            const catCount = categories.filter(c => c.industry_id === ind.id).length;
            const qCount = questions.filter(q => categories.find(c => c.id === q.category_id && c.industry_id === ind.id)).length;
            return (
              <div
                key={ind.id}
                onClick={() => { setSelectedIndustry(ind.id); setSelectedCategory(null); }}
                className={`rounded-lg border p-3 cursor-pointer transition-all ${
                  selectedIndustry === ind.id
                    ? 'border-primary bg-primary/5'
                    : ind.available
                    ? 'border-border bg-card hover:border-primary/30'
                    : 'border-border bg-muted/30 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{ind.label}</p>
                      {ind.available ? (
                        <Badge variant="outline" className="text-[8px] h-4 bg-primary/10 text-primary border-primary/20">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[8px] h-4">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{catCount} categories · {qCount} questions</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); moveItem('scoping_industries', industries, i, -1); }}>
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); moveItem('scoping_industries', industries, i, 1); }}>
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setEditDialog({ type: 'industry', mode: 'edit', data: { ...ind } }); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Column 2: Categories */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedInd ? `${selectedInd.label} — Categories` : 'Select an industry'}
            </p>
            {selectedIndustry && (
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2"
                onClick={() => setEditDialog({ type: 'category', mode: 'add', data: { label: '', icon: 'Sparkles', phase: 'game_plan' } })}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            )}
          </div>
          {industryCats.map((cat, i) => {
            const qCount = questions.filter(q => q.category_id === cat.id).length;
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-lg border p-3 cursor-pointer transition-all ${
                  selectedCategory === cat.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-5 text-center">{i + 1}</span>
                    <p className="text-sm font-medium text-foreground">{cat.label}</p>
                    <Badge variant="outline" className="text-[8px] h-4">{cat.icon}</Badge>
                    <Badge variant="secondary" className="text-[8px] h-4">{qCount}q</Badge>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); moveItem('scoping_categories', industryCats, i, -1); }}>
                      <ArrowUp className="w-2.5 h-2.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); moveItem('scoping_categories', industryCats, i, 1); }}>
                      <ArrowDown className="w-2.5 h-2.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); setEditDialog({ type: 'category', mode: 'edit', data: { ...cat } }); }}>
                      <Pencil className="w-2.5 h-2.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); deleteItem('scoping_categories', cat.id); }}>
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {selectedIndustry && industryCats.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-4 text-center">No categories yet</p>
          )}
        </div>

        {/* Column 3: Questions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedCategory ? `Questions` : 'Select a category'}
            </p>
            {selectedCategory && (
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2"
                onClick={() => setEditDialog({ type: 'question', mode: 'add', data: { question: '', detail_prompt: '' } })}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            )}
          </div>
          {categoryQuestions.map((q, i) => (
            <div key={q.id} className="rounded-lg border border-border bg-card p-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{q.question}</p>
                  {q.detail_prompt && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{q.detail_prompt}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => moveItem('scoping_questions', categoryQuestions, i, -1)}>
                    <ArrowUp className="w-2.5 h-2.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => moveItem('scoping_questions', categoryQuestions, i, 1)}>
                    <ArrowDown className="w-2.5 h-2.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => setEditDialog({ type: 'question', mode: 'edit', data: { ...q } })}>
                    <Pencil className="w-2.5 h-2.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive" onClick={() => deleteItem('scoping_questions', q.id)}>
                    <Trash2 className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {selectedCategory && categoryQuestions.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-4 text-center">No questions yet</p>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <EditDialog
        dialog={editDialog}
        saving={saving}
        onClose={() => setEditDialog(null)}
        onSaveIndustry={saveIndustry}
        onSaveCategory={saveCategory}
        onSaveQuestion={saveQuestion}
        onDelete={deleteItem}
        onToggleAvailable={toggleAvailable}
      />
    </div>
  );
};

// ── Edit Dialog Component ──
const EditDialog = ({ dialog, saving, onClose, onSaveIndustry, onSaveCategory, onSaveQuestion, onDelete, onToggleAvailable }: {
  dialog: any;
  saving: boolean;
  onClose: () => void;
  onSaveIndustry: (d: any) => void;
  onSaveCategory: (d: any) => void;
  onSaveQuestion: (d: any) => void;
  onDelete: (table: string, id: string) => void;
  onToggleAvailable: (ind: any) => void;
}) => {
  const [form, setForm] = useState<any>({});
  const [examplesText, setExamplesText] = useState('');

  useEffect(() => {
    if (dialog) {
      setForm({ ...dialog.data });
      setExamplesText((dialog.data.examples || []).join('\n'));
    }
  }, [dialog]);

  if (!dialog) return null;

  const handleSave = () => {
    if (dialog.type === 'industry') {
      onSaveIndustry({ ...form, examples: examplesText.split('\n').map((s: string) => s.trim()).filter(Boolean) });
    } else if (dialog.type === 'category') {
      onSaveCategory(form);
    } else {
      onSaveQuestion(form);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {dialog.mode === 'add' ? 'Add' : 'Edit'} {dialog.type === 'industry' ? 'Industry' : dialog.type === 'category' ? 'Category' : 'Question'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {dialog.type === 'industry' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Label</Label>
                <Input value={form.label || ''} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Health & Wellness" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Examples (one per line)</Label>
                <Textarea value={examplesText} onChange={e => setExamplesText(e.target.value)} rows={4} placeholder="Massage therapists&#10;Physiotherapists&#10;..." />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.available ?? false} onCheckedChange={v => setForm({ ...form, available: v })} />
                <Label className="text-xs">Questionnaire available (active)</Label>
              </div>
            </>
          )}
          {dialog.type === 'category' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Label</Label>
                <Input value={form.label || ''} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Services & Offerings" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Icon</Label>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_OPTIONS.map(icon => (
                    <button key={icon} onClick={() => setForm({ ...form, icon })}
                      className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${form.icon === icon ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {dialog.type === 'question' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Question (Yes/No format)</Label>
                <Textarea value={form.question || ''} onChange={e => setForm({ ...form, question: e.target.value })} rows={2} placeholder="Do you offer...?" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Detail prompt (shown when "Yes")</Label>
                <Textarea value={form.detail_prompt || ''} onChange={e => setForm({ ...form, detail_prompt: e.target.value })} rows={3} placeholder="Describe the specifics..." />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>
            {dialog.mode === 'edit' && dialog.type !== 'industry' && (
              <Button variant="destructive" size="sm" onClick={() => { onDelete(dialog.type === 'category' ? 'scoping_categories' : 'scoping_questions', form.id); onClose(); }}>
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScopingQuestionEditor;
