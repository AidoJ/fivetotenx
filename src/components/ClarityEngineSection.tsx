import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Radar, Search, MessageCircle, Puzzle, FileText, Rocket, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const phases = [
  {
    icon: Radar,
    emoji: '🧭',
    label: 'Signal Capture™',
    phase: 'Phase 1',
    formerly: 'Assessment',
    question: 'What\'s really going on beneath the surface?',
    description: 'We capture the signal in the noise — a high-level snapshot of your business, challenges, and untapped opportunities.',
    accent: 'from-blue-500 to-indigo-500',
    accentLight: 'bg-blue-500/10 border-blue-500/20',
    dot: 'bg-blue-500',
  },
  {
    icon: Search,
    emoji: '🔍',
    label: 'Pattern Mapping™',
    phase: 'Phase 2',
    formerly: 'Deep Dive',
    question: 'Where are you leaking time, money, and momentum?',
    description: 'We identify patterns, inefficiencies, and leverage points across your workflows, data, and customer journey.',
    accent: 'from-violet-500 to-purple-500',
    accentLight: 'bg-violet-500/10 border-violet-500/20',
    dot: 'bg-violet-500',
  },
  {
    icon: MessageCircle,
    emoji: '💬',
    label: 'Alignment Dialogue™',
    phase: 'Phase 3',
    formerly: 'Discovery Call',
    question: 'What does success actually look like — and what matters most?',
    description: 'A structured conversation to align vision, priorities, and outcomes — turning insight into direction.',
    accent: 'from-purple-500 to-pink-500',
    accentLight: 'bg-purple-500/10 border-purple-500/20',
    dot: 'bg-purple-500',
  },
  {
    icon: Puzzle,
    emoji: '🧩',
    label: 'System Blueprint™',
    phase: 'Phase 4',
    formerly: 'Scoping',
    question: 'How does this work — end to end?',
    description: 'We architect your app as a system — defining features, flows, logic, and integrations.',
    accent: 'from-pink-500 to-rose-500',
    accentLight: 'bg-pink-500/10 border-pink-500/20',
    dot: 'bg-pink-500',
  },
  {
    icon: FileText,
    emoji: '📐',
    label: 'Commercial Clarity™',
    phase: 'Phase 5',
    formerly: 'Proposal',
    question: 'What\'s the return — and how do we get there?',
    description: 'A clear, outcome-driven plan that aligns functionality with ROI, investment, and execution.',
    accent: 'from-orange-500 to-amber-500',
    accentLight: 'bg-orange-500/10 border-orange-500/20',
    dot: 'bg-orange-500',
  },
  {
    icon: Rocket,
    emoji: '🚀',
    label: 'Build & Activate™',
    phase: 'Phase 6',
    formerly: 'Build',
    question: 'Let\'s bring it to life.',
    description: 'We design, develop, and deploy your app — transforming strategy into a working growth engine.',
    accent: 'from-emerald-500 to-green-500',
    accentLight: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
];

interface ClarityEngineProps {
  onStart: () => void;
}

const ClarityEngineSection = ({ onStart }: ClarityEngineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const timelineHeight = useTransform(scrollYProgress, [0, 0.8], ['0%', '100%']);

  return (
    <section
      ref={containerRef}
      className="relative px-4 py-20 md:py-28 overflow-hidden"
      style={{ background: 'var(--gradient-hero)' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto mb-16 space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm"
          style={{ color: 'hsl(0 0% 80%)' }}
        >
          <span className="text-lg">⚡</span> The Clarity Engine™
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight"
          style={{ color: 'hsl(0 0% 95%)' }}
        >
          From fragmented ideas to{' '}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-vibrant)' }}>
            engineered growth systems
          </span>
        </h2>
        <p className="text-base md:text-lg leading-relaxed" style={{ color: 'hsl(220 20% 65%)' }}>
          A structured, conversational framework that transforms scattered business processes into a scalable, revenue-aligned app.
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="relative max-w-3xl mx-auto">
        {/* Vertical connector line */}
        <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-white/10 rounded-full">
          <motion.div
            className="w-full rounded-full"
            style={{
              height: timelineHeight,
              backgroundImage: 'var(--gradient-vibrant)',
            }}
          />
        </div>

        {/* Phase Cards */}
        <div className="space-y-8">
          {phases.map((phase, i) => {
            const Icon = phase.icon;
            return (
              <motion.div
                key={phase.label}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex gap-4 md:gap-6 pl-0"
              >
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0 mt-1">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${phase.accent} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                </div>

                {/* Card */}
                <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 md:p-6 space-y-3 hover:bg-white/[0.08] transition-colors group">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(220 20% 55%)' }}>
                      {phase.phase}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5" style={{ color: 'hsl(220 20% 55%)' }}>
                      formerly {phase.formerly}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-display font-bold" style={{ color: 'hsl(0 0% 95%)' }}>
                    {phase.emoji} {phase.label}
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed" style={{ color: 'hsl(220 20% 72%)' }}>
                    {phase.description}
                  </p>
                  <p className="text-sm italic font-medium group-hover:translate-x-1 transition-transform" style={{ color: 'hsl(260 60% 75%)' }}>
                    "{phase.question}"
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="text-center mt-16 space-y-4"
      >
        <Button
          onClick={onStart}
          size="lg"
          className="text-lg px-8 py-6 gap-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          style={{
            backgroundImage: 'var(--gradient-primary)',
            color: 'white',
            border: 'none',
          }}
        >
          <Sparkles className="w-5 h-5" />
          Start Your Signal Capture™
          <ArrowRight className="w-5 h-5" />
        </Button>
        <p className="text-sm" style={{ color: 'hsl(220 15% 50%)' }}>
          Free ROI assessment — takes 2 minutes
        </p>
      </motion.div>
    </section>
  );
};

export default ClarityEngineSection;
