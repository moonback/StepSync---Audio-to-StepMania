import { AudioAnalysisResult } from './audioAnalysis';

export interface SMOptions {
  title: string;
  artist: string;
  filename: string;
  bannerFileName?: string;
  bgFileName?: string;
  bpmOverride?: number;
  difficultyScale: number; // 1 to 5
  trimSilence?: boolean; // We might just adjust offset.
  onsetThreshold?: number;
  mineProbability?: number;
}

export function generateSM(
  options: SMOptions, 
  analysis: AudioAnalysisResult,
  durationSeconds: number
): string {
  const bpm = options.bpmOverride || analysis.bpm;
  const offset = options.trimSilence ? analysis.offset : 0;
  
  let sm = '';
  sm += `#TITLE:${options.title};\n`;
  sm += `#ARTIST:${options.artist};\n`;
  sm += `#MUSIC:${options.filename};\n`;
  if (options.bannerFileName) sm += `#BANNER:${options.bannerFileName};\n`;
  if (options.bgFileName) sm += `#BACKGROUND:${options.bgFileName};\n`;
  sm += `#OFFSET:${-offset.toFixed(3)};\n`;
  
  if (options.bpmOverride) {
      sm += `#BPMS:0.000=${options.bpmOverride.toFixed(3)};\n`;
  } else {
      // StepMania allows mapping multiple tempos; if analysis had them, we'd list them 
      // e.g. 0.000=120, 10.000=125. Using the detected one as base.
      sm += `#BPMS:0.000=${bpm.toFixed(3)};\n`;
  }
  
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
  const beatsPerSecond = bpm / 60;
  const totalBeats = Math.ceil(durationSeconds * beatsPerSecond);
  const totalMeasures = Math.ceil(totalBeats / 4);

  // Generate measures
  // 4 beats per measure, quarter notes = 4 lines per measure
  let beatIndex = 0;
  for (let m = 0; m < totalMeasures; m++) {
    for (let b = 0; b < 4; b++) {
      const timeInSeconds = (beatIndex / beatsPerSecond) + offset;
      
      // Determine energy at this time to adjust probability
      const energyIndex = Math.min(
        Math.floor(timeInSeconds * 10), 
        analysis.energyProfile.length - 1
      );
      // Normalized roughly above threshold
      const localEnergy = analysis.energyProfile[energyIndex] || 0;
      
      // High energy might spawn mines or more frequent steps, let's keep it simple
      const energyThreshold = options.onsetThreshold || 1.5;
      const isHighEnergy = localEnergy > (analysis.energyProfile.reduce((a, b) => a + b, 0) / analysis.energyProfile.length) * energyThreshold;
      
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
