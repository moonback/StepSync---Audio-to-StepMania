import React, { useEffect, useState } from 'react';

interface VideoPreviewProps {
  file: File;
  className?: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ file, className }) => {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return null;

  return (
    <video 
      src={url} 
      className={className} 
      muted 
      loop 
      onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
      onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
    />
  );
};
