import { AudioAnalysisResult, TempoChange } from './audioAnalysis';

export interface SMOptions {
  title: string;
  artist: string;
  filename: string;
  bannerFileName?: string;
  bgFileName?: string;
  bpmOverride?: number;
  difficultyScale: number; // 1 to 5
  trimSilence?: boolean;
  onsetThreshold?: number;
  mineProbability?: number;
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
  analysis: AudioAnalysisResult,
  durationSeconds: number
): string {
  const bpm = options.bpmOverride || analysis.bpm;
  const offset = options.trimSilence ? analysis.offset : 0;
  
  const tempoMap = new TempoMap(
      options.trimSilence ? analysis.offset : 0, 
      options.bpmOverride ? [] : analysis.tempoChanges, 
      bpm
  );

  let sm = '';
  sm += `#TITLE:${options.title};\n`;
  sm += `#ARTIST:${options.artist};\n`;
  sm += `#MUSIC:${options.filename};\n`;
  if (options.bannerFileName) sm += `#BANNER:${options.bannerFileName};\n`;
  if (options.bgFileName) sm += `#BACKGROUND:${options.bgFileName};\n`;
  sm += `#OFFSET:${-offset.toFixed(3)};\n`;
  sm += `#BPMS:${tempoMap.getBpmString()};\n`;
  sm += `#STOPS:;\n`;
  sm += `#SAMPLESTART:0.000;\n`;
  sm += `#SAMPLELENGTH:10.000;\n\n`;

  // Difficulty mappings
  const difficulties = [
    { name: 'Beginner', meter: 1, stepProbability: 0.2 },
    { name: 'Easy', meter: 3, stepProbability: 0.4 },
    { name: 'Medium', meter: 5, stepProbability: 0.6 },
    { name: 'Hard', meter: 7, stepProbability: 0.8 },
    { name: 'Challenge', meter: 9, stepProbability: 0.95 },
  ];

  // We will generate the target difficulty
  const targetDiff = difficulties[Math.min(options.difficultyScale - 1, 4)];

  sm += `//---------------dance-single - ----------------\n`;
  sm += `#NOTES:\n`;
  sm += `     dance-single:\n`;
  sm += `     :\n`;
  sm += `     ${targetDiff.name}:\n`;
  sm += `     ${targetDiff.meter}:\n`;
  sm += `     0.000,0.000,0.000,0.000,0.000:\n`;

  // Calculate total beats
  const totalBeats = Math.ceil(tempoMap.getTotalBeats(durationSeconds));
  const totalMeasures = Math.ceil(totalBeats / 4);

  // Generate measures
  // 4 beats per measure, quarter notes = 4 lines per measure
  let beatIndex = 0;
  for (let m = 0; m < totalMeasures; m++) {
    for (let b = 0; b < 4; b++) {
      const timeInSeconds = tempoMap.getTimeForBeat(beatIndex);
      
      // Determine energy at this time to adjust probability
      const energyIndex = Math.min(
        Math.max(0, Math.floor(timeInSeconds * 10)), 
        Math.max(0, analysis.energyProfile.length - 1)
      );
      // Normalized roughly above threshold
      const localEnergy = analysis.energyProfile[energyIndex] || 0;
      
      // High energy might spawn mines or more frequent steps, let's keep it simple
      const energyThreshold = options.onsetThreshold || 1.5;
      const avgEnergy = analysis.energyProfile.length > 0 ? (analysis.energyProfile.reduce((a, b) => a + b, 0) / analysis.energyProfile.length) : 0;
      const isHighEnergy = avgEnergy > 0 && localEnergy > avgEnergy * energyThreshold;
      
      let stepLine = '0000';
      if (Math.random() < targetDiff.stepProbability || (isHighEnergy && Math.random() < 0.8)) {
        // Place a note
        const noteIdx = Math.floor(Math.random() * 4);
        const chars = ['0', '0', '0', '0'];
        
        // Add a mine occasionally on high energy
        const mineProb = options.mineProbability ?? 0.1;
        if (isHighEnergy && targetDiff.meter >= 5 && Math.random() < mineProb) {
            chars[Math.floor(Math.random() * 4)] = 'M';
        }
        
        chars[noteIdx] = '1';
        stepLine = chars.join('');
      }

      sm += `${stepLine}\n`;
      beatIndex++;
    }
    
    if (m < totalMeasures - 1) {
      sm += `,\n`;
    }
  }

  sm += `;\n`;

  return sm;
}
