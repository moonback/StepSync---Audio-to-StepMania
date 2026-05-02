import React, { useState, useEffect } from 'react';
import { ImageIcon, X, Upload } from 'lucide-react';

interface ImagePreviewProps {
  label: string;
  file?: File;
  imageUrl?: string;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  description?: string;
  className?: string;
}

export function ImagePreview({ 
  label, 
  file, 
  imageUrl,
  onFileSelect, 
  onRemove, 
  description,
  className 
}: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (imageUrl) {
      setPreviewUrl(imageUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [file, imageUrl]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div className="flex items-center justify-between px-1">
        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00f5ff] sm-glow-cyan">{label}</label>
        {(file || imageUrl) && (
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
        ${file || imageUrl ? 'border-[#00f5ff]/30' : 'border-white/5 hover:border-[#00f5ff]/30 bg-black/40'}`}
        onClick={() => !file && !imageUrl && document.getElementById(`upload-${label}`)?.click()}
      >
        <input 
          type="file" 
          id={`upload-${label}`} 
          className="hidden" 
          accept="image/*" 
          onChange={handleInput} 
        />
        
        {previewUrl ? (
          <div className="w-full h-full relative group">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            <div 
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center"
              onClick={(e) => { e.stopPropagation(); document.getElementById(`upload-${label}`)?.click(); }}
            >
              <div className="p-2 bg-[#00f5ff]/10 rounded-full mb-2">
                <Upload className="w-4 h-4 text-[#00f5ff] sm-glow-cyan" />
              </div>
              <p className="text-[9px] text-white font-black uppercase tracking-widest">
                Change Image
              </p>
            </div>
            {(file || imageUrl) && (
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/80 border border-white/10 rounded text-[7px] text-[#39ff14] font-black uppercase tracking-widest">
                {file ? `${(file.size / 1024).toFixed(0)} KB` : 'REMOTE'}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center p-6 text-center">
            <div className="p-3 bg-white/5 rounded-xl mb-3 text-white/20 group-hover:text-[#00f5ff] group-hover:scale-110 transition-all">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-white">Insert Media</p>
            {description && <p className="text-[7px] text-white/20 uppercase tracking-tighter mt-1">{description}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
