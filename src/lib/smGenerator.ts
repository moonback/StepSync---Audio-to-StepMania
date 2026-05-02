import { AudioAnalysisResult, TempoChange } from './audioAnalysis';
import { ChoreographyStyle, EnhancedAnalysisResult } from './aiTypes';
import { buildChoreography } from './choreographer';
import type { DifficultyConfig, SimpleTempoMap } from './choreographer';

export interface SMOptions {
  title: string;
  artist: string;
  subtitle?: string;
  titleTranslit?: string;
  subtitleTranslit?: string;
  artistTranslit?: string;
  genre?: string;
  credit?: string;
  filename: string;
  bannerFileName?: string;
  bgFileName?: string;
  bpmOverride?: number;
  difficultyScale?: number; // 1 to 5
  trimSilence?: boolean;
  onsetThreshold?: number;
  mineProbability?: number;
  videoFileName?: string;
  gameModes?: string[];
  choreographyStyle?: ChoreographyStyle;
}

class TempoMap {
    changes: { beat: number, bpm: number, time: number }[];
    offset: number;
    
    constructor(offset: number, tempoChanges: TempoChange[], fallbackBpm: number) {
        this.offset = offset;
        this.changes = [];
        
        if (!tempoChanges || tempoChanges.length === 0) {
            this.changes.push({ beat: 0, bpm: fallbackBpm, time: offset });
            return;
        }
        
        let firstBpm = tempoChanges[0].bpm;
        this.changes.push({ beat: 0, bpm: firstBpm, time: offset });
        
        for (let i = 0; i < tempoChanges.length; i++) {
            const change = tempoChanges[i];
            
            // if change is before or at offset, skip adding a new beat marker
            // (it's covered by the initial tempo or just before start)
            if (change.timeInSeconds <= offset) continue;
            
            const lastChange = this.changes[this.changes.length - 1];
            if (lastChange.time >= change.timeInSeconds) continue;
            
            const timeDiff = change.timeInSeconds - lastChange.time;
            const beatsElapsed = timeDiff * (lastChange.bpm / 60);
            const newBeat = lastChange.beat + beatsElapsed;
            
            this.changes.push({
                beat: newBeat,
                bpm: change.bpm,
                time: change.timeInSeconds
            });
        }
    }
    
    getTimeForBeat(beat: number): number {
        let activeChange = this.changes[0];
        for (const change of this.changes) {
            if (change.beat <= beat) {
                activeChange = change;
            } else {
                break;
            }
        }
        
        const beatsSinceChange = beat - activeChange.beat;
        return activeChange.time + beatsSinceChange * (60 / activeChange.bpm);
    }
    
    getBpmString(): string {
        return this.changes.map(c => `${c.beat.toFixed(3)}=${c.bpm.toFixed(3)}`).join(',\n');
    }

    getTotalBeats(durationSeconds: number): number {
        // Find last change within duration
        let activeChange = this.changes[0];
        for (const change of this.changes) {
            if (change.time <= durationSeconds) {
                activeChange = change;
            } else {
                break;
            }
        }
        const remainingTime = Math.max(0, durationSeconds - activeChange.time);
        return activeChange.beat + remainingTime * (activeChange.bpm / 60);
    }
}

