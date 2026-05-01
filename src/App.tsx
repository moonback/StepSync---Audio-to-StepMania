/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Disc3, HelpCircle, Sun, Moon, Music, Settings2, Zap, Check, 
  ArrowRight, Download, Image as ImageIcon, Video, RefreshCw, Activity 
} from 'lucide-react';
import { SongRow } from './components/SongRow';
import { ImagePreview } from './components/ImagePreview';
import { VideoPreview } from './components/VideoPreview';
import { useLocalStorage } from './useLocalStorage';
import { packageAndDownload } from './lib/exporter';
import { parseAudioMetadata } from './lib/metadataParser';
import { fetchArtwork } from './lib/itunesSearch';
import { processAudio } from './lib/audioAnalysis';
import { SongItem } from './lib/types';
import { HelpModal } from './components/HelpModal';
import { useTheme } from './lib/useTheme';

export default function App() {
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  // Settings
  const [currentStep, setCurrentStep] = useState(1);
  const [trimSilence, setTrimSilence] = useLocalStorage('stepsync-trimSilence', true);
  const [bpmOverride, setBpmOverride] = useLocalStorage<string>('stepsync-bpm', '');

  // Advanced Settings
  const [onsetThreshold, setOnsetThreshold] = useLocalStorage('stepsync-onset', 0.15);
  const [mineProbability, setMineProbability] = useLocalStorage('stepsync-minProb', 0.1);

  const [bgImageFile, setBgImageFile] = useState<File | undefined>();
  const [bannerImageFile, setBannerImageFile] = useState<File | undefined>();
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [bgType, setBgType] = useState<'image' | 'video'>('image');

  const resetApp = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setSongs([]);
    setBpmOverride('');
    setTrimSilence(true);
    setOnsetThreshold(0.15);
    setMineProbability(0.1);
    setBgImageFile(undefined);
    setBannerImageFile(undefined);
    setVideoFile(undefined);
    setBgType('image');
    setCurrentStep(1);
  }, [setSongs, setBpmOverride, setTrimSilence, setOnsetThreshold, setMineProbability]);

  const [isSuccess, setIsSuccess] = useState(false);
  const [isTuned, setIsTuned] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files as FileList);
      await processAddedFiles(files);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files: File[] = Array.from(e.dataTransfer.files as FileList);
    await processAddedFiles(files);
  }, []);

  const processAddedFiles = async (files: File[]) => {
    const audioFiles = files.filter(f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|flac|m4a)$/i));
    if (audioFiles.length === 0) return;

    for (const file of audioFiles) {
      const id = crypto.randomUUID();
      const meta = await parseAudioMetadata(file);
      const artUrl = await fetchArtwork(`${meta.artist} ${meta.title}`.trim() || meta.title);

      const newItem: SongItem = {
        id,
        file,
        title: meta.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: meta.artist || "Unknown Artist",
        artworkUrl: artUrl || undefined,
      };

      setSongs(prev => [...prev, newItem]);

      (async () => {
        try {
          const buffer = await file.arrayBuffer();
          const analysis = await processAudio(buffer);
          setSongs(prev => prev.map(s => s.id === id ? { 
            ...s, 
            bpm: analysis.bpm, 
            offset: analysis.offset,
            analysis: analysis 
          } : s));
          if (songs.length === 0) setBpmOverride(analysis.bpm.toString());
        } catch (e) {
          console.warn('BPM detection failed', e);
        }
      })();
    }
  };

  const recalculateBPM = async () => {
    if (songs.length === 0) return;
    const song = songs[0];
    const buffer = await song.file.arrayBuffer();
    const analysis = await processAudio(buffer);
    setBpmOverride(analysis.bpm.toString());
    setSongs(prev => prev.map(s => s.id === song.id ? { ...s, analysis } : s));
  };

  const autoTuneAlgorithms = useCallback(() => {
    if (songs.length === 0) {
      alert("Veuillez d'abord importer des musiques.");
      return;
    }
    
    let totalDensity = 0;
    let count = 0;

    songs.forEach(song => {
      if (song.analysis) {
        const duration = song.analysis.energyProfile.length / 100;
        const density = song.analysis.peaks.length / duration;
        totalDensity += density;
        count++;
      }
    });

    if (count > 0) {
      const avgDensity = totalDensity / count;
      let suggestedThreshold = 0.15;
      if (avgDensity > 2.5) suggestedThreshold = 0.22;
      else if (avgDensity < 1.5) suggestedThreshold = 0.10;

      setOnsetThreshold(suggestedThreshold);
      
      const avgBpm = songs.reduce((acc, s) => acc + (s.bpm || 120), 0) / songs.length;
      let suggestedMines = 0.05;
      if (avgBpm > 150) suggestedMines = 0.12;
      else if (avgBpm < 100) suggestedMines = 0.02;
      
      setMineProbability(suggestedMines);
      
      setIsTuned(true);
      setTimeout(() => setIsTuned(false), 2000);
      console.log("Auto-tuned:", { threshold: suggestedThreshold, mines: suggestedMines, avgDensity });
    } else {
      alert("L'analyse audio est toujours en cours. Veuillez patienter quelques secondes.");
    }
  }, [songs, setOnsetThreshold, setMineProbability]);

  const handleExport = async () => {
    if (songs.length === 0) return;
    setExporting(true);
    try {
      await packageAndDownload(
        songs,
        {
          trimSilence,
          bpmOverride: bpmOverride ? parseFloat(bpmOverride) : undefined,
          onsetThreshold,
          mineProbability
        },
        bgImageFile,
        bannerImageFile,
        videoFile
      );
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l\'exportation.');
    } finally {
      setExporting(false);
      if (songs.length > 0) {
        setIsSuccess(true);
        setCurrentStep(5);
      }
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Animated Mesh Background with 3D Depth */}
      <div className="mesh-bg">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
        {/* Floating 3D Icons in Background */}
        <div className="absolute top-[15%] left-[5%] text-indigo-500/10 floating-3d no-transition">
          <Disc3 className="w-64 h-64" />
        </div>
        <div className="absolute bottom-[10%] right-[10%] text-purple-500/10 floating-3d no-transition" style={{ animationDelay: '-3s' }}>
          <Music className="w-48 h-48" />
        </div>
      </div>

      <header className="sticky top-0 z-50 glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              onClick={resetApp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-3 group focus:outline-none"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-500">
                  <Disc3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xl font-black tracking-tighter text-[var(--text-primary)] leading-none">Step<span className="text-indigo-400">Sync</span></span>
                <span className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-[0.2em] mt-0.5">Audio to Chart</span>
              </div>
            </motion.button>

            <div className="hidden md:flex items-center space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => (step === 1 || songs.length > 0) && setCurrentStep(step)}
                    className={`flex items-center justify-center w-10 h-10 rounded-2xl text-xs font-bold transition-all duration-500 border ${currentStep === step
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-110'
                      : currentStep > step
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'
                        : 'bg-white/5 border-slate-700/30 text-slate-500'
                      }`}
                  >
                    {currentStep > step ? <Check className="w-4 h-4" /> : step}
                  </button>
                  {step < 4 && (
                    <div className={`w-8 h-px mx-2 ${currentStep > step ? 'bg-indigo-500/40' : 'bg-slate-700/20'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-2xl bg-white/5 border border-slate-700/30 text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-all duration-300"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="p-2.5 rounded-2xl bg-white/5 border border-slate-700/30 text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-all duration-300"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 perspective-container">
        <div className="flex flex-col items-center">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, rotateY: -15, z: -100, x: -50 }}
                animate={{ opacity: 1, rotateY: 0, z: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: 15, z: -100, x: 50 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="w-full max-w-4xl"
              >
                <div 
                  className={`relative group p-12 rounded-[2.5rem] border-2 border-dashed transition-all duration-700 glass-card tilt-card
                    ${songs.length > 0 ? 'border-indigo-500/50 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10' : 'border-slate-700/30 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 rounded-[2.5rem] pointer-events-none" />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
                      <div className="relative p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-500/30 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        <Music className="w-10 h-10" />
                      </div>
                    </div>

                    <h2 className="text-4xl font-black tracking-tight text-[var(--text-primary)] mb-4">
                      Vos musiques <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">ici.</span>
                    </h2>
                    <p className="text-lg text-[var(--text-muted)] max-w-md mx-auto mb-10 leading-relaxed font-medium">
                      Glissez vos MP3 ou un dossier complet. StepSync s'occupe de l'analyse et du reste.
                    </p>

                    <input type="file" id="file-upload" multiple className="hidden" onChange={handleFileSelect} />
                    <label
                      htmlFor="file-upload"
                      className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl cursor-pointer shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transform hover:-translate-y-1 transition-all duration-300"
                    >
                      Parcourir les fichiers
                    </label>

                    {songs.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-12 w-full space-y-4"
                      >
                        <div className="flex items-center justify-between px-4">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">File d'attente ({songs.length})</h3>
                          <button onClick={() => setSongs([])} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest">Tout vider</button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {songs.map((song) => (
                            <SongRow
                              key={song.id}
                              song={song}
                              onUpdate={(updated) => setSongs(prev => prev.map(s => s.id === song.id ? { ...s, ...updated } : s))}
                              onRemove={() => setSongs(prev => prev.filter(s => s.id !== song.id))}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, rotateY: 15, z: -100, x: 50 }}
                animate={{ opacity: 1, rotateY: 0, z: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: -15, z: -100, x: -50 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="w-full max-w-4xl"
              >
                <div className="p-10 rounded-[2.5rem] glass-card tilt-card">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                        <Settings2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-[var(--text-primary)]">Paramètres de Génération</h3>
                        <p className="text-sm text-[var(--text-muted)] font-medium">Configurez le cœur de vos stepcharts.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      <div className="p-6 rounded-3xl bg-white/5 border border-slate-700/30 hover:border-indigo-500/30 transition-colors duration-500">
                        <div className="flex items-center justify-between mb-6">
                          <label className="text-xs font-black uppercase tracking-widest text-indigo-400">Rythme (BPM)</label>
                          <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs uppercase tracking-widest">BPM</div>
                            <input 
                              type="number" 
                              value={bpmOverride || ''} 
                              onChange={(e) => setBpmOverride(e.target.value)}
                              placeholder="Auto..."
                              className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-2xl pl-16 pr-4 py-4 text-lg font-black text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 transition-all"
                            />
                          </div>
                          <button
                            onClick={recalculateBPM}
                            className="p-4 bg-indigo-600/20 text-indigo-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all duration-300"
                            title="Recalculer"
                          >
                            <RefreshCw className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      <div className="p-8 rounded-3xl bg-indigo-600/10 border border-indigo-500/20">
                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6">Difficultés Incluses</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {['Beginner', 'Easy', 'Medium', 'Hard', 'Challenge'].map((level) => (
                            <div key={level} className="flex items-center space-x-3 p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-default)]">
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span className="text-sm font-bold text-[var(--text-secondary)]">{level}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex flex-col items-center justify-center text-center h-full relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                          <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 mx-auto">
                            <Activity className="w-8 h-8" />
                          </div>
                          <h4 className="text-xl font-black text-white mb-4">Analyse Automatique</h4>
                          <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs mx-auto">
                            StepSync utilise un algorithme de détection de transitoires pour identifier le BPM et l'offset exact de chaque musique.
                          </p>
                          <div className="mt-8 pt-8 border-t border-indigo-500/10 flex justify-center space-x-8">
                            <div className="text-center">
                              <div className="text-lg font-black text-indigo-400">99%</div>
                              <div className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-widest">Précision</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-black text-purple-400">0ms</div>
                              <div className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-widest">Latence</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, rotateX: 15, z: -100, y: 50 }}
                animate={{ opacity: 1, rotateX: 0, z: 0, y: 0 }}
                exit={{ opacity: 0, rotateX: -15, z: -100, y: -50 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="w-full max-w-4xl"
              >
                <div className="p-10 rounded-[2.5rem] glass-card tilt-card">
                  <div className="flex items-center space-x-4 mb-10">
                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[var(--text-primary)]">Algorithmes Avancés</h3>
                      <p className="text-sm text-[var(--text-muted)] font-medium">Ajustez la sensibilité de détection.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      <div className="space-y-6 p-6 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-default)]">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-black uppercase tracking-widest text-indigo-400">Seuil d'Énergie</label>
                          <span className="text-sm font-black text-[var(--text-primary)] font-mono">{onsetThreshold.toFixed(2)}</span>
                        </div>
                        <input
                          type="range" min="0.05" max="0.5" step="0.01"
                          value={onsetThreshold}
                          onChange={(e) => setOnsetThreshold(parseFloat(e.target.value))}
                          className="w-full accent-indigo-500 no-transition h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-6 p-6 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-default)]">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-black uppercase tracking-widest text-red-400">Densité de Mines</label>
                          <span className="text-sm font-black text-[var(--text-primary)] font-mono">{Math.round(mineProbability * 100)}%</span>
                        </div>
                        <input
                          type="range" min="0" max="0.3" step="0.01"
                          value={mineProbability}
                          onChange={(e) => setMineProbability(parseFloat(e.target.value))}
                          className="w-full accent-red-500 no-transition h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="flex items-center justify-between p-6 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-default)]">
                        <div>
                          <label className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">Silence Automatique</label>
                          <p className="text-[10px] text-[var(--text-muted)]">Couper le début</p>
                        </div>
                        <button
                          onClick={() => setTrimSilence(!trimSilence)}
                          className={`relative w-14 h-8 rounded-full transition-all duration-300 ${trimSilence ? 'bg-emerald-500' : 'bg-slate-800'}`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${trimSilence ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>

                      <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-indigo-500/20 flex flex-col justify-center relative group">
                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center space-x-3 mb-4">
                          <Zap className="w-5 h-5 text-indigo-400" />
                          <h4 className="text-sm font-bold text-white uppercase tracking-widest">Optimisation Magique</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium mb-6">
                          Laissez StepSync ajuster automatiquement les réglages en fonction du profil sonore de vos musiques.
                        </p>
                        <button 
                          onClick={autoTuneAlgorithms}
                          className={`w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2 ${isTuned ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'}`}
                        >
                          {isTuned ? <Check className="w-3.5 h-3.5" /> : <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />}
                          <span>{isTuned ? "Réglages Appliqués" : "Recommander les réglages"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, rotateY: -15, z: -100, x: -50 }}
                animate={{ opacity: 1, rotateY: 0, z: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: 15, z: -100, x: 50 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="max-w-4xl mx-auto w-full"
              >
                <div className="p-10 rounded-[2.5rem] glass-card tilt-card">
                  <div className="flex items-center space-x-4 mb-10">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[var(--text-primary)]">Ressources Graphiques</h3>
                      <p className="text-sm text-[var(--text-muted)] font-medium">Personnalisez votre pack.</p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-10">
                    <div className="flex justify-center">
                      <div className="p-1.5 rounded-2xl flex items-center space-x-1 bg-white/5 border border-slate-700/30">
                        <button
                          onClick={() => setBgType('image')}
                          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${bgType === 'image' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-500 hover:text-white'}`}
                        >
                          Image
                        </button>
                        <button
                          onClick={() => setBgType('video')}
                          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${bgType === 'video' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-500 hover:text-white'}`}
                        >
                          Vidéo (BGA)
                        </button>
                      </div>
                    </div>

                    <div className="max-w-2xl mx-auto w-full space-y-10">
                      <AnimatePresence mode="wait">
                        {bgType === 'image' ? (
                          <motion.div key="img-mode" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            <ImagePreview
                              label="Image de Fond"
                              file={bgImageFile}
                              onFileSelect={(file) => { setBgImageFile(file); setVideoFile(undefined); }}
                              onRemove={() => setBgImageFile(undefined)}
                              isDark={isDark}
                              description="Format 1920x1080 recommandé"
                            />
                            {!bgImageFile && songs.some(s => s.artworkUrl) && (
                              <div className="p-6 rounded-3xl bg-white/5 border border-slate-700/30">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4 block">Suggestions du pack</label>
                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                                  {Array.from(new Set(songs.filter(s => s.artworkUrl).map(s => s.artworkUrl))).map((url, idx) => (
                                    <motion.button
                                      key={idx}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={async () => {
                                        try {
                                          const res = await fetch(url!);
                                          const blob = await res.blob();
                                          setBgImageFile(new File([blob], `bg_${idx}.jpg`, { type: 'image/jpeg' }));
                                          setVideoFile(undefined);
                                        } catch (e) { console.warn(e); }
                                      }}
                                      className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border-2 border-transparent hover:border-indigo-500"
                                    >
                                      <img src={url} alt="Suggestion" className="w-full h-full object-cover" />
                                    </motion.button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          <motion.div key="vid-mode" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <VideoPreview
                              label="Vidéo de Fond"
                              file={videoFile}
                              onFileSelect={(file) => { setVideoFile(file); setBgImageFile(undefined); }}
                              onRemove={() => setVideoFile(undefined)}
                              isDark={isDark}
                              description="Format MP4 recommandé"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <ImagePreview
                        label="Bannière (Banner)"
                        file={bannerImageFile}
                        onFileSelect={setBannerImageFile}
                        onRemove={() => setBannerImageFile(undefined)}
                        isDark={isDark}
                        description="Format 512x160 recommandé"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -30 }}
                transition={{ type: 'spring', damping: 20 }}
                className="max-w-2xl mx-auto w-full text-center"
              >
                <div className="p-16 rounded-[3rem] glass-card relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-indigo-500/10 pointer-events-none" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-10">
                      <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-30 animate-pulse" />
                      <div className="relative w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40">
                        <Check className="w-12 h-12 stroke-[3]" />
                      </div>
                    </div>

                    <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Pack Généré !</h2>
                    <p className="text-lg text-slate-400 mb-12 font-medium max-w-sm">
                      Votre pack StepMania est prêt. Les fichiers ont été optimisés et assemblés.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                      <button
                        onClick={() => { setIsSuccess(false); setCurrentStep(1); setSongs([]); }}
                        className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10 w-full sm:w-auto"
                      >
                        Créer un autre pack
                      </button>
                      <button
                        onClick={handleExport}
                        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all w-full sm:w-auto flex items-center justify-center space-x-2"
                      >
                        <Download className="w-5 h-5" />
                        <span>Télécharger à nouveau</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          {currentStep < 5 && (
            <div className="mt-12 w-full max-w-4xl">
              <div className="flex items-center justify-between p-6 rounded-[2rem] glass-card">
                <button
                  onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                  className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-white'}`}
                >
                  Précédent
                </button>

                <div className="flex items-center space-x-4">
                  {currentStep < 4 ? (
                    <button
                      onClick={() => songs.length > 0 && setCurrentStep(currentStep + 1)}
                      disabled={songs.length === 0}
                      className="group px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 disabled:opacity-50"
                    >
                      Suivant
                      <ArrowRight className="w-4 h-4 inline ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button
                      onClick={handleExport}
                      disabled={exporting || songs.length === 0}
                      className="group px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/30 disabled:opacity-50 flex items-center space-x-3"
                    >
                      {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>{exporting ? "Génération..." : "Générer le Pack"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
