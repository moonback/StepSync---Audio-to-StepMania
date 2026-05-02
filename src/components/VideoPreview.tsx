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
    <div className={`space-y-2 ${className || ''}`}>
      <div className="flex items-center justify-between px-1">
        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#39ff14] sm-glow-green">{label}</label>
        {file && (
          <button 
            onClick={onRemove} 
            className="text-[8px] font-black uppercase tracking-tighter text-[#ff2edb] hover:text-white transition-colors"
          >
            [ REMOVE ]
          </button>
        )}
      </div>

      <div 
        className={`relative group cursor-pointer sm-panel sm-scanlines rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center transition-all duration-300
        ${file ? 'border-[#39ff14]/30' : 'border-white/5 hover:border-[#39ff14]/30 bg-black/40'}`}
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
              className="w-full h-full object-cover opacity-80 group-hover/vid:opacity-100 transition-opacity" 
              muted={true} 
              loop 
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Play/Pause Overlay */}
            <div 
              className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
              onClick={togglePlay}
            >
              <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl transform group-hover/vid:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-5 h-5 text-[#39ff14] sm-glow-green" /> : <Play className="w-5 h-5 text-[#39ff14] sm-glow-green ml-1" />}
              </div>
            </div>

            {/* Change Video Button */}
            <div 
              className="absolute top-2 right-2 p-1.5 bg-black/80 border border-white/10 rounded-md opacity-0 group-hover/vid:opacity-100 transition-opacity hover:border-[#39ff14]"
              onClick={(e) => { e.stopPropagation(); document.getElementById(`upload-${label}`)?.click(); }}
            >
              <Upload className="w-3.5 h-3.5 text-[#39ff14]" />
            </div>

            {file && (
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/80 border border-white/10 rounded text-[7px] text-[#39ff14] font-black uppercase tracking-widest">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center p-6 text-center">
            <div className="p-3 bg-white/5 rounded-xl mb-3 text-white/20 group-hover:text-[#39ff14] group-hover:scale-110 transition-all">
              <Video className="w-6 h-6" />
            </div>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-white">Insert Video</p>
            {description && <p className="text-[7px] text-white/20 uppercase tracking-tighter mt-1">{description}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
