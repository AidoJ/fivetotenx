import { useState, useEffect } from 'react';
import { FormData } from '@/lib/formTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Info } from 'lucide-react';

// Industry-average defaults for fields the client may not know
const FIELD_DEFAULTS: Record<string, { value: string; hint: string }> = {
  monthlyVisitors: { value: '500', hint: "We've estimated ~500 visitors/mo — update if you know yours" },
  monthlyLeads: { value: '30', hint: "Estimated ~30 enquiries/mo based on typical small business" },
  conversionRate: { value: '3', hint: "Industry average ~3% — adjust if you know yours" },
  monthlyNewCustomers: { value: '15', hint: "Estimated ~15 new customers/mo — update if you know" },
  noShowRate: { value: '15', hint: "Industry average ~15% no-show rate" },
  monthlyMarketingSpend: { value: '1000', hint: "Estimated $1,000/mo — update if you know yours" },
  customerAcquisitionCost: { value: '65', hint: "Estimated ~$65 per new customer" },
  upsellRevenuePercent: { value: '10', hint: "Estimated ~10% of revenue from upsells" },
  avgDealCycleWeeks: { value: '2', hint: "Estimated ~2 weeks from enquiry to sale" },
};

interface Props {
  data: FormData;
  onChange: (data: Partial<FormData>) => void;
  errors?: Record<string, string>;
}

interface ToggleFieldProps {
  label: string;
  description?: string;
  id: string;
  fieldKey: string;
  placeholder: string;
  value: string;
  known: boolean | null; // null = not yet answered
  onToggle: (known: boolean) => void;
  onChange: (value: string) => void;
  error?: string;
  estimated?: boolean;
  estimateHint?: string;
}

