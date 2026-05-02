import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, RefreshCw, Scissors, Activity, Sparkles } from 'lucide-react';
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

const STYLES = [
  {
    id: 'balanced',
    label: 'Équilibré',
    abbr: 'BAL',
    judgment: 'GREAT',
    cls: 'sm-great',
    arrows: ['↓', '↑'],
    arrowColors: ['text-[#3fd4e8]', 'text-[#27e86b]'],
    border: 'border-[#27e86b]/40',
    bg: 'bg-[#27e86b]/10',
    desc: 'Flow régulier, pour tous les niveaux.'
  },
  {
    id: 'stream',
    label: 'Stream',
    abbr: 'STR',
    judgment: 'PERFECT',
    cls: 'sm-perfect',
    arrows: ['←', '↓', '↑', '→'],
    arrowColors: ['text-[#e83f9a]', 'text-[#3fd4e8]', 'text-[#27e86b]', 'text-[#f5e542]'],
    border: 'border-[#ffe600]/40',
    bg: 'bg-[#ffe600]/10',
    desc: 'Notes rapides et continues.'
  },
  {
    id: 'tech',
    label: 'Technique',
    abbr: 'TECH',
    judgment: 'MISS',
    cls: 'sm-miss',
    arrows: ['✕', '←', '✕'],
    arrowColors: ['text-[#e84040]', 'text-[#e83f9a]', 'text-[#e84040]'],
    border: 'border-[#ff2edb]/40',
    bg: 'bg-[#ff2edb]/10',
    desc: 'Patterns complexes & mines.'
  },
];

