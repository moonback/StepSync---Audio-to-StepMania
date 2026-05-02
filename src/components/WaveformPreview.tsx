import React, { useEffect, useRef, useState } from 'react';

interface WaveformPreviewProps {
  file: File;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
}

export function WaveformPreview({ file, currentTime = 0, duration = 0, onSeek }: WaveformPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const peaksRef = useRef<number[]>([]);
  const [isAnalysing, setIsAnalysing] = useState(true);

  // Effect to decode audio only once per file
  useEffect(() => {
    let active = true;
    setIsAnalysing(true);
    peaksRef.current = [];

    async function analyzeAudio() {
      let audioCtx: AudioContext | null = null;
      try {
        const arrayBuffer = await file.arrayBuffer();
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        
        if (!active) return;

        const channelData = decoded.getChannelData(0);
        const width = 800; 
        const peaks = [];
        const step = Math.ceil(channelData.length / width);
        
        for (let i = 0; i < width; i++) {
          let max = 0;
          for (let j = 0; j < step; j++) {
            const datum = Math.abs(channelData[i * step + j] || 0);
            if (datum > max) max = datum;
          }
          peaks.push(max);
        }
        
        peaksRef.current = peaks;
        setIsAnalysing(false);
      } catch (e) {
        console.error("Analysis failed", e);
      } finally {
        if (audioCtx) await audioCtx.close();
      }
    }

    analyzeAudio();
    return () => { active = false; };
  }, [file]);

  // Effect to draw waveform and progress
  useEffect(() => {
    if (!canvasRef.current || isAnalysing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const peaks = peaksRef.current;
    const progressX = duration > 0 ? (currentTime / duration) * width : 0;

    // Use arcade palette
    const bgColor = '#000000';
    const playedColor = '#00f5ff'; // Cyan
    const unplayedColor = 'rgba(255, 255, 255, 0.15)';
    const gridColor = 'rgba(255, 255, 255, 0.05)';

    ctx.clearRect(0, 0, width, height);
    
    // Draw background and grid
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    
    // Draw peaks
    for (let i = 0; i < width; i++) {
      const peak = peaks[i] || 0;
      const barHeight = Math.max(1, peak * height * 0.9);
      
      const isPlayed = i < progressX;
      ctx.fillStyle = isPlayed ? playedColor : unplayedColor;
      
      if (isPlayed) {
        // Add a small glow to the played bars
        ctx.shadowBlur = 4;
        ctx.shadowColor = playedColor;
      } else {
        ctx.shadowBlur = 0;
      }
      
      ctx.fillRect(i, (height - barHeight) / 2, 1, barHeight);
    }
    
    ctx.shadowBlur = 0;

    // Progress line (Arcade Cursor style)
    if (progressX > 0) {
      ctx.fillStyle = '#ff2edb'; // Pink cursor
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff2edb';
      ctx.fillRect(progressX - 1, 0, 2, height);
      
      // Glow on cursor
      const grad = ctx.createRadialGradient(progressX, height/2, 0, progressX, height/2, 10);
      grad.addColorStop(0, 'rgba(255, 46, 219, 0.3)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(progressX - 10, 0, 20, height);
    }
  }, [isAnalysing, currentTime, duration]);

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current || !onSeek || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percentage * duration);
  };

  return (
    <div 
        ref={containerRef}
        className="relative group cursor-pointer h-16 overflow-hidden sm-panel sm-scanlines rounded-lg"
        onClick={handleInteraction}
    >
        {isAnalysing && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
             <div className="flex items-center space-x-2">
               <div className="w-1.5 h-6 bg-[#00f5ff] animate-pulse shadow-[0_0_10px_#00f5ff]" />
               <div className="text-[10px] font-black text-[#00f5ff] uppercase tracking-widest">Analysing...</div>
             </div>
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={80} 
          className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
        />
    </div>
  );
}
