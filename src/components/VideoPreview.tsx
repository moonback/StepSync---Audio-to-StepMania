import React, { useEffect, useState, useRef } from 'react';
import { Video, X, Upload, Play, Pause } from 'lucide-react';

interface VideoPreviewProps {
  label: string;
  file?: File;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  description?: string;
  className?: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ 
  label, 
  file, 
  onFileSelect, 
  onRemove, 
  description,
  className 
}) => {
  const [url, setUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!file) {
      setUrl('');
      setIsPlaying(false);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{label}</label>
        {file && (
          <button onClick={onRemove} className="text-[10px] font-bold uppercase tracking-tighter text-red-400 hover:text-red-300 transition-colors">
            Supprimer
          </button>
        )}
      </div>

      <div 
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all overflow-hidden aspect-video flex flex-col items-center justify-center
        ${file ? 'border-indigo-500/50 bg-indigo-500/5' : `border-[var(--border-card)] hover:border-indigo-500/30 bg-[var(--bg-drop)]`}`}
        onClick={() => !file && document.getElementById(`upload-${label}`)?.click()}
      >
        <input 
          type="file" 
          id={`upload-${label}`} 
          className="hidden" 
          accept="video/mp4,video/x-msvideo,video/quicktime" 
          onChange={handleInput} 
        />

        {url ? (
          <div className="w-full h-full relative group/vid">
            <video 
              ref={videoRef}
              src={url} 
              className="w-full h-full object-cover" 
              muted={false} 
              loop 
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Play/Pause Overlay */}
            <div 
              className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
              onClick={togglePlay}
            >
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl transform group-hover/vid:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
              </div>
            </div>

            {/* Change Video Button */}
            <div 
              className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-lg opacity-0 group-hover/vid:opacity-100 transition-opacity hover:bg-indigo-600"
              onClick={(e) => { e.stopPropagation(); document.getElementById(`upload-${label}`)?.click(); }}
              title="Changer la vidéo"
            >
              <Upload className="w-4 h-4 text-white" />
            </div>

            {file && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[9px] text-white font-mono">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center p-6 text-center">
            <div className="p-3 bg-indigo-500/10 rounded-xl mb-3 text-indigo-400 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">Cliquez pour importer</p>
            {description && <p className="text-[9px] text-[var(--text-dim)] mt-1">{description}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
