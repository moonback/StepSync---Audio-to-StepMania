import React from 'react';
import { motion } from 'motion/react';
import { Music, ArrowRight } from 'lucide-react';
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
      <div className="mb-6 flex items-center justify-start">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors group"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span>Retour à l'accueil</span>
        </button>
      </div>
      <div
        className={`relative group p-5 sm:p-12 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-dashed transition-all duration-700 glass-card tilt-card
          ${songs.length > 0 ? 'border-indigo-500/50 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10' : 'border-slate-700/30 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5'}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 rounded-[1.5rem] sm:rounded-[2.5rem] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-4 sm:mb-8">
            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
            <div className="relative p-4 sm:p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl sm:rounded-3xl text-white shadow-xl shadow-indigo-500/30 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
              <Music className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          </div>

          <h2 className="text-xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)] mb-2 sm:mb-4">
            Vos musiques <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">ici.</span>
          </h2>
          <p className="text-xs sm:text-lg text-[var(--text-muted)] max-w-md mx-auto mb-6 sm:mb-10 leading-relaxed font-medium">
            Glissez vos MP3 ou un dossier complet. StepSync s'occupe de l'analyse et du reste.
          </p>

          <input type="file" id="file-upload" multiple className="hidden" onChange={onFileSelect} />
          <label
            htmlFor="file-upload"
            className="px-6 sm:px-10 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl sm:rounded-2xl cursor-pointer shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transform hover:-translate-y-1 transition-all duration-300 text-xs sm:text-base"
          >
            Parcourir vos fichiers musicaux
          </label>

          {songs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 sm:mt-12 w-full space-y-3 sm:space-y-4"
            >
              <div className="flex items-center justify-between px-2 sm:px-4 pb-4 border-b border-white/5 mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-inner">
                    <Music className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm sm:text-base font-black text-white tracking-tight">File d'attente</h3>
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-indigo-400/80">{songs.length} titre{songs.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button 
                  onClick={onClearAll} 
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg"
                >
                  Tout vider
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-4">
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
