import { AudioAnalysisResult, TempoChange } from './audioAnalysis';

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
  difficultyScale: number; // 1 to 5
  trimSilence?: boolean;
  onsetThreshold?: number;
  mineProbability?: number;
  videoFileName?: string;
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

  // We will generate the target difficulty
  const targetDiff = difficulties[Math.min(options.difficultyScale - 1, 4)];
  
  // Difficulty string format from user: "Difficulty:\n     Level:"
  const difficultyStr = `${targetDiff.name}:\n     ${targetDiff.meter}:`;

  sm += `//---------------dance-single - ----------------\n`;
  sm += `#NOTES:\n`;
  sm += `     dance-single:\n`;
  sm += `     :\n`;
  sm += `     ${difficultyStr}\n`;
  sm += `     0.733800,0.772920,0.048611,0.850698,0.060764,634.000000,628.000000,6.000000,105.000000,8.000000,0.000000,0.733800,0.772920,0.048611,0.850698,0.060764,634.000000,628.000000,6.000000,105.000000,8.000000,0.000000:\n`;

  // Calculate total beats
  const totalBeats = Math.ceil(tempoMap.getTotalBeats(durationSeconds));
  const totalMeasures = Math.ceil(totalBeats / 4);

  // Generate measures
  // 4 beats per measure, quarter notes = 4 lines per measure
  let beatIndex = 0;
  
  // Pre-calculate avg energy for normalization
  const avgEnergy = analysis.energyProfile.length > 0 
    ? (analysis.energyProfile.reduce((a, b) => a + b, 0) / analysis.energyProfile.length) 
    : 0.1;

  for (let m = 0; m < totalMeasures; m++) {
    for (let b = 0; b < 4; b++) {
      const timeInSeconds = tempoMap.getTimeForBeat(beatIndex);
      
      // Determine energy at this time (100Hz resolution from improved audioAnalysis)
      const energyIndex = Math.min(
        Math.max(0, Math.floor(timeInSeconds * 100)), 
        Math.max(0, analysis.energyProfile.length - 1)
      );
      
      const localEnergy = analysis.energyProfile[energyIndex] || 0;
      const energyRatio = localEnergy / avgEnergy;
      
      const energyThreshold = options.onsetThreshold || 1.5;
      const isHighEnergy = energyRatio > energyThreshold;
      
      // Calculate dynamic probability based on difficulty and local energy
      // More energy = more chance for a note
      let dynamicProb = targetDiff.stepProbability;
      if (energyRatio > 1.0) {
        dynamicProb = Math.min(0.95, targetDiff.stepProbability * (1 + (energyRatio - 1) * 0.5));
      }

      let stepLine = '0000';
      if (Math.random() < dynamicProb) {
        const chars = ['0', '0', '0', '0'];
        
        // Decide number of notes (Jumps)
        // Jumps only if high energy and not beginner
        let noteCount = 1;
        if (isHighEnergy && targetDiff.meter >= 4 && Math.random() < 0.3) {
            noteCount = 2;
        }

        // Place notes
        const availableIdx = [0, 1, 2, 3];
        for (let i = 0; i < noteCount; i++) {
            const randIdx = Math.floor(Math.random() * availableIdx.length);
            const pos = availableIdx.splice(randIdx, 1)[0];
            chars[pos] = '1';
        }

        // Add a mine occasionally if it's not a jump
        const mineProb = options.mineProbability ?? 0.1;
        if (noteCount === 1 && Math.random() < mineProb) {
            // Find an empty spot for the mine
            const emptySpots = [];
            for (let i = 0; i < 4; i++) if (chars[i] === '0') emptySpots.push(i);
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
    
    if (m < totalMeasures - 1) {
      sm += `,\n`;
    }
  }

  sm += `;\n`;

  return sm;
}
