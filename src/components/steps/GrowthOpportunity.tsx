import { FormData, CURRENT_FEATURES } from '@/lib/formTypes';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  data: FormData;
  onChange: (data: Partial<FormData>) => void;
}

const GrowthOpportunity = ({ data, onChange }: Props) => {
  const toggleFeature = (feature: string) => {
    const current = data.currentFeatures;
    const updated = current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature];
    onChange({ currentFeatures: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">Growth Opportunity</h2>
        <p className="text-muted-foreground text-sm">Let's identify where the biggest gains are hiding.</p>
      </div>

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
          rows={4}
          value={data.conversionImpactAnswer}
          onChange={(e) => onChange({ conversionImpactAnswer: e.target.value })}
          className="bg-secondary border-border resize-none"
        />
      </div>
    </div>
  );
};

export default GrowthOpportunity;
