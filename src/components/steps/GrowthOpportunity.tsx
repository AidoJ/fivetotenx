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

      {/* Operational Efficiency */}
      <div className="space-y-4 rounded-xl border border-border bg-secondary/20 p-5">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-1">Operational Efficiency</h3>
          <p className="text-muted-foreground text-xs">Where time (and money) is being lost — drives cost-saving ROI.</p>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-3">Hours per week spent on:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin">Admin</Label>
              <Input id="admin" type="number" placeholder="0"
                value={data.hoursAdmin} onChange={(e) => onChange({ hoursAdmin: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking">Booking mgmt</Label>
              <Input id="booking" type="number" placeholder="0"
                value={data.hoursBooking} onChange={(e) => onChange({ hoursBooking: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followups">Follow-ups</Label>
              <Input id="followups" type="number" placeholder="0"
                value={data.hoursFollowUps} onChange={(e) => onChange({ hoursFollowUps: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoicing">Invoicing</Label>
              <Input id="invoicing" type="number" placeholder="0"
                value={data.hoursInvoicing} onChange={(e) => onChange({ hoursInvoicing: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hourlyCost">Average Hourly Staff Cost ($)</Label>
          <Input id="hourlyCost" type="number" placeholder="e.g. 35" className="max-w-xs"
            value={data.hourlyStaffCost} onChange={(e) => onChange({ hourlyStaffCost: e.target.value })} />
        </div>

        <div className="space-y-3">
          <Label>Do you lose sales due to:</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LOST_SALES_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                  data.lostSalesReasons.includes(reason)
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-secondary hover:border-muted-foreground'
                }`}
              >
                <Checkbox
                  checked={data.lostSalesReasons.includes(reason)}
                  onCheckedChange={() => toggleReason(reason)}
                />
                <span className="text-sm">{reason}</span>
              </label>
            ))}
            {data.lostSalesReasons.filter(isCustomReason).map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-primary bg-primary/5 cursor-pointer transition-all"
              >
                <Checkbox checked onCheckedChange={() => toggleReason(reason)} />
                <span className="text-sm">{reason}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Other reason..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOtherReason())}
              className="max-w-xs"
            />
            <button
              type="button"
              onClick={addOtherReason}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-secondary text-secondary-foreground hover:border-muted-foreground transition-all"
            >
              Add
            </button>
          </div>
        </div>
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
