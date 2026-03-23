import { motion } from 'framer-motion';
import {
  Building2, Users, DollarSign, Target, Clock, Globe,
  TrendingUp, ShoppingCart, Zap, BarChart3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  formData: any;
  roiResults: any;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const Field = ({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) => {
  if (!value && value !== 0) return null;
  const display = Array.isArray(value) ? value.join(', ') : String(value);
  if (!display) return null;
  return (
    <div className="flex items-start gap-2 py-0.5">
      {Icon && <Icon className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-[11px] text-foreground">{display}</p>
      </div>
    </div>
  );
};

const RealityCheckViewer = ({ formData, roiResults }: Props) => {
  if (!formData) return null;
  const fd = formData as any;
  const roi = roiResults as any;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3"
    >
      {/* Business Snapshot */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Building2 className="w-3 h-3" /> Business Snapshot
        </p>
        <div className="bg-secondary/50 rounded-lg p-2.5 space-y-0.5">
          <Field label="Business Type" value={fd.businessType} />
          <Field label="Industry" value={fd.industry} />
          <Field label="Monthly Revenue" value={fd.monthlyRevenue} icon={DollarSign} />
          <Field label="Staff" value={
            [fd.staffFullTime && `${fd.staffFullTime} FT`, fd.staffPartTime && `${fd.staffPartTime} PT`, fd.staffCasual && `${fd.staffCasual} casual`, fd.staffSubcontractors && `${fd.staffSubcontractors} subs`].filter(Boolean).join(', ') || fd.numberOfStaff
          } icon={Users} />
        </div>
      </div>

      {/* Customer Metrics */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Customer Metrics
        </p>
        <div className="bg-secondary/50 rounded-lg p-2.5 space-y-0.5">
          <Field label="Monthly Visitors" value={fd.monthlyVisitors} icon={Globe} />
          <Field label="Monthly Leads" value={fd.monthlyLeads} />
          <Field label="Conversion Rate" value={fd.conversionRate ? `${fd.conversionRate}%` : null} icon={BarChart3} />
          <Field label="New Customers / Month" value={fd.monthlyNewCustomers} />
          <Field label="Avg Purchase Value" value={fd.avgPurchaseValue ? formatCurrency(parseFloat(fd.avgPurchaseValue)) : null} icon={ShoppingCart} />
          <Field label="Purchases / Year" value={fd.avgPurchasesPerYear} />
          <Field label="Avg Retention" value={fd.avgRetentionYears ? `${fd.avgRetentionYears} years` : null} />
          <Field label="No-Show Rate" value={fd.noShowRate ? `${fd.noShowRate}%` : null} />
          <Field label="Marketing Spend" value={fd.monthlyMarketingSpend ? formatCurrency(parseFloat(fd.monthlyMarketingSpend)) : null} />
          <Field label="CAC" value={fd.customerAcquisitionCost ? formatCurrency(parseFloat(fd.customerAcquisitionCost)) : null} />
          <Field label="Upsell Revenue %" value={fd.upsellRevenuePercent ? `${fd.upsellRevenuePercent}%` : null} />
        </div>
      </div>

      {/* Operations */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Clock className="w-3 h-3" /> Weekly Time Spend
        </p>
        <div className="bg-secondary/50 rounded-lg p-2.5 space-y-0.5">
          <Field label="Admin" value={fd.hoursAdmin ? `${fd.hoursAdmin} hrs` : null} />
          <Field label="Booking" value={fd.hoursBooking ? `${fd.hoursBooking} hrs` : null} />
          <Field label="Follow-ups" value={fd.hoursFollowUps ? `${fd.hoursFollowUps} hrs` : null} />
          <Field label="Invoicing" value={fd.hoursInvoicing ? `${fd.hoursInvoicing} hrs` : null} />
          <Field label="Hourly Staff Cost" value={fd.hourlyStaffCost ? formatCurrency(parseFloat(fd.hourlyStaffCost)) : null} />
        </div>
      </div>

      {/* Growth */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Target className="w-3 h-3" /> Growth & Goals
        </p>
        <div className="bg-secondary/50 rounded-lg p-2.5 space-y-0.5">
          <Field label="Lost Sales Reasons" value={fd.lostSalesReasons} icon={Zap} />
          <Field label="Current Features" value={fd.currentFeatures} />
          <Field label="Primary Goals" value={fd.primaryGoals} icon={Target} />
          <Field label="Current Website" value={fd.currentWebsite} icon={Globe} />
          <Field label="Conversion Impact" value={fd.conversionImpactAnswer} />
          <Field label="Additional Notes" value={fd.additionalNotes} />
        </div>
      </div>

      {/* ROI Summary */}
      {roi && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> ROI Summary
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 grid grid-cols-2 gap-1.5">
            {roi.revenueLift > 0 && (
              <div><p className="text-[9px] text-muted-foreground">Revenue Lift</p><p className="text-[11px] font-bold text-foreground">{formatCurrency(roi.revenueLift)}/yr</p></div>
            )}
            {roi.operationalSavings > 0 && (
              <div><p className="text-[9px] text-muted-foreground">Op. Savings</p><p className="text-[11px] font-bold text-foreground">{formatCurrency(roi.operationalSavings)}/yr</p></div>
            )}
            {roi.retentionImprovement > 0 && (
              <div><p className="text-[9px] text-muted-foreground">Retention</p><p className="text-[11px] font-bold text-foreground">{formatCurrency(roi.retentionImprovement)}/yr</p></div>
            )}
            {roi.noShowRecovery > 0 && (
              <div><p className="text-[9px] text-muted-foreground">No-Show Recovery</p><p className="text-[11px] font-bold text-foreground">{formatCurrency(roi.noShowRecovery)}/yr</p></div>
            )}
            {roi.upsellLift > 0 && (
              <div><p className="text-[9px] text-muted-foreground">Upsell Lift</p><p className="text-[11px] font-bold text-foreground">{formatCurrency(roi.upsellLift)}/yr</p></div>
            )}
            {roi.marketingEfficiency > 0 && (
              <div><p className="text-[9px] text-muted-foreground">Marketing Eff.</p><p className="text-[11px] font-bold text-foreground">{formatCurrency(roi.marketingEfficiency)}/yr</p></div>
            )}
            <div className="col-span-2 border-t border-primary/20 pt-1">
              <p className="text-[9px] text-muted-foreground">Total Annual Impact</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(roi.totalAnnualImpact)}/yr</p>
            </div>
            <div><p className="text-[9px] text-muted-foreground">ROI</p><p className="text-[11px] font-bold text-foreground">{Math.round(roi.roiPercentage)}%</p></div>
            <div><p className="text-[9px] text-muted-foreground">Break-even</p><p className="text-[11px] font-bold text-foreground">{Math.round(roi.breakEvenMonths)} months</p></div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RealityCheckViewer;
