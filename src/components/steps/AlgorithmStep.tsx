import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Activity, HelpCircle, Check, RefreshCw, Scissors, Cpu, Music2, Sparkles } from 'lucide-react';
import { SongItem } from '../../lib/types';

interface AlgorithmStepProps {
  songs: SongItem[];
  onsetThreshold: number;
  setOnsetThreshold: (val: number) => void;
  mineProbability: number;
  setMineProbability: (val: number) => void;
  choreographyStyle: string;
  setChoreographyStyle: (val: string) => void;
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
  choreographyStyle,
  setChoreographyStyle,
  trimSilence,
  setTrimSilence,
  isTuned,
  isProcessing,
  onAutoTune
}) => {
  const isMultiPack = songs.length > 1;

  const styles = [
    { id: 'balanced', label: 'Équilibré', icon: <Activity className="w-3 h-3" />, desc: 'Pas trop difficile, pas trop facile.' },
    { id: 'stream', label: 'Stream', icon: <RefreshCw className="w-3 h-3" />, desc: 'Beaucoup de notes rapides et continues.' },
    { id: 'tech', label: 'Technique', icon: <Zap className="w-3 h-3" />, desc: 'Des patterns complexes et beaucoup de mines.' },
  ];

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, rotateX: 10, z: -100, y: 30 }}
      animate={{ opacity: 1, rotateX: 0, z: 0, y: 0 }}
      exit={{ opacity: 0, rotateX: -10, z: -100, y: -30 }}
      transition={{ type: 'spring', damping: 25, stiffness: 120 }}
      className="w-full max-w-5xl"
    >
      <div className="p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] glass-card tilt-card relative overflow-hidden">
        {/* Decorative Background Element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl text-purple-400 border border-purple-500/20 shadow-inner">
              <Cpu className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">Intelligence Artificielle</h3>
              <p className="text-sm text-[var(--text-muted)] font-medium">Affinez les paramètres de l'analyseur audio.</p>
            </div>
          </div>

          <button
            onClick={onAutoTune}
            disabled={isProcessing || isMultiPack}
            className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center space-x-2 transition-all duration-500 shadow-lg ${isTuned
              ? 'bg-green-500 text-white shadow-green-500/20 scale-105'
              : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white hover:shadow-indigo-500/20 active:scale-95'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isTuned ? (
              <Check className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isTuned ? "Paramètres Optimisés" : "Auto-Configuration"}</span>
          </button>
        </div>

        {isMultiPack && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-3 mb-10 p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-indigo-500/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Activity className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
            <div className="relative z-10">
              <h4 className="text-sm font-black text-indigo-400 mb-1 uppercase tracking-wider">Optimisation Multi-Pistes Active</h4>
              <p className="text-xs text-indigo-300/80 leading-relaxed font-medium">
                Vous exportez un pack de <span className="text-white font-bold">{songs.length} musiques</span>.
                L'IA analysera chaque morceau individuellement pour appliquer les seuils de détection les plus précis.
                Les réglages manuels ci-dessous sont ignorés au profit d'un réglage dynamique par chanson.
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Audio Sensitivity Column */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Music2 className="w-4 h-4" />
                  </span>
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Détection d'Énergie</label>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-[var(--bg-input)] rounded-full text-sm font-black text-indigo-400 font-mono border border-[var(--border-default)]">
                    {onsetThreshold.toFixed(2)}
                  </span>
                  <button className="text-[var(--text-dim)] hover:text-indigo-400 transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative pt-2 pb-6">
                <input
                  type="range" min="0.05" max="0.5" step="0.01"
                  value={onsetThreshold}
                  onChange={(e) => setOnsetThreshold(parseFloat(e.target.value))}
                  disabled={isMultiPack}
                  className="w-full accent-indigo-500 no-transition h-2 bg-slate-800/50 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between mt-3 px-1">
                  <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase">Précis</span>
                  <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase">Énergique</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400/70">Profils de Sensibilité :</p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'Pop / EDM', range: '0.15 - 0.22', desc: 'Idéal pour les kicks marqués.' },
                    { label: 'Ambient / Chill', range: '0.08 - 0.12', desc: 'Capture les nuances subtiles.' },
                    { label: 'Metal / Hardcore', range: '0.25 - 0.35', desc: 'Ignore le bruit de fond.' }
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-default">
                      <div>
                        <div className="text-[11px] font-black text-[var(--text-secondary)]">{p.label}</div>
                        <div className="text-[9px] text-[var(--text-dim)] font-medium">{p.desc}</div>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-400/50 font-mono group-hover:text-indigo-400 transition-colors">{p.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Choreography & Cleanup Column */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-purple-400">Style Chorégraphique</label>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setChoreographyStyle(style.id)}
                    disabled={isMultiPack}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${choreographyStyle === style.id
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/10'
                      : 'bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-dim)] hover:border-purple-500/30'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <div className="mb-1">{style.icon}</div>
                    <span className="text-[10px] font-black uppercase">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-red-500/10 rounded-lg text-red-400">
                    <Zap className="w-4 h-4" />
                  </span>
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-red-400">Densité de Mines</label>
                </div>
                <span className="px-3 py-1 bg-[var(--bg-input)] rounded-full text-sm font-black text-red-400 font-mono border border-[var(--border-default)]">
                  {Math.round(mineProbability * 100)}%
                </span>
              </div>

              <div className="relative pt-2 pb-6">
                <input
                  type="range" min="0" max="0.3" step="0.01"
                  value={mineProbability}
                  onChange={(e) => setMineProbability(parseFloat(e.target.value))}
                  disabled={isMultiPack}
                  className="w-full accent-red-500 no-transition h-2 bg-slate-800/50 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--border-default)]">
              <div
                className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group"
                onClick={() => setTrimSilence(!trimSilence)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2.5 rounded-xl transition-colors ${trimSilence ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[var(--text-primary)]">Nettoyage Automatique</h4>
                    <p className="text-[10px] text-[var(--text-dim)] font-medium">Supprime le silence au début du fichier.</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${trimSilence ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${trimSilence ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

