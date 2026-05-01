import React, { useState, useRef, useEffect } from 'react';
import { X, PlayCircle, PauseCircle } from 'lucide-react';
import { WaveformPreview } from './WaveformPreview';
import { SongItem } from '../App';

export function SongRow({ song, onRemove }: { song: SongItem; onRemove: (id: string) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(song.file);
    const audio = new Audio(url);
    audioRef.current = audio;
    
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
          <div className="overflow-hidden">
            <div className="font-semibold text-white truncate">{song.title}</div>
            <div className="text-sm text-slate-400 truncate">{song.artist}</div>
          </div>
        </div>
      </div>
      <WaveformPreview file={song.file} />
    </div>
  );
}
