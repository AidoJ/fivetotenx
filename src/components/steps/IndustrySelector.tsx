import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Lock, Loader2 } from 'lucide-react';

interface Industry {
  id: string;
  slug: string;
  label: string;
  description: string;
  examples: string[];
  available: boolean;
  sort_order: number;
}

interface Props {
  selectedIndustryId: string | null;
  onSelect: (industry: Industry) => void;
}

const IndustrySelector = ({ selectedIndustryId, onSelect }: Props) => {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('scoping_industries' as any)
        .select('*')
        .order('sort_order');
      if (!error && data) setIndustries(data as any);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">Select Your Industry</h2>
        <p className="text-muted-foreground text-sm">
          This helps us ask the right questions for your specific business type.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {industries.map((ind) => (
          <motion.button
            key={ind.id}
            whileHover={ind.available ? { scale: 1.02 } : {}}
            whileTap={ind.available ? { scale: 0.98 } : {}}
            onClick={() => ind.available && onSelect(ind)}
            disabled={!ind.available}
            className={`rounded-xl border-2 p-4 text-left space-y-1.5 transition-colors ${
              selectedIndustryId === ind.id
                ? 'border-primary bg-primary/10'
                : ind.available
                ? 'border-border bg-card hover:border-primary/50 cursor-pointer'
                : 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold text-sm ${ind.available ? 'text-foreground' : 'text-muted-foreground'}`}>
                {ind.label}
              </h3>
              {!ind.available && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
              {selectedIndustryId === ind.id && <ArrowRight className="w-4 h-4 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground">{ind.description}</p>
            {ind.examples && ind.examples.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {ind.examples.slice(0, 3).map((ex, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                    {ex}
                  </span>
                ))}
              </div>
            )}
            {!ind.available && (
              <span className="text-[10px] font-medium text-muted-foreground italic">Coming soon</span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default IndustrySelector;
