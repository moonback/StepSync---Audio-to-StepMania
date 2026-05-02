import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Activity, HelpCircle, AlertTriangle, Loader2, Brain, Waves, GitFork, Dumbbell } from 'lucide-react';
import { SongItem } from '../../lib/types';
import type { ChoreographyStyle } from '../../lib/aiTypes';
import type { AIAnalyzerState } from '../../lib/aiAudioAnalysis';

interface StyleOption {
  id:          ChoreographyStyle;
  label:       string;
  description: string;
  icon:        React.ReactNode;
  color:       string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id:          'stream',
    label:       'Stream',
    description: 'Enchaînements constants de notes simples calés sur kick & snare. Fluide et physiquement exigeant.',
    icon:        <Waves className="w-4 h-4" />,
    color:       'indigo',
  },
  {
    id:          'crossover',
    label:       'Crossover / Tech',
    description: 'Alterne gauche/droite pour forcer les croisements de pieds. Idéal pour le jeu technique.',
    icon:        <GitFork className="w-4 h-4" />,
    color:       'violet',
  },
  {
    id:          'jump',
    label:       'Jump',
    description: 'Doubles flèches intensifiées sur les drops, notes simples entre les sections. Impact maximal.',
    icon:        <Dumbbell className="w-4 h-4" />,
    color:       'pink',
  },
];

interface AlgorithmStepProps {
  songs:                SongItem[];
  onsetThreshold:       number;
  setOnsetThreshold:    (val: number) => void;
  mineProbability:      number;
  setMineProbability:   (val: number) => void;
  trimSilence:          boolean;
  setTrimSilence:       (val: boolean) => void;
  isTuned:              boolean;
  isProcessing:         boolean;
  onAutoTune:           () => void;
  // AI Choreographer props (Task 12.1)
  choreographyStyle:    ChoreographyStyle | null;
  setChoreographyStyle: (style: ChoreographyStyle | null) => void;
  aiStatus:             AIAnalyzerState['status'];
  aiFallback:           boolean;
  aiProgress:           number;
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
  onAutoTune,
  choreographyStyle,
  setChoreographyStyle,
  aiStatus,
  aiFallback,
  aiProgress,
}) => {
  const [hoveredStyle, setHoveredStyle] = useState<ChoreographyStyle | null>(null);

  // Only disable during active loading — fallback still produces real onsets (inline DSP)
  const isAILoading = aiStatus === 'loading' || aiStatus === 'analyzing';
  const styleDisabled = isAILoading;

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
        {/* Header */}
        <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-10">
          <div className="p-2.5 sm:p-3 bg-purple-500/10 rounded-xl sm:rounded-2xl text-purple-400">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">Algorithmes Avancés</h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">Ajustez la sensibilité de détection.</p>
          </div>
        </div>

        {/* Pack-mode warning */}
        {songs.length > 1 && (
          <div className="flex items-start space-x-2 mb-8 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <Activity className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-300 leading-relaxed font-medium">
              <strong className="block text-indigo-400 text-sm mb-1">Optimisation Magique Auto (Pack Multiple)</strong>
              Pour garantir la meilleure qualité, les réglages manuels sont désactivés. Lors de l'export, notre algorithme analysera individuellement chaque musique et appliquera l'optimisation la plus adaptée à son profil énergétique et son BPM.
            </p>
          </div>
        )}

        <div className="space-y-8">

          {/* ----------------------------------------------------------------
              AI CHOREOGRAPHER SECTION
          ---------------------------------------------------------------- */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/20">
            {/* Section header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Style Chorégraphique IA</span>
              </div>
              {/* AI status badge */}
              {isAILoading && (
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{aiStatus === 'loading' ? 'Initialisation...' : `Analyse ${aiProgress}%`}</span>
                </div>
              )}
              {aiStatus === 'ready' && !aiFallback && (
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Prêt</span>
                </div>
              )}
            </div>

            {/* Fallback warning banner (Req 7.4) */}
            <AnimatePresence>
            {aiFallback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="flex items-start space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <Activity className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-300/90 leading-tight font-medium">
                      <strong className="block text-blue-300 mb-0.5">Mode analyse intégré actif</strong>
                      Le Worker IA est indisponible. L'analyse DSP s'exécute directement dans le navigateur — les styles chorégraphiques fonctionnent normalement.
                    </p>
                  </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* AI progress bar */}
            <AnimatePresence>
              {isAILoading && aiProgress > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-4"
                >
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-indigo-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${aiProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Style selector (Req 7.1, 7.3, 7.6) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* "None" option */}
              <button
                id="style-none"
                disabled={styleDisabled}
                onClick={() => setChoreographyStyle(null)}
                className={`relative p-3 rounded-2xl border text-left transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                  choreographyStyle === null
                    ? 'bg-slate-700/60 border-slate-500 text-white'
                    : 'bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-slate-500/50'
                }`}
              >
                <div className="text-xs font-black mb-1">Aucun</div>
                <div className="text-[10px] text-[var(--text-dim)] leading-tight">Mode classique (probabiliste)</div>
              </button>

              {STYLE_OPTIONS.map(opt => {
                const isActive = choreographyStyle === opt.id;
                const colorMap: Record<string, string> = {
                  indigo: isActive
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-indigo-500/40',
                  violet: isActive
                    ? 'bg-violet-600/30 border-violet-500 text-white'
                    : 'bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-violet-500/40',
                  pink: isActive
                    ? 'bg-pink-600/30 border-pink-500 text-white'
                    : 'bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-pink-500/40',
                };
                const iconColor: Record<string, string> = {
                  indigo: 'text-indigo-400',
                  violet: 'text-violet-400',
                  pink:   'text-pink-400',
                };

                return (
                  <div key={opt.id} className="relative">
                    <button
                      id={`style-${opt.id}`}
                      disabled={styleDisabled}
                      onClick={() => setChoreographyStyle(isActive ? null : opt.id)}
                      onMouseEnter={() => setHoveredStyle(opt.id)}
                      onMouseLeave={() => setHoveredStyle(null)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${colorMap[opt.color]}`}
                    >
                      <div className={`flex items-center space-x-2 mb-1 ${iconColor[opt.color]}`}>
                        {opt.icon}
                        <span className="text-xs font-black">{opt.label}</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-dim)] leading-tight line-clamp-2">
                        {opt.description}
                      </div>
                    </button>

                    {/* Tooltip (Req 7.6) */}
                    <AnimatePresence>
                      {hoveredStyle === opt.id && !styleDisabled && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-20 bottom-full left-0 mb-2 w-56 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl pointer-events-none"
                        >
                          <p className="text-[11px] text-slate-200 leading-relaxed">{opt.description}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ----------------------------------------------------------------
              EXISTING CONTROLS  (Req 7.5: preserved unchanged)
          ---------------------------------------------------------------- */}
          <div className="flex justify-center items-center">
            <div className="w-full space-y-8">
              {/* Onset threshold */}
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

              {/* Mine probability */}
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
      </div>
    </motion.div>
  );
};
