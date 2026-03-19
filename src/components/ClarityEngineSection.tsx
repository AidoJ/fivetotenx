import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Compass, MessageCircle, Puzzle, CheckCircle, Wrench, FlaskConical, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const phases = [
  {
    icon: Compass,
    emoji: '🧭',
    label: 'Reality Check™',
    phase: 'Phase 1 — Assess',
    description: 'We take a proper look at how things are really running day-to-day.',
    bullets: ['Where time is being lost', 'What\'s manual or clunky', 'What\'s slowing your team down'],
    outcome: 'You get a clear picture of what\'s actually going on',
    accent: 'from-blue-500 to-indigo-500',
  },
  {
    icon: MessageCircle,
    emoji: '💬',
    label: 'Straight Talk™',
    phase: 'Phase 2 — Discuss',
    description: 'We have a focused conversation about what needs to change.',
    bullets: ['What\'s frustrating you most', 'What\'s costing time or money', 'What a better setup looks like'],
    outcome: 'We agree on what\'s worth fixing first',
    accent: 'from-violet-500 to-purple-500',
  },
  {
    icon: Puzzle,
    emoji: '🧩',
    label: 'Game Plan™',
    phase: 'Phase 3 — Plan',
    description: 'We map out a simple, practical solution.',
    bullets: ['What the app will do', 'How it fits into your workflow', 'What gets automated'],
    outcome: 'You see exactly how this will work in your business',
    accent: 'from-pink-500 to-rose-500',
  },
  {
    icon: CheckCircle,
    emoji: '✅',
    label: 'Green Light™',
    phase: 'Phase 4 — Sign Off',
    description: 'You review and approve everything before we build.',
    bullets: ['Clear scope', 'Clear cost', 'Clear outcome'],
    outcome: 'No surprises. Full confidence moving forward',
    accent: 'from-orange-500 to-amber-500',
  },
  {
    icon: Wrench,
    emoji: '🛠️',
    label: 'Build™',
    phase: 'Phase 5 — Build',
    description: 'We develop your system around your actual workflow.',
    bullets: ['Core features built', 'Integrations connected', 'Working version ready'],
    outcome: 'Your solution takes shape',
    accent: 'from-lime-500 to-emerald-500',
  },
  {
    icon: FlaskConical,
    emoji: '🧪',
    label: 'Test, Handover & Go Live™',
    phase: 'Phase 6 — Test • Train • Launch',
    description: 'We make sure everything works — and your team is ready to use it from day one.',
    bullets: ['Real-world testing', 'Final refinements', 'Team walkthroughs and training', 'System deployed into your live environment'],
    outcome: 'You\'re confident, your team is ready, and everything is running',
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
          <span className="text-lg">⚡</span> The 5to10x Clarity Path™
        </div>
        <h2
          className="text-2xl md:text-4xl lg:text-5xl font-display font-bold leading-tight"
          style={{ color: 'hsl(0 0% 95%)' }}
        >
          From messy workflows to{' '}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-vibrant)' }}>
            a system that just works
          </span>
        </h2>
        <p className="text-sm md:text-lg leading-relaxed" style={{ color: 'hsl(220 20% 65%)' }}>
          A simple, structured way to turn how your business runs today into a streamlined, automated system.
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
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(220 20% 55%)' }}>
                    {phase.phase}
                  </span>
                  <h3 className="text-base md:text-2xl font-display font-bold" style={{ color: 'hsl(0 0% 95%)' }}>
                    {phase.emoji} {phase.label}
                  </h3>
                  <p className="text-xs md:text-base leading-relaxed" style={{ color: 'hsl(220 20% 72%)' }}>
                    {phase.description}
                  </p>
                  <ul className="space-y-1 text-xs md:text-sm" style={{ color: 'hsl(220 20% 65%)' }}>
                    {phase.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs md:text-sm font-medium group-hover:translate-x-1 transition-transform" style={{ color: 'hsl(260 60% 75%)' }}>
                    → {phase.outcome}
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
          Start Your Reality Check™
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
