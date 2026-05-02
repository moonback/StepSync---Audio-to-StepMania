import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Cpu, Layers, Zap, Check, ChevronRight, Music, Activity, Monitor, ShieldCheck, Globe } from 'lucide-react';

interface LandingStepProps {
  onStart: () => void;
  onShowHelp: () => void;
}

export const LandingStep: React.FC<LandingStepProps> = ({ onStart, onShowHelp }) => {
  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-6xl mx-auto flex flex-col items-center text-center space-y-24 py-10 md:py-20"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="space-y-10 relative">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center space-y-6"
        >
          <div className="inline-flex items-center space-x-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/90 text-[10px] font-black uppercase tracking-[0.25em] backdrop-blur-md shadow-xl shadow-black/20">
            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
            <span>Édition Desktop Native</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>

          <h1 className="text-4xl sm:text-8xl font-black tracking-tight text-[var(--text-primary)] leading-[0.95] perspective-title">
            Générateur de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-500 drop-shadow-sm">
              StepCharts
            </span>
          </h1>

          <p className="text-sm sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto font-medium leading-relaxed px-4 opacity-80">
            Découvrez <span className="text-white font-bold">StepSync</span>, le générateur de StepCharts le plus avancé, capable de transformer vos fichiers audio en StepCharts parfaits pour StepMania, avec une précision chirurgicale.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full px-6 sm:px-0"
        >
          <button
            onClick={onStart}
            className="group relative w-full sm:w-auto px-12 py-5 bg-white text-black font-black rounded-full overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-center space-x-3 group-hover:text-white transition-colors duration-500">
              <span className="text-base">Démarrer le Pipeline</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={onShowHelp}
            className="w-full sm:w-auto px-12 py-5 bg-white/5 border border-white/10 text-white font-black rounded-full transition-all duration-300 hover:bg-white/10 hover:border-white/20 backdrop-blur-md"
          >
            Guide Technique
          </button>
        </motion.div>
      </div>

      {/* Trust & Stats Section */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-10">
          {[
            { label: "Moteur IA", value: "StepSync v2", icon: <Cpu className="w-4 h-4" /> },
            { label: "Précision BPM", value: "±0.01bpm", icon: <Activity className="w-4 h-4" /> },
            { label: "Analyse Locale", value: "100% Hors-ligne", icon: <ShieldCheck className="w-4 h-4" /> },
            { label: "Standard", value: "SM5 / DDR / ITG", icon: <Globe className="w-4 h-4" /> }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-xl group hover:border-white/20 transition-all duration-500"
            >
              <div className="flex items-center justify-center space-x-2 text-indigo-400 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">
                {stat.icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className="text-xl md:text-2xl font-black text-white">{stat.value}</div>
            </motion.div>
          ))}
        </div>
      </div>


    </motion.div>
  );
};
