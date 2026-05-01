import React from 'react';
import { Music } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-8 sm:py-12 px-4 border-t border-[var(--glass-border)] bg-black/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 md:gap-8">
        <div className="flex flex-col items-center md:items-start space-y-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Music className="w-4 h-4" />
            </div>
            <span className="text-xl font-black tracking-tighter text-[var(--text-primary)]">StepSync</span>
          </div>
          <p className="text-xs font-medium text-[var(--text-dim)] text-center md:text-left max-w-[200px] sm:max-w-none">
            Transformez votre musique en StepCharts instantanément.
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
          <a href="https://github.com/moonback/StepSync---Audio-to-StepMania/blob/main/DOCUMENTATION.md" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">Documentation</a>
          <a href="https://github.com/moonback/StepSync---Audio-to-StepMania" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">Code Source</a>
          <a href="https://github.com/moonback" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">A propos</a>
        </div>

        <div className="flex flex-col items-center md:items-end space-y-1 pt-4 md:pt-0 border-t md:border-none border-white/5 w-full md:w-auto">
          <div className="text-xs font-black text-[var(--text-primary)]">Version 1.8</div>
          <div className="text-[10px] text-[var(--text-dim)] font-bold">© 2026 Maysson.D</div>
        </div>
      </div>
    </footer>
  );
};
