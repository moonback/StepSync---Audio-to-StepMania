// Audio analysis utilities

export interface TempoChange {
  timeInSeconds: number;
  bpm: number;
}

export interface AudioAnalysisResult {
  bpm: number;
  offset: number; // in seconds
  peaks: number[]; // times in seconds of major beats
  energyProfile: number[]; // energy levels over time
  tempoChanges: TempoChange[];
  frequencyBands?: {
    low: number[];
    mid: number[];
    high: number[];
  };
}

function getBpmFromIntervals(intervals: number[], roundFactor: number = 5): number {
  if (intervals.length === 0) return 120;
  const buckets: Record<number, number> = {};
  intervals.forEach(interval => {
    const currentBpm = 60 / interval;
    const roundedBpm = Math.round(currentBpm / roundFactor) * roundFactor;
    if (roundedBpm >= 60 && roundedBpm <= 240) {
      buckets[roundedBpm] = (buckets[roundedBpm] || 0) + 1;
    }
  });

  let maxCount = 0;
  let assumedBpm = 120;
  for (const [b, count] of Object.entries(buckets)) {
    if (count > maxCount) {
      maxCount = count;
      assumedBpm = parseInt(b, 10);
    }
  }
  return assumedBpm;
}

export async function processAudio(arrayBuffer: ArrayBuffer): Promise<AudioAnalysisResult> {
  let audioCtx: AudioContext | null = null;
  let audioBuffer: AudioBuffer;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const rawBuffer = arrayBuffer.slice(0); // clone just in case
    audioBuffer = await audioCtx.decodeAudioData(rawBuffer);
  } finally {
    if (audioCtx && audioCtx.state !== 'closed') {
        await audioCtx.close();
    }
  }

  // Simplified BPM detection
  const channelData = audioBuffer.getChannelData(0);
  
  // 1. Calculate energy profile (e.g., 10 samples per second)
  const sampleRate = audioBuffer.sampleRate;
  const bucketSize = Math.floor(sampleRate / 10);
  const energyProfile: number[] = [];
  
  for (let i = 0; i < channelData.length; i += bucketSize) {
    let sum = 0;
    for (let j = 0; j < bucketSize && i + j < channelData.length; j++) {
      sum += Math.abs(channelData[i + j]);
    }
    energyProfile.push(sum / bucketSize);
  }

  // Find peaks to estimate BPM
  // A real implementation would do cross-correlation or comb filters, 
  // but for browser-based we will do a simple peak detection over a threshold.
  const threshold = calculateMean(energyProfile) * 1.5;
  const peaks: number[] = [];
  
  for (let i = 1; i < energyProfile.length - 1; i++) {
    if (energyProfile[i] > threshold && energyProfile[i] > energyProfile[i-1] && energyProfile[i] > energyProfile[i+1]) {
      peaks.push(i / 10); // time in seconds
    }
  }

  // Estimate BPM by looking at intervals between consecutive peaks
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const diff = peaks[i] - peaks[i-1];
    if (diff > 0.2 && diff < 2.0) { // between 30 and 300 bpm
      intervals.push(diff);
    }
  }

  const bpm = getBpmFromIntervals(intervals, 5);

  const tempoChanges: TempoChange[] = [];
  const windowSize = 20; // seconds
  const stepSize = 10; // seconds
  
  let lastBpm = -1;
  let maxTime = peaks.length > 0 ? peaks[peaks.length - 1] : 0;
  
  // Find tempo drifts
  for (let t = 0; t < maxTime; t += stepSize) {
      const windowPeaks = peaks.filter(p => p >= t && p < t + windowSize);
      if (windowPeaks.length < 5) continue;
      
      const windowIntervals: number[] = [];
      for (let i = 1; i < windowPeaks.length; i++) {
          const diff = windowPeaks[i] - windowPeaks[i-1];
          if (diff > 0.2 && diff < 2.0) {
              windowIntervals.push(diff);
          }
      }
      
      const windowBpm = getBpmFromIntervals(windowIntervals, 1); // Exact tracking
      
      if (lastBpm === -1) {
          lastBpm = windowBpm;
          tempoChanges.push({ timeInSeconds: 0, bpm: windowBpm });
      } else if (Math.abs(windowBpm - lastBpm) >= 3) {
          // Significant change detected
          tempoChanges.push({ timeInSeconds: t, bpm: windowBpm });
          lastBpm = windowBpm;
      }
  }
  
  if (tempoChanges.length === 0) {
      tempoChanges.push({ timeInSeconds: 0, bpm: bpm });
  }

  // First peak offset
  const offset = peaks.length > 0 ? peaks[0] % (60 / bpm) : 0;

  return {
    bpm,
    offset,
    peaks,
    energyProfile,
    tempoChanges
  };
}

function calculateMean(data: number[]) {
  if (data.length === 0) return 0;
  return data.reduce((a, b) => a + b, 0) / data.length;
}
