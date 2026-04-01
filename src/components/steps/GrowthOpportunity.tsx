import { useState } from 'react';
import { FormData, CURRENT_FEATURES, GOAL_OPTIONS, LOST_SALES_REASONS } from '@/lib/formTypes';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  data: FormData;
  onChange: (data: Partial<FormData>) => void;
}

const GrowthOpportunity = ({ data, onChange }: Props) => {
  const [otherReason, setOtherReason] = useState('');

  const toggleFeature = (feature: string) => {
    const current = data.currentFeatures;
    const updated = current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature];
    onChange({ currentFeatures: updated });
  };

  const toggleGoal = (goal: string) => {
    const current = data.primaryGoals;
    const updated = current.includes(goal)
      ? current.filter((g) => g !== goal)
      : [...current, goal];
    onChange({ primaryGoals: updated });
  };

  const toggleReason = (reason: string) => {
    const current = data.lostSalesReasons;
    const updated = current.includes(reason)
      ? current.filter((r) => r !== reason)
      : [...current, reason];
    onChange({ lostSalesReasons: updated });
  };

  const addOtherReason = () => {
    const trimmed = otherReason.trim();
    if (trimmed && !data.lostSalesReasons.includes(trimmed)) {
      onChange({ lostSalesReasons: [...data.lostSalesReasons, trimmed] });
      setOtherReason('');
    }
  };

  const isCustomReason = (reason: string) => !LOST_SALES_REASONS.includes(reason);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">Growth Opportunity</h2>
        <p className="text-muted-foreground text-sm">Let's identify where the biggest gains are hiding.</p>
      </div>

      {/* Current Website */}
      <div className="space-y-2">
        <Label htmlFor="currentWebsite">Current website URL (if any)</Label>
        <Input
          id="currentWebsite"
          placeholder="https://yourbusiness.com"
          value={data.currentWebsite}
          onChange={(e) => onChange({ currentWebsite: e.target.value })}
        />
      </div>

      {/* Primary Goals */}
      <div className="space-y-3">
        <Label>What are your primary goals? (select all that apply)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GOAL_OPTIONS.map((goal) => (
            <label
              key={goal}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                data.primaryGoals.includes(goal)
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-secondary hover:border-muted-foreground'
              }`}
            >
              <Checkbox
                checked={data.primaryGoals.includes(goal)}
                onCheckedChange={() => toggleGoal(goal)}
              />
              <span className="text-sm">{goal}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Current Features */}
      <div className="space-y-3">
        <Label>Do you currently have:</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CURRENT_FEATURES.map((feature) => (
            <label
              key={feature}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                data.currentFeatures.includes(feature)
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-secondary hover:border-muted-foreground'
              }`}
            >
              <Checkbox
                checked={data.currentFeatures.includes(feature)}
                onCheckedChange={() => toggleFeature(feature)}
              />
              <span className="text-sm">{feature}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="impact">
          If you increased conversions by just 10%, what would that mean to your business?
        </Label>
        <Textarea
          id="impact"
          placeholder="Think about what extra revenue, time, or growth would look like..."
          rows={3}
          value={data.conversionImpactAnswer}
          onChange={(e) => onChange({ conversionImpactAnswer: e.target.value })}
          className="bg-secondary border-border resize-none"
        />
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="additionalNotes">
          Anything else we should know?
        </Label>
        <Textarea
          id="additionalNotes"
          placeholder="Competitors, specific challenges, upcoming deadlines, tools you love or hate..."
          rows={3}
          value={data.additionalNotes}
          onChange={(e) => onChange({ additionalNotes: e.target.value })}
          className="bg-secondary border-border resize-none"
        />
      </div>
    </div>
  );
};

export default GrowthOpportunity;
