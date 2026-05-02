import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, AlertTriangle, Activity } from 'lucide-react';
import { SongItem } from '../../lib/types';

interface ConfigStepProps {
  songs: SongItem[];
  bpmOverride: string;
  setBpmOverride: (val: string) => void;
  gameModes: string[];
  setGameModes: (modes: string[]) => void;
  onRecalculateBPM: () => void;
}

const ARROWS = ['←', '↓', '↑', '→'];
const ARROW_COLORS = ['[--sm-left]', '[--sm-down]', '[--sm-up]', '[--sm-right]'];

const GAME_MODES = [
  {
    id: 'dance-single',
    label: 'Dance Single',
    sub: '4 Panels',
    arrows: ['←', '↓', '↑', '→'],
    colors: ['text-[#e83f9a]', 'text-[#3fd4e8]', 'text-[#27e86b]', 'text-[#f5e542]'],
  },
  {
    id: 'dance-double',
    label: 'Dance Double',
    sub: '8 Panels',
    arrows: ['←', '↓', '↑', '→', '←', '↓', '↑', '→'],
    colors: ['text-[#e83f9a]', 'text-[#3fd4e8]', 'text-[#27e86b]', 'text-[#f5e542]', 'text-[#e83f9a]', 'text-[#3fd4e8]', 'text-[#27e86b]', 'text-[#f5e542]'],
  },
  {
    id: 'pump-single',
    label: 'Pump Single',
    sub: '5 Panels',
    arrows: ['↙', '↖', '·', '↗', '↘'],
    colors: ['text-[#e83f9a]', 'text-[#f5e542]', 'text-[#3fd4e8]', 'text-[#f5e542]', 'text-[#e83f9a]'],
  },
  {
    id: 'pump-double',
    label: 'Pump Double',
    sub: '10 Panels',
    arrows: ['↙', '↖', '·', '↗', '↘', '↙', '↖', '·', '↗', '↘'],
    colors: ['text-[#e83f9a]', 'text-[#f5e542]', 'text-[#3fd4e8]', 'text-[#f5e542]', 'text-[#e83f9a]', 'text-[#e83f9a]', 'text-[#f5e542]', 'text-[#3fd4e8]', 'text-[#f5e542]', 'text-[#e83f9a]'],
  },
];

const DIFFICULTIES = [
  { label: 'Beginner', level: 1, color: '#3fd4e8', bar: 'w-1/5' },
  { label: 'Easy',     level: 3, color: '#27e86b', bar: 'w-2/5' },
  { label: 'Medium',   level: 6, color: '#f5e542', bar: 'w-3/5' },
  { label: 'Hard',     level: 8, color: '#e83f9a', bar: 'w-4/5' },
  { label: 'Challenge',level: 10,color: '#ff4444', bar: 'w-full' },
];

