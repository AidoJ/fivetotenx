import { FormData, REVENUE_OPTIONS } from '@/lib/formTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  data: FormData;
  onChange: (data: Partial<FormData>) => void;
}

const BusinessSnapshot = ({ data, onChange }: Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">Business Snapshot</h2>
        <p className="text-muted-foreground text-sm">Let's get a quick overview of your business — takes 30 seconds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <Label htmlFor="contactName">Your Name</Label>
          <Input id="contactName" placeholder="e.g. John Smith"
            value={data.contactName} onChange={(e) => onChange({ contactName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email</Label>
          <Input id="contactEmail" type="email" placeholder="e.g. john@acme.com"
            value={data.contactEmail} onChange={(e) => onChange({ contactEmail: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Phone</Label>
          <Input id="contactPhone" type="tel" placeholder="e.g. 0412 345 678"
            value={data.contactPhone} onChange={(e) => onChange({ contactPhone: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input id="businessName" placeholder="e.g. Acme Services"
            value={data.businessName} onChange={(e) => onChange({ businessName: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            placeholder="e.g. Construction, Fitness, Retail"
            value={data.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff">Number of Staff</Label>
          <Input
            id="staff"
            type="number"
            placeholder="e.g. 12"
            value={data.numberOfStaff}
            onChange={(e) => onChange({ numberOfStaff: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avgTransaction">Average Transaction Value ($)</Label>
          <Input
            id="avgTransaction"
            type="number"
            placeholder="e.g. 200"
            value={data.avgTransactionValue}
            onChange={(e) => onChange({ avgTransactionValue: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Monthly Revenue (approx range)</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {REVENUE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange({ monthlyRevenue: option })}
              className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all ${
                data.monthlyRevenue === option
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-secondary text-secondary-foreground hover:border-muted-foreground'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessSnapshot;