export const AlgorithmStep: React.FC<AlgorithmStepProps> = ({
  songs, onsetThreshold, setOnsetThreshold, mineProbability, setMineProbability,
  choreographyStyle, setChoreographyStyle, trimSilence, setTrimSilence,
  isTuned, isProcessing, onAutoTune
}) => {
  const isMultiPack = songs.length > 1;

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ type: 'spring', damping: 22, stiffness: 120 }}
      className="w-full max-w-5xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-0.5 text-sm">
            {['←', '↓', '↑', '→'].map((a, i) => (
              <span key={i} className="sm-arrow" style={{ color: ['#e83f9a','#3fd4e8','#27e86b','#f5e542'][i], animationDelay: `${i * 0.15}s` }}>{a}</span>
            ))}
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest text-white sm-glow-cyan">IA Chorégraphique</h2>
            <p className="text-[9px] font-bold text-[#00f5ff]/50 uppercase tracking-widest">DSP Engine · Algorithme</p>
          </div>
        </div>

        <button
          onClick={onAutoTune}
          disabled={isProcessing || isMultiPack}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isTuned
            ? 'border-[#39ff14]/50 bg-[#39ff14]/10 text-[#39ff14]'
            : 'border-[#00f5ff]/30 bg-[#00f5ff]/5 text-[#00f5ff] hover:bg-[#00f5ff]/15'}`}
          style={isTuned ? { boxShadow: '0 0 15px rgba(57,255,20,0.2)' } : {}}
        >
          {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : isTuned ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{isTuned ? 'Optimisé !' : 'Auto-Tune IA'}</span>
        </button>
      </div>

      {isMultiPack && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start space-x-3 p-3 rounded-xl border border-[#00f5ff]/20 bg-[#00f5ff]/5">
          <Activity className="w-4 h-4 text-[#00f5ff] shrink-0 mt-0.5" style={{ filter: 'drop-shadow(0 0 4px #00f5ff)' }} />
          <p className="text-[9px] text-[#00f5ff]/80 font-bold leading-relaxed">
            <span className="text-[#00f5ff]">PACK MODE ·</span> {songs.length} pistes — l'IA ajuste chaque chanson individuellement.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Energy Detection */}
          <div className="sm-panel sm-scanlines rounded-2xl p-5 relative">
            <div className="absolute inset-0 sm-beat-grid rounded-2xl opacity-40 pointer-events-none" />
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00f5ff]/60">Détection d'Énergie</span>
                <span className="text-lg font-black tabular-nums sm-glow-cyan" style={{ color: '#00f5ff', fontFamily: 'Outfit, monospace' }}>
                  {onsetThreshold.toFixed(2)}
                </span>
              </div>

              {/* Note highway visualization */}
              <div className="relative h-12 mb-4 sm-highway rounded-lg overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div key={i}
                    className="absolute top-0 bottom-0 w-px"
                    style={{ left: `${(i + 1) * 12.5}%`, background: 'rgba(0,245,255,0.15)' }}
                  />
                ))}
                <motion.div
                  className="absolute bottom-0 h-full rounded"
                  style={{ width: `${((onsetThreshold - 0.05) / 0.45) * 100}%`, background: 'linear-gradient(90deg, rgba(0,245,255,0.3), rgba(0,245,255,0.8))', boxShadow: '0 0 10px rgba(0,245,255,0.4)' }}
                  animate={{ width: `${((onsetThreshold - 0.05) / 0.45) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] font-black text-[#00f5ff]/50 uppercase tracking-widest">
                    {onsetThreshold < 0.15 ? 'Précis' : onsetThreshold < 0.3 ? 'Équilibré' : 'Énergique'}
                  </span>
                </div>
              </div>

              <input type="range" min="0.05" max="0.5" step="0.01"
                value={onsetThreshold}
                onChange={(e) => setOnsetThreshold(parseFloat(e.target.value))}
                disabled={isMultiPack}
                className="sm-range w-full no-transition disabled:opacity-30 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[8px] font-bold text-white/25 uppercase">Précis</span>
                <span className="text-[8px] font-bold text-white/25 uppercase">Énergique</span>
              </div>

              {/* Profiles */}
              <div className="mt-4 space-y-1.5">
                {[
                  { label: 'Pop / EDM',      range: '0.15–0.22', color: '#e83f9a' },
                  { label: 'Ambient / Chill', range: '0.08–0.12', color: '#3fd4e8' },
                  { label: 'Metal / Hard',    range: '0.25–0.35', color: '#f5e542' },
                ].map((p) => (
                  <div key={p.label} className="flex items-center justify-between px-2 py-1 rounded bg-white/3 border border-white/5">
                    <span className="text-[9px] font-bold" style={{ color: p.color }}>{p.label}</span>
                    <span className="text-[8px] font-mono text-white/30">{p.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mine Density */}
          <div className="sm-panel rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#e84040]/70">Densité de Mines</span>
              <span className="text-lg font-black tabular-nums" style={{ color: '#e84040', fontFamily: 'Outfit, monospace', textShadow: '0 0 10px #e84040' }}>
                {Math.round(mineProbability * 100)}%
              </span>
            </div>
            {/* Mine visual */}
            <div className="flex space-x-1 mb-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i}
                  className="flex-1 h-4 rounded-sm transition-all"
                  style={{
                    background: i < Math.round(mineProbability * 10 / 0.3)
                      ? 'linear-gradient(180deg, #e84040, #ff8080)'
                      : 'rgba(255,255,255,0.06)',
                    boxShadow: i < Math.round(mineProbability * 10 / 0.3) ? '0 0 6px rgba(232,64,64,0.5)' : 'none'
                  }}
                />
              ))}
            </div>
            <input type="range" min="0" max="0.3" step="0.01"
              value={mineProbability}
              onChange={(e) => setMineProbability(parseFloat(e.target.value))}
              disabled={isMultiPack}
              className="w-full no-transition h-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ accentColor: '#e84040' }}
            />
            <p className="mt-2 text-[8px] text-white/25 text-center uppercase tracking-widest">
              {mineProbability < 0.05 ? 'Aucune Mine' : mineProbability < 0.15 ? 'Quelques Mines' : 'Champ de Mines !'}
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Choreography Style */}
          <div className="sm-panel rounded-2xl p-5">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff2edb]/60 block mb-4">Style Chorégraphique</span>
            <div className="space-y-2">
              {STYLES.map((style) => {
                const active = choreographyStyle === style.id;
                return (
                  <button key={style.id}
                    onClick={() => setChoreographyStyle(style.id)}
                    disabled={isMultiPack}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${active ? `${style.bg} ${style.border}` : 'bg-black/20 border-white/8 hover:border-white/20'}`}
                  >
                    <div className="flex space-x-0.5 w-12 justify-center">
                      {style.arrows.map((a, i) => (
                        <span key={i} className={`text-sm font-black ${style.arrowColors[i % style.arrowColors.length]}`} style={{ filter: active ? 'drop-shadow(0 0 4px currentColor)' : 'none' }}>{a}</span>
                      ))}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">{style.label}</span>
                        {active && <span className={`text-[8px] font-black uppercase tracking-widest ${style.cls}`}>{style.judgment}</span>}
                      </div>
                      <span className="text-[8px] text-white/35 font-medium">{style.desc}</span>
                    </div>
                    {active && (
                      <div className="w-3 h-3 rounded-sm rotate-45" style={{ background: style.cls === 'sm-perfect' ? '#ffe600' : style.cls === 'sm-great' ? '#39ff14' : '#ff2edb', boxShadow: `0 0 8px currentColor` }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trim Silence */}
          <div className="sm-panel rounded-2xl p-5">
            <div
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setTrimSilence(!trimSilence)}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg transition-all ${trimSilence ? 'bg-[#39ff14]/15 text-[#39ff14]' : 'bg-white/5 text-white/30'}`}
                  style={trimSilence ? { boxShadow: '0 0 10px rgba(57,255,20,0.3)' } : {}}>
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Nettoyage Silence</h4>
                  <p className="text-[8px] text-white/35 font-medium">Supprime le silence du début</p>
                </div>
              </div>
              {/* SM-style toggle */}
              <div className={`w-10 h-5 rounded-full relative sm-toggle-track ${trimSilence ? 'on' : 'off'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-200 ${trimSilence ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>
          </div>

          {/* Judgment preview */}
          <div className="sm-panel rounded-2xl p-5">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 block mb-3">Aperçu Jugements</span>
            <div className="flex justify-around">
              {[
                { label: 'PERFECT', cls: 'sm-perfect' },
                { label: 'GREAT', cls: 'sm-great' },
                { label: 'GOOD', cls: 'sm-good' },
                { label: 'MISS', cls: 'sm-miss' },
              ].map((j, i) => (
                <motion.div key={j.label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  className={`text-center ${j.cls}`}
                >
                  <div className="text-[8px] font-black uppercase tracking-widest">{j.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