export const ConfigStep: React.FC<ConfigStepProps> = ({
  songs, bpmOverride, setBpmOverride, gameModes, setGameModes, onRecalculateBPM
}) => {
  const displayBpm = songs.length > 1 ? 'MULTI' : (bpmOverride || '---');
  const isAnalyzing = songs.length === 1 && !bpmOverride;

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ type: 'spring', damping: 22, stiffness: 120 }}
      className="w-full max-w-4xl"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-5">
        <div className="flex space-x-1">
          {ARROWS.map((a, i) => (
            <span key={i} className={`sm-arrow text-base ${ARROW_COLORS[i].replace('[--sm-', 'text-[#').replace(']', '') === 'text-[#e83f9a' ? 'text-[#e83f9a]' : i === 1 ? 'text-[#3fd4e8]' : i === 2 ? 'text-[#27e86b]' : 'text-[#f5e542]'}`} style={{ animationDelay: `${i * 0.2}s` }}>{a}</span>
          ))}
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-widest text-white sm-glow-cyan">Paramètres</h2>
          <p className="text-[9px] font-bold text-[#00f5ff]/50 uppercase tracking-widest">
            Config · {songs.length} track{songs.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BPM Panel */}
        <div className="sm-panel sm-scanlines rounded-2xl p-5 relative">
          <div className="absolute inset-0 sm-beat-grid rounded-2xl opacity-60 pointer-events-none" />
          <div className="relative z-20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00f5ff]/60">Rythme / BPM</span>
              {isAnalyzing && <span className="text-[8px] font-black text-[#f5e542] sm-blink uppercase tracking-widest">Analyse...</span>}
            </div>

            {/* Big BPM Display */}
            <div className="text-center mb-4">
              <div className={`text-5xl font-black tracking-tight tabular-nums ${isAnalyzing ? 'sm-glow-yellow' : 'sm-glow-cyan'}`}
                style={{ color: isAnalyzing ? '#ffe600' : '#00f5ff', fontFamily: 'Outfit, monospace' }}>
                {displayBpm}
              </div>
              <div className="text-[9px] text-[#00f5ff]/40 font-bold uppercase tracking-widest mt-1">
                {songs.length > 1 ? 'Auto par piste' : 'Beats Per Minute'}
              </div>
            </div>

            {songs.length > 1 && (
              <div className="mb-4 p-3 rounded-lg border border-[#00f5ff]/15 bg-[#00f5ff]/5 flex items-start space-x-2">
                <Activity className="w-3 h-3 text-[#00f5ff] shrink-0 mt-0.5" />
                <p className="text-[9px] text-[#00f5ff]/70 leading-tight font-bold">
                  PACK MULTI · BPM automatique par piste
                </p>
              </div>
            )}

            <div className="flex space-x-2">
              <input
                type="text"
                value={songs.length > 1 ? '' : (bpmOverride || '')}
                onChange={(e) => setBpmOverride(e.target.value)}
                disabled={songs.length > 1}
                placeholder={isAnalyzing ? 'Analyse...' : 'BPM manuel...'}
                className="sm-input flex-1 rounded-lg px-3 py-2.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              />
              <button
                onClick={onRecalculateBPM}
                disabled={songs.length > 1}
                title="Recalculer"
                className="px-3 py-2.5 rounded-lg border border-[#00f5ff]/25 text-[#00f5ff] hover:bg-[#00f5ff]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Difficulty Panel */}
        <div className="sm-panel rounded-2xl p-5">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff2edb]/60 block mb-4">Difficultés générées</span>
          <div className="space-y-2.5">
            {DIFFICULTIES.map((d) => (
              <div key={d.label} className="flex items-center space-x-3">
                <div className="w-16 text-[9px] font-black uppercase tracking-wide" style={{ color: d.color }}>{d.label}</div>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.2 + DIFFICULTIES.indexOf(d) * 0.08, duration: 0.5 }}
                    className={`h-full ${d.bar} rounded-full`}
                    style={{ background: `linear-gradient(90deg, ${d.color}88, ${d.color})`, boxShadow: `0 0 8px ${d.color}60` }}
                  />
                </div>
                <div className="flex">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-sm mx-px" style={{ background: i < d.level ? d.color : 'rgba(255,255,255,0.07)', boxShadow: i < d.level ? `0 0 4px ${d.color}` : 'none' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Modes Panel — full width */}
        <div className="sm-panel rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#39ff14]/60">Modes de Jeu</span>
            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{gameModes.length} sélectionné{gameModes.length > 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {GAME_MODES.map((mode) => {
              const active = gameModes.includes(mode.id);
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    if (active) { if (gameModes.length > 1) setGameModes(gameModes.filter(m => m !== mode.id)); }
                    else setGameModes([...gameModes, mode.id]);
                  }}
                  className={`relative flex flex-col items-center p-4 rounded-xl border transition-all duration-300 ${active
                    ? 'bg-[#39ff14]/10 border-[#39ff14]/40'
                    : 'bg-black/30 border-white/10 hover:border-[#39ff14]/25'
                  }`}
                  style={active ? { boxShadow: '0 0 15px rgba(57,255,20,0.15)' } : {}}
                >
                  {active && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#39ff14] sm-glow-green" style={{ boxShadow: '0 0 6px #39ff14' }} />}
                  {/* Arrows preview */}
                  <div className="flex flex-wrap justify-center gap-0.5 mb-2 max-w-[60px]">
                    {mode.arrows.map((a, i) => (
                      <span key={i} className={`text-[10px] font-black ${mode.colors[i % mode.colors.length]}`} style={{ filter: 'drop-shadow(0 0 3px currentColor)' }}>{a}</span>
                    ))}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-tight block ${active ? 'text-[#39ff14]' : 'text-white/60'}`}>{mode.label}</span>
                  <span className={`text-[7px] font-bold uppercase tracking-widest ${active ? 'text-[#39ff14]/60' : 'text-white/25'}`}>{mode.sub}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {gameModes.some(m => m !== 'dance-single') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-4"
              >
                <div className="flex items-start space-x-2 p-3 bg-[#f5e542]/5 border border-[#f5e542]/20 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#f5e542] shrink-0 mt-0.5" style={{ filter: 'drop-shadow(0 0 4px #f5e542)' }} />
                  <p className="text-[9px] text-[#f5e542]/80 leading-tight font-bold">
                    <span className="text-[#f5e542]">ATTENTION MATÉRIEL ·</span> Les modes Pump et Double nécessitent des tapis spécifiques.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
