/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, Settings, Download, X, PlayCircle, Image as ImageIcon, Music, LayoutDashboard, Zap, Activity, Hash, ShieldAlert, Sliders, Github, Heart, ExternalLink, Disc3, HelpCircle, Sun, Moon, Video } from 'lucide-react';
import { WaveformPreview } from './components/WaveformPreview';
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
  const [isHovering, setIsHovering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  // Settings
  const [currentStep, setCurrentStep] = useState(1);
  const [trimSilence, setTrimSilence] = useLocalStorage('stepsync-trimSilence', true);
  const [bpmOverride, setBpmOverride] = useLocalStorage<string>('stepsync-bpm', '');

  // Advanced Settings
  const [onsetThreshold, setOnsetThreshold] = useLocalStorage('stepsync-onset', 1.5);
  const [mineProbability, setMineProbability] = useLocalStorage('stepsync-minProb', 0.1);

  const [bgImageFile, setBgImageFile] = useState<File | undefined>();
  const [bannerImageFile, setBannerImageFile] = useState<File | undefined>();
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [bgType, setBgType] = useState<'image' | 'video'>('image');

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);

    // Fallback typing for dataTransfer files
    const files: File[] = Array.from(e.dataTransfer.files as FileList);
    await processAddedFiles(files);
  }, [songs, videoFile, bgImageFile, bannerImageFile]);

  const resetApp = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setSongs([]);
    setBpmOverride('');
    setTrimSilence(true);
    setOnsetThreshold(1.5);
    setMineProbability(0.1);
    setBgImageFile(undefined);
    setBannerImageFile(undefined);
    setVideoFile(undefined);
    setBgType('image');
    setCurrentStep(1);
  }, [setSongs, setBpmOverride, setTrimSilence, setOnsetThreshold, setMineProbability, setBgImageFile, setBannerImageFile, setVideoFile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files as FileList);
      await processAddedFiles(files);
    }
  };

  const processAddedFiles = async (files: File[]) => {
    const audioFiles = files.filter(f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|flac|m4a)$/i));

    if (audioFiles.length === 0) return;

    // Optional: look for resource files if they dropped a folder
    if (!videoFile && !bgImageFile) {
      const vid = files.find(f => f.name.match(/\.(mp4|avi|mov)$/i));
      if (vid) {
        setVideoFile(vid);
        setBgImageFile(undefined);
        setBgType('video');
      } else {
        const bg = files.find(f => f.name.match(/bg\.(jpg|png)$/i) || f.name.match(/background\.(jpg|png)$/i));
        if (bg) setBgImageFile(bg);
      }
    }
    if (!bannerImageFile) {
      const bn = files.find(f => f.name.match(/bn\.(jpg|png)$/i) || f.name.match(/banner\.(jpg|png)$/i));
      if (bn) setBannerImageFile(bn);
    }

    for (const file of audioFiles) {
      const id = crypto.randomUUID();
      const meta = await parseAudioMetadata(file);
      const artUrl = await fetchArtwork(`${meta.artist} ${meta.title}`.trim() || meta.title);

      const newItem: SongItem = {
        id,
        file,
        title: meta.title,
        artist: meta.artist,
        subtitle: '',
        titleTranslit: '',
        subtitleTranslit: '',
        artistTranslit: '',
        genre: '',
        credit: 'StepSync par Maysson.D',
        artworkUrl: artUrl || undefined,
      };

      setSongs(prev => [...prev, newItem]);

      // Process audio in background
      (async () => {
        try {
          const buffer = await file.arrayBuffer();
          const analysis = await processAudio(buffer);

          setSongs(prev => prev.map(s => s.id === id ? {
            ...s,
            bpm: analysis.bpm,
            offset: analysis.offset
          } : s));

          // If it's the first song and no global BPM is set, update global override
          setBpmOverride(current => {
            if (!current) return analysis.bpm.toString();
            return current;
          });
        } catch (e) {
          console.warn('BPM detection failed for', file.name, e);
        }
      })();
    }
  };

  const handleExport = async () => {
    if (songs.length === 0) return;
    setIsProcessing(true);
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
      alert('Échec du traitement et de l\'exportation. Veuillez vérifier la console pour plus de détails.');
    } finally {
      setIsProcessing(false);
    }
  };

  // UI rendering
  return (
    <div className={`min-h-screen font-sans selection:bg-indigo-500/30 relative overflow-x-hidden bg-[var(--bg-app)] text-[var(--text-primary)]`}>
      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-400/15'}`} />
        <div className={`absolute top-[20%] -right-[10%] w-[30%] h-[50%] rounded-full blur-[100px] ${isDark ? 'bg-blue-600/10' : 'bg-blue-400/10'}`} />
        <div className={`absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] rounded-full blur-[120px] ${isDark ? 'bg-purple-600/10' : 'bg-purple-400/10'}`} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header / Navbar */}
        <header className="sticky top-0 z-50">
          {/* Top accent gradient line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          <div className={`backdrop-blur-2xl border-b bg-[var(--bg-header)] border-[var(--border-default)]`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Left: Logo + Brand */}
                <div className="flex items-center space-x-4">
                  <div className="relative flex items-center justify-center w-9 h-9">
                    <div className="absolute inset-0 bg-indigo-500/15 rounded-xl blur-md" />
                    <div className="relative w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/30">
                      <Disc3 className="w-5 h-5 text-white animate-[spin_6s_linear_infinite]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <button onClick={resetApp} className="group flex items-center space-x-2.5 focus:outline-none">
                      <h1 className="text-lg sm:text-xl font-black tracking-tight text-[var(--text-primary)]">
                        Step<span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Sync</span>
                      </h1>
                    </button>
                    <span className="hidden sm:inline-flex px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-[0.15em] rounded border border-indigo-500/20">
                      v1.8
                    </span>
                  </div>
                </div>

                {/* Center: Step Indicator */}
                <div className="hidden md:flex items-center space-x-4">
                  {[1, 2, 3, 4].map((step) => (
                    <button
                      key={step}
                      onClick={() => {
                        if (step === 1 || (step > 1 && songs.length > 0)) {
                          setCurrentStep(step);
                        }
                      }}
                      disabled={step > 1 && songs.length === 0}
                      className="flex items-center group focus:outline-none"
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold transition-all border ${currentStep === step
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                        : currentStep > step
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                          : 'bg-[var(--bg-hover)] border-[var(--border-default)] text-[var(--text-muted)] group-hover:border-indigo-500/30'
                        }`}>
                        {currentStep > step ? '✓' : step}
                      </div>
                      {step < 4 && (
                        <div className={`w-8 h-[1px] ml-4 ${currentStep > step ? 'bg-emerald-500/30' : 'bg-[var(--border-default)]'}`} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-yellow-400' : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600'} hover:shadow-lg`}
                    title={isDark ? "Passer au mode clair" : "Passer au mode sombre"}
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setShowHelp(true)}
                    className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400' : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600'} hover:shadow-lg`}
                    title="Aide & Tutoriel"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Navigation Controls (Top) */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {currentStep === 1 && "Glissez-déposez vos fichiers ou dossier ici"}
              {currentStep === 2 && "Paramètres de Génération"}
              {currentStep === 3 && "Options Avancées"}
              {currentStep === 4 && "Ressources Graphiques"}
            </h2>

            <div className="flex items-center space-x-3">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Précédent
                </button>
              )}
              {currentStep < 4 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={currentStep === 1 && songs.length === 0}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${currentStep === 1 && songs.length === 0
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
                    }`}
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={handleExport}
                  disabled={songs.length === 0 || isProcessing}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${songs.length === 0 || isProcessing
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
                    }`}
                >
                  {isProcessing ? 'Traitement...' : 'Finaliser & Télécharger'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                    onDragLeave={() => setIsHovering(false)}
                    onDrop={handleDrop}
                    className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-500 group
                      ${isHovering
                        ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01] shadow-2xl shadow-indigo-500/10'
                        : isDark ? 'border-slate-800 bg-slate-900/30 hover:border-slate-700' : 'border-slate-200 bg-white/50 hover:border-slate-300'}`}
                  >
                    <div className="p-12 sm:p-20 flex flex-col items-center text-center relative z-10">
                      <div className={`mb-8 p-6 rounded-3xl transition-all duration-500 ${isHovering ? 'bg-indigo-500 text-white scale-110 shadow-xl shadow-indigo-500/40 rotate-12' : 'bg-indigo-500/10 text-indigo-400 group-hover:scale-105 group-hover:rotate-6'}`}>
                        <UploadCloud className="w-12 h-12" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight text-[var(--text-primary)]">
                        Glissez-déposez vos fichiers ou dossier ici
                      </h2>
                      <p className="text-[var(--text-muted)] mb-10 max-w-md mx-auto text-sm sm:text-base font-medium leading-relaxed">
                        Importez vos musiques (.mp3, .wav, .ogg). Les dossiers seront automatiquement scannés pour trouver les fichiers compatibles.
                      </p>
                      <label className="relative group cursor-pointer inline-flex">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                        <span className="relative px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm tracking-wide transition-all group-hover:bg-indigo-500 flex items-center shadow-xl shadow-indigo-900/20">
                          <Music className="w-4 h-4 mr-2" />
                          Sélectionner des fichiers
                        </span>
                        <input type="file" multiple accept="audio/*" onChange={handleFileSelect} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {songs.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] flex items-center">
                          <Activity className="w-4 h-4 mr-2 text-indigo-400" />
                          Liste des pistes ({songs.length})
                        </h3>
                        <button onClick={() => setSongs([])} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors">
                          Tout effacer
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {songs.map((song) => (
                          <SongRow
                            key={song.id}
                            song={song}
                            onUpdate={(updated) => setSongs(prev => prev.map(s => s.id === song.id ? { ...s, ...updated } : s))}
                            onRemove={() => setSongs(prev => prev.filter(s => s.id !== song.id))}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="max-w-3xl mx-auto w-full space-y-6"
                >
                  <div className={`p-8 rounded-3xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white/70 border-slate-200'}`}>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center mb-8">
                      <Sliders className="w-6 h-6 mr-3 text-indigo-400" />
                      Paramètres de Génération
                    </h3>
                    <div className="space-y-8">
                      {/* Difficulty Section */}
                      <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Zap className="w-12 h-12 text-indigo-400" />
                        </div>
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                            <Zap className="w-5 h-5 text-indigo-400" />
                          </div>
                          <h4 className="text-base font-bold text-[var(--text-primary)]">Difficultés Multiples</h4>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
                          StepSync génère automatiquement <span className="text-indigo-400 font-bold">tous les niveaux</span> (Débutant à Expert) pour chaque musique.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['Beginner', 'Easy', 'Medium', 'Hard', 'Challenge'].map((d, i) => (
                            <span key={i} className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400">{d}</span>
                          ))}
                        </div>
                      </div>

                      {/* BPM Section */}
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-[var(--text-secondary)] flex items-center">
                          <Hash className="w-4 h-4 mr-2 text-indigo-400" />
                          Forcer le BPM (Optionnel)
                        </label>
                        <div className="relative group">
                          <input
                            type="number"
                            placeholder="Détection automatique..."
                            value={bpmOverride}
                            onChange={(e) => setBpmOverride(e.target.value)}
                            className={`w-full rounded-2xl pl-5 pr-32 py-4 text-base text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-[var(--bg-input)] border border-[var(--border-input)] group-hover:border-[var(--border-accent)] shadow-sm`}
                          />
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center space-x-3">
                            {songs.length > 0 && (
                              <button
                                onClick={async () => {
                                  const song = songs[0];
                                  const buffer = await song.file.arrayBuffer();
                                  const analysis = await processAudio(buffer);
                                  setSongs(prev => prev.map(s => s.id === song.id ? { ...s, bpm: analysis.bpm, offset: analysis.offset } : s));
                                  setBpmOverride(analysis.bpm.toString());
                                }}
                                className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center space-x-2 group/recalc"
                              >
                                <Activity className="w-3.5 h-3.5 group-hover/recalc:animate-spin" />
                                <span>Recalculer</span>
                              </button>
                            )}
                            <div className="text-sm font-mono text-[var(--text-muted)] border-l border-[var(--border-default)] pl-3">
                              BPM
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-[var(--text-dim)] px-2">Laissez vide pour utiliser la détection automatique intelligente.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="max-w-3xl mx-auto w-full space-y-6"
                >
                  <div className={`p-8 rounded-3xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white/70 border-slate-200'}`}>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center mb-8">
                      <ShieldAlert className="w-6 h-6 mr-3 text-indigo-400" />
                      Options Avancées (Algorithme)
                    </h3>

                    <div className="space-y-10">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <div className="space-y-1">
                            <label className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Sensibilité d'Énergie</label>
                            <p className="text-xs text-[var(--text-dim)]">Plus bas = détection plus agressive des beats</p>
                          </div>
                          <span className={`text-sm font-mono font-bold px-3 py-1.5 rounded-xl border transition-colors ${onsetThreshold < 1.2 ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'}`}>
                            {onsetThreshold.toFixed(1)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5" max="3.0" step="0.1"
                          value={onsetThreshold}
                          onChange={e => setOnsetThreshold(parseFloat(e.target.value))}
                          className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                        />
                        <div className="flex justify-between text-[10px] text-[var(--text-dim)] mt-3 font-bold uppercase tracking-widest">
                          <span>Ultra-Sensible</span>
                          <span>Filtrage Strict</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <div className="space-y-1">
                            <label className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Intensité des Mines</label>
                            <p className="text-xs text-[var(--text-dim)]">Fréquence d'apparition des obstacles</p>
                          </div>
                          <span className="text-sm font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">{(mineProbability * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0" max="0.5" step="0.01"
                          value={mineProbability}
                          onChange={e => setMineProbability(parseFloat(e.target.value))}
                          className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                        />
                        <div className="flex justify-between text-[10px] text-[var(--text-dim)] mt-3 font-bold uppercase tracking-widest">
                          <span>Aucune</span>
                          <span>Chaotique</span>
                        </div>
                      </div>

                      <div className="pt-4">
                        <label className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all group ${isDark ? 'bg-slate-900/30 border-slate-800/50 hover:bg-slate-900/50 hover:border-indigo-500/30' : 'bg-white/60 border-slate-200 hover:bg-white hover:border-indigo-500/30'}`}>
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                              <Activity className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                              <div className="text-base font-bold text-[var(--text-primary)]">Ajustement du Silence</div>
                              <div className="text-xs text-[var(--text-muted)]">Supprime le silence au début et ajuste l'offset</div>
                            </div>
                          </div>
                          <div className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={trimSilence}
                              onChange={(e) => setTrimSilence(e.target.checked)}
                            />
                            <div className={`w-12 h-7 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white ${isDark ? 'bg-slate-800 after:bg-slate-400 after:border-slate-300' : 'bg-slate-300 after:bg-white after:border-slate-200'}`}></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="max-w-4xl mx-auto w-full space-y-8"
                >
                  <div className={`p-8 rounded-3xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white/70 border-slate-200'}`}>
<h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center mb-8">
                      <ImageIcon className="w-6 h-6 mr-3 text-indigo-400" />
                      Ressources Graphiques (Globales)
                    </h3>

                    <div className="flex flex-col space-y-8">
                      {/* Background Mode Selector */}
                      <div className="flex justify-center">
                        <div className={`p-1 rounded-2xl flex items-center space-x-1 ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100 border border-slate-200'}`}>
                          <button
                            onClick={() => setBgType('image')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${bgType === 'image' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span>Image</span>
                          </button>
                          <button
                            onClick={() => setBgType('video')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${bgType === 'video' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                          >
                            <Video className="w-4 h-4" />
                            <span>Vidéo (BGA)</span>
                          </button>
                        </div>
                      </div>

                      <div className="max-w-2xl mx-auto w-full space-y-6">
                        {bgType === 'image' ? (
                          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                            <ImagePreview
                              label="Image de Fond (Background)"
                              file={bgImageFile}
                              onFileSelect={(file) => {
                                setBgImageFile(file);
                                setVideoFile(undefined);
                              }}
                              onRemove={() => setBgImageFile(undefined)}
                              isDark={isDark}
                              description="Affiché derrière les flèches (1920x1080 recommandé)"
                            />
                            
                            {/* Suggestions d'arrière-plan basées sur les musiques */}
                            {!bgImageFile && !videoFile && songs.some(s => s.artworkUrl) && (
                              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">
                                  Suggestions (Cliquer pour appliquer)
                                </label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                  {Array.from(new Set(songs.filter(s => s.artworkUrl).map(s => s.artworkUrl))).map((url, idx) => (
                                    <button
                                      key={idx}
                                      onClick={async () => {
                                        try {
                                          const res = await fetch(url!);
                                          const blob = await res.blob();
                                          const file = new File([blob], `suggested_bg_${idx}.jpg`, { type: blob.type || 'image/jpeg' });
                                          setBgImageFile(file);
                                          setVideoFile(undefined);
                                        } catch (e) { console.warn("Failed to convert suggestion to file", e); }
                                      }}
                                      className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-400 focus:outline-none focus:border-indigo-500 transition-all opacity-80 hover:opacity-100"
                                      title="Utiliser comme arrière-plan global"
                                    >
                                      <img src={url} alt="Suggestion" className="w-full h-full object-cover" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <VideoPreview
                              label="Vidéo de Fond (BGA)"
                              file={videoFile}
                              onFileSelect={(file) => {
                                setVideoFile(file);
                                setBgImageFile(undefined);
                              }}
                              onRemove={() => setVideoFile(undefined)}
                              isDark={isDark}
                              description="Lecture en boucle pendant la partie (.mp4, .avi, .mov)"
                            />
                          </div>
                        )}

                        <ImagePreview
                          label="Bannière (Banner)"
                          file={bannerImageFile}
                          onFileSelect={setBannerImageFile}
                          onRemove={() => setBannerImageFile(undefined)}
                          isDark={isDark}
                          description="Affiché dans le menu de sélection (512x160 recommandé)"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Footer */}
        <footer className={`border-t backdrop-blur-sm ${isDark ? 'border-slate-800/60 bg-slate-950/50' : 'border-slate-200 bg-white/50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {/* Branding */}
              <div className="space-y-3">
                <button onClick={resetApp} className="flex items-center space-x-2 focus:outline-none group">
                  <Disc3 className="w-5 h-5 text-indigo-400 group-hover:rotate-90 transition-transform" />
                  <span className="text-sm font-black tracking-tighter text-[var(--text-primary)]">Step<span className="text-indigo-400">Sync</span></span>
                </button>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Générateur automatique de stepcharts pour StepMania, ITG et formats compatibles.
                </p>
              </div>

              {/* Links */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Liens Utiles</h4>
                <div className="flex flex-col space-y-2">
                  <a href="https://www.stepmania.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--text-muted)] hover:text-indigo-400 transition-colors flex items-center space-x-1">
                    <ExternalLink className="w-3 h-3" />
                    <span>StepMania</span>
                  </a>
                  <a href="https://github.com/moonback/StepSync---Audio-to-StepMania" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--text-muted)] hover:text-indigo-400 transition-colors flex items-center space-x-1">
                    <Github className="w-3 h-3" />
                    <span>Code Source</span>
                  </a>
                </div>
              </div>

              {/* Credits */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Crédits</h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Créé avec <Heart className="w-3 h-3 inline text-red-400" /> par <span className="text-[var(--text-primary)] font-semibold">Maysson.D</span>
                </p>
                <p className="text-[10px] text-[var(--text-dim)] font-mono">
                  v1.8
                </p>
              </div>
            </div>

            <div className={`mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'border-slate-800/40' : 'border-slate-200'}`}>
              <p className="text-[10px] text-[var(--text-dim)]">
                © {new Date().getFullYear()} StepSync. Tous droits réservés.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
