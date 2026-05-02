import React from 'react';
import { motion } from 'motion/react';
import { Disc3, Check, Rocket, HelpCircle } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onReset: () => void;
  onShowHelp: () => void;
  hasSongs: boolean;
}

const STEP_LABELS = ['Accueil', 'Import', 'Config', 'IA', 'Export'];

export const Header: React.FC<HeaderProps> = ({ currentStep, setCurrentStep, onReset, onShowHelp, hasSongs }) => {
  return (
    <header className="sticky top-0 z-50 glass-header border-b border-white/5 shadow-2xl shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 sm:py-2">
        <div className="flex items-center justify-between">
          <motion.button
            onClick={onReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-2 group focus:outline-none"
          >
            <div className="relative">
              <div className="relative p-1.5 sm:p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-500">
                <Disc3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm sm:text-lg font-black tracking-tighter text-[var(--text-primary)] leading-none">Step<span className="text-indigo-400">Sync</span></span>
              <span className="text-[7px] sm:text-[9px] font-bold text-indigo-400/80 uppercase tracking-[0.2em] mt-0.5">Packs StepMania</span>
            </div>
          </motion.button>

          {/* Step Navigation - Only visible after landing */}
          {currentStep > 0 && (
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              {[0, 1, 2, 3, 4].map((step) => {
                const isActive = currentStep === step;
                const isCompleted = currentStep > step;
                const canClick = step === 0 || step === 1 || hasSongs;

                return (
                  <div key={step} className="flex items-center">
                    <div className="flex flex-col items-center group relative">
                      <button
                        onClick={() => canClick && setCurrentStep(step)}
                        disabled={!canClick}
                        className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold transition-all duration-500 border-2 ${isActive
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/40 scale-105 z-10'
                          : isCompleted
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
                            : 'bg-white/5 border-slate-700/30 text-slate-500 grayscale opacity-50'
                          }`}
                      >
                        {isCompleted ? <Check className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" /> : step === 0 ? <Rocket className="w-3 h-3 sm:w-4 sm:h-4" /> : step}
                      </button>
                    </div>

                    {step < 4 && (
                      <div className="relative w-2 sm:w-6 h-0.5 mx-0.5 sm:mx-1.5 rounded-full bg-slate-700/20 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: isCompleted ? '100%' : '0%' }}
                          className="absolute inset-0 bg-indigo-500/50"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onShowHelp}
              className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="Aide & Documentation"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Progress Line at bottom */}
      <div className="h-0.5 w-full bg-slate-800/20 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          animate={{ width: `${(currentStep / 4) * 100}%` }}
          transition={{ type: "spring", damping: 20 }}
        />
      </div>
    </header>
  );
};
