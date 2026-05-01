import React, { useEffect, useRef } from 'react';

export function WaveformPreview({ file }: { file: File }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let active = true;

    async function drawWaveform() {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      // Draw loading state
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#818cf8';
      ctx.font = '12px Inter';
      ctx.fillText('Analyzing audio...', 10, height / 2);

      let audioCtx: AudioContext | null = null;
      try {
        const arrayBuffer = await file.arrayBuffer();
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        
        if (!active) {
            await audioCtx.close();
            return;
        }

        const channelData = decoded.getChannelData(0);
        const step = Math.ceil(channelData.length / width);
        const amp = height / 2;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#818cf8'; // Indigo waveform
        
        for (let i = 0; i < width; i++) {
          let min = 1.0;
          let max = -1.0;
          for (let j = 0; j < step; j++) {
            const datum = channelData[i * step + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }

      } catch (e) {
        console.error(e);
      } finally {
         if (audioCtx && audioCtx.state !== 'closed') {
             await audioCtx.close();
         }
      }
    }

    drawWaveform();

    return () => {
      active = false;
    };
  }, [file]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={60} 
      className="w-full h-16 rounded-md border border-slate-700 bg-slate-900"
    />
  );
}
