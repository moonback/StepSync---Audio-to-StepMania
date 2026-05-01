import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, Zap, Activity, RefreshCw, AlertTriangle } from 'lucide-react';
import { SongItem } from '../../lib/types';

interface ConfigStepProps {
  songs: SongItem[];
  bpmOverride: string;
  setBpmOverride: (val: string) => void;
  gameModes: string[];
  setGameModes: (modes: string[]) => void;
  onRecalculateBPM: () => void;
}

export const ConfigStep: React.FC<ConfigStepProps> = ({
  songs,
  bpmOverride,
  setBpmOverride,
  gameModes,
  setGameModes,
  onRecalculateBPM
}) => {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, rotateY: 15, z: -100, x: 50 }}
      animate={{ opacity: 1, rotateY: 0, z: 0, x: 0 }}
      exit={{ opacity: 0, rotateY: -15, z: -100, x: -50 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="w-full max-w-4xl"
    >
      <div className="p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] glass-card tilt-card">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2.5 sm:p-3 bg-indigo-500/10 rounded-xl sm:rounded-2xl text-indigo-400">
              <Settings2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">Paramètres de Génération</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">
                Configurez le cœur de {songs.length > 1 ? `vos ${songs.length} stepcharts` : 'votre stepchart'}.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-white/5 border border-slate-700/30 hover:border-indigo-500/30 transition-colors duration-500">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-black uppercase tracking-widest text-indigo-400">Rythme (BPM)</label>
                <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              {songs.length > 1 && (
                <div className="flex items-start space-x-2 mb-4 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-indigo-300 leading-tight font-medium">
                    <strong className="block text-indigo-400 mb-0.5">Pack Multiple Détecté</strong>
                    Le réglage manuel du BPM est désactivé pour éviter de désynchroniser vos différentes pistes. L'algorithme calculera chaque BPM individuellement.
                  </p>
                </div>
              )}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs uppercase tracking-widest">BPM</div>
                  <input
                    type="number"
                    value={songs.length > 1 ? '' : (bpmOverride || '')}
                    onChange={(e) => setBpmOverride(e.target.value)}
                    disabled={songs.length > 1}
                    placeholder="Auto..."
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-2xl pl-16 pr-4 py-4 text-base sm:text-lg font-black text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  onClick={onRecalculateBPM}
                  disabled={songs.length > 1}
                  className="p-4 bg-indigo-600/20 text-indigo-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600/20 disabled:hover:text-indigo-400"
                  title="Recalculer"
                >
                  <RefreshCw className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-indigo-600/10 border border-indigo-500/20">
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6">Modes de Jeu & Difficultés</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold mb-3 uppercase tracking-wider">Modes</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'dance-single', label: 'Dance (4)' },
                      { id: 'dance-double', label: 'Double (8)' },
                      { id: 'pump-single', label: 'Pump (5)' },
                      { id: 'pump-double', label: 'Pump Double (10)' }
                    ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => {
                            if (gameModes.includes(mode.id)) {
                              if (gameModes.length > 1) setGameModes(gameModes.filter(m => m !== mode.id));
                            } else {
                              setGameModes([...gameModes, mode.id]);
                            }
                          }}
                          className={`px-4 py-2.5 sm:px-3 sm:py-2 rounded-lg text-xs font-bold border transition-colors ${gameModes.includes(mode.id) ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-indigo-500/50'}`}
                        >
                          {mode.label}
                        </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--text-dim)] mt-3 leading-relaxed border-l-2 border-indigo-500/30 pl-2">
                    <strong className="text-[var(--text-secondary)]">Dance</strong> : Tapis classique en croix (DDR/StepMania).<br />
                    <strong className="text-[var(--text-secondary)]">Pump</strong> : Tapis avec diagonales et centre (Pump It Up).<br />
                    <strong className="text-[var(--text-secondary)]">Double</strong> : Jouez seul sur deux tapis connectés.
                  </p>
                  
                  <AnimatePresence>
                    {gameModes.some(m => m !== 'dance-single') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-start space-x-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-amber-500/90 leading-tight font-medium">
                            <strong className="block text-amber-500 mb-0.5">Attention au matériel</strong>
                            Les modes Pump et Double nécessitent des tapis spécifiques (5 panneaux ou 2 tapis connectés). Les flèches générées ne correspondront pas à un tapis classique.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold mb-3 uppercase tracking-wider">Difficultés incluses par défaut</p>
                  <div className="grid grid-cols-2 gap-4">
                    {['Beginner', 'Easy', 'Medium', 'Hard', 'Challenge'].map((level) => (
                      <div key={level} className="flex items-center space-x-3 p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-default)]">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-sm font-bold text-[var(--text-secondary)]">{level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex flex-col items-center justify-center text-center h-full relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 mx-auto">
                  <Activity className="w-8 h-8" />
                </div>
                <h4 className="text-lg sm:text-xl font-black text-white mb-4">Analyse Automatique</h4>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-xs mx-auto">
                  StepSync utilise un algorithme de détection de transitoires pour identifier le BPM et l'offset exact de chaque musique.
                </p>
                <div className="mt-8 pt-8 border-t border-indigo-500/10 flex justify-center space-x-8">
                  <div className="text-center">
                    <div className="text-lg font-black text-indigo-400">99%</div>
                    <div className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Précision</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-purple-400">0ms</div>
                    <div className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Latence</div>
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
