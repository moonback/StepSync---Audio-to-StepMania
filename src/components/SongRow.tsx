import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Edit2, Music, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative sm-panel overflow-hidden rounded-xl transition-all duration-300 border ${
        isPlaying 
          ? 'border-[#00f5ff]/60 bg-[#00f5ff]/5 shadow-[0_0_30px_rgba(0,245,255,0.15)]' 
          : 'border-white/10 bg-black/40 hover:border-[#00f5ff]/30'
      }`}
    >
      {/* Beat Grid Background (visible when playing) */}
      <div className={`absolute inset-0 sm-beat-grid opacity-10 transition-opacity duration-500 pointer-events-none ${isPlaying ? 'opacity-30' : 'opacity-0'}`} />
      <div className="absolute inset-0 sm-scanlines opacity-20 pointer-events-none" />

      {/* Remove Button */}
      <button 
        onClick={() => onRemove(song.id)}
        className="absolute top-2 right-2 w-6 h-6 rounded border border-white/10 bg-black/60 text-slate-500 hover:text-white hover:bg-[#e84040] hover:border-[#e84040] transition-all z-30 flex items-center justify-center opacity-0 group-hover:opacity-100"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="relative z-10 p-3 sm:p-4 flex flex-col space-y-3">
        <div className="flex items-center space-x-4">
          {/* Artwork / Play Button */}
          <div 
            onClick={togglePlay}
            className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center cursor-pointer group/art transition-all active:scale-95"
          >
            {song.artworkUrl ? (
              <img 
                src={song.artworkUrl} 
                alt="" 
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ${isPlaying ? 'scale-110' : 'group-hover/art:scale-105'}`}
              />
            ) : (
              <Music className="w-5 h-5 text-slate-600" />
            )}
            
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover/art:opacity-100'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPlaying ? 'bg-[#ff2edb] text-white shadow-[0_0_15px_rgba(255,46,219,0.5)]' : 'bg-[#00f5ff] text-black shadow-[0_0_15px_rgba(0,245,255,0.5)]'}`}>
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
              </div>
            </div>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-0.5">
              <h3 className={`text-sm sm:text-base font-black truncate tracking-tight transition-colors ${isPlaying ? 'text-[#00f5ff] sm-glow-cyan' : 'text-white'}`}>
                {song.title}
              </h3>
              {song.bpm && (
                <div className="flex items-center bg-[#39ff14]/10 text-[#39ff14] px-1.5 py-0.5 rounded border border-[#39ff14]/20 text-[7px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(57,255,20,0.2)]">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                  ANALYSÉ
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px] uppercase tracking-wider italic">
                {song.artist}
              </span>
              <div className="flex items-center space-x-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border transition-colors ${isPlaying ? 'bg-[#00f5ff]/10 border-[#00f5ff]/40 text-[#00f5ff]' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                  {song.bpm ? `${Math.round(song.bpm)} BPM` : '--- BPM'}
                </span>
                <span className="text-[8px] font-mono text-slate-600 font-bold">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowMetadata(!showMetadata)}
              className={`p-2 rounded border transition-all ${
                showMetadata 
                  ? 'bg-[#00f5ff]/10 border-[#00f5ff]/50 text-[#00f5ff] shadow-[0_0_10px_rgba(0,245,255,0.2)]' 
                  : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-black/60 rounded-xl border border-white/5 mt-1">
                {[
                  { label: 'Titre', value: song.title, key: 'title' },
                  { label: 'Artiste', value: song.artist, key: 'artist' },
                  { label: 'Version', value: song.subtitle || '', key: 'subtitle' },
                  { label: 'Genre', value: song.genre || '', key: 'genre' }
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1 block">
                      {field.label}
                    </label>
                    <input 
                      type="text" 
                      value={field.value} 
                      onChange={(e) => onUpdate({ [field.key]: e.target.value })}
                      className="sm-input w-full rounded-lg px-3 py-1.5 text-[10px]"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform Area */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${isPlaying ? 'text-[#ff2edb] sm-glow-pink' : 'text-slate-600'}`}>
                {isPlaying ? 'PLAYING PREVIEW' : 'AUDIO WAVEFORM'}
              </span>
              <div className="h-px w-12 bg-white/5" />
            </div>
            <span className="text-[8px] font-bold text-slate-700 uppercase tracking-tighter">
              {formatSize(song.file.size)} / {song.file.type.split('/')[1].toUpperCase()}
            </span>
          </div>
          
          <div className={`rounded-xl overflow-hidden bg-black/60 border p-1.5 transition-all ${isPlaying ? 'border-[#ff2edb]/30' : 'border-white/5'}`}>
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

      {/* Decorative Arrow (playing state) */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-3 bottom-3 pointer-events-none"
          >
            <ChevronRight className="w-4 h-4 text-[#00f5ff] animate-ping opacity-30" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
