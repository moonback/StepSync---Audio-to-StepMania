import React, { useState, useRef, useEffect } from 'react';
import { X, PlayCircle, PauseCircle } from 'lucide-react';
import { WaveformPreview } from './WaveformPreview';
import { SongItem } from '../App';

export function SongRow({ song, onRemove }: { song: SongItem; onRemove: (id: string) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(song.file);
    const audio = new Audio(url);
    audioRef.current = audio;
    
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
    
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
    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl relative group">
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
            <div className="font-semibold text-white truncate">{song.title}</div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
              <span className="truncate max-w-[150px] sm:max-w-[200px]" title={song.artist}>{song.artist}</span>
              <span>•</span>
              <span className="font-mono">{formatDuration(duration)}</span>
              <span>•</span>
              <span className="font-mono">{formatSize(song.file.size)}</span>
            </div>
          </div>
        </div>
      </div>
      <WaveformPreview file={song.file} />
    </div>
  );
}
