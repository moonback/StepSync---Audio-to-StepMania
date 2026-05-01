/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Disc3, Music, Sun, Moon, ArrowRight, Check, Download, RefreshCw } from 'lucide-react';
import { useLocalStorage } from './useLocalStorage';
import { packageAndDownload } from './lib/exporter';
import { parseAudioMetadata } from './lib/metadataParser';
import { fetchArtwork } from './lib/itunesSearch';
import { processAudio } from './lib/audioAnalysis';
import { SongItem } from './lib/types';
import { HelpModal } from './components/HelpModal';
import { useTheme } from './lib/useTheme';

// Layout Components
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Step Components
import { LandingStep } from './components/steps/LandingStep';
import { UploadStep } from './components/steps/UploadStep';
import { ConfigStep } from './components/steps/ConfigStep';
import { AlgorithmStep } from './components/steps/AlgorithmStep';
import { AssetsStep } from './components/steps/AssetsStep';
import { SuccessStep } from './components/steps/SuccessStep';

export default function App() {
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  // Settings
  const [currentStep, setCurrentStep] = useState(0);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const [trimSilence, setTrimSilence] = useLocalStorage('stepsync-trimSilence', true);
  const [bpmOverride, setBpmOverride] = useLocalStorage<string>('stepsync-bpm', '');

  // Advanced Settings
  const [onsetThreshold, setOnsetThreshold] = useLocalStorage('stepsync-onset', 0.15);
  const [mineProbability, setMineProbability] = useLocalStorage('stepsync-minProb', 0.1);
  const [gameModes, setGameModes] = useLocalStorage<string[]>('stepsync-gamemodes', ['dance-single']);

  const [bgImageFile, setBgImageFile] = useState<File | undefined>();
  const [bannerImageFile, setBannerImageFile] = useState<File | undefined>();
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [bgType, setBgType] = useState<'image' | 'video'>('image');
  const [globalUseArtwork, setGlobalUseArtwork] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);
  const [isTuned, setIsTuned] = useState(false);

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
    setCurrentStep(0);
    setIsSuccess(false);
    setIsTuned(false);
  }, [setSongs, setBpmOverride, setTrimSilence, setOnsetThreshold, setMineProbability]);

  const processAddedFiles = useCallback(async (files: File[]) => {
    const audioFiles = files.filter(f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|flac|m4a)$/i));
    if (audioFiles.length === 0) return;

    for (const file of audioFiles) {
      const id = crypto.randomUUID();
      console.log(`Processing: ${file.name}`);
      const meta = await parseAudioMetadata(file);
      console.log('Metadata parsed:', meta);
      
      let artUrl = await fetchArtwork(`${meta.artist} ${meta.title}`.trim());
      if (!artUrl && meta.title) {
        artUrl = await fetchArtwork(meta.title); // Fallback to just title
      }
      console.log('Artwork found:', artUrl);

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
  }, [songs.length, setBpmOverride]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files as FileList);
      processAddedFiles(files);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files: File[] = Array.from(e.dataTransfer.files as FileList);
    processAddedFiles(files);
  }, [processAddedFiles]);

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
          bpmOverride: songs.length > 1 ? undefined : (bpmOverride ? parseFloat(bpmOverride) : undefined),
          onsetThreshold: songs.length > 1 ? undefined : onsetThreshold,
          mineProbability: songs.length > 1 ? undefined : mineProbability,
          gameModes,
        },
        bgType === 'image' ? bgImageFile : undefined,
        bannerImageFile,
        bgType === 'video' ? videoFile : undefined,
        globalUseArtwork
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
    <div className="min-h-screen transition-colors duration-500 overflow-x-hidden selection:bg-indigo-500 selection:text-white flex flex-col">
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

      <Header
        currentStep={currentStep === 5 ? 4 : currentStep}
        setCurrentStep={setCurrentStep}
        onReset={resetApp}
        onShowHelp={() => setShowHelp(true)}
        hasSongs={songs.length > 0}
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-32 perspective-container flex-1">
        <div className="flex flex-col items-center w-full h-full">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <LandingStep onStart={() => setCurrentStep(1)} onShowHelp={() => setShowHelp(true)} />
            )}

            {currentStep === 1 && (
              <UploadStep
                songs={songs}
                onFileSelect={handleFileSelect}
                onDrop={handleDrop}
                onUpdateSong={(id, updated) => setSongs(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s))}
                onRemoveSong={(id) => setSongs(prev => prev.filter(s => s.id !== id))}
                onClearAll={() => setSongs([])}
                onBack={() => setCurrentStep(0)}
              />
            )}

            {currentStep === 2 && (
              <ConfigStep
                songs={songs}
                bpmOverride={bpmOverride}
                setBpmOverride={setBpmOverride}
                gameModes={gameModes}
                setGameModes={setGameModes}
                onRecalculateBPM={recalculateBPM}
              />
            )}

            {currentStep === 3 && (
              <AlgorithmStep
                songs={songs}
                onsetThreshold={onsetThreshold}
                setOnsetThreshold={setOnsetThreshold}
                mineProbability={mineProbability}
                setMineProbability={setMineProbability}
                trimSilence={trimSilence}
                setTrimSilence={setTrimSilence}
                isTuned={isTuned}
                isProcessing={isProcessing}
                onAutoTune={autoTuneAlgorithms}
              />
            )}

            {currentStep === 4 && (
              <AssetsStep 
                songs={songs} 
                selectedSongId={selectedSongId} 
                setSelectedSongId={setSelectedSongId} 
                isDark={isDark} 
                onUpdateSong={(id, updated) => setSongs(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s))}
                onSetGlobalBg={setBgImageFile}
                onSetGlobalBanner={setBannerImageFile}
                onSetGlobalVideo={setVideoFile}
                onRemoveGlobalBg={() => setBgImageFile(undefined)}
                onRemoveGlobalBanner={() => setBannerImageFile(undefined)}
                onRemoveGlobalVideo={() => setVideoFile(undefined)}
                globalBg={bgImageFile}
                globalBanner={bannerImageFile}
                globalVideo={videoFile}
                bgType={bgType}
                setBgType={setBgType}
                globalUseArtwork={globalUseArtwork}
                setGlobalUseArtwork={setGlobalUseArtwork}
              />
            )}

            {currentStep === 5 && (
              <SuccessStep
                songs={songs}
                gameModes={gameModes}
                onDownload={handleExport}
                onReset={resetApp}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Bottom Controls */}
      <AnimatePresence>
        {songs.length > 0 && currentStep > 0 && currentStep < 5 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
          >
            <div className="glass-card p-3 sm:p-4 flex items-center justify-between shadow-2xl border border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem]">
              <div className="flex items-center space-x-3 sm:space-x-4 ml-2 sm:ml-4">
                <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Musiques</span>
                  <span className="text-sm font-black text-white">{songs.length}</span>
                </div>
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="p-3 sm:p-4 text-[var(--text-secondary)] hover:text-white transition-colors"
                  >
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 rotate-180" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleTheme}
                  className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 text-[var(--text-secondary)] hover:text-indigo-400 transition-all"
                  title="Changer le thème"
                >
                  {isDark ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
                <button
                  onClick={currentStep === 4 ? handleExport : () => setCurrentStep(prev => prev + 1)}
                  disabled={exporting}
                  className="px-6 sm:px-10 py-3 sm:py-4 bg-indigo-600 text-white font-black rounded-xl sm:rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all flex items-center space-x-3 disabled:opacity-50 text-xs sm:text-base"
                >
                  {exporting ? (
                    <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : currentStep === 4 ? (
                    <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                  <span>{exporting ? "Génération..." : currentStep === 4 ? "Générer le Pack" : "Suivant"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
