import React, { useState, useEffect } from 'react';
import { ImageIcon, X, Upload } from 'lucide-react';

interface ImagePreviewProps {
  label: string;
  file?: File;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  isDark: boolean;
  description?: string;
  className?: string;
}

export function ImagePreview({ 
  label, 
  file, 
  onFileSelect, 
  onRemove, 
  isDark, 
  description,
  className 
}: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
          accept="image/*" 
          onChange={handleInput} 
        />
        
        {previewUrl ? (
          <div className="w-full h-full relative group">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <div 
              className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); document.getElementById(`upload-${label}`)?.click(); }}
            >
              <p className="text-xs text-white font-bold flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Changer l'image
              </p>
            </div>
            {file && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[9px] text-white font-mono">
                {(file.size / 1024).toFixed(0)} KB
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center p-6 text-center">
            <div className="p-3 bg-indigo-500/10 rounded-xl mb-3 text-indigo-400 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">Cliquez pour importer</p>
            {description && <p className="text-[9px] text-[var(--text-dim)] mt-1">{description}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
