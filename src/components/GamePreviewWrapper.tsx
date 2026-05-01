import React, { useState, useEffect } from 'react';
import { GamePreview3D } from './GamePreview3D';
import { processAudio } from '../lib/audioAnalysis';
import { generateSM } from '../lib/smGenerator';
import { parseSMNotes, SMNote } from '../lib/smParser';
import { useLocalStorage } from '../useLocalStorage';
import { SongItem } from '../lib/types';

interface GamePreviewWrapperProps {
  song: SongItem;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
}

export function GamePreviewWrapper({ song, audioRef, isPlaying }: GamePreviewWrapperProps) {
  const [notes, setNotes] = useState<SMNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Settings
  const [difficulty] = useLocalStorage('stepsync-difficulty', 3);
  const [trimSilence] = useLocalStorage('stepsync-trimSilence', true);
  const [bpmOverride] = useLocalStorage<string>('stepsync-bpm', '');
  const [onsetThreshold] = useLocalStorage('stepsync-onset', 1.5);
  const [mineProbability] = useLocalStorage('stepsync-minProb', 0.1);

  useEffect(() => {
    let isMounted = true;

    async function analyzeAndGenerate() {
      try {
        setIsLoading(true);
        const arrayBuffer = await song.file.arrayBuffer();
        
        let durationSeconds = 120;
        if (audioRef.current) {
          durationSeconds = audioRef.current.duration || 120;
        }

        const analysis = await processAudio(arrayBuffer);
        
        if (!isMounted) return;

        const smOptions = {
          title: song.title,
          artist: song.artist,
          filename: song.file.name,
          difficultyScale: difficulty,
          trimSilence: trimSilence,
          bpmOverride: bpmOverride ? parseFloat(bpmOverride) : undefined,
          onsetThreshold: onsetThreshold,
          mineProbability: mineProbability,
        };

        const smContent = generateSM(smOptions, analysis, durationSeconds);
        const parsedNotes = parseSMNotes(smContent, smOptions.bpmOverride || analysis.bpm, trimSilence ? analysis.offset : 0);
        
        if (isMounted) {
          setNotes(parsedNotes);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Preview generation failed", err);
        if (isMounted) setIsLoading(false);
      }
    }

    analyzeAndGenerate();

    return () => {
      isMounted = false;
    };
  }, [song, difficulty, trimSilence, bpmOverride, onsetThreshold, mineProbability, audioRef]);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] sm:h-[500px] rounded-xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center border border-slate-800">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium">Analyse et génération de la chorégraphie 3D...</p>
      </div>
    );
  }

  return <GamePreview3D notes={notes} audioRef={audioRef} isPlaying={isPlaying} />;
}
