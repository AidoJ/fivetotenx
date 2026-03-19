import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Compass, MessageCircle, Puzzle, CheckCircle, Wrench, FlaskConical, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* Logo-extracted colors for each phase */
const PHASE_COLORS = {
  blue: '#1789CE',
  deepBlue: '#2258B4',
  purple: '#643AA4',
  gold: '#D88E08',
  lime: '#73AD12',
  green: '#398C08',
};

const phases = [
  {
    icon: Compass,
    emoji: '🧭',
    label: 'Reality Check™',
    phase: 'Phase 1 — Assess',
    description: 'We take a proper look at how things are really running day-to-day.',
    bullets: ['Where time is being lost', 'What\'s manual or clunky', 'What\'s slowing your team down'],
    outcome: 'You get a clear picture of what\'s actually going on',
    color: PHASE_COLORS.blue,
  },
  {
    icon: MessageCircle,
    emoji: '💬',
    label: 'Straight Talk™',
    phase: 'Phase 2 — Discuss',
    description: 'We have a focused conversation about what needs to change.',
    bullets: ['What\'s frustrating you most', 'What\'s costing time or money', 'What a better setup looks like'],
    outcome: 'We agree on what\'s worth fixing first',
    color: PHASE_COLORS.deepBlue,
  },
  {
    icon: Puzzle,
    emoji: '🧩',
    label: 'Game Plan™',
    phase: 'Phase 3 — Plan',
    description: 'We map out a simple, practical solution.',
    bullets: ['What the app will do', 'How it fits into your workflow', 'What gets automated'],
    outcome: 'You see exactly how this will work in your business',
    color: PHASE_COLORS.purple,
  },
  {
    icon: CheckCircle,
    emoji: '✅',
    label: 'Green Light™',
    phase: 'Phase 4 — Sign Off',
    description: 'You review and approve everything before we build.',
    bullets: ['Clear scope', 'Clear cost', 'Clear outcome'],
    outcome: 'No surprises. Full confidence moving forward',
    color: PHASE_COLORS.gold,
  },
  {
    icon: Wrench,
    emoji: '🛠️',
    label: 'Build™',
    phase: 'Phase 5 — Build',
    description: 'We develop your system around your actual workflow.',
    bullets: ['Core features built', 'Integrations connected', 'Working version ready'],
    outcome: 'Your solution takes shape',
    color: PHASE_COLORS.lime,
  },
  {
    icon: FlaskConical,
    emoji: '🧪',
    label: 'Test, Handover & Go Live™',
    phase: 'Phase 6 — Test • Train • Launch',
    description: 'We make sure everything works — and your team is ready to use it from day one.',
    bullets: ['Real-world testing', 'Final refinements', 'Team walkthroughs and training', 'System deployed into your live environment'],
    outcome: 'You\'re confident, your team is ready, and everything is running',
    color: PHASE_COLORS.green,
  },
];

interface ClarityEngineProps {
  onStart: () => void;
}

/* Animated phase card */
const PhaseCard = ({ phase, index }: { phase: typeof phases[0]; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const Icon = phase.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -40, scale: 0.95 }}
      animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative flex gap-3 md:gap-6 pl-0"
    >
      {/* Timeline icon with pulse */}
      <div className="relative z-10 flex-shrink-0 mt-1">
        <motion.div
          className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center"
          style={{
            background: phase.color,
            boxShadow: `0 0 20px ${phase.color}44`,
          }}
          animate={isInView ? {
            boxShadow: [
              `0 0 20px ${phase.color}44`,
              `0 0 35px ${phase.color}66`,
              `0 0 20px ${phase.color}44`,
            ],
          } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
        </motion.div>
      </div>

      {/* Card with hover lift */}
      <motion.div
        className="flex-1 rounded-xl md:rounded-2xl p-4 md:p-6 space-y-2 md:space-y-3 transition-all group cursor-default"
        style={{
          border: `1px solid ${phase.color}22`,
          background: 'hsl(0 0% 100% / 0.05)',
          backdropFilter: 'blur(8px)',
        }}
        whileHover={{
          y: -4,
          borderColor: `${phase.color}55`,
          boxShadow: `0 8px 30px ${phase.color}22`,
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: phase.color }}
          initial={{ opacity: 0, x: -10 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: index * 0.12 + 0.2 }}
        >
          {phase.phase}
        </motion.span>
        <h3 className="text-base md:text-2xl font-display font-bold" style={{ color: 'hsl(0 0% 95%)' }}>
          {phase.emoji} {phase.label}
        </h3>
        <p className="text-xs md:text-base leading-relaxed" style={{ color: 'hsl(220 20% 72%)' }}>
          {phase.description}
        </p>
        <ul className="space-y-1 text-xs md:text-sm" style={{ color: 'hsl(220 20% 65%)' }}>
          {phase.bullets.map((b, j) => (
            <motion.li
              key={j}
              className="flex items-start gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: index * 0.12 + 0.3 + j * 0.06 }}
            >
              <span className="mt-0.5" style={{ color: phase.color }}>•</span>
              <span>{b}</span>
            </motion.li>
          ))}
        </ul>
        <motion.p
          className="text-xs md:text-sm font-medium"
          style={{ color: phase.color }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: index * 0.12 + 0.5 }}
        >
          → {phase.outcome}
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

