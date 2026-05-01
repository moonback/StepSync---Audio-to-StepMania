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
        // We want a high enough resolution for the canvas
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
    const amp = height / 2;
    const progressX = duration > 0 ? (currentTime / duration) * width : 0;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
    
    for (let i = 0; i < width; i++) {
      const peak = peaks[i] || 0;
      const barHeight = Math.max(2, peak * height * 0.8);
      
      if (i < progressX) {
        ctx.fillStyle = '#818cf8'; // Played
      } else {
        ctx.fillStyle = '#334155'; // Unplayed
      }
      
      ctx.fillRect(i, (height - barHeight) / 2, 1, barHeight);
    }

    // Progress line
    if (progressX > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(progressX - 1, 0, 2, height);
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
        className="relative group cursor-pointer h-16"
        onClick={handleInteraction}
    >
        {isAnalysing && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/50 rounded-xl">
             <div className="flex items-center space-x-2">
               <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
               <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
               <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={80} 
          className="w-full h-full rounded-xl border border-slate-800 bg-slate-950 transition-all group-hover:border-slate-700 shadow-inner"
        />
    </div>
  );
}
