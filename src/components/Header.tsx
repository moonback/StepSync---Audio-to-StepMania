import React from 'react';
import { motion } from 'motion/react';
import { Check, Rocket, HelpCircle, Zap } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onReset: () => void;
  onShowHelp: () => void;
  hasSongs: boolean;
}

const STEP_LABELS = ['HOME', 'IMPORT', 'CONFIG', 'ASSETS', 'READY'];
const COLORS = ['#e83f9a', '#3fd4e8', '#27e86b', '#f5e542', '#00f5ff'];

export const Header: React.FC<HeaderProps> = ({ currentStep, setCurrentStep, onReset, onShowHelp, hasSongs }) => {
  return (
    <header className="sticky top-0 z-50 sm-panel sm-scanlines border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <motion.button
            onClick={onReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 group"
          >
            <div className="relative">
              <div className="p-2 sm:p-2 bg-black border border-[#00f5ff]/30 rounded-lg shadow-[0_0_15px_rgba(0,245,255,0.2)] group-hover:border-[#00f5ff] transition-all">
                <Zap className="w-5 h-5 text-[#00f5ff] sm-glow-cyan" />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white leading-none">
                Step<span className="text-[#ff2edb] sm-glow-pink">Sync</span>
              </h1>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="text-[7px] font-black text-[#00f5ff]/60 uppercase tracking-[0.3em]">PRO ARCADE</span>
                <div className="w-1 h-1 rounded-full bg-[#39ff14] animate-pulse" />
              </div>
            </div>
          </motion.button>

          {/* Step Navigation */}
          {currentStep >= 0 && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              {[0, 1, 2, 3, 4].map((step) => {
                const isActive = currentStep === step;
                const isCompleted = currentStep > step;
                const canClick = step === 0 || step === 1 || hasSongs;
                const color = COLORS[step % COLORS.length];

                return (
                  <div key={step} className="flex items-center">
                    <div className="relative group">
                      <button
                        onClick={() => canClick && setCurrentStep(step)}
                        disabled={!canClick}
                        className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-[10px] font-black transition-all duration-300 border ${isActive
                          ? `bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110 z-10`
                          : isCompleted
                            ? `bg-black/40 border-[${color}]/40 text-[${color}] opacity-80`
                            : `bg-black/20 border-white/5 text-white/20 grayscale opacity-40`
                          }`}
                        style={isCompleted ? { color: color, borderColor: `${color}66` } : {}}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step === 0 ? <Rocket className="w-4 h-4" /> : step + 1}
                      </button>
                      
                      {/* Label */}
                      <div className={`absolute -bottom-5 left-1/2 -translate-x-1/2 hidden lg:block whitespace-nowrap text-[7px] font-black uppercase tracking-widest transition-all ${isActive ? 'text-white opacity-100' : 'text-white/20 opacity-0 group-hover:opacity-100'}`}>
                        {STEP_LABELS[step]}
                      </div>
                    </div>

                    {step < 4 && (
                      <div className="mx-1 sm:mx-1.5 w-2 sm:w-4 h-px bg-white/10" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Help Action */}
          <button 
            onClick={onShowHelp}
            className="p-2 sm:p-2.5 rounded-lg border border-white/10 text-slate-500 hover:text-[#00f5ff] hover:border-[#00f5ff]/30 hover:bg-[#00f5ff]/5 transition-all"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Visual Ticker line */}
      <div className="h-0.5 w-full bg-white/5 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-[#ff2edb] via-[#00f5ff] to-[#39ff14]"
          animate={{ width: `${((currentStep + 1) / 5) * 100}%` }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          style={{ boxShadow: '0 0 10px rgba(0,245,255,0.5)' }}
        />
      </div>
    </header>
  );
};
