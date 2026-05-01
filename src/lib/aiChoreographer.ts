/**
 * AI-driven choreography and advanced audio analysis
 */

import * as tf from '@tensorflow/tfjs';

export enum ChoreographyStyle {
  BALANCED = 'balanced',
  STREAM = 'stream',
  CROSSOVER = 'crossover',
  JUMP = 'jump'
}

export interface FrequencyBands {
  low: number[];    // 20-250Hz (Kick/Bass)
  mid: number[];    // 250-2000Hz (Snare/Lead)
  high: number[];   // 2000Hz+ (Hi-hat/Cymbals)
}

export async function analyzeAdvancedAI(audioBuffer: AudioBuffer): Promise<FrequencyBands> {
  // We analyze bands in parallel
  const [lowData, midData, highData] = await Promise.all([
    getBandEnergy(audioBuffer, 'lowpass', 250),
    getBandEnergy(audioBuffer, 'bandpass', 1000, 1.0),
    getBandEnergy(audioBuffer, 'highpass', 2500)
  ]);

  return {
    low: lowData,
    mid: midData,
    high: highData
  };
}

async function getBandEnergy(
  buffer: AudioBuffer, 
  filterType: BiquadFilterType,
  frequency: number,
  Q: number = 1.0
): Promise<number[]> {
  // Create a fresh context for each pass to avoid "stopped state" errors
  const ctx = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;
  filter.Q.value = Q;

  source.connect(filter);
  filter.connect(ctx.destination);
  source.start();

  const renderedBuffer = await ctx.startRendering();
  const data = renderedBuffer.getChannelData(0);
  
  // Downsample to 100 samples per second for analysis
  const bucketSize = Math.floor(renderedBuffer.sampleRate / 100);
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i += bucketSize) {
    let sum = 0;
    for (let j = 0; j < bucketSize && i + j < data.length; j++) {
      sum += data[i + j] * data[i + j];
    }
    result.push(Math.sqrt(sum / bucketSize));
  }
  
  return result;
}

/**
 * State machine for Crossover/Tech patterns
 */
export class FootState {
  lastNote: number = -1; // 0:L, 1:D, 2:U, 3:R
  leftFootPos: number = 0; 
  rightFootPos: number = 3;

  getNextNote(style: ChoreographyStyle, energy: number): number {
    const weights = [1, 1, 1, 1];
    
    // Simple tech logic: discourage same note repeats, encourage alternating
    if (this.lastNote !== -1) {
      weights[this.lastNote] *= 0.1; 
    }

    if (style === ChoreographyStyle.CROSSOVER) {
        // Encourage crossing: if last was Left, next should be something that moves the right foot
        // or vice versa.
    }

    // Pick highest weight or randomized
    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < 4; i++) {
      if (rand < weights[i]) return i;
      rand -= weights[i];
    }
    return Math.floor(Math.random() * 4);
  }
}
