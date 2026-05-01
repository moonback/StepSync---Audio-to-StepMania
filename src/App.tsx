/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Settings, Download, X, PlayCircle, Image as ImageIcon, Music, LayoutDashboard, Zap, Activity, Hash, ShieldAlert, Sliders } from 'lucide-react';
import { WaveformPreview } from './components/WaveformPreview';
import { SongRow } from './components/SongRow';
import { ImagePreview } from './components/ImagePreview';
import { useLocalStorage } from './useLocalStorage';
import { packageAndDownload } from './lib/exporter';
import { parseAudioMetadata } from './lib/metadataParser';

import { SongItem } from './lib/types';

export default function App() {
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
        credit: 'AutoStepper par Maysson.D'
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-3 text-indigo-400">
            <LayoutDashboard className="w-8 h-8" />
            <h1 className="text-3xl font-bold tracking-tighter text-white">
              Step<span className="text-indigo-400 font-normal">Sync</span>
            </h1>
          </div>
          <p className="text-sm font-mono text-slate-400">Générateur Audio vers StepMania</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Area */}
          <div className="lg:col-span-2 space-y-6">
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
              onDragLeave={() => setIsHovering(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden
                ${isHovering ? 'border-indigo-500 bg-indigo-600/10' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40'}`}
              onClick={() => document.getElementById('audio-upload')?.click()}
            >
              <input 
                type="file" 
                id="audio-upload" 
                className="hidden" 
                multiple 
                accept="audio/*" 
                onChange={handleFileSelect} 
              />
              <UploadCloud className={`w-16 h-16 mb-6 ${isHovering ? 'text-indigo-400' : 'text-slate-600'}`} />
              <h2 className="text-xl font-medium text-white mb-2">Glissez et Déposez vos Fichiers Audio</h2>
              <p className="text-slate-400 text-center max-w-sm">
                Déposez des fichiers .mp3, .wav, ou .ogg ici, ou cliquez pour parcourir. Déposez un dossier pour le traitement par lots.
              </p>
            </div>

            {songs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <Music className="w-5 h-5 mr-2 text-indigo-400" />
                  File d'attente ({songs.length})
                </h3>
                <div className="space-y-3">
                  {songs.map(song => (
                    <SongRow key={song.id} song={song} onRemove={removeSong} onUpdate={(updates) => updateSong(song.id, updates)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            <div className="p-1 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-800">
              <div className="p-6 bg-slate-950/40 rounded-xl backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white flex items-center mb-8">
                  <Sliders className="w-5 h-5 mr-3 text-indigo-400" />
                  Paramètres de Génération
                </h3>
                
                <div className="space-y-8">
                  {/* Difficulty Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-semibold text-slate-300 flex items-center">
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
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest px-1">
                      <span>Niv. 1</span>
                      <span>Niv. 5</span>
                    </div>
                  </div>

                  {/* BPM Section */}
                  <div>
                    <label className="text-sm font-semibold text-slate-300 flex items-center mb-3">
                      <Hash className="w-4 h-4 mr-2 text-indigo-400" />
                      Forcer le BPM
                    </label>
                    <div className="relative group">
                      <input 
                        type="number" 
                        placeholder="Détection automatique..."
                        value={bpmOverride}
                        onChange={(e) => setBpmOverride(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all group-hover:border-slate-700"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                        BPM
                      </div>
                    </div>
                  </div>

                  {/* Trim Silence Toggle */}
                  <label className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl border border-slate-800/50 cursor-pointer hover:bg-slate-900/50 transition-colors group">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                        <Activity className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Ajuster le silence</div>
                        <div className="text-[11px] text-slate-500">Corrige le décalage initial</div>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={trimSilence}
                        onChange={(e) => setTrimSilence(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">
                <Settings className="w-24 h-24 text-white" />
              </div>
              
              <h3 className="text-base font-bold text-white flex items-center mb-6">
                <ShieldAlert className="w-4 h-4 mr-2 text-indigo-400" />
                Options Avancées (Algorithme)
              </h3>
              
              <div className="space-y-6 relative">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="space-y-0.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Seuil d'Énergie</label>
                      <p className="text-[10px] text-slate-600">Sensibilité de la détection</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">{onsetThreshold.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" max="2.5" step="0.1" 
                    value={onsetThreshold} 
                    onChange={e => setOnsetThreshold(parseFloat(e.target.value))} 
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all" 
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="space-y-0.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Densité de Mines</label>
                      <p className="text-[10px] text-slate-600">Probabilité d'apparition</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">{(mineProbability * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05" 
                    value={mineProbability} 
                    onChange={e => setMineProbability(parseFloat(e.target.value))} 
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all" 
                  />
                </div>

                <div className="pt-2">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 overflow-hidden">
                      <span className="text-indigo-500 select-none">$</span>
                      <span className="truncate">autostepper --onset {onsetThreshold.toFixed(1)} --mines {mineProbability.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
              <h3 className="text-base font-bold text-white flex items-center mb-6">
                <ImageIcon className="w-4 h-4 mr-2 text-indigo-400" />
                Ressources Graphiques
              </h3>
              
              <div className="space-y-6">
                {/* Background Image */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400">Arrière-plan (.jpg, .png)</label>
                    {bgImageFile && (
                      <button onClick={() => setBgImageFile(undefined)} className="text-[10px] text-red-400 hover:underline">Supprimer</button>
                    )}
                  </div>
                  <div 
                    className={`relative group cursor-pointer rounded-xl border-2 border-dashed transition-all overflow-hidden
                      ${bgImageFile ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'}`}
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
                        <ImageIcon className="w-6 h-6 text-slate-600 mb-2" />
                        <p className="text-[11px] text-slate-500">Cliquez pour ajouter</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Image */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400">Bannière (Optionnel)</label>
                    {bannerImageFile && (
                      <button onClick={() => setBannerImageFile(undefined)} className="text-[10px] text-red-400 hover:underline">Supprimer</button>
                    )}
                  </div>
                  <div 
                    className={`relative group cursor-pointer rounded-xl border-2 border-dashed transition-all overflow-hidden
                      ${bannerImageFile ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'}`}
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
                        <ImageIcon className="w-5 h-5 text-slate-600 mb-1" />
                        <p className="text-[11px] text-slate-500">Cliquez pour ajouter</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={songs.length === 0 || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                songs.length === 0 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : isProcessing
                    ? 'bg-indigo-600 text-white cursor-wait opacity-80'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 hover:-translate-y-0.5'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3" />
                  Génération des Pas...
                </>
              ) : (
                <>
                  <Download className="w-6 h-6 mr-2" />
                  Exporter le Pack .sm
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