const ClarityEngineSection = ({ onStart }: ClarityEngineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-50px' });
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const timelineHeight = useTransform(scrollYProgress, [0, 0.8], ['0%', '100%']);

  return (
    <section
      ref={containerRef}
      className="relative px-4 py-16 md:py-28 overflow-hidden"
      style={{ background: '#010100' }}
    >
      {/* Header — BIG */}
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 50 }}
        animate={headerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center max-w-4xl mx-auto mb-16 md:mb-24 space-y-6 px-2"
      >
        <motion.div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border text-sm"
          style={{
            borderColor: `${PHASE_COLORS.blue}33`,
            background: `${PHASE_COLORS.blue}11`,
            color: PHASE_COLORS.blue,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={headerInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          <span className="text-lg">⚡</span> How We Work
        </motion.div>

        <motion.h2
          className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight"
          style={{ color: 'hsl(0 0% 95%)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          The 5to10x{' '}
          <motion.span
            style={{ color: PHASE_COLORS.blue }}
            animate={headerInView ? {
              color: [PHASE_COLORS.blue, PHASE_COLORS.deepBlue, PHASE_COLORS.purple, PHASE_COLORS.gold, PHASE_COLORS.green, PHASE_COLORS.blue],
            } : {}}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            Clarity Path™
          </motion.span>
        </motion.h2>

        <motion.p
          className="text-lg md:text-2xl leading-relaxed max-w-2xl mx-auto"
          style={{ color: 'hsl(220 20% 65%)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
        >
          From messy workflows to a system that just works
        </motion.p>

        <motion.p
          className="text-sm md:text-base leading-relaxed max-w-xl mx-auto"
          style={{ color: 'hsl(220 20% 50%)' }}
          initial={{ opacity: 0 }}
          animate={headerInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7 }}
        >
          A simple, structured way to turn how your business runs today into a streamlined, automated system.
        </motion.p>
      </motion.div>

      {/* Timeline */}
      <div className="relative max-w-3xl mx-auto">
        {/* Vertical connector line — color transitions blue→green */}
        <div
          className="absolute left-5 md:left-8 top-0 bottom-0 w-0.5 rounded-full"
          style={{ background: 'hsl(0 0% 100% / 0.08)' }}
        >
          <motion.div
            className="w-full rounded-full"
            style={{
              height: timelineHeight,
              background: `linear-gradient(to bottom, ${PHASE_COLORS.blue}, ${PHASE_COLORS.deepBlue}, ${PHASE_COLORS.purple}, ${PHASE_COLORS.gold}, ${PHASE_COLORS.lime}, ${PHASE_COLORS.green})`,
            }}
          />
        </div>

        {/* Phase Cards */}
        <div className="space-y-4 md:space-y-8">
          {phases.map((phase, i) => (
            <PhaseCard key={phase.label} phase={phase} index={i} />
          ))}
        </div>
      </div>

      {/* CTA — Green (end of spectrum) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-center mt-16 md:mt-24 space-y-4"
      >
        <Button
          onClick={onStart}
          size="lg"
          className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 gap-3 rounded-xl font-semibold transition-all hover:scale-105"
          style={{
            background: PHASE_COLORS.green,
            color: 'white',
            border: 'none',
            boxShadow: `0 0 30px ${PHASE_COLORS.green}33`,
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
