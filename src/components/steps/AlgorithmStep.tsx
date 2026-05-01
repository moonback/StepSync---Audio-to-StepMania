import React from 'react';
import { motion } from 'motion/react';
import { Zap, Activity, HelpCircle, Check, RefreshCw } from 'lucide-react';
import { SongItem } from '../../lib/types';

interface AlgorithmStepProps {
  songs: SongItem[];
  onsetThreshold: number;
  setOnsetThreshold: (val: number) => void;
  mineProbability: number;
  setMineProbability: (val: number) => void;
  trimSilence: boolean;
  setTrimSilence: (val: boolean) => void;
  isTuned: boolean;
  isProcessing: boolean;
  onAutoTune: () => void;
}

export const AlgorithmStep: React.FC<AlgorithmStepProps> = ({
  songs,
  onsetThreshold,
  setOnsetThreshold,
  mineProbability,
  setMineProbability,
  trimSilence,
  setTrimSilence,
  isTuned,
  isProcessing,
  onAutoTune
}) => {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, rotateX: 15, z: -100, y: 50 }}
      animate={{ opacity: 1, rotateX: 0, z: 0, y: 0 }}
      exit={{ opacity: 0, rotateX: -15, z: -100, y: -50 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="w-full max-w-4xl"
    >
      <div className="p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] glass-card tilt-card">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-10">
          <div className="p-2.5 sm:p-3 bg-purple-500/10 rounded-xl sm:rounded-2xl text-purple-400">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">Algorithmes Avancés</h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">Ajustez la sensibilité de détection.</p>
          </div>
        </div>

        {songs.length > 1 && (
          <div className="flex items-start space-x-2 mb-8 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <Activity className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-300 leading-relaxed font-medium">
              <strong className="block text-indigo-400 text-sm mb-1">Optimisation Magique Auto (Pack Multiple)</strong>
              Pour garantir la meilleure qualité, les réglages manuels sont désactivés. Lors de l'export, notre algorithme analysera individuellement chaque musique et appliquera l'optimisation la plus adaptée à son profil énergétique et son BPM.
            </p>
          </div>
        )}

        <div className="flex justify-center items-center">
          <div className="space-y-8">
            <div className="space-y-6 p-6 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-default)] hover:border-indigo-500/20 transition-all group">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-black uppercase tracking-widest text-indigo-400">Seuil d'Énergie</label>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
                <span className="text-sm font-black text-[var(--text-primary)] font-mono">{onsetThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.05" max="0.5" step="0.01"
                value={onsetThreshold}
                onChange={(e) => setOnsetThreshold(parseFloat(e.target.value))}
                disabled={songs.length > 1}
                className="w-full accent-indigo-500 no-transition h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="pt-4 border-t border-[var(--border-default)] space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400 opacity-70">Valeurs recommandées :</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[10px] text-[var(--text-dim)]">Pop/EDM: <span className="text-[var(--text-secondary)] font-mono">0.15-0.20</span></div>
                  <div className="text-[10px] text-[var(--text-dim)]">Calme: <span className="text-[var(--text-secondary)] font-mono">0.08-0.12</span></div>
                  <div className="text-[10px] text-[var(--text-dim)] text-indigo-400/60">Hardcore: <span className="text-[var(--text-secondary)] font-mono">0.25-0.35</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-default)] hover:border-red-500/20 transition-all group">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-black uppercase tracking-widest text-red-400">Densité de Mines</label>
                  <Zap className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400 transition-colors" />
                </div>
                <span className="text-sm font-black text-[var(--text-primary)] font-mono">{Math.round(mineProbability * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="0.3" step="0.01"
                value={mineProbability}
                onChange={(e) => setMineProbability(parseFloat(e.target.value))}
                disabled={songs.length > 1}
                className="w-full accent-red-500 no-transition h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="pt-4 border-t border-[var(--border-default)] space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-400 opacity-70">Niveaux de difficulté :</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[10px] text-[var(--text-dim)]"><span className="text-[var(--text-secondary)] font-mono">0%</span>: None</div>
                  <div className="text-[10px] text-[var(--text-dim)]"><span className="text-[var(--text-secondary)] font-mono">10%</span>: Pro</div>
                  <div className="text-[10px] text-[var(--text-dim)] text-red-400/60"><span className="text-[var(--text-secondary)] font-mono">20%</span>: Expert</div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </motion.div>
  );
};
