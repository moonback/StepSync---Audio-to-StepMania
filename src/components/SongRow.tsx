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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 border border-white/5"
    >
      {/* Remove Button */}
      <button 
        onClick={() => onRemove(song.id)}
        className="absolute -top-1.5 -right-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-300 z-20 shadow-lg"
      >
        <X className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>

      <div className="flex flex-col space-y-3 sm:space-y-5">
        <div className="flex items-center space-x-4">
          {/* Artwork / Play Toggle */}
          <div 
            onClick={togglePlay}
            className="relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer group/art shadow-inner"
          >
            {song.artworkUrl ? (
              <img 
                src={song.artworkUrl} 
                alt="Artwork" 
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-110' : 'group-hover/art:scale-110'}`}
              />
            ) : (
              <Music className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400/40" />
            )}
            <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover/art:opacity-100'}`}>
              {isPlaying ? <PauseCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white/20" /> : <PlayCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white/20" />}
            </div>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-baseline space-x-2 truncate mb-1">
              <h3 className="text-sm font-black text-white truncate tracking-tight leading-none">{song.title}</h3>
              <span className="text-[10px] font-bold text-slate-400 truncate leading-none max-w-[120px] sm:max-w-[200px]">{song.artist}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mt-0.5">
              <div className="flex items-center space-x-1 bg-black/20 px-1.5 py-0.5 rounded border border-white/5">
                {song.bpm ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full border border-indigo-500/30 border-t-indigo-500 animate-spin" />
                )}
                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${song.bpm ? 'text-emerald-400' : 'text-indigo-400'}`}>
                  {song.bpm ? `${Math.round(song.bpm)} BPM` : 'Analyse...'}
                </span>
              </div>
              
              <div className="flex items-center space-x-1 text-slate-400 bg-black/20 px-1.5 py-0.5 rounded border border-white/5">
                <Music className="w-2.5 h-2.5 opacity-50" />
                <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest">{formatDuration(duration)}</span>
              </div>

              <div className="flex items-center px-1.5 py-0.5 rounded bg-black/20 border border-white/5">
                <span className="text-[8px] sm:text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  {song.file.name.split('.').pop()?.substring(0,3) || 'MP3'} • {formatSize(song.file.size)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowMetadata(!showMetadata)}
              className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl border transition-all ${showMetadata ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
              title="Éditer les infos"
            >
              <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Metadata Editor */}
        <AnimatePresence>
          {showMetadata && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 pb-4">
                {[
                  { label: 'Titre', value: song.title, key: 'title' },
                  { label: 'Artiste', value: song.artist, key: 'artist' },
                  { label: 'Sous-titre', value: song.subtitle || '', key: 'subtitle' },
                  { label: 'Genre', value: song.genre || '', key: 'genre' }
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{field.label}</label>
                    <input 
                      type="text" 
                      value={field.value} 
                      onChange={(e) => onUpdate({ [field.key]: e.target.value })}
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Section */}
        <div className="space-y-4 pt-2">
          <div className="rounded-2xl overflow-hidden bg-black/20 border border-white/5 p-1">
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
      </div>
    </motion.div>
  );
};
