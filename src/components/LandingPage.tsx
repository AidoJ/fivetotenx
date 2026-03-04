import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo-5to10x.png';

interface Props {
  onStart: () => void;
}

const features = [
  {
    icon: Zap,
    title: 'Automate & Save',
    description: 'Cut manual admin hours by up to 40% with smart automation that runs while you sleep.',
  },
  {
    icon: TrendingUp,
    title: 'Grow Revenue',
    description: 'Boost conversions, recover no-shows, and unlock upsell opportunities you didn\'t know existed.',
  },
  {
    icon: BarChart3,
    title: 'Measure Real ROI',
    description: 'See exactly what a custom app is worth to your business — in pounds, not promises.',
  },
];

const LandingPage = ({ onStart }: Props) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section
        className="relative flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 overflow-hidden"
        style={{ background: '#0E0B1F' }}
      >

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-3xl mx-auto space-y-8"
        >
          <motion.img
            src={logo}
            alt="5to10X — Build • Innovate • Scale"
            className="h-72 md:h-96 w-auto mx-auto drop-shadow-2xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          <div className="space-y-4">
            <motion.h1
              className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight"
              style={{ color: 'hsl(0 0% 95%)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              The businesses winning today{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'var(--gradient-vibrant)', backgroundSize: '200% auto' }}
              >
                aren't waiting.
              </span>
            </motion.h1>

            <motion.p
              className="text-base md:text-xl max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'hsl(220 20% 72%)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              AI-powered apps are transforming how small and medium businesses operate —
              cutting costs, delighting customers, and unlocking growth that was never possible before.
              <strong style={{ color: 'hsl(0 0% 88%)' }}> The question isn't if, it's how much you're leaving on the table.</strong>
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
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
              Let's Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-sm" style={{ color: 'hsl(220 15% 55%)' }}>
              Free ROI assessment — takes 2 minutes
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="bg-background px-4 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
              Discover what a custom app could do for{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
                your business
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              In just 2 minutes, our ROI calculator gives you a clear, data-driven picture of
              the impact — no jargon, no obligations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="rounded-2xl border border-border bg-card p-6 space-y-3 hover:shadow-lg transition-shadow"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundImage: 'var(--gradient-primary)' }}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button
              onClick={onStart}
              size="lg"
              className="gap-2 rounded-xl font-semibold"
            >
              Calculate My ROI <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} 5to10X — Build • Innovate • Scale
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
