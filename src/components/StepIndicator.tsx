import { motion } from 'framer-motion';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const StepIndicator = ({ currentStep, totalSteps, labels }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-between w-full mb-10">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                i < currentStep
                  ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_12px_hsl(260_65%_52%/0.35)]'
                  : i === currentStep
                  ? 'border-primary text-primary bg-primary/15'
                  : 'border-border text-muted-foreground bg-secondary'
              }`}
              animate={i === currentStep ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              {i < currentStep ? '✓' : i + 1}
            </motion.div>
            <span className={`text-xs font-medium hidden sm:block ${
              i <= currentStep ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {labels[i]}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div className="flex-1 mx-3 h-0.5 mt-[-1.5rem]">
              <div className={`h-full rounded-full transition-colors ${
                i < currentStep ? 'bg-primary' : 'bg-border'
              }`} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
