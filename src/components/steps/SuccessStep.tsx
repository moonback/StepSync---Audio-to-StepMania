import React from 'react';
import { motion } from 'motion/react';
import { Check, Download, Music } from 'lucide-react';
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
  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      className="max-w-2xl mx-auto w-full text-center"
    >
      <div className="p-6 sm:p-16 rounded-[1.5rem] sm:rounded-[3rem] glass-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-indigo-500/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-6 sm:mb-10">
            <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-30 animate-pulse" />
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40">
              <Check className="w-8 h-8 sm:w-12 sm:h-12 stroke-[3]" />
            </div>
          </div>

          <h2 className="text-xl sm:text-4xl font-black text-[var(--text-primary)] mb-2 sm:mb-4 tracking-tight">Pack Généré !</h2>
          <p className="text-xs sm:text-lg text-[var(--text-muted)] mb-6 sm:mb-8 font-medium max-w-sm">
            Votre pack StepMania est prêt. Les fichiers ont été optimisés et assemblés.
          </p>

          <div className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-8 sm:mb-12 w-full max-w-md mx-auto text-left space-y-3 sm:space-y-4 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">Chansons incluses</span>
              <span className="text-xs sm:text-sm font-black text-indigo-400">{songs.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-[var(--text-muted)]">Modes générés</span>
              <div className="flex gap-1.5 sm:gap-2">
                {gameModes.map(mode => (
                  <span key={mode} className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] sm:text-[10px] font-bold rounded">
                    {mode === 'dance-single' ? 'Dance' : mode === 'dance-double' ? 'Double' : mode === 'pump-single' ? 'Pump' : 'P.Double'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <button
              onClick={onReset}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center space-x-2"
            >
              <Music className="w-5 h-5" />
              <span>Nouveau pack</span>
            </button>
            <button
              onClick={onDownload}
              className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all flex items-center justify-center space-x-3"
            >
              <Download className="w-5 h-5" />
              <span>Télécharger le Pack</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
