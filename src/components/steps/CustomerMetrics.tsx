import { useState } from 'react';
import { FormData } from '@/lib/formTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Props {
  data: FormData;
  onChange: (data: Partial<FormData>) => void;
}

interface ToggleFieldProps {
  label: string;
  description?: string;
  id: string;
  placeholder: string;
  value: string;
  known: boolean;
  onToggle: (known: boolean) => void;
  onChange: (value: string) => void;
}

const ToggleField = ({ label, description, id, placeholder, value, known, onToggle, onChange }: ToggleFieldProps) => (
  <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-4">
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant={known ? 'default' : 'outline'}
          className="h-7 px-3 text-xs"
          onClick={() => onToggle(true)}
        >
          Yes
        </Button>
        <Button
          type="button"
          size="sm"
          variant={!known ? 'default' : 'outline'}
          className="h-7 px-3 text-xs"
          onClick={() => {
            onToggle(false);
            onChange('');
          }}
        >
          No
        </Button>
      </div>
    </div>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
    {known && (
      <Input
        id={id}
        type="number"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
      />
    )}
  </div>
);

const CustomerMetrics = ({ data, onChange }: Props) => {
  const isService = data.businessType === 'service' || data.businessType === 'hybrid';
  const isProduct = data.businessType === 'product' || data.businessType === 'hybrid';

  const [known, setKnown] = useState<Record<string, boolean>>({
    monthlyVisitors: !!data.monthlyVisitors,
    monthlyLeads: !!data.monthlyLeads,
    conversionRate: !!data.conversionRate,
    monthlyNewCustomers: !!data.monthlyNewCustomers,
    noShowRate: !!data.noShowRate,
    monthlyMarketingSpend: !!data.monthlyMarketingSpend,
    customerAcquisitionCost: !!data.customerAcquisitionCost,
    upsellRevenuePercent: !!data.upsellRevenuePercent,
  });

  const toggle = (field: string, value: boolean) => {
    setKnown((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">Customer & Sales Metrics</h2>
        <p className="text-muted-foreground text-sm">
          Do you know the following marketing data? Toggle <strong>Yes</strong> and enter the value, or <strong>No</strong> to skip.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToggleField
          label="Monthly Website Visitors"
          id="visitors"
          placeholder="e.g. 1000"
          value={data.monthlyVisitors}
          known={known.monthlyVisitors}
          onToggle={(v) => toggle('monthlyVisitors', v)}
          onChange={(v) => onChange({ monthlyVisitors: v })}
        />
        <ToggleField
          label="Monthly Leads / Enquiries"
          id="leads"
          placeholder="e.g. 50"
          value={data.monthlyLeads}
          known={known.monthlyLeads}
          onToggle={(v) => toggle('monthlyLeads', v)}
          onChange={(v) => onChange({ monthlyLeads: v })}
        />
        <ToggleField
          label="Lead-to-Sale Conversion Rate (%)"
          id="conversion"
          placeholder="e.g. 5"
          value={data.conversionRate}
          known={known.conversionRate}
          onToggle={(v) => toggle('conversionRate', v)}
          onChange={(v) => onChange({ conversionRate: v })}
        />
        <ToggleField
          label="Monthly New Customers"
          id="newCustomers"
          placeholder="e.g. 25"
          value={data.monthlyNewCustomers}
          known={known.monthlyNewCustomers}
          onToggle={(v) => toggle('monthlyNewCustomers', v)}
          onChange={(v) => onChange({ monthlyNewCustomers: v })}
        />
        {isService && (
          <ToggleField
            label="No-Show / Cancellation Rate (%)"
            description="% of bookings that don't show up"
            id="noShowRate"
            placeholder="e.g. 15"
            value={data.noShowRate}
            known={known.noShowRate}
            onToggle={(v) => toggle('noShowRate', v)}
            onChange={(v) => onChange({ noShowRate: v })}
          />
        )}
        <ToggleField
          label="Monthly Marketing Spend ($)"
          id="marketingSpend"
          placeholder="e.g. 2000"
          value={data.monthlyMarketingSpend}
          known={known.monthlyMarketingSpend}
          onToggle={(v) => toggle('monthlyMarketingSpend', v)}
          onChange={(v) => onChange({ monthlyMarketingSpend: v })}
        />
        <ToggleField
          label="Customer Acquisition Cost ($)"
          description="How much it costs to win one new customer"
          id="cac"
          placeholder="e.g. 50"
          value={data.customerAcquisitionCost}
          known={known.customerAcquisitionCost}
          onToggle={(v) => toggle('customerAcquisitionCost', v)}
          onChange={(v) => onChange({ customerAcquisitionCost: v })}
        />
        {isProduct && (
          <ToggleField
            label="Upsell / Cross-sell Revenue (%)"
            description="% of revenue from add-on / cross-sell products"
            id="upsellPercent"
            placeholder="e.g. 20"
            value={data.upsellRevenuePercent}
            known={known.upsellRevenuePercent}
            onToggle={(v) => toggle('upsellRevenuePercent', v)}
            onChange={(v) => onChange({ upsellRevenuePercent: v })}
          />
        )}
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
