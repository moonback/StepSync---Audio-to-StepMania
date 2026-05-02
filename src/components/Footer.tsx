import React from 'react';
import { Music, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-8 px-4 sm-panel sm-scanlines border-t border-white/5 bg-black/60 relative overflow-hidden">
      <div className="absolute inset-0 sm-beat-grid opacity-5 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
        <div className="flex flex-col items-center md:items-start space-y-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-[#ff2edb] sm-glow-pink" />
            <span className="text-lg font-black tracking-tighter text-white">
              Step<span className="text-[#00f5ff] sm-glow-cyan">Sync</span>
            </span>
          </div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center md:text-left">
            Arcade-Grade StepChart Generator
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
          <a href="https://github.com/moonback/StepSync---Audio-to-StepMania/blob/main/DOCUMENTATION.md" target="_blank" rel="noopener noreferrer" className="hover:text-[#00f5ff] transition-colors">DOCS</a>
          <a href="https://github.com/moonback/StepSync---Audio-to-StepMania" target="_blank" rel="noopener noreferrer" className="hover:text-[#00f5ff] transition-colors">GITHUB</a>
          <a href="https://github.com/moonback" target="_blank" rel="noopener noreferrer" className="hover:text-[#00f5ff] transition-colors">CREDITS</a>
        </div>

        <div className="flex flex-col items-center md:items-end space-y-1">
          <div className="text-[9px] font-black text-white px-2 py-0.5 border border-[#39ff14]/30 rounded text-[#39ff14]">VER 2.0.0-PRO</div>
          <div className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">© 2026 STEPSYNC ENGINE</div>
        </div>
      </div>
    </footer>
  );
};
