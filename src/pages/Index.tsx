import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormData, initialFormData, calculateROI, ROIResults } from '@/lib/formTypes';
import StepIndicator from '@/components/StepIndicator';
import BusinessSnapshot from '@/components/steps/BusinessSnapshot';
import CustomerMetrics from '@/components/steps/CustomerMetrics';
import OperationalEfficiency from '@/components/steps/OperationalEfficiency';
import GrowthOpportunity from '@/components/steps/GrowthOpportunity';
import ROIDashboard from '@/components/ROIDashboard';
import WebsitePage from '@/components/WebsitePage';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import logo from '@/assets/logo-5to10x-color.webp';

const STEP_LABELS = ['Business', 'Metrics', 'Operations', 'Growth'];

const Index = () => {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [results, setResults] = useState<ROIResults | null>(null);

  const handleChange = (partial: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = () => {
    const roi = calculateROI(formData);
    setResults(roi);
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setResults(null);
    setStep(0);
    setStarted(false);
  };

  if (!started) {
    return <WebsitePage onStartAssessment={() => setStarted(true)} />;
  }

  const steps = [
    <BusinessSnapshot key="s1" data={formData} onChange={handleChange} />,
    <CustomerMetrics key="s2" data={formData} onChange={handleChange} />,
    <OperationalEfficiency key="s3" data={formData} onChange={handleChange} />,
    <GrowthOpportunity key="s4" data={formData} onChange={handleChange} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logo} alt="5to10X" className="h-16 w-auto" />
          <div>
            <h1 className="text-base font-display font-bold text-foreground">App ROI Calculator</h1>
            <p className="text-xs text-muted-foreground">See the real value before you build</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {results ? (
          <ROIDashboard results={results} formData={formData} onReset={handleReset} />
        ) : (
          <>
            <StepIndicator currentStep={step} totalSteps={4} labels={STEP_LABELS} />

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-border bg-card p-6 md:p-8"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>

              {step < 3 ? (
                <Button onClick={() => setStep((s) => s + 1)} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="gap-2">
                  Calculate ROI
                </Button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;