const ToggleField = ({
  label, description, id, fieldKey, placeholder, value, known, onToggle, onChange, error, estimated, estimateHint,
}: ToggleFieldProps) => (
  <div className={`space-y-2 rounded-lg border p-4 ${error ? 'border-destructive bg-destructive/5' : 'border-border bg-secondary/30'}`}>
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant={known === true ? 'default' : 'outline'}
          className="h-7 px-3 text-xs"
          onClick={() => onToggle(true)}
        >
          I know this
        </Button>
        <Button
          type="button"
          size="sm"
          variant={known === false ? 'default' : 'outline'}
          className="h-7 px-3 text-xs"
          onClick={() => onToggle(false)}
        >
          Estimate for me
        </Button>
      </div>
    </div>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}

    {/* Show input when known=true (user enters their value) */}
    {known === true && (
      <Input
        id={id}
        type="number"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 ${error ? 'border-destructive' : ''}`}
        aria-invalid={!!error}
      />
    )}

    {/* Show pre-filled estimate when known=false */}
    {known === false && (
      <div className="mt-1 space-y-1">
        <div className="relative">
          <Input
            id={id}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pr-20 border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/20"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
            Estimated
          </span>
        </div>
        {estimateHint && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Info className="w-3 h-3 flex-shrink-0" /> {estimateHint}
          </p>
        )}
      </div>
    )}

    {error && (
      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </p>
    )}
  </div>
);

interface RequiredFieldProps {
  label: string;
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const RequiredField = ({ label, id, placeholder, value, onChange, error }: RequiredFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="flex items-center gap-1">
      {label} <span className="text-destructive">*</span>
    </Label>
    <Input
      id={id}
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={error ? 'border-destructive ring-1 ring-destructive' : ''}
      aria-invalid={!!error}
    />
    {error && (
      <p className="text-xs text-destructive flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </p>
    )}
  </div>
);

const CustomerMetrics = ({ data, onChange, errors = {} }: Props) => {
  const isService = data.businessType === 'service' || data.businessType === 'hybrid';
  const isProduct = data.businessType === 'product' || data.businessType === 'hybrid';

  // null = not yet answered, true = user knows, false = use estimate
  const [known, setKnown] = useState<Record<string, boolean | null>>({
    monthlyVisitors: data.monthlyVisitors ? true : null,
    monthlyLeads: data.monthlyLeads ? true : null,
    conversionRate: data.conversionRate ? true : null,
    monthlyNewCustomers: data.monthlyNewCustomers ? true : null,
    noShowRate: data.noShowRate ? true : null,
    monthlyMarketingSpend: data.monthlyMarketingSpend ? true : null,
    customerAcquisitionCost: data.customerAcquisitionCost ? true : null,
    upsellRevenuePercent: data.upsellRevenuePercent ? true : null,
  });

  const toggle = (field: string, value: boolean) => {
    setKnown((prev) => ({ ...prev, [field]: value }));
    if (!value) {
      // User chose "Estimate for me" — fill with default
      const defaultVal = FIELD_DEFAULTS[field]?.value || '';
      onChange({ [field]: defaultVal } as Partial<FormData>);
    } else {
      // User chose "I know this" — clear so they enter their own
      if (!data[field as keyof FormData]) {
        onChange({ [field]: '' } as Partial<FormData>);
      }
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">Customer & Sales Metrics</h2>
        <p className="text-muted-foreground text-sm">
          Tell us what you know — for anything you're unsure of, we'll use a sensible industry estimate.
        </p>
      </div>

      {hasErrors && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive font-medium">
            Please complete the required fields marked with <span className="text-destructive">*</span> below to calculate your ROI.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToggleField
          label="Monthly Website Visitors"
          id="visitors"
          fieldKey="monthlyVisitors"
          placeholder="e.g. 1000"
          value={data.monthlyVisitors}
          known={known.monthlyVisitors}
          onToggle={(v) => toggle('monthlyVisitors', v)}
          onChange={(v) => onChange({ monthlyVisitors: v })}
          estimated={known.monthlyVisitors === false}
          estimateHint={FIELD_DEFAULTS.monthlyVisitors.hint}
        />
        <ToggleField
          label="Monthly Leads / Enquiries"
          id="leads"
          fieldKey="monthlyLeads"
          placeholder="e.g. 50"
          value={data.monthlyLeads}
          known={known.monthlyLeads}
          onToggle={(v) => toggle('monthlyLeads', v)}
          onChange={(v) => onChange({ monthlyLeads: v })}
          estimated={known.monthlyLeads === false}
          estimateHint={FIELD_DEFAULTS.monthlyLeads.hint}
        />
        <ToggleField
          label="Lead-to-Sale Conversion Rate (%)"
          id="conversion"
          fieldKey="conversionRate"
          placeholder="e.g. 5"
          value={data.conversionRate}
          known={known.conversionRate}
          onToggle={(v) => toggle('conversionRate', v)}
          onChange={(v) => onChange({ conversionRate: v })}
          estimated={known.conversionRate === false}
          estimateHint={FIELD_DEFAULTS.conversionRate.hint}
        />
        <ToggleField
          label="Monthly New Customers"
          id="newCustomers"
          fieldKey="monthlyNewCustomers"
          placeholder="e.g. 25"
          value={data.monthlyNewCustomers}
          known={known.monthlyNewCustomers}
          onToggle={(v) => toggle('monthlyNewCustomers', v)}
          onChange={(v) => onChange({ monthlyNewCustomers: v })}
          estimated={known.monthlyNewCustomers === false}
          estimateHint={FIELD_DEFAULTS.monthlyNewCustomers.hint}
        />
        {isService && (
          <ToggleField
            label="No-Show / Cancellation Rate (%)"
            description="% of bookings that don't show up"
            id="noShowRate"
            fieldKey="noShowRate"
            placeholder="e.g. 15"
            value={data.noShowRate}
            known={known.noShowRate}
            onToggle={(v) => toggle('noShowRate', v)}
            onChange={(v) => onChange({ noShowRate: v })}
            estimated={known.noShowRate === false}
            estimateHint={FIELD_DEFAULTS.noShowRate.hint}
          />
        )}
        <ToggleField
          label="Monthly Marketing Spend ($)"
          id="marketingSpend"
          fieldKey="monthlyMarketingSpend"
          placeholder="e.g. 2000"
          value={data.monthlyMarketingSpend}
          known={known.monthlyMarketingSpend}
          onToggle={(v) => toggle('monthlyMarketingSpend', v)}
          onChange={(v) => onChange({ monthlyMarketingSpend: v })}
          estimated={known.monthlyMarketingSpend === false}
          estimateHint={FIELD_DEFAULTS.monthlyMarketingSpend.hint}
        />
        <ToggleField
          label="Customer Acquisition Cost ($)"
          description="How much it costs to win one new customer"
          id="cac"
          fieldKey="customerAcquisitionCost"
          placeholder="e.g. 50"
          value={data.customerAcquisitionCost}
          known={known.customerAcquisitionCost}
          onToggle={(v) => toggle('customerAcquisitionCost', v)}
          onChange={(v) => onChange({ customerAcquisitionCost: v })}
          estimated={known.customerAcquisitionCost === false}
          estimateHint={FIELD_DEFAULTS.customerAcquisitionCost.hint}
        />
        {isProduct && (
          <ToggleField
            label="Upsell / Cross-sell Revenue (%)"
            description="% of revenue from add-on / cross-sell products"
            id="upsellPercent"
            fieldKey="upsellRevenuePercent"
            placeholder="e.g. 20"
            value={data.upsellRevenuePercent}
            known={known.upsellRevenuePercent}
            onToggle={(v) => toggle('upsellRevenuePercent', v)}
            onChange={(v) => onChange({ upsellRevenuePercent: v })}
            estimated={known.upsellRevenuePercent === false}
            estimateHint={FIELD_DEFAULTS.upsellRevenuePercent.hint}
          />
        )}
      </div>

      <div className="pt-2">
        <p className="text-sm text-muted-foreground mb-1 font-medium">Customer Lifetime Value (CLV) inputs:</p>
        <p className="text-xs text-destructive mb-4">These fields are required to calculate your ROI</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <RequiredField
            label="Average Purchase Value ($)"
            id="purchaseValue"
            placeholder="e.g. 200"
            value={data.avgPurchaseValue}
            onChange={(v) => onChange({ avgPurchaseValue: v })}
            error={errors.avgPurchaseValue}
          />
          <RequiredField
            label="Average Purchases Per Year"
            id="purchasesPerYear"
            placeholder="e.g. 4"
            value={data.avgPurchasesPerYear}
            onChange={(v) => onChange({ avgPurchasesPerYear: v })}
            error={errors.avgPurchasesPerYear}
          />
          <RequiredField
            label="Customer Retention (years)"
            id="retention"
            placeholder="e.g. 3"
            value={data.avgRetentionYears}
            onChange={(v) => onChange({ avgRetentionYears: v })}
            error={errors.avgRetentionYears}
          />
          <ToggleField
            label="Average Deal Cycle (weeks)"
            description="How long from first enquiry to closed deal?"
            id="dealCycle"
            fieldKey="avgDealCycleWeeks"
            placeholder="e.g. 2"
            value={data.avgDealCycleWeeks}
            known={known.avgDealCycleWeeks ?? null}
            onToggle={(v) => toggle('avgDealCycleWeeks', v)}
            onChange={(v) => onChange({ avgDealCycleWeeks: v })}
            estimated={known.avgDealCycleWeeks === false}
            estimateHint={FIELD_DEFAULTS.avgDealCycleWeeks?.hint}
          />
        </div>
      </div>
    </div>
  );
};

// Validation helper — exported for use in parent
export const CUSTOMER_METRICS_REQUIRED = [
  'avgPurchaseValue',
  'avgPurchasesPerYear',
  'avgRetentionYears',
] as const;

export function validateCustomerMetrics(data: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key of CUSTOMER_METRICS_REQUIRED) {
    const val = parseFloat(data[key]);
    if (!val || val <= 0) {
      errors[key] = 'Required — enter a value greater than 0';
    }
  }
  return errors;
}

export default CustomerMetrics;
