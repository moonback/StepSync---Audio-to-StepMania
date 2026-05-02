import React, { useState, useRef, useEffect } from 'react';
import { X, PlayCircle, PauseCircle, ChevronDown, ChevronUp, Edit2, Music, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WaveformPreview } from './WaveformPreview';
import { SongItem } from '../lib/types';

interface SongRowProps {
  song: SongItem;
  onRemove: (id: string) => void;
  onUpdate: (updates: Partial<SongItem>) => void;
}

export const SongRow: React.FC<SongRowProps> = ({ 
  song, 
  onRemove, 
  onUpdate 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(song.file);
    const audio = new Audio(url);
    audioRef.current = audio;
    
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
    audio.onpause = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    
    return () => {
      audio.pause();
      audio.src = '';
      URL.revokeObjectURL(url);
    };
  }, [song.file]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return (bytes / 1024).toFixed(0) + ' KB';
    return mb.toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`group relative overflow-hidden rounded-2xl transition-all duration-500 border ${
        isPlaying 
          ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_40px_rgba(79,70,229,0.15)]' 
          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
      }`}
    >
      {/* Remove Button - More Integrated */}
      <button 
        onClick={() => onRemove(song.id)}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 text-slate-400 hover:text-white hover:bg-red-500 transition-all duration-300 z-20 flex items-center justify-center backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 shadow-xl"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="relative z-10 p-3 sm:p-4 flex flex-col space-y-3">
        <div className="flex items-center space-x-4">
          {/* Artwork / Play Toggle - More Polished */}
          <div 
            onClick={togglePlay}
            className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center cursor-pointer group/art shadow-2xl transition-transform active:scale-95"
          >
            {song.artworkUrl ? (
              <img 
                src={song.artworkUrl} 
                alt="Artwork" 
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${isPlaying ? 'scale-125 rotate-6' : 'group-hover/art:scale-110'}`}
              />
            ) : (
              <Music className="w-5 h-5 text-indigo-400/30" />
            )}
            
            <div className={`absolute inset-0 bg-indigo-600/40 backdrop-blur-[2px] flex items-center justify-center transition-all duration-500 ${isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-110 group-hover/art:opacity-100 group-hover/art:scale-100'}`}>
              <div className="p-2 bg-white text-indigo-600 rounded-full shadow-2xl">
                {isPlaying ? <PauseCircle className="w-4 h-4 fill-current" /> : <PlayCircle className="w-4 h-4 fill-current" />}
              </div>
            </div>
          </div>

          {/* Song Info - Enhanced Typography */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-0.5">
              <h3 className="text-sm sm:text-base font-black text-white truncate tracking-tight">
                {song.title}
              </h3>
              {song.bpm && (
                <div className="flex items-center bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="text-[7px] font-black uppercase tracking-tighter">OK</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-3">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 truncate max-w-[120px] uppercase tracking-wide">
                {song.artist}
              </span>
              <div className="flex items-center space-x-1">
                <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                  {song.bpm ? `${Math.round(song.bpm)} BPM` : '...'}
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Edit Trigger */}
          <button 
            onClick={() => setShowMetadata(!showMetadata)}
            className={`p-2 rounded-xl border transition-all active:scale-90 ${
              showMetadata 
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metadata Editor - Compact */}
        <AnimatePresence>
          {showMetadata && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-black/40 rounded-2xl border border-white/5 mt-1">
                {[
                  { label: 'Titre', value: song.title, key: 'title' },
                  { label: 'Artiste', value: song.artist, key: 'artist' },
                  { label: 'Sous-titre', value: song.subtitle || '', key: 'subtitle' },
                  { label: 'Genre', value: song.genre || '', key: 'genre' }
                ].map((field) => (
                  <div key={field.key} className="flex flex-col space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">
                      {field.label}
                    </label>
                    <input 
                      type="text" 
                      value={field.value} 
                      onChange={(e) => onUpdate({ [field.key]: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-indigo-500/50 transition-all font-bold"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform - Slim */}
        <div className="rounded-xl overflow-hidden bg-black/20 border border-white/5 p-1">
          <WaveformPreview 
            file={song.file} 
            currentTime={currentTime} 
            duration={duration || 0} 
            onSeek={(time) => {
              if (audioRef.current) {
                audioRef.current.currentTime = time;
                setCurrentTime(time);
              }
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};
