import React, { useState, useRef, useEffect } from 'react';
import { X, PlayCircle, PauseCircle, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
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

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return (bytes / 1024).toFixed(1) + ' Ko';
    return mb.toFixed(1) + ' Mo';
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl relative group backdrop-blur-sm">
      <button 
        onClick={() => onRemove(song.id)}
        className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Retirer"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 w-full pr-8">
          <button 
            onClick={togglePlay} 
            className="text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
            title={isPlaying ? "Mettre en pause" : "Jouer"}
          >
            {isPlaying ? <PauseCircle className="w-8 h-8" /> : <PlayCircle className="w-8 h-8" />}
          </button>
          <div className="flex-1 overflow-hidden">
            <div className="font-semibold text-[var(--text-primary)] truncate">{song.title}</div>
            <div className="flex items-center space-x-2 text-xs text-[var(--text-secondary)] mt-1">
              <span className="truncate max-w-[150px] sm:max-w-[200px]" title={song.artist}>{song.artist}</span>
              <span>•</span>
              <span className="font-mono">{formatDuration(duration)}</span>
              <span>•</span>
              <span className="font-mono">{formatSize(song.file.size)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowMetadata(!showMetadata)}
              className={`p-2 rounded-lg transition-colors ${showMetadata ? 'bg-indigo-500/20 text-indigo-400' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
              title="Modifier les métadonnées"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showMetadata && (
        <div className="mt-4 pt-4 border-t border-[var(--border-card)] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Titre</label>
            <input 
              type="text" 
              value={song.title} 
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Sous-titre</label>
            <input 
              type="text" 
              value={song.subtitle || ''} 
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Artiste</label>
            <input 
              type="text" 
              value={song.artist} 
              onChange={(e) => onUpdate({ artist: e.target.value })}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Genre</label>
            <input 
              type="text" 
              value={song.genre || ''} 
              onChange={(e) => onUpdate({ genre: e.target.value })}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Titre Translit.</label>
            <input 
              type="text" 
              value={song.titleTranslit || ''} 
              onChange={(e) => onUpdate({ titleTranslit: e.target.value })}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Artiste Translit.</label>
            <input 
              type="text" 
              value={song.artistTranslit || ''} 
              onChange={(e) => onUpdate({ artistTranslit: e.target.value })}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Crédit</label>
            <input 
              type="text" 
              value={song.credit || ''} 
              onChange={(e) => onUpdate({ credit: e.target.value })}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center space-x-2 mb-3">
          <button 
            onClick={() => setPreviewMode('waveform')}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${previewMode === 'waveform' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            Forme d'onde
          </button>
          <button 
            onClick={() => setPreviewMode('3d')}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center space-x-1 ${previewMode === '3d' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
            Prévisualisation 3D
          </button>
        </div>
        
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
          <GamePreviewWrapper 
            song={song} 
            audioRef={audioRef} 
            isPlaying={isPlaying} 
          />
        )}
      </div>
    </div>
  );
}
