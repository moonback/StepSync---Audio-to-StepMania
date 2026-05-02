import React from 'react';
import { motion } from 'motion/react';
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

export const UploadStep: React.FC<UploadStepProps> = ({
  songs,
  onFileSelect,
  onDrop,
  onUpdateSong,
  onRemoveSong,
  onClearAll,
  onBack
}) => {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, rotateY: -15, z: -100, x: -50 }}
      animate={{ opacity: 1, rotateY: 0, z: 0, x: 0 }}
      exit={{ opacity: 0, rotateY: 15, z: -100, x: 50 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="w-full max-w-4xl"
    >
      <div className="mb-4 flex items-center justify-start">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors group"
        >
          <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span>Retour</span>
        </button>
      </div>
      <div
        className={`relative group p-4 sm:p-8 rounded-[1.25rem] sm:rounded-[2rem] border-2 border-dashed transition-all duration-700 glass-card tilt-card
          ${songs.length > 0 ? 'border-indigo-500/50 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10' : 'border-slate-700/30 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5'}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 rounded-[1.25rem] sm:rounded-[2rem] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-3 sm:mb-6">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse" />
            <div className="relative p-3 sm:p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl sm:rounded-2xl text-white shadow-xl shadow-indigo-500/30 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
              <Music className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>

          <h2 className="text-lg sm:text-3xl font-black tracking-tight text-[var(--text-primary)] mb-1 sm:mb-2">
            Vos musiques <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">ici.</span>
          </h2>
          <p className="text-[10px] sm:text-base text-[var(--text-muted)] max-w-md mx-auto mb-4 sm:mb-6 leading-relaxed font-medium">
            Glissez vos MP3 ou un dossier complet. StepSync s'occupe de l'analyse.
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
            className="px-5 py-2.5 sm:px-8 sm:py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg sm:rounded-xl cursor-pointer shadow-lg shadow-indigo-600/30 transition-all duration-300 text-[10px] sm:text-sm"
          >
            Parcourir vos fichiers
          </button>

          {songs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 sm:mt-12 w-full space-y-4"
            >
              <div className="flex items-center justify-between px-1 sm:px-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <span className="text-[10px] font-black text-indigo-400">{songs.length}</span>
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white">File d'attente</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={onClearAll} 
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 group/clear"
                  >
                    <X className="w-3 h-3 group-hover:rotate-90 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Vider</span>
                  </button>
                  <button 
                    onClick={() => (window as any).advanceStep()} 
                    className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-600/20"
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest">Suivant</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {songs.map((song) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    onUpdate={(updated) => onUpdateSong(song.id, updated)}
                    onRemove={() => onRemoveSong(song.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
