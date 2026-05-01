import React, { useState, useEffect } from 'react';

export function ImagePreview({ file, className }: { file: File; className?: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!previewUrl) return null;

  return (
    <img src={previewUrl} alt="Aperçu" className={`object-cover rounded border border-slate-700 ${className || ''}`} />
  );
}
