import { FormData } from '@/lib/formTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  data: FormData;
  onChange: (data: Partial<FormData>) => void;
}

const CustomerMetrics = ({ data, onChange }: Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">Customer & Sales Metrics</h2>
        <p className="text-muted-foreground text-sm">These numbers let us calculate the immediate value an app delivers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="visitors">Monthly Website Visitors</Label>
          <Input id="visitors" type="number" placeholder="e.g. 1000"
            value={data.monthlyVisitors} onChange={(e) => onChange({ monthlyVisitors: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="leads">Monthly Leads / Enquiries</Label>
          <Input id="leads" type="number" placeholder="e.g. 50"
            value={data.monthlyLeads} onChange={(e) => onChange({ monthlyLeads: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="conversion">Lead-to-Sale Conversion Rate (%)</Label>
          <Input id="conversion" type="number" placeholder="e.g. 5"
            value={data.conversionRate} onChange={(e) => onChange({ conversionRate: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newCustomers">Monthly New Customers</Label>
          <Input id="newCustomers" type="number" placeholder="e.g. 25"
            value={data.monthlyNewCustomers} onChange={(e) => onChange({ monthlyNewCustomers: e.target.value })} />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-sm text-muted-foreground mb-4 font-medium">Customer Lifetime Value (CLV) inputs:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label htmlFor="purchaseValue">Average Purchase Value ($)</Label>
            <Input id="purchaseValue" type="number" placeholder="e.g. 200"
              value={data.avgPurchaseValue} onChange={(e) => onChange({ avgPurchaseValue: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchasesPerYear">Average Purchases Per Year</Label>
            <Input id="purchasesPerYear" type="number" placeholder="e.g. 4"
              value={data.avgPurchasesPerYear} onChange={(e) => onChange({ avgPurchasesPerYear: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retention">Average Customer Retention (years)</Label>
            <Input id="retention" type="number" placeholder="e.g. 3"
              value={data.avgRetentionYears} onChange={(e) => onChange({ avgRetentionYears: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMetrics;
