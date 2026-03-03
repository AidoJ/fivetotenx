import { FormData, LOST_SALES_REASONS } from '@/lib/formTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  data: FormData;
  onChange: (data: Partial<FormData>) => void;
}

const OperationalEfficiency = ({ data, onChange }: Props) => {
  const toggleReason = (reason: string) => {
    const current = data.lostSalesReasons;
    const updated = current.includes(reason)
      ? current.filter((r) => r !== reason)
      : [...current, reason];
    onChange({ lostSalesReasons: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">Operational Efficiency</h2>
        <p className="text-muted-foreground text-sm">Where time (and money) is being lost — this drives cost-saving ROI.</p>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-4">Hours per week spent on:</p>
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
        </div>
      </div>
    </div>
  );
};

export default OperationalEfficiency;
