import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { maybeAutoRegenerateProposal } from '@/lib/proposalBuilder';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Loader2, Sparkles, Clock, TrendingUp, DollarSign, Shield, Users,
  RefreshCw, Zap, ArrowRight,
} from 'lucide-react';

interface Opportunity {
  title: string;
  impact_category: string;
  estimated_annual_impact: number;
  difficulty: string;
  explanation: string;
  recommendation: string;
}

interface Analysis {
  big_hits: Opportunity[];
  quick_wins: Opportunity[];
  summary: string;
  total_potential_impact: number;
}

const categoryConfig: Record<string, { icon: any; color: string; label: string }> = {
  time_savings: { icon: Clock, color: 'text-blue-600', label: 'Time Savings' },
  revenue_growth: { icon: TrendingUp, color: 'text-green-600', label: 'Revenue Growth' },
  cost_reduction: { icon: DollarSign, color: 'text-amber-600', label: 'Cost Reduction' },
  risk_mitigation: { icon: Shield, color: 'text-red-600', label: 'Risk Mitigation' },
  customer_experience: { icon: Users, color: 'text-purple-600', label: 'Customer Experience' },
};

const difficultyConfig: Record<string, { bg: string; label: string }> = {
  easy: { bg: 'bg-green-500/10 text-green-700 border-green-500/20', label: 'Easy' },
  medium: { bg: 'bg-amber-500/10 text-amber-700 border-amber-500/20', label: 'Medium' },
  hard: { bg: 'bg-red-500/10 text-red-700 border-red-500/20', label: 'Hard' },
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const OpportunityCard = ({ opp, index, isBigHit }: { opp: Opportunity; index: number; isBigHit: boolean }) => {
  const cat = categoryConfig[opp.impact_category] || categoryConfig.time_savings;
  const diff = difficultyConfig[opp.difficulty] || difficultyConfig.medium;
  const CatIcon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-xl border bg-card p-5 space-y-3 ${isBigHit ? 'border-primary/30 shadow-sm' : 'border-border'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isBigHit ? 'bg-primary/10' : 'bg-secondary'}`}>
            <span className="text-sm font-bold text-primary">#{index + 1}</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{opp.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <CatIcon className={`w-3 h-3 ${cat.color}`} />
              <span className={`text-[10px] font-medium ${cat.color}`}>{cat.label}</span>
              <Badge variant="outline" className={`text-[9px] h-4 ${diff.bg}`}>{diff.label}</Badge>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-primary">{formatCurrency(opp.estimated_annual_impact)}</p>
          <p className="text-[9px] text-muted-foreground">per year</p>
        </div>
      </div>

      <p className="text-xs text-foreground/80 leading-relaxed">{opp.explanation}</p>

      <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3">
        <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-foreground font-medium">{opp.recommendation}</p>
      </div>
    </motion.div>
  );
};

interface Props {
  assessmentId: string;
  existingAnalysis: Analysis | null;
  onUpdate: (analysis: Analysis) => void;
}

const OpportunityAnalysis = ({ assessmentId, existingAnalysis, onUpdate }: Props) => {
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-opportunities', {
        body: { assessmentId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.analysis) {
        onUpdate(data.analysis);
        const regenerated = await maybeAutoRegenerateProposal(assessmentId);
        toast({
          title: 'Analysis complete ✅',
          description: `Found ${(data.analysis.big_hits?.length || 0) + (data.analysis.quick_wins?.length || 0)} opportunities.${regenerated ? ' Proposal auto-regenerated.' : ''}`,
        });
      }
    } catch (err: any) {
      toast({ title: 'Analysis failed', description: err.message, variant: 'destructive' });
    }
    setAnalyzing(false);
  };

  if (!existingAnalysis) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center space-y-4">
        <Sparkles className="w-10 h-10 text-primary mx-auto" />
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">AI Opportunity Analysis</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Analyze all Straight Talk™ data, transcripts, and discovery answers to identify the top automation and efficiency opportunities for this client.
          </p>
        </div>
        <Button onClick={handleAnalyze} disabled={analyzing} className="gap-2">
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {analyzing ? 'Analyzing...' : 'Run Opportunity Analysis'}
        </Button>
      </div>
    );
  }

  const { big_hits, quick_wins, summary, total_potential_impact } = existingAnalysis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Opportunity Analysis
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{summary}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Potential Impact</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(total_potential_impact)}<span className="text-xs text-muted-foreground font-normal">/yr</span></p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={analyzing} className="gap-1.5">
            {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Re-analyze
          </Button>
        </div>
      </div>

      {/* Big 5 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground">The Big 5 — Highest Impact Opportunities</h3>
          <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">
            {formatCurrency(big_hits.reduce((s, o) => s + o.estimated_annual_impact, 0))}/yr
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {big_hits.map((opp, i) => (
            <OpportunityCard key={i} opp={opp} index={i} isBigHit />
          ))}
        </div>
      </div>

      {/* Next Best 5 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Next Best 5 — Additional Opportunities</h3>
          <Badge variant="outline" className="text-[9px]">
            {formatCurrency(quick_wins.reduce((s, o) => s + o.estimated_annual_impact, 0))}/yr
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {quick_wins.map((opp, i) => (
            <OpportunityCard key={i} opp={opp} index={i + 5} isBigHit={false} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OpportunityAnalysis;
