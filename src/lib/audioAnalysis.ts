// Audio analysis utilities

export interface AudioAnalysisResult {
  bpm: number;
  offset: number; // in seconds
  peaks: number[]; // times in seconds of major beats
  energyProfile: number[]; // energy levels over time
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

  let bpm = 120; // Default
  if (intervals.length > 0) {
    // Group intervals into buckets to find most common frequency
    const buckets: Record<number, number> = {};
    intervals.forEach(interval => {
      // Round to near interval corresponding to standard BPM
      const currentBpm = 60 / interval;
      // Round BPM to nearest 5 for stability
      const roundedBpm = Math.round(currentBpm / 5) * 5;
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
    bpm = assumedBpm;
  }

  // First peak offset
  const offset = peaks.length > 0 ? peaks[0] % (60 / bpm) : 0;

  return {
    bpm,
    offset,
    peaks,
    energyProfile
  };
}

function calculateMean(data: number[]) {
  if (data.length === 0) return 0;
  return data.reduce((a, b) => a + b, 0) / data.length;
}
