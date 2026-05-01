/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Settings, Download, X, PlayCircle, Image as ImageIcon, Music, LayoutDashboard } from 'lucide-react';
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
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <h3 className="text-lg font-medium text-white flex items-center mb-6">
                <Settings className="w-5 h-5 mr-2 text-indigo-400" />
                Paramètres de Génération
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Difficulté Cible (1-5)
                  </label>
                  <input 
                    type="range" 
                    min="1" max="5" 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono">
                    <span>Débutant</span>
                    <span>Expert</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Forcer le BPM (Optionnel)
                  </label>
                  <input 
                    type="number" 
                    placeholder="Détection auto. si vide"
                    value={bpmOverride}
                    onChange={(e) => setBpmOverride(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="trimSilence"
                    checked={trimSilence}
                    onChange={(e) => setTrimSilence(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                  />
                  <label htmlFor="trimSilence" className="text-sm font-medium text-slate-300">
                    Ajuster le décalage pour le silence d'intro
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <h3 className="text-lg font-medium text-white flex items-center mb-6">
                <Settings className="w-5 h-5 mr-2 text-indigo-400" />
                Avancé (Options CLI)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-2">--onset-threshold (Seuil d'Énergie): {onsetThreshold.toFixed(1)}</label>
                  <input type="range" min="1.0" max="2.5" step="0.1" value={onsetThreshold} onChange={e => setOnsetThreshold(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-2">--mine-probability (Prob. Mines 0-1): {mineProbability.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.05" value={mineProbability} onChange={e => setMineProbability(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <h3 className="text-lg font-medium text-white flex items-center mb-6">
                <ImageIcon className="w-5 h-5 mr-2 text-indigo-400" />
                Ressources
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Image d'arrière-plan</label>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg"
                    onChange={(e) => e.target.files && setBgImageFile(e.target.files[0])}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-indigo-400 hover:file:bg-slate-700 cursor-pointer"
                  />
                 {bgImageFile && (
                   <div className="mt-3">
                     <p className="text-xs text-slate-400 truncate mb-2">Sélectionné : {bgImageFile.name}</p>
                     <ImagePreview file={bgImageFile} className="w-full h-32" />
                   </div>
                 )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Image de Bannière</label>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg"
                    onChange={(e) => e.target.files && setBannerImageFile(e.target.files[0])}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-indigo-400 hover:file:bg-slate-700 cursor-pointer"
                  />
                  {bannerImageFile && (
                   <div className="mt-3">
                     <p className="text-xs text-slate-400 truncate mb-2">Sélectionné : {bannerImageFile.name}</p>
                     <ImagePreview file={bannerImageFile} className="w-full h-16" />
                   </div>
                  )}
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
