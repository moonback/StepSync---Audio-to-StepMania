import React, { useState, useRef, useEffect } from 'react';
import { X, PlayCircle, PauseCircle, ChevronDown, ChevronUp, Edit2, Music, CheckCircle2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WaveformPreview } from './WaveformPreview';
import { GamePreviewWrapper } from './GamePreviewWrapper';
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
  const [previewMode, setPreviewMode] = useState<'waveform' | '3d'>('waveform');
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
      className="group relative glass-card rounded-3xl p-5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 border border-white/5"
    >
      {/* Remove Button */}
      <button 
        onClick={() => onRemove(song.id)}
        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-300 z-20 shadow-lg"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col space-y-5">
        <div className="flex items-center space-x-4">
          {/* Artwork / Play Toggle */}
          <div 
            onClick={togglePlay}
            className="relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer group/art shadow-inner"
          >
            {song.artworkUrl ? (
              <img 
                src={song.artworkUrl} 
                alt="Artwork" 
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-110' : 'group-hover/art:scale-110'}`}
              />
            ) : (
              <Music className="w-6 h-6 text-indigo-400/40" />
            )}
            <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover/art:opacity-100'}`}>
              {isPlaying ? <PauseCircle className="w-8 h-8 text-white fill-white/20" /> : <PlayCircle className="w-8 h-8 text-white fill-white/20" />}
            </div>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-[var(--text-primary)] truncate tracking-tight">{song.title}</h3>
              {song.bpm && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            </div>
            <div className="flex items-center space-x-3 mt-1.5 overflow-hidden">
              <span className="text-xs font-bold text-[var(--text-muted)] truncate">{song.artist}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest shrink-0">
                {song.bpm ? `${Math.round(song.bpm)} BPM` : 'Analyse...'}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
              <span className="text-[10px] font-mono text-slate-500 shrink-0">{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowMetadata(!showMetadata)}
              className={`p-2.5 rounded-xl border transition-all ${showMetadata ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
              title="Éditer les infos"
            >
              <Edit2 className="w-4 h-4" />
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 p-1 bg-black/20 rounded-xl border border-white/5">
              <button 
                onClick={() => setPreviewMode('waveform')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${previewMode === 'waveform' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Audio
              </button>
              <button 
                onClick={() => setPreviewMode('3d')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-1.5 ${previewMode === '3d' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Activity className="w-3 h-3" />
                <span>Rendu 3D</span>
              </button>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{formatSize(song.file.size)}</span>
          </div>
          
          <div className="rounded-2xl overflow-hidden bg-black/20 border border-white/5 p-1">
            {previewMode === 'waveform' ? (
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
            ) : (
              <div className="aspect-[21/9]">
                <GamePreviewWrapper 
                  song={song} 
                  audioRef={audioRef} 
                  isPlaying={isPlaying} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
