/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, Download, RefreshCw } from 'lucide-react';
import { StepManiaBackground } from './components/DancerBackground';
import { useLocalStorage } from './useLocalStorage';
import { packageAndDownload } from './lib/exporter';
import { parseAudioMetadata } from './lib/metadataParser';
import { fetchArtwork } from './lib/itunesSearch';
import { processAudio } from './lib/audioAnalysis';
import { SongItem } from './lib/types';
import { HelpModal } from './components/HelpModal';

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

  // Settings
  const [currentStep, setCurrentStep] = useState(0);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    (window as any).advanceStep = () => setCurrentStep(prev => prev + 1);
  }, [currentStep]);

  const [trimSilence, setTrimSilence] = useLocalStorage('stepsync-trimSilence', true);
  const [bpmOverride, setBpmOverride] = useLocalStorage<string>('stepsync-bpm', '');

  // Advanced Settings
  const [onsetThreshold, setOnsetThreshold] = useLocalStorage('stepsync-onset', 0.15);
  const [mineProbability, setMineProbability] = useLocalStorage('stepsync-minProb', 0.1);
  const [choreographyStyle, setChoreographyStyle] = useLocalStorage('stepsync-style', 'balanced');
  const [gameModes, setGameModes] = useLocalStorage<string[]>('stepsync-gamemodes', ['dance-single']);

  const [bgImageFile, setBgImageFile] = useState<File | undefined>();
  const [bannerImageFile, setBannerImageFile] = useState<File | undefined>();
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [bgType, setBgType] = useState<'image' | 'video'>('image');
  const [globalUseArtwork, setGlobalUseArtwork] = useState<boolean | undefined>(undefined);
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
    setBpmOverride('');
    setCurrentStep(0);
    setIsSuccess(false);
    setIsTuned(false);
  }, [setSongs, setBpmOverride, setTrimSilence, setOnsetThreshold, setMineProbability]);

  useEffect(() => {
    const generateMissingBanners = async () => {
      const { generateBannerWithText } = await import('./lib/bannerGenerator');
      let updated = false;
      const newSongs = await Promise.all(songs.map(async (song) => {
        if (!song.customBanner && !song.useArtwork) {
          const banner = await generateBannerWithText(song.title, song.artist);
          updated = true;
          return { ...song, customBanner: banner };
        }
        return song;
      }));
      if (updated) setSongs(newSongs);
    };
    if (songs.length > 0) generateMissingBanners();
  }, [songs.length]);

  const processAddedFiles = useCallback(async (files: File[]) => {
    const audioFiles = files.filter(f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|flac|m4a)$/i));
    if (audioFiles.length === 0) return;

    for (const file of audioFiles) {
      const id = crypto.randomUUID();
      console.log(`[StepSync] Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);
      try {
        const meta = await parseAudioMetadata(file);
        console.log('[StepSync] Metadata parsed:', meta);
        
        let artUrl = await fetchArtwork(`${meta.artist} ${meta.title}`.trim());
        if (!artUrl && meta.title) {
          artUrl = await fetchArtwork(meta.title); // Fallback to just title
        }
        console.log('[StepSync] Artwork found:', artUrl);

        // Auto-generate a stylized banner with text
        const { generateBannerWithText } = await import('./lib/bannerGenerator');
        const autoBanner = await generateBannerWithText(
          meta.title || file.name.replace(/\.[^/.]+$/, ""),
          meta.artist || "Unknown Artist"
        );

        const newItem: SongItem = {
          id,
          file,
          title: meta.title || file.name.replace(/\.[^/.]+$/, ""),
          artist: meta.artist || "Unknown Artist",
          artworkUrl: artUrl || undefined,
          customBanner: autoBanner,
        };

        setSongs(prev => [...prev, newItem]);

        (async () => {
          try {
            console.log(`[StepSync] Starting analysis for: ${file.name}`);
            const buffer = await file.arrayBuffer();
            console.log(`[StepSync] ArrayBuffer loaded, size: ${buffer.byteLength}`);
            const analysis = await processAudio(buffer);
            console.log(`[StepSync] Analysis complete for: ${file.name}`, analysis.bpm);
            setSongs(prev => {
              const newSongs = prev.map(s => s.id === id ? {
                ...s,
                bpm: analysis.bpm,
                offset: analysis.offset,
                analysis: analysis
              } : s);
              if (newSongs.length === 1 || !bpmOverride) {
                setBpmOverride(analysis.bpm.toFixed(3));
              }
              return newSongs;
            });
          } catch (e) {
            console.error('[StepSync] BPM detection failed', e);
          }
        })();
      } catch (err) {
        console.error('[StepSync] Error processing file:', file.name, err);
      }
    }
  }, [songs.length, setBpmOverride]);

  useEffect(() => {
    const handleElectronFiles = async (e: any) => {
      const electronFiles = e.detail;
      const files: { file: File, meta?: any }[] = await Promise.all(electronFiles.map(async (ef: any) => {
        try {
          const response = await fetch(`file://${ef.path}`);
          const blob = await response.blob();
          const file = new File([blob], ef.name, { type: 'audio/mpeg' });
          return { file, meta: ef.metadata };
        } catch (err) {
          console.error("Failed to load electron file via file://", err);
          return { file: new File([], ef.name) }; 
        }
      }));
      
      for (const item of files) {
        if (item.file.size > 0) {
          // Custom process for Electron files with metadata
          const id = crypto.randomUUID();
          const file = item.file;
          const meta = item.meta || { title: file.name.replace(/\.[^/.]+$/, ""), artist: "Unknown Artist" };

          console.log(`[StepSync] Electron processing: ${file.name}`, meta);

          let artUrl = await fetchArtwork(`${meta.artist} ${meta.title}`.trim());
          if (!artUrl && meta.title) {
            artUrl = await fetchArtwork(meta.title); 
          }
          console.log('[StepSync] Artwork found:', artUrl);

          const { generateBannerWithText } = await import('./lib/bannerGenerator');
          const autoBanner = await generateBannerWithText(
            meta.title || file.name.replace(/\.[^/.]+$/, ""),
            meta.artist || "Unknown Artist"
          );

          const newItem: SongItem = {
            id,
            file,
            title: meta.title || file.name.replace(/\.[^/.]+$/, ""),
            artist: meta.artist || "Unknown Artist",
            artworkUrl: artUrl || undefined,
            customBanner: autoBanner,
          };

          setSongs(prev => [...prev, newItem]);

          (async () => {
            try {
              const buffer = await file.arrayBuffer();
              const analysis = await processAudio(buffer);
              setSongs(prev => {
                const newSongs = prev.map(s => s.id === id ? {
                  ...s,
                  bpm: analysis.bpm,
                  offset: analysis.offset,
                  analysis: analysis
                } : s);
                
                // If it's the first song being analyzed, update the global BPM override
                if (newSongs.length === 1 || !bpmOverride) {
                   setBpmOverride(analysis.bpm.toFixed(3));
                }
                
                return newSongs;
              });
            } catch (e) {
              console.error('[StepSync] BPM detection failed', e);
            }
          })();
        }
      }
    };

    window.addEventListener('electron-files-selected', handleElectronFiles);
    return () => window.removeEventListener('electron-files-selected', handleElectronFiles);
  }, [processAddedFiles]);

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

  const updateSong = useCallback((id: string, updated: Partial<SongItem>) => {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  }, [setSongs]);

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
          choreographyStyle: songs.length > 1 ? undefined : choreographyStyle,
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
      {/* StepMania Scrolling Background */}
      <StepManiaBackground />

      <Header
        currentStep={currentStep === 5 ? 4 : currentStep}
        setCurrentStep={setCurrentStep}
        onReset={resetApp}
        onShowHelp={() => setShowHelp(true)}
        hasSongs={songs.length > 0}
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 perspective-container flex-1">
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
                onUpdateSong={updateSong}
                onRemoveSong={(id) => setSongs(prev => prev.filter(s => s.id !== id))}
                onClearAll={() => {
                  setSongs([]);
                  setBpmOverride('');
                }}
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
                choreographyStyle={choreographyStyle}
                setChoreographyStyle={setChoreographyStyle}
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
                onUpdateSong={updateSong}
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
