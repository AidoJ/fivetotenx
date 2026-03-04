import { motion } from 'framer-motion';
import { DynamicPricing, MAINTENANCE_UPLIFT } from '@/lib/formTypes';
import { DollarSign, AlertTriangle, CreditCard, Calendar, Repeat, Wrench } from 'lucide-react';

interface Props {
  pricing: DynamicPricing;
  totalAnnualImpact: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const PricingSection = ({ pricing, totalAnnualImpact }: Props) => {
  const paybackMonths = totalAnnualImpact > 0
    ? (pricing.buildCost / (totalAnnualImpact / 12))
    : 0;

  if (!pricing.isViable) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-3"
      >
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Recommendation: Not Viable for Custom App
        </h3>
        <p className="text-sm text-muted-foreground">
          Based on the projected annual impact of <strong>{formatCurrency(totalAnnualImpact)}</strong>, a custom app build
          isn't cost-effective at this stage. We'd recommend simpler solutions like a booking plugin, improved website, or
          off-the-shelf tools.
        </p>
      </motion.div>
    );
  }

  const planIcons = {
    upfront: CreditCard,
    'deposit-subscription': Calendar,
    'subscription-only': Repeat,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-xl border border-border bg-card p-6 space-y-5"
    >
      <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-accent" />
        Investment & Payment Options
      </h3>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center p-3 rounded-lg bg-secondary space-y-1">
          <p className="text-xs text-muted-foreground">Build Investment</p>
          <p className="text-lg font-display font-bold text-foreground">{formatCurrency(pricing.buildCost)}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary space-y-1">
          <p className="text-xs text-muted-foreground">Tier</p>
          <p className="text-lg font-display font-bold text-primary">{pricing.tierLabel}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary space-y-1">
          <p className="text-xs text-muted-foreground">Payback Period</p>
          <p className="text-lg font-display font-bold text-primary">{paybackMonths.toFixed(1)} months</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary space-y-1">
          <p className="text-xs text-muted-foreground">Year 1 Net Return</p>
          <p className="text-lg font-display font-bold text-primary">{formatCurrency(totalAnnualImpact - pricing.buildCost)}</p>
        </div>
      </div>

      {/* Payment plans */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Choose a payment structure:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricing.plans.map((plan) => {
            const Icon = planIcons[plan.type];
            return (
              <div
                key={plan.type}
                className="rounded-lg border border-border bg-secondary p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">{plan.label}</p>
                </div>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
                <div className="space-y-1 text-sm">
                  {plan.deposit > 0 && (
                    <p className="text-foreground">
                      Deposit: <strong>{formatCurrency(plan.deposit)}</strong>
                    </p>
                  )}
                  {plan.monthlyAmount > 0 && (
                    <p className="text-foreground">
                      Monthly: <strong>{formatCurrency(plan.monthlyAmount)}</strong>
                      {plan.includesMaintenance && (
                        <span className="text-xs text-muted-foreground ml-1">(incl. maintenance)</span>
                      )}
                    </p>
                  )}
                  {plan.type === 'upfront' && (
                    <p className="text-foreground">
                      Completion: <strong>{formatCurrency(plan.totalCost - plan.deposit)}</strong>
                    </p>
                  )}
                  {plan.totalCost > 0 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Total: {formatCurrency(plan.totalCost)}
                    </p>
                  )}
                  {plan.type === 'subscription-only' && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Ongoing — cancel anytime after 12 months
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maintenance note */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
        <Wrench className="w-4 h-4 text-accent mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Annual Maintenance & Support</p>
          <p>
            <strong>{formatCurrency(pricing.annualMaintenance)}/year</strong> ({(MAINTENANCE_UPLIFT * 100).toFixed(0)}% of build cost)
            — includes updates, bug fixes, hosting support, and performance monitoring.
            {pricing.plans.find(p => p.type === 'subscription-only')?.includesMaintenance && (
              <span> Already included in the subscription plan.</span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingSection;
