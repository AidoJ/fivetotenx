import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Radar, MessageCircle, Puzzle, FileText, Rocket, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const phases = [
  {
    icon: Radar,
    emoji: '🧭',
    label: 'Signal Capture™',
    phase: 'Phase 1 — Assess',
    formerly: 'Assessment',
    question: 'What\'s really going on beneath the surface?',
    description: 'We capture the signal in the noise — a comprehensive snapshot of your business, challenges, goals, and untapped opportunities.',
    accent: 'from-blue-500 to-indigo-500',
  },
  {
    icon: MessageCircle,
    emoji: '💬',
    label: 'Alignment Dialogue™',
    phase: 'Phase 2 — Discuss',
    formerly: 'Discovery Call',
    question: 'What does success actually look like — and what matters most?',
    description: 'A structured conversation to align vision, priorities, and outcomes — turning insight into direction.',
    accent: 'from-violet-500 to-purple-500',
  },
  {
    icon: Puzzle,
    emoji: '🧩',
    label: 'System Blueprint™',
    phase: 'Phase 3 — Plan',
    formerly: 'Scoping',
    question: 'How does this work — end to end?',
    description: 'We architect your app as a system — defining features, flows, logic, and integrations.',
    accent: 'from-pink-500 to-rose-500',
  },
  {
    icon: FileText,
    emoji: '📐',
    label: 'Commercial Clarity™',
    phase: 'Phase 4 — Sign Off',
    formerly: 'Proposal',
    question: 'What\'s the return — and how do we get there?',
    description: 'A clear, outcome-driven plan that aligns functionality with ROI, investment, and execution.',
    accent: 'from-orange-500 to-amber-500',
  },
  {
    icon: Rocket,
    emoji: '🚀',
    label: 'Build & Activate™',
    phase: 'Phase 5 — Build',
    formerly: 'Build',
    question: 'Let\'s bring it to life.',
    description: 'We design, develop, and deploy your app — transforming strategy into a working growth engine.',
    accent: 'from-emerald-500 to-green-500',
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
      className="relative px-4 py-16 md:py-28 overflow-hidden"
      style={{ background: 'var(--gradient-hero)' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto mb-12 md:mb-16 space-y-4 px-2"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm"
          style={{ borderColor: 'hsl(0 0% 100% / 0.1)', background: 'hsl(0 0% 100% / 0.05)', color: 'hsl(0 0% 80%)' }}
        >
          <span className="text-lg">⚡</span> The Clarity Engine™
        </div>
        <h2
          className="text-2xl md:text-4xl lg:text-5xl font-display font-bold leading-tight"
          style={{ color: 'hsl(0 0% 95%)' }}
        >
          From fragmented ideas to{' '}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-vibrant)' }}>
            engineered growth systems
          </span>
        </h2>
        <p className="text-sm md:text-lg leading-relaxed" style={{ color: 'hsl(220 20% 65%)' }}>
          Assess → Discuss → Plan → Sign Off → Build. A streamlined framework that transforms scattered business processes into a scalable, revenue-aligned app.
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="relative max-w-3xl mx-auto">
        {/* Vertical connector line */}
        <div
          className="absolute left-5 md:left-8 top-0 bottom-0 w-0.5 rounded-full"
          style={{ background: 'hsl(0 0% 100% / 0.1)' }}
        >
          <motion.div
            className="w-full rounded-full"
            style={{
              height: timelineHeight,
              backgroundImage: 'var(--gradient-vibrant)',
            }}
          />
        </div>

        {/* Phase Cards */}
        <div className="space-y-4 md:space-y-8">
          {phases.map((phase, i) => {
            const Icon = phase.icon;
            return (
              <motion.div
                key={phase.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative flex gap-3 md:gap-6 pl-0"
              >
                {/* Timeline icon */}
                <div className="relative z-10 flex-shrink-0 mt-1">
                  <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br ${phase.accent} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                </div>

                {/* Card */}
                <div
                  className="flex-1 rounded-xl md:rounded-2xl p-4 md:p-6 space-y-2 md:space-y-3 transition-colors group"
                  style={{
                    border: '1px solid hsl(0 0% 100% / 0.1)',
                    background: 'hsl(0 0% 100% / 0.05)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(220 20% 55%)' }}>
                      {phase.phase}
                    </span>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full"
                      style={{ border: '1px solid hsl(0 0% 100% / 0.1)', background: 'hsl(0 0% 100% / 0.05)', color: 'hsl(220 20% 55%)' }}
                    >
                      formerly {phase.formerly}
                    </span>
                  </div>
                  <h3 className="text-base md:text-2xl font-display font-bold" style={{ color: 'hsl(0 0% 95%)' }}>
                    {phase.emoji} {phase.label}
                  </h3>
                  <p className="text-xs md:text-base leading-relaxed" style={{ color: 'hsl(220 20% 72%)' }}>
                    {phase.description}
                  </p>
                  <p className="text-xs md:text-sm italic font-medium group-hover:translate-x-1 transition-transform" style={{ color: 'hsl(260 60% 75%)' }}>
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
        className="text-center mt-12 md:mt-16 space-y-4"
      >
        <Button
          onClick={onStart}
          size="lg"
          className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 gap-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
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
