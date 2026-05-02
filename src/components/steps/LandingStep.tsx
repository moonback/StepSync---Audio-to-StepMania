import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Play, Info, Disc, Zap, Music2, Cpu } from 'lucide-react';

interface LandingStepProps {
  onStart: () => void;
  onShowHelp: () => void;
}

export const LandingStep: React.FC<LandingStepProps> = ({ onStart, onShowHelp }) => {
  const ARROWS = ['←', '↓', '↑', '→'];
  const COLORS = ['#e83f9a', '#3fd4e8', '#27e86b', '#f5e542'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
      className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-4xl px-4"
    >
      <div className="relative sm-panel sm-scanlines rounded-[3rem] p-12 sm:p-20 w-full overflow-hidden text-center">
        {/* Animated Background */}
        <div className="absolute inset-0 sm-beat-grid opacity-20 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent animate-pulse" />
        
        {/* Logo Section */}
        <div className="relative z-10 mb-12 flex flex-col items-center">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex space-x-2 mb-6"
          >
            {ARROWS.map((a, i) => (
              <span key={i} className="sm-arrow text-3xl sm:text-4xl" style={{ color: COLORS[i], animationDelay: `${i * 0.1}s` }}>{a}</span>
            ))}
          </motion.div>
          
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-white mb-2 uppercase sm-glow-cyan">
            Step<span className="sm-glow-pink" style={{ color: '#ff2edb' }}>Sync</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-black text-[#00f5ff]/60 uppercase tracking-[0.5em] mb-10">
            Audio-to-StepMania Engine v2.0
          </p>
        </div>

        {/* Features Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 relative z-10">
          {[
            { icon: <Music2 className="w-5 h-5 text-[#e83f9a]" />, title: 'ANALYSE DSP', desc: 'Détection de BPM chirurgicale' },
            { icon: <Cpu className="w-5 h-5 text-[#27e86b]" />, title: 'AI CHOREO', desc: 'Génération de patterns pro' },
            { icon: <Disc className="w-5 h-5 text-[#f5e542]" />, title: 'PACK ZIP', desc: 'Exportation prête à jouer' }
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col items-center"
            >
              <div className="mb-3">{feat.icon}</div>
              <h3 className="text-[9px] font-black text-white uppercase tracking-widest mb-1">{feat.title}</h3>
              <p className="text-[8px] text-slate-500 font-bold uppercase">{feat.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
          <button
            onClick={onStart}
            className="group relative px-12 py-5 bg-[#00f5ff] text-black font-black rounded-2xl shadow-[0_0_40px_rgba(0,245,255,0.3)] hover:scale-110 active:scale-95 transition-all flex items-center space-x-3 uppercase tracking-widest text-xs overflow-hidden"
          >
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Play className="w-5 h-5 fill-current" />
            <span className="relative z-10 sm-blink">Insert Coin / Start</span>
          </button>
          
          <button
            onClick={onShowHelp}
            className="flex items-center space-x-2 text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>Comment ça marche ?</span>
          </button>
        </div>

        {/* Arcade Cabinet Footer Decoration */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-12 opacity-10">
          <Zap className="w-6 h-6 text-[#00f5ff]" />
          <Zap className="w-6 h-6 text-[#ff2edb]" />
          <Zap className="w-6 h-6 text-[#27e86b]" />
          <Zap className="w-6 h-6 text-[#f5e542]" />
        </div>
      </div>
    </motion.div>
  );
};
