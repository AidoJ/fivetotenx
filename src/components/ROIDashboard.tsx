import { useState } from 'react';
import { motion } from 'framer-motion';
import { ROIResults, FormData } from '@/lib/formTypes';
import { TrendingUp, Clock, Users, DollarSign, ArrowRight, Send, Video, Loader2, CheckCircle, ShieldAlert, ShoppingBag, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PricingSection from '@/components/dashboard/PricingSection';

interface Props {
  results: ROIResults;
  formData: FormData;
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

const ROIDashboard = ({ results, formData, onReset }: Props) => {
  const [zoomLink, setZoomLink] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSendReport = async (includeZoom: boolean) => {
    if (!formData.contactEmail || !formData.contactName) {
      toast({ title: 'Missing info', description: 'Name and email are required to send the report.', variant: 'destructive' });
      return;
    }
    if (includeZoom && !zoomLink) {
      toast({ title: 'Missing Zoom link', description: 'Please enter a Zoom link before sending the invite.', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const { data: insertedRow, error: dbError } = await supabase.from('roi_assessments').insert([{
        contact_name: formData.contactName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        business_name: formData.businessName,
        industry: formData.industry,
        form_data: JSON.parse(JSON.stringify(formData)),
        roi_results: JSON.parse(JSON.stringify(results)),
        report_sent: true,
        invite_sent: includeZoom,
        is_qualified: results.pricing.isQualified,
        pipeline_stage: results.pricing.isQualified ? 'qualified' : 'assessment',
        qualified_at: results.pricing.isQualified ? new Date().toISOString() : null,
      } as any]).select('id').single();
      if (dbError) throw dbError;

      const { error: fnError } = await supabase.functions.invoke('send-report', {
        body: {
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          businessName: formData.businessName,
          results,
          formData,
          zoomLink: includeZoom ? zoomLink : null,
        },
      });
      if (fnError) throw fnError;

      setSent(true);
      toast({ title: 'Report sent! ✅', description: `Report sent to ${formData.contactEmail}` });
    } catch (err: unknown) {
      console.error('Send error:', err);
      toast({ title: 'Error', description: 'Failed to send report. Please try again.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // Build breakdown cards - only show non-zero values
  const breakdownCards = [
    { icon: TrendingUp, label: 'Revenue Lift', value: results.revenueLift, delay: 0.3 },
    { icon: Clock, label: 'Operational Savings', value: results.operationalSavings, delay: 0.35 },
    { icon: Users, label: 'Retention Improvement', value: results.retentionImprovement, delay: 0.4 },
    { icon: ShieldAlert, label: 'No-Show Recovery', value: results.noShowRecovery, delay: 0.45 },
    { icon: ShoppingBag, label: 'Upsell / Cross-sell Lift', value: results.upsellLift, delay: 0.5 },
    { icon: Megaphone, label: 'Marketing Efficiency', value: results.marketingEfficiency, delay: 0.55 },
  ].filter(card => card.value > 0);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h2 className="text-3xl font-display font-bold text-foreground mb-2">
          ROI Projection for {formData.businessName || 'Your Business'}
        </h2>
        <p className="text-muted-foreground">Here's what a custom app could deliver annually.</p>
      </motion.div>

      {/* Main Impact */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-8 text-center animate-gradient-shift"
        style={{ backgroundImage: 'var(--gradient-vibrant)', backgroundSize: '200% 200%' }}
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1">
          Total Potential Annual Impact
        </p>
        <p className="text-5xl md:text-6xl font-display font-bold text-primary-foreground">
          {formatCurrency(results.totalAnnualImpact)}
        </p>
      </motion.div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {breakdownCards.map((card) => (
          <ResultCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={formatCurrency(card.value)}
            color="bg-primary/15 text-primary"
            delay={card.delay}
          />
        ))}
      </div>

      {/* Dynamic Pricing & Payment Plans */}
      <PricingSection pricing={results.pricing} totalAnnualImpact={results.totalAnnualImpact} />

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
          {results.noShowRecovery > 0 && (
            <div className="p-4 rounded-lg bg-secondary">
              <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" /> No-Show Recovery
              </p>
              <p className="text-muted-foreground">
                App reminders recover ~50% of no-shows → {formatCurrency(results.noShowRecovery)}/year saved
              </p>
            </div>
          )}
          {results.upsellLift > 0 && (
            <div className="p-4 rounded-lg bg-secondary">
              <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" /> Upsell / Cross-sell
              </p>
              <p className="text-muted-foreground">
                Smart in-app recommendations lift upsell revenue by 15% → {formatCurrency(results.upsellLift)}/year
              </p>
            </div>
          )}
          {results.marketingEfficiency > 0 && (
            <div className="p-4 rounded-lg bg-secondary">
              <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" /> Marketing Efficiency
              </p>
              <p className="text-muted-foreground">
                Better in-app conversion reduces effective CAC → 20% marketing spend saved ({formatCurrency(results.marketingEfficiency)}/year)
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Send Report & Zoom Invite */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="rounded-xl border border-border bg-card p-6 space-y-5"
      >
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          Send Report to {formData.contactName || 'Client'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Send this ROI report to <strong>{formData.contactEmail}</strong>. Optionally include a Zoom training session invite.
        </p>

        <div className="space-y-2">
          <Label htmlFor="zoomLink" className="flex items-center gap-2">
            <Video className="w-4 h-4 text-primary" />
            Zoom Training Link (optional)
          </Label>
          <Input
            id="zoomLink"
            type="url"
            placeholder="https://zoom.us/j/your-meeting-id"
            value={zoomLink}
            onChange={(e) => setZoomLink(e.target.value)}
            disabled={sent}
          />
        </div>

        {sent ? (
          <div className="flex items-center gap-2 text-primary font-medium">
            <CheckCircle className="w-5 h-5" />
            Report sent successfully!
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => handleSendReport(false)} disabled={sending} className="gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Report Only
            </Button>
            <Button onClick={() => handleSendReport(true)} disabled={sending || !zoomLink} variant="outline" className="gap-2">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              Send Report + Zoom Invite
            </Button>
          </div>
        )}
      </motion.div>

      {/* Tagline */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-center py-6">
        <p className="text-lg font-display font-semibold text-foreground mb-1">You're not buying tech.</p>
        <p className="text-2xl font-display font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>You're buying profit.</p>
        <button onClick={onReset} className="mt-6 text-sm text-muted-foreground hover:text-foreground underline transition-colors">
          Start a new assessment
        </button>
      </motion.div>
    </div>
  );
};

export default ROIDashboard;
