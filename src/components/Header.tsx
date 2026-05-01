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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <motion.button
            onClick={onReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-2 sm:space-x-3 group focus:outline-none"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative p-2 sm:p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-500">
                <Disc3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[var(--bg-card)] rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center space-x-1.5">
                <span className="text-base sm:text-xl font-black tracking-tighter text-[var(--text-primary)] leading-none">Step<span className="text-indigo-400">Sync</span></span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-black text-indigo-400 uppercase tracking-widest">Platinum</span>
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-indigo-400/80 uppercase tracking-[0.2em] mt-0.5">Packs StepMania</span>
            </div>
          </motion.button>

          {/* Step Navigation - Only visible after landing */}
          {currentStep > 0 && (
            <div className="flex items-center space-x-2 sm:space-x-4">
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
                        className={`flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition-all duration-500 border-2 ${isActive
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/40 scale-110 z-10'
                          : isCompleted
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
                            : 'bg-white/5 border-slate-700/30 text-slate-500 grayscale opacity-50'
                          }`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[3]" /> : step === 0 ? <Rocket className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> : step}
                      </button>
                      
                      {/* Tooltip Label */}
                      <div className={`absolute -bottom-5 hidden lg:block whitespace-nowrap text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${isActive ? 'text-indigo-400 opacity-100 translate-y-0' : 'text-slate-500 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-1'}`}>
                        {STEP_LABELS[step]}
                      </div>
                    </div>

                    {step < 4 && (
                      <div className="relative w-3 sm:w-10 h-1 mx-1 sm:mx-2 rounded-full bg-slate-700/20 overflow-hidden">
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
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setCurrentStep(currentStep)} // Just a placeholder for now or remove if not needed
              className="hidden lg:flex flex-col items-end mr-4"
            >
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Statut</span>
              <span className="text-[10px] font-bold text-white flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Opérationnel
              </span>
            </button>
            <button 
              onClick={onShowHelp}
              className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="Aide & Documentation"
            >
              <HelpCircle className="w-5 h-5" />
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
