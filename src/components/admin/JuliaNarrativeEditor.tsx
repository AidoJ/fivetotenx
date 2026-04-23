// Editable narrative blocks for the Julia-pixel proposal layout.
// All fields are optional and saved into proposal_data — JuliaProposalView
// renders sensible fallbacks when a block is empty.

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Plus, X, Loader2, Wand2, MessageSquareQuote, ListChecks, ShieldCheck, FileText, CalendarClock, Ban } from 'lucide-react';

export interface NarrativeBlock { heading: string; body: string }
export interface DeliveryPhase { weeks: string; title: string; body: string }

export interface JuliaNarrativeFields {
  proposal_title: string;
  what_we_heard: string;
  highlight_box: { headline: string; body: string };
  what_this_means: NarrativeBlock[];
  out_of_scope: string[];
  what_we_need_from_you: string[];
  delivery_phases: DeliveryPhase[];
  oversight_note: string;
  closing_paragraph: string;
}

interface Props {
  value: JuliaNarrativeFields;
  onChange: (next: JuliaNarrativeFields) => void;
  disabled?: boolean;
  onAutoFill?: () => void | Promise<void>;
  autoFilling?: boolean;
}

const JuliaNarrativeEditor: React.FC<Props> = ({ value, onChange, disabled, onAutoFill, autoFilling }) => {
  const patch = (p: Partial<JuliaNarrativeFields>) => onChange({ ...value, ...p });

  const updateMeansBlock = (idx: number, b: Partial<NarrativeBlock>) => {
    patch({
      what_this_means: value.what_this_means.map((row, i) => i === idx ? { ...row, ...b } : row),
    });
  };
  const addMeansBlock = () => patch({ what_this_means: [...value.what_this_means, { heading: '', body: '' }] });
  const removeMeansBlock = (idx: number) => patch({ what_this_means: value.what_this_means.filter((_, i) => i !== idx) });

  const updateNeed = (idx: number, v: string) =>
    patch({ what_we_need_from_you: value.what_we_need_from_you.map((row, i) => i === idx ? v : row) });
  const addNeed = () => patch({ what_we_need_from_you: [...value.what_we_need_from_you, ''] });
  const removeNeed = (idx: number) => patch({ what_we_need_from_you: value.what_we_need_from_you.filter((_, i) => i !== idx) });

  const oos = value.out_of_scope || [];
  const updateOos = (idx: number, v: string) =>
    patch({ out_of_scope: oos.map((row, i) => i === idx ? v : row) });
  const addOos = () => patch({ out_of_scope: [...oos, ''] });
  const removeOos = (idx: number) => patch({ out_of_scope: oos.filter((_, i) => i !== idx) });

  const phases = value.delivery_phases || [];
  const updatePhase = (idx: number, p: Partial<DeliveryPhase>) =>
    patch({ delivery_phases: phases.map((row, i) => i === idx ? { ...row, ...p } : row) });
  const addPhase = () => patch({ delivery_phases: [...phases, { weeks: '', title: '', body: '' }] });
  const removePhase = (idx: number) => patch({ delivery_phases: phases.filter((_, i) => i !== idx) });

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> 6. Proposal Narrative (Julia layout)
        </h3>
        {onAutoFill && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onAutoFill()}
            disabled={disabled || autoFilling}
            title="Use AI to fill these narrative blocks from Straight Talk transcripts and analysis"
          >
            {autoFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            Auto-fill from analysis
          </Button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground -mt-2">
        These are the editable blocks that appear in the client's proposal email and on the proposal page.
        Empty blocks fall back to sensible defaults built from the analysis.
      </p>

      {/* Title */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Proposal title</Label>
        <Input
          value={value.proposal_title}
          onChange={e => patch({ proposal_title: e.target.value })}
          placeholder="Phase 1 Proposal for [Business]"
          className="text-xs bg-background border-border"
          disabled={disabled}
        />
      </div>

      {/* What we heard */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MessageSquareQuote className="w-3.5 h-3.5" /> What We Heard
        </Label>
        <Textarea
          value={value.what_we_heard}
          onChange={e => patch({ what_we_heard: e.target.value })}
          rows={5}
          placeholder="The opening narrative that reflects the client's own words back to them."
          className="text-xs bg-background border-border resize-none"
          disabled={disabled}
        />
      </div>

      {/* Highlight box */}
      <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Highlight box (amber callout)</Label>
        <Input
          value={value.highlight_box.headline}
          onChange={e => patch({ highlight_box: { ...value.highlight_box, headline: e.target.value } })}
          placeholder="Headline (e.g. the headline build outcome)"
          className="text-xs bg-background border-border"
          disabled={disabled}
        />
        <Textarea
          value={value.highlight_box.body}
          onChange={e => patch({ highlight_box: { ...value.highlight_box, body: e.target.value } })}
          rows={3}
          placeholder="Short body text describing the headline outcome."
          className="text-xs bg-background border-border resize-none"
          disabled={disabled}
        />
      </div>

      {/* What this means */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">What This Means in Practice</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addMeansBlock} disabled={disabled} className="gap-1.5 h-7">
            <Plus className="w-3.5 h-3.5" /> Add block
          </Button>
        </div>
        {value.what_this_means.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic">No blocks — add 2-4 short paragraphs describing what changes for the client.</p>
        )}
        {value.what_this_means.map((b, idx) => (
          <div key={idx} className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2 relative">
            <button
              type="button"
              onClick={() => removeMeansBlock(idx)}
              disabled={disabled}
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
              title="Remove block"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <Input
              value={b.heading}
              onChange={e => updateMeansBlock(idx, { heading: e.target.value })}
              placeholder="Heading"
              className="text-xs bg-background border-border pr-8"
              disabled={disabled}
            />
            <Textarea
              value={b.body}
              onChange={e => updateMeansBlock(idx, { body: e.target.value })}
              rows={3}
              placeholder="Body"
              className="text-xs bg-background border-border resize-none"
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      {/* What we need from you */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5" /> What We Need from You
          </Label>
          <Button type="button" variant="ghost" size="sm" onClick={addNeed} disabled={disabled} className="gap-1.5 h-7">
            <Plus className="w-3.5 h-3.5" /> Add item
          </Button>
        </div>
        {value.what_we_need_from_you.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic">No items — add the access, sample data and reviewers we need to start.</p>
        )}
        {value.what_we_need_from_you.map((n, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <div className="flex flex-col items-center pt-2 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{idx + 1}.</span>
            </div>
            <Textarea
              value={n}
              onChange={e => updateNeed(idx, e.target.value)}
              placeholder={"e.g. API access to Monday.com\n— admin token, sandbox board, and a named reviewer for sign-off."}
              rows={3}
              className="text-xs bg-background border-border resize-y min-h-[72px]"
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => removeNeed(idx)}
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive shrink-0 mt-2"
              title="Remove"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground italic">
          Tip: each item supports multiple lines. Use line breaks for sub-points — they render as paragraphs in the client proposal.
        </p>
      </div>

      {/* Delivery timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" /> Delivery Timeline
          </Label>
          <Button type="button" variant="ghost" size="sm" onClick={addPhase} disabled={disabled} className="gap-1.5 h-7">
            <Plus className="w-3.5 h-3.5" /> Add phase
          </Button>
        </div>
        {phases.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic">No phases yet — add week-by-week delivery blocks for the proposal page.</p>
        )}
        {phases.map((phase, idx) => (
          <div key={idx} className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2 relative">
            <button
              type="button"
              onClick={() => removePhase(idx)}
              disabled={disabled}
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
              title="Remove phase"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="grid gap-2 sm:grid-cols-[140px,1fr]">
              <Input
                value={phase.weeks}
                onChange={e => updatePhase(idx, { weeks: e.target.value })}
                placeholder="Week 1"
                className="text-xs bg-background border-border pr-8"
                disabled={disabled}
              />
              <Input
                value={phase.title}
                onChange={e => updatePhase(idx, { title: e.target.value })}
                placeholder="Discovery & Specification"
                className="text-xs bg-background border-border"
                disabled={disabled}
              />
            </div>
            <Textarea
              value={phase.body}
              onChange={e => updatePhase(idx, { body: e.target.value })}
              rows={4}
              placeholder="Describe what happens in this phase and what gets delivered."
              className="text-xs bg-background border-border resize-none"
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      {/* Oversight note */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Oversight note (amber callout near end)
        </Label>
        <Textarea
          value={value.oversight_note}
          onChange={e => patch({ oversight_note: e.target.value })}
          rows={4}
          placeholder="Reassurance about human review, parallel run, and compliance gates that stay in place."
          className="text-xs bg-background border-border resize-none"
          disabled={disabled}
        />
      </div>

      {/* Closing */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Closing paragraph
        </Label>
        <Textarea
          value={value.closing_paragraph}
          onChange={e => patch({ closing_paragraph: e.target.value })}
          rows={3}
          placeholder="Final note before the signature block."
          className="text-xs bg-background border-border resize-none"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default JuliaNarrativeEditor;