export function generateSM(
  options: SMOptions,
  analysis: AudioAnalysisResult | EnhancedAnalysisResult,
  durationSeconds: number
): string {
  // Determine whether we have enhanced analysis with AI source profile (Req 8.1, 8.2)
  const enhanced = (analysis as EnhancedAnalysisResult).sourceProfile
    ? (analysis as EnhancedAnalysisResult)
    : null;
  const useChoreographer = !!(options.choreographyStyle && enhanced);
  const bpm = options.bpmOverride || analysis.bpm;
  const offset = options.trimSilence ? analysis.offset : 0;
  
  const tempoMap = new TempoMap(
      options.trimSilence ? analysis.offset : 0, 
      options.bpmOverride ? [] : analysis.tempoChanges, 
      bpm
  );

  let sm = '';
  sm += `#TITLE:${options.title};\n`;
  sm += `#SUBTITLE:${options.subtitle || ''};\n`;
  sm += `#ARTIST:${options.artist};\n`;
  sm += `#TITLETRANSLIT:${options.titleTranslit || ''};\n`;
  sm += `#SUBTITLETRANSLIT:${options.subtitleTranslit || ''};\n`;
  sm += `#ARTISTTRANSLIT:${options.artistTranslit || ''};\n`;
  sm += `#GENRE:${options.genre || ''};\n`;
  sm += `#CREDIT:${options.credit || 'AutoStepper par Maysson.D'};\n`;
  sm += `#BANNER:${options.bannerFileName || ''};\n`;
  sm += `#BACKGROUND:${options.bgFileName || options.videoFileName || ''};\n`;
  sm += `#LYRICSPATH:;\n`;
  sm += `#CDTITLE:;\n`;
  sm += `#MUSIC:${options.filename};\n`;
  sm += `#OFFSET:${-offset.toFixed(3)};\n`;
  sm += `#SAMPLESTART:30.0;\n`;
  sm += `#SAMPLELENGTH:30.0;\n`;
  sm += `#SELECTABLE:YES;\n`;
  sm += `#BPMS:${tempoMap.getBpmString()};\n`;
  sm += `#STOPS:;\n`;
  sm += `#KEYSOUNDS:;\n`;
  sm += `#ATTACKS:;\n`;
  if (options.videoFileName) {
    sm += `#BGCHANGES:0.000=${options.videoFileName}=1.000=1=0=1,,,;\n`;
  }
  sm += `\n`;

  // Difficulty mappings
  const difficulties = [
    { name: 'Beginner', meter: 2, stepProbability: 0.2 },
    { name: 'Easy', meter: 4, stepProbability: 0.4 },
    { name: 'Medium', meter: 6, stepProbability: 0.6 },
    { name: 'Hard', meter: 8, stepProbability: 0.8 },
    { name: 'Challenge', meter: 10, stepProbability: 0.95 },
  ];

  // Calculate total beats once
  const totalBeats = Math.ceil(tempoMap.getTotalBeats(durationSeconds));
  const totalMeasures = Math.ceil(totalBeats / 4);
  const avgEnergy = analysis.energyProfile.length > 0 
    ? (analysis.energyProfile.reduce((a, b) => a + b, 0) / analysis.energyProfile.length) 
    : 0.1;

  // Game mode configurations
  const gameModeConfigs: Record<string, number> = {
    'dance-single': 4,
    'dance-double': 8,
    'pump-single': 5,
    'pump-double': 10
  };

  const selectedModes = options.gameModes && options.gameModes.length > 0 
    ? options.gameModes 
    : ['dance-single'];

  // Generate each difficulty block for each selected mode
  for (const mode of selectedModes) {
    const numPanels = gameModeConfigs[mode] || 4;

    for (const targetDiff of difficulties) {
      sm += `//---------------${mode} - ${targetDiff.name}----------------\n`;
      sm += `#NOTES:\n`;
      sm += `     ${mode}:\n`;
      sm += `     :\n`;
      sm += `     ${targetDiff.name}:\n`;
      sm += `     ${targetDiff.meter}:\n`;
      sm += `     0.733800,0.772920,0.048611,0.850698,0.060764,634.000000,628.000000,6.000000,105.000000,8.000000,0.000000,0.733800,0.772920,0.048611,0.850698,0.060764,634.000000,628.000000,6.000000,105.000000,8.000000,0.000000:\n`;

      // ---------------------------------------------------------------
      // AI Choreographer path (Req 8.1, 8.2: only when style + enhanced analysis provided)
      // ---------------------------------------------------------------
      let choreographyMap: Map<number, string> | null = null;
      if (useChoreographer && enhanced) {
        const diffCfg: DifficultyConfig = {
          name:            targetDiff.name,
          meter:           targetDiff.meter,
          stepProbability: targetDiff.stepProbability,
        };
        // Adapt TempoMap to the SimpleTempoMap interface
        const tempoMapAdapter: SimpleTempoMap = {
          getTimeForBeat: (b: number) => tempoMap.getTimeForBeat(b),
          getTotalBeats:  (d: number) => tempoMap.getTotalBeats(d),
        };
        choreographyMap = buildChoreography({
          style:         options.choreographyStyle!,
          sourceProfile: enhanced.sourceProfile,
          drops:         enhanced.drops,
          onsets:        enhanced.onsets,
          numPanels,
          difficulty:    diffCfg,
          tempoMap:      tempoMapAdapter,
          durationSecs:  durationSeconds,
        });
      }

      let beatIndex = 0;
      for (let m = 0; m < totalMeasures; m++) {
        for (let b = 0; b < 4; b++) {
          // --- AI Choreographer step line ---
          if (choreographyMap && choreographyMap.has(beatIndex)) {
            sm += `${choreographyMap.get(beatIndex)}\n`;
            beatIndex++;
            continue;
          }
          if (choreographyMap) {
            // AI mode: beats with no choreographer note → empty line
            sm += `${'0'.repeat(numPanels)}\n`;
            beatIndex++;
            continue;
          }

          // --- Legacy probabilistic path (Req 8.2: unchanged when no choreographyStyle) ---
          const timeInSeconds = tempoMap.getTimeForBeat(beatIndex);
          const energyIndex = Math.min(
            Math.max(0, Math.floor(timeInSeconds * 100)),
            Math.max(0, analysis.energyProfile.length - 1)
          );

          const localEnergy = analysis.energyProfile[energyIndex] || 0;
          const energyRatio = localEnergy / avgEnergy;
          const energyThreshold = options.onsetThreshold || 1.5;
          const isHighEnergy = energyRatio > energyThreshold;

          let dynamicProb = targetDiff.stepProbability;
          if (energyRatio > 1.0) {
            dynamicProb = Math.min(0.95, targetDiff.stepProbability * (1 + (energyRatio - 1) * 0.5));
          }

          let stepLine = '0'.repeat(numPanels);
          if (Math.random() < dynamicProb) {
            const chars = Array(numPanels).fill('0');
            let noteCount = 1;
            if (isHighEnergy && targetDiff.meter >= 4 && Math.random() < 0.3) {
              noteCount = 2;
            }
            if (isHighEnergy && targetDiff.meter >= 8 && Math.random() < 0.1 && numPanels > 4) {
              noteCount = 3;
            }

            const availableIdx = Array.from({ length: numPanels }, (_, i) => i);
            for (let i = 0; i < noteCount; i++) {
              const randIdx = Math.floor(Math.random() * availableIdx.length);
              const pos = availableIdx.splice(randIdx, 1)[0];
              chars[pos] = '1';
            }

            const mineProb = options.mineProbability ?? 0.1;
            if (noteCount === 1 && Math.random() < mineProb) {
              const emptySpots: number[] = [];
              for (let i = 0; i < numPanels; i++) if (chars[i] === '0') emptySpots.push(i);
              if (emptySpots.length > 0) {
                const minePos = emptySpots[Math.floor(Math.random() * emptySpots.length)];
                chars[minePos] = 'M';
              }
            }
            stepLine = chars.join('');
          }

          sm += `${stepLine}\n`;
          beatIndex++;
        }
        if (m < totalMeasures - 1) sm += `,\n`;
      }
      sm += `;\n\n`;
    }
  }

  return sm;
}
