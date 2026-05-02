import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, ArrowRight, X } from 'lucide-react';
import { SongRow } from '../SongRow';
import { SongItem } from '../../lib/types';

interface UploadStepProps {
  songs: SongItem[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onUpdateSong: (id: string, updated: Partial<SongItem>) => void;
  onRemoveSong: (id: string) => void;
  onClearAll: () => void;
  onBack: () => void;
}

const ARROWS_DISPLAY = [
  { char: '←', color: '#e83f9a', delay: 0 },
  { char: '↓', color: '#3fd4e8', delay: 0.2 },
  { char: '↑', color: '#27e86b', delay: 0.4 },
  { char: '→', color: '#f5e542', delay: 0.6 },
];

export const UploadStep: React.FC<UploadStepProps> = ({
  songs, onFileSelect, onDrop, onUpdateSong, onRemoveSong, onClearAll, onBack
}) => {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', damping: 22, stiffness: 120 }}
      className="w-full max-w-4xl"
    >
      {/* Back link */}
      <div className="mb-4">
        <button onClick={onBack}
          className="flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-[#00f5ff] transition-colors group">
          <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span>Retour</span>
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`sm-panel sm-scanlines relative rounded-2xl p-6 sm:p-10 border-2 border-dashed transition-all duration-500 ${songs.length > 0
          ? 'border-[#00f5ff]/40 bg-[#00f5ff]/3'
          : 'border-white/10 hover:border-[#00f5ff]/30'}`}
        style={songs.length > 0 ? { boxShadow: '0 0 40px rgba(0,245,255,0.06), inset 0 0 40px rgba(0,245,255,0.02)' } : {}}
      >
        {/* Animated beat grid */}
        <div className="absolute inset-0 sm-beat-grid rounded-2xl opacity-30 pointer-events-none" />

        {/* Lane dividers */}
        <div className="absolute inset-0 flex pointer-events-none rounded-2xl overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 border-r border-white/[0.025] last:border-r-0" />
          ))}
        </div>

        <div className="relative z-20 flex flex-col items-center text-center">
          {/* Arrow icons */}
          <div className="flex space-x-3 mb-4">
            {ARROWS_DISPLAY.map((a) => (
              <motion.span
                key={a.char}
                className="sm-arrow text-2xl sm:text-3xl"
                style={{ color: a.color, animationDelay: `${a.delay}s` }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: a.delay + 0.2 }}
              >
                {a.char}
              </motion.span>
            ))}
          </div>

          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white mb-1 uppercase">
            Vos <span className="sm-glow-cyan" style={{ color: '#00f5ff' }}>Musiques</span>
          </h2>
          <p className="text-[10px] sm:text-sm text-white/35 max-w-sm mb-5 font-medium leading-relaxed">
            Glissez vos fichiers MP3/OGG — StepSync analyse et génère automatiquement.
          </p>

          <input type="file" id="file-upload" multiple className="hidden" onChange={onFileSelect} />
          <button
            onClick={async () => {
              const ipc = (window as any).ipcRenderer;
              if (ipc && ipc.selectFiles) {
                const files = await ipc.selectFiles();
                if (files.length > 0) {
                  const event = new CustomEvent('electron-files-selected', { detail: files });
                  window.dispatchEvent(event);
                }
              } else {
                document.getElementById('file-upload')?.click();
              }
            }}
            className="relative overflow-hidden px-6 py-2.5 rounded-lg border font-black text-[11px] uppercase tracking-widest transition-all group"
            style={{
              borderColor: 'rgba(0,245,255,0.4)',
              color: '#00f5ff',
              background: 'rgba(0,245,255,0.05)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,245,255,0.12)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,245,255,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,245,255,0.05)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
          >
            <Music className="w-4 h-4 inline-block mr-2" />
            Parcourir les fichiers
          </button>
        </div>

        {/* Song queue */}
        {songs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-20 mt-6 space-y-3"
          >
            {/* Queue header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Song count badge - like a score display */}
                <div className="px-2 py-0.5 rounded border font-black text-sm tabular-nums"
                  style={{ borderColor: 'rgba(0,245,255,0.3)', color: '#00f5ff', background: 'rgba(0,245,255,0.08)', fontFamily: 'Outfit, monospace', textShadow: '0 0 10px #00f5ff' }}>
                  {String(songs.length).padStart(2, '0')}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Pistes en file</span>
              </div>
              <div className="flex space-x-2">
                <button onClick={onClearAll}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border border-[#ff2edb]/20 text-[#ff2edb]/60 hover:bg-[#ff2edb]/10 hover:text-[#ff2edb]"
                >
                  <X className="w-3 h-3" />
                  <span>Vider</span>
                </button>
                <button onClick={() => (window as any).advanceStep()}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border border-[#39ff14]/30 text-[#39ff14] hover:bg-[#39ff14]/10"
                  style={{ boxShadow: '0 0 10px rgba(57,255,20,0.1)' }}
                >
                  <span>Suivant</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Song list */}
            <div className="space-y-2">
              <AnimatePresence>
                {songs.map((song) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    onUpdate={(updated) => onUpdateSong(song.id, updated)}
                    onRemove={() => onRemoveSong(song.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
