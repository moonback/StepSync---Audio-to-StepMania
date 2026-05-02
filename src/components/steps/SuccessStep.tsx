import React from 'react';
import { motion } from 'motion/react';
import { Check, Download, Music, Rocket, Star, Trophy } from 'lucide-react';
import { SongItem } from '../../lib/types';

interface SuccessStepProps {
  songs: SongItem[];
  gameModes: string[];
  onDownload: () => void;
  onReset: () => void;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({
  songs,
  gameModes,
  onDownload,
  onReset
}) => {
  const ARROWS = ['←', '↓', '↑', '→'];
  const COLORS = ['#e83f9a', '#3fd4e8', '#27e86b', '#f5e542'];

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="max-w-3xl mx-auto w-full text-center"
    >
      <div className="sm-panel sm-scanlines rounded-[2.5rem] p-8 sm:p-16 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 sm-beat-grid opacity-30 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#00f5ff]/10 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#ff2edb]/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 flex flex-col items-center">
          {/* Main Success Icon */}
          <div className="relative mb-8">
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="relative w-24 h-24 sm:w-32 sm:h-32 bg-black border-4 border-[#39ff14] rounded-full flex items-center justify-center text-[#39ff14] shadow-[0_0_50px_rgba(57,255,20,0.4)]"
            >
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16" />
              {/* Spinning border or something */}
              <div className="absolute inset-0 border-t-4 border-transparent border-r-4 border-r-[#39ff14]/30 rounded-full animate-spin" />
            </motion.div>
            
            {/* Floatings stars */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0], y: [-20, -60], x: [0, (i - 1) * 30] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                className="absolute top-0 text-[#f5e542]"
              >
                <Star className="w-6 h-6 fill-current" />
              </motion.div>
            ))}
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white mb-2 tracking-tighter uppercase sm-glow-cyan">Course Complete!</h2>
          <p className="text-[10px] sm:text-xs font-black text-[#00f5ff]/60 uppercase tracking-[0.4em] mb-10">
            Pack de StepCharts prêt pour l'arcade
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-12">
            {/* Stats Card 1 */}
            <div className="bg-black/50 border border-white/10 rounded-2xl p-5 flex flex-col items-center">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Pistes</span>
              <div className="flex items-center space-x-2">
                <Music className="w-4 h-4 text-[#e83f9a]" />
                <span className="text-2xl font-black text-white tabular-nums sm-glow-pink" style={{ fontFamily: 'Outfit, monospace' }}>
                  {String(songs.length).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Stats Card 2 */}
            <div className="bg-black/50 border border-white/10 rounded-2xl p-5 flex flex-col items-center">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Modes de Jeu</span>
              <div className="flex gap-1.5 mt-1">
                {gameModes.map((mode, i) => (
                  <span key={mode} className="px-2 py-0.5 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] text-[8px] font-black rounded uppercase tracking-tighter shadow-[0_0_8px_rgba(0,245,255,0.2)]">
                    {mode === 'dance-single' ? 'DANCE' : mode === 'dance-double' ? 'DOUBLE' : mode === 'pump-single' ? 'PUMP' : 'P.DBL'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <button
              onClick={onReset}
              className="w-full sm:w-auto px-10 py-4 bg-black/40 border border-white/10 text-white font-black rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center space-x-3 uppercase tracking-widest text-[10px] group"
            >
              <Rocket className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Nouveau Pack</span>
            </button>
            <button
              onClick={onDownload}
              className="w-full sm:w-auto px-12 py-4 bg-[#39ff14] text-black font-black rounded-2xl shadow-[0_0_30px_rgba(57,255,20,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-3 uppercase tracking-widest text-[10px]"
            >
              <Download className="w-5 h-5 animate-bounce" />
              <span>Télécharger .ZIP</span>
            </button>
          </div>

          {/* Footer Arrows Decoration */}
          <div className="flex space-x-6 mt-16 opacity-30">
            {ARROWS.map((a, i) => (
              <span key={i} className="sm-arrow text-2xl" style={{ color: COLORS[i], animationDelay: `${i * 0.2}s` }}>{a}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
