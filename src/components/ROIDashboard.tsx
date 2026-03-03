import { motion } from 'framer-motion';
import { ROIResults, APP_BUILD_COST } from '@/lib/formTypes';
import { TrendingUp, Clock, Users, DollarSign, ArrowRight } from 'lucide-react';

interface Props {
  results: ROIResults;
  businessName: string;
  onReset: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const ResultCard = ({ icon: Icon, label, value, color, delay }: {
  icon: typeof TrendingUp; label: string; value: string; color: string; delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="rounded-xl border border-border bg-card p-6 flex flex-col gap-2"
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-sm text-muted-foreground font-medium">{label}</span>
    <span className="text-2xl font-display font-bold text-foreground">{value}</span>
  </motion.div>
);

const ROIDashboard = ({ results, businessName, onReset }: Props) => {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-display font-bold text-foreground mb-2">
          ROI Projection for {businessName || 'Your Business'}
        </h2>
        <p className="text-muted-foreground">Here's what a custom app could deliver annually.</p>
      </motion.div>

      {/* Main Impact */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-8 text-center"
        style={{ background: 'var(--gradient-gold)' }}
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1">
          Total Potential Annual Impact
        </p>
        <p className="text-5xl md:text-6xl font-display font-bold text-primary-foreground">
          {formatCurrency(results.totalAnnualImpact)}
        </p>
      </motion.div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard
          icon={TrendingUp}
          label="Revenue Lift"
          value={formatCurrency(results.revenueLift)}
          color="bg-primary/15 text-primary"
          delay={0.3}
        />
        <ResultCard
          icon={Clock}
          label="Operational Savings"
          value={formatCurrency(results.operationalSavings)}
          color="bg-primary/15 text-primary"
          delay={0.4}
        />
        <ResultCard
          icon={Users}
          label="Retention Improvement"
          value={formatCurrency(results.retentionImprovement)}
          color="bg-primary/15 text-primary"
          delay={0.5}
        />
      </div>

      {/* ROI Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl border border-border bg-card p-6 space-y-4"
      >
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-accent" />
          Investment Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground mb-1">App Build Cost</p>
            <p className="text-xl font-display font-bold text-foreground">{formatCurrency(APP_BUILD_COST)}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground mb-1">Year 1 ROI</p>
            <p className="text-xl font-display font-bold text-primary">{results.roiPercentage.toFixed(0)}%</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground mb-1">Break-even</p>
            <p className="text-xl font-display font-bold text-primary">{results.breakEvenMonths.toFixed(1)} months</p>
          </div>
        </div>
      </motion.div>

      {/* Detail Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-xl border border-border bg-card p-6 space-y-5"
      >
        <h3 className="font-display font-bold text-lg text-foreground">How We Calculated This</h3>

        <div className="space-y-4 text-sm">
          <div className="p-4 rounded-lg bg-secondary">
            <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Revenue Lift
            </p>
            <p className="text-muted-foreground">
              {results.currentConversion.toFixed(1)}% conversion <ArrowRight className="w-3 h-3 inline" /> {results.newConversion.toFixed(2)}% with 15% app improvement
            </p>
            <p className="text-muted-foreground">
              {formatCurrency(results.currentMonthlyRevenue)}/mo <ArrowRight className="w-3 h-3 inline" /> {formatCurrency(results.newMonthlyRevenue)}/mo
            </p>
          </div>

          <div className="p-4 rounded-lg bg-secondary">
            <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Operational Savings
            </p>
            <p className="text-muted-foreground">
              {results.weeklyAdminHours}h/week manual work → automation removes {results.weeklySavingsHours.toFixed(1)}h/week (40%)
            </p>
          </div>

          <div className="p-4 rounded-lg bg-secondary">
            <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Retention & Upsell
            </p>
            <p className="text-muted-foreground">
              {results.activeCustomers} active customers × {formatCurrency(results.clv)} CLV × 10% retention lift
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-center py-6"
      >
        <p className="text-lg font-display font-semibold text-foreground mb-1">You're not buying tech.</p>
        <p className="text-2xl font-display font-bold text-primary">You're buying profit.</p>
        <button
          onClick={onReset}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground underline transition-colors"
        >
          Start a new assessment
        </button>
      </motion.div>
    </div>
  );
};

export default ROIDashboard;
