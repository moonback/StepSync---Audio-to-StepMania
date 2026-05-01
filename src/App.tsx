/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, Settings, Download, X, PlayCircle, Image as ImageIcon, Music, LayoutDashboard, Zap, Activity, Hash, ShieldAlert, Sliders, Github, Heart, ExternalLink, Disc3, HelpCircle, Sun, Moon } from 'lucide-react';
import { WaveformPreview } from './components/WaveformPreview';
import { SongRow } from './components/SongRow';
import { ImagePreview } from './components/ImagePreview';
import { useLocalStorage } from './useLocalStorage';
import { packageAndDownload } from './lib/exporter';
import { parseAudioMetadata } from './lib/metadataParser';

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
  const [difficulty, setDifficulty] = useLocalStorage('stepsync-difficulty', 3);
  const [trimSilence, setTrimSilence] = useLocalStorage('stepsync-trimSilence', true);
  const [bpmOverride, setBpmOverride] = useLocalStorage<string>('stepsync-bpm', '');

  // Advanced Settings
  const [onsetThreshold, setOnsetThreshold] = useLocalStorage('stepsync-onset', 1.5);
  const [mineProbability, setMineProbability] = useLocalStorage('stepsync-minProb', 0.1);

  const [bgImageFile, setBgImageFile] = useState<File | undefined>();
  const [bannerImageFile, setBannerImageFile] = useState<File | undefined>();

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);

    // Fallback typing for dataTransfer files
    const files: File[] = Array.from(e.dataTransfer.files as FileList);
    await processAddedFiles(files);
  }, [songs]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files as FileList);
      await processAddedFiles(files);
    }
  };

  const processAddedFiles = async (files: File[]) => {
    const audioFiles = files.filter(f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|flac|m4a)$/i));

    if (audioFiles.length === 0) return;

    // Optional: look for image files if they dropped a folder
    if (!bgImageFile) {
      const bg = files.find(f => f.name.match(/bg\.(jpg|png)$/i) || f.name.match(/background\.(jpg|png)$/i));
      if (bg) setBgImageFile(bg);
    }

    const newItems: SongItem[] = [];
    for (const file of audioFiles) {
      const meta = await parseAudioMetadata(file);
      newItems.push({
        id: crypto.randomUUID(),
        file,
        title: meta.title,
        artist: meta.artist,
        subtitle: '',
        titleTranslit: '',
        subtitleTranslit: '',
        artistTranslit: '',
        genre: '',
        credit: 'StepSync par Maysson.D'
      });
    }

    setSongs(prev => [...prev, ...newItems]);
  };

  const removeSong = (id: string) => {
    setSongs(songs.filter(s => s.id !== id));
  };

  const updateSong = (id: string, updates: Partial<SongItem>) => {
    setSongs(songs.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleExport = async () => {
    if (songs.length === 0) return;
    setIsProcessing(true);
    try {
      await packageAndDownload(
        songs,
        {
          difficulty,
          trimSilence,
          bpmOverride: bpmOverride ? parseFloat(bpmOverride) : undefined,
          onsetThreshold,
          mineProbability
        },
        bgImageFile,
        bannerImageFile
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
                    <h1 className="text-lg sm:text-xl font-black tracking-tight text-[var(--text-primary)]">
                      Step<span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Sync</span>
                    </h1>
                    <span className="hidden sm:inline-flex px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-[0.15em] rounded border border-indigo-500/20">
                      v2.0
                    </span>
                  </div>
                </div>

                {/* Center: Tagline (hidden on small) */}
                <div className="hidden lg:flex items-center">
                  <p className="text-[11px] text-[var(--text-muted)] font-medium tracking-wide">
                    Audio → StepMania · Générateur de Stepcharts
                  </p>
                </div>

                {/* Right: Status + Actions */}
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  {/* Song counter pill */}
                  <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-[var(--bg-hover)] rounded-lg border border-[var(--border-default)]">
                    <div className={`w-1.5 h-1.5 rounded-full ${songs.length > 0 ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-slate-600'}`} />
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                      {songs.length} piste{songs.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px h-5 bg-[var(--border-default)]" />

                  {/* Action buttons */}
                  <a
                    href="https://github.com/moonback/StepSync---Audio-to-StepMania"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all duration-150"
                    title="Code source"
                  >
                    <Github className="w-[18px] h-[18px]" />
                  </a>
                  <button
                    onClick={() => setShowHelp(true)}
                    className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all duration-150"
                    title="Centre d'aide"
                  >
                    <HelpCircle className="w-[18px] h-[18px]" />
                  </button>
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-all duration-150 ${isDark ? 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10'}`}
                    title={isDark ? 'Thème clair' : 'Thème sombre'}
                  >
                    {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Area */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                layout
                onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                onDragLeave={() => setIsHovering(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden group
                ${isHovering ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' : `border-[var(--border-card)] bg-[var(--bg-drop)] hover:border-[var(--border-input)]`}`}
                onClick={() => document.getElementById('audio-upload')?.click()}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <input
                  type="file"
                  id="audio-upload"
                  className="hidden"
                  multiple
                  accept="audio/*"
                  onChange={handleFileSelect}
                />
                <motion.div
                  animate={{ y: isHovering ? -10 : 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <UploadCloud className={`w-20 h-20 mb-6 ${isHovering ? 'text-indigo-400' : 'text-[var(--text-dim)]'}`} />
                </motion.div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">Glissez-déposez vos fichiers ou dossier ici</h2>
                <p className="text-[var(--text-muted)] text-center max-w-sm text-sm">
                  <span className="text-indigo-400 font-mono">.mp3, .wav, .ogg</span> pour commencer la magie.
                </p>

                {isHovering && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase tracking-widest shadow-lg shadow-indigo-900/40"
                  >
                    Lâcher pour Importer
                  </motion.div>
                )}
              </motion.div>

              {songs.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[var(--text-primary)] flex items-center">
                    <Music className="w-5 h-5 mr-2 text-indigo-400" />
                    File d'attente ({songs.length})
                  </h3>
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {songs.map(song => (
                        <motion.div
                          key={song.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        >
                          <SongRow song={song} onRemove={removeSong} onUpdate={(updates) => updateSong(song.id, updates)} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-6">
              <div className={`p-1 rounded-2xl shadow-2xl border ${isDark ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-800' : 'bg-gradient-to-b from-slate-200 to-slate-100 border-slate-200'}`}>
                <div className={`p-6 rounded-xl backdrop-blur-sm ${isDark ? 'bg-slate-950/40' : 'bg-white/80'}`}>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center mb-8">
                    <Sliders className="w-5 h-5 mr-3 text-indigo-400" />
                    Paramètres de Génération
                  </h3>

                  <div className="space-y-8">
                    {/* Difficulty Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-semibold text-[var(--text-secondary)] flex items-center">
                          <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                          Difficulté Cible
                        </label>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                        ${difficulty === 1 ? 'bg-emerald-500/20 text-emerald-400' :
                            difficulty === 2 ? 'bg-cyan-500/20 text-cyan-400' :
                              difficulty === 3 ? 'bg-yellow-500/20 text-yellow-400' :
                                difficulty === 4 ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-red-500/20 text-red-400'}`}>
                          {['Débutant', 'Facile', 'Moyen', 'Difficile', 'Expert'][difficulty - 1]}
                        </span>
                      </div>
                      <div className="relative h-6 flex items-center">
                        <input
                          type="range"
                          min="1" max="5"
                          value={difficulty}
                          onChange={(e) => setDifficulty(parseInt(e.target.value))}
                          className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-2 font-bold uppercase tracking-widest px-1">
                        <span>Niv. 1</span>
                        <span>Niv. 5</span>
                      </div>
                    </div>

                    {/* BPM Section */}
                    <div>
                      <label className="text-sm font-semibold text-[var(--text-secondary)] flex items-center mb-3">
                        <Hash className="w-4 h-4 mr-2 text-indigo-400" />
                        Forcer le BPM
                      </label>
                      <div className="relative group">
                        <input
                          type="number"
                          placeholder="Détection automatique..."
                          value={bpmOverride}
                          onChange={(e) => setBpmOverride(e.target.value)}
                          className={`w-full rounded-xl pl-4 pr-12 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-[var(--bg-input)] border border-[var(--border-input)] group-hover:border-[var(--border-accent)]`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--text-muted)]">
                          BPM
                        </div>
                      </div>
                    </div>

                    {/* Trim Silence Toggle */}
                    <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors group ${isDark ? 'bg-slate-900/30 border-slate-800/50 hover:bg-slate-900/50' : 'bg-white/60 border-slate-200 hover:bg-slate-50'}`}>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                          <Activity className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[var(--text-primary)]">Ajuster le silence</div>
                          <div className="text-[11px] text-[var(--text-muted)]">Corrige le décalage initial</div>
                        </div>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={trimSilence}
                          onChange={(e) => setTrimSilence(e.target.checked)}
                        />
                        <div className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white ${isDark ? 'bg-slate-800 after:bg-slate-400 after:border-slate-300' : 'bg-slate-300 after:bg-white after:border-slate-200'}`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl relative overflow-hidden group transition-all border ${isDark ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' : 'bg-white/70 border-slate-200 hover:border-slate-300'}`}>
                <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">
                  <Settings className="w-24 h-24 text-[var(--text-primary)]" />
                </div>

                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center mb-6">
                  <ShieldAlert className="w-4 h-4 mr-2 text-indigo-400" />
                  Options Avancées (Algorithme)
                </h3>

                <div className="space-y-6 relative">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Seuil d'Énergie</label>
                        <p className="text-[10px] text-[var(--text-dim)]">Sensibilité de la détection</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">{onsetThreshold.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.0" max="2.5" step="0.1"
                      value={onsetThreshold}
                      onChange={e => setOnsetThreshold(parseFloat(e.target.value))}
                      className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Densité de Mines</label>
                        <p className="text-[10px] text-[var(--text-dim)]">Probabilité d'apparition</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">{(mineProbability * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0" max="1" step="0.05"
                      value={mineProbability}
                      onChange={e => setMineProbability(parseFloat(e.target.value))}
                      className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                    />
                  </div>

                  <div className="pt-2">
                    <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800/50' : 'bg-slate-100 border-slate-200'}`}>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 overflow-hidden">
                        <span className="text-indigo-500 select-none">$</span>
                        <span className="truncate">autostepper --onset {onsetThreshold.toFixed(1)} --mines {mineProbability.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border transition-all ${isDark ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' : 'bg-white/70 border-slate-200 hover:border-slate-300'}`}>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center mb-6">
                  <ImageIcon className="w-4 h-4 mr-2 text-indigo-400" />
                  Ressources Graphiques
                </h3>

                <div className="space-y-6">
                  {/* Background Image */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Arrière-plan (.jpg, .png)</label>
                      {bgImageFile && (
                        <button onClick={() => setBgImageFile(undefined)} className="text-[10px] text-red-400 hover:underline">Supprimer</button>
                      )}
                    </div>
                    <div
                      className={`relative group cursor-pointer rounded-xl border-2 border-dashed transition-all overflow-hidden
                      ${bgImageFile ? 'border-indigo-500/50 bg-indigo-500/5' : `border-[var(--border-card)] hover:border-[var(--border-input)] bg-[var(--bg-surface)]`}`}
                      onClick={() => document.getElementById('bg-upload')?.click()}
                    >
                      <input
                        type="file"
                        id="bg-upload"
                        className="hidden"
                        accept="image/png, image/jpeg"
                        onChange={(e) => e.target.files && setBgImageFile(e.target.files[0])}
                      />
                      {bgImageFile ? (
                        <div className="relative aspect-video">
                          <ImagePreview file={bgImageFile} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-xs text-white font-medium">Changer l'image</p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 flex flex-col items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-[var(--text-dim)] mb-2" />
                          <p className="text-[11px] text-[var(--text-muted)]">Cliquez pour ajouter</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Banner Image */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Bannière (Optionnel)</label>
                      {bannerImageFile && (
                        <button onClick={() => setBannerImageFile(undefined)} className="text-[10px] text-red-400 hover:underline">Supprimer</button>
                      )}
                    </div>
                    <div
                      className={`relative group cursor-pointer rounded-xl border-2 border-dashed transition-all overflow-hidden
                      ${bannerImageFile ? 'border-indigo-500/50 bg-indigo-500/5' : `border-[var(--border-card)] hover:border-[var(--border-input)] bg-[var(--bg-surface)]`}`}
                      onClick={() => document.getElementById('banner-upload')?.click()}
                    >
                      <input
                        type="file"
                        id="banner-upload"
                        className="hidden"
                        accept="image/png, image/jpeg"
                        onChange={(e) => e.target.files && setBannerImageFile(e.target.files[0])}
                      />
                      {bannerImageFile ? (
                        <div className="relative h-16">
                          <ImagePreview file={bannerImageFile} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-xs text-white font-medium">Changer</p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 flex flex-col items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-[var(--text-dim)] mb-1" />
                          <p className="text-[11px] text-[var(--text-muted)]">Cliquez pour ajouter</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                layout
                onClick={handleExport}
                disabled={songs.length === 0 || isProcessing}
                whileHover={{ scale: songs.length === 0 ? 1 : 1.02 }}
                whileTap={{ scale: songs.length === 0 ? 1 : 0.98 }}
                className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center transition-all relative overflow-hidden group
                ${songs.length === 0
                    ? `${isDark ? 'bg-slate-900 text-slate-700 border-slate-800' : 'bg-slate-100 text-slate-400 border-slate-200'} cursor-not-allowed border`
                    : isProcessing
                      ? 'bg-indigo-600 text-white cursor-wait opacity-80'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.5)]'
                  }`}
              >
                {songs.length > 0 && !isProcessing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                )}

                {isProcessing ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin mr-4" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-7 h-7 mr-3" />
                    Exporter le Pack .sm
                  </>
                )}
              </motion.button>

              {songs.length > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]"
                >
                  Prêt pour StepMania & ITG
                </motion.p>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className={`border-t backdrop-blur-sm ${isDark ? 'border-slate-800/60 bg-slate-950/50' : 'border-slate-200 bg-white/50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {/* Branding */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Disc3 className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-black tracking-tighter text-[var(--text-primary)]">Step<span className="text-indigo-400">Sync</span></span>
                </div>
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
                  v2.0 • Apache-2.0
                </p>
              </div>
            </div>

            <div className={`mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'border-slate-800/40' : 'border-slate-200'}`}>
              <p className="text-[10px] text-[var(--text-dim)]">
                © {new Date().getFullYear()} StepSync. Tous droits réservés.
              </p>
              <div className="flex items-center space-x-4 text-[10px] text-[var(--text-dim)]">
                <span>React + Vite</span>
                <span>•</span>
                <span>Tailwind CSS</span>
                <span>•</span>
                <span>Web Audio API</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
