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
}

/**
 * Robust BPM detection using OfflineAudioContext and peak analysis
 */
export async function processAudio(arrayBuffer: ArrayBuffer): Promise<AudioAnalysisResult> {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  let audioBuffer: AudioBuffer;
  
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    if (audioCtx.state !== 'closed') {
      await audioCtx.close();
    }
  }

  // 1. Pre-process: Filter audio to isolate the beat (usually low frequency)
  const offlineCtx = new OfflineAudioContext(
    1,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  // Lowpass filter at 150Hz to isolate kick drum/bass
  const filter = offlineCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 150;
  filter.Q.value = 1;

  source.connect(filter);
  filter.connect(offlineCtx.destination);
  source.start(0);

  const filteredBuffer = await offlineCtx.startRendering();
  const channelData = filteredBuffer.getChannelData(0);

  // 2. Energy Profile & Peak Detection
  // We use a higher resolution for precision (100 samples per second = 10ms)
  const sampleRate = filteredBuffer.sampleRate;
  const bucketSize = Math.floor(sampleRate / 100); 
  const energyProfile: number[] = [];
  
  for (let i = 0; i < channelData.length; i += bucketSize) {
    let sumSquared = 0;
    let count = 0;
    for (let j = 0; j < bucketSize && i + j < channelData.length; j++) {
      const val = channelData[i + j];
      sumSquared += val * val;
      count++;
    }
    energyProfile.push(Math.sqrt(sumSquared / (count || 1)));
  }

  // 3. Robust Peak detection (Adaptive Threshold)
  const peaks: number[] = [];
  const windowSizePeaks = 10; // 10 buckets = 100ms
  
  let lastPeakTime = -1;
  const minPeakDistance = 0.25; // max 240 BPM

  for (let i = windowSizePeaks; i < energyProfile.length - windowSizePeaks; i++) {
    // Local mean
    let localSum = 0;
    for (let j = i - windowSizePeaks; j < i + windowSizePeaks; j++) {
      localSum += energyProfile[j];
    }
    const localMean = localSum / (windowSizePeaks * 2);
    const peakThreshold = localMean * 1.6;

    if (energyProfile[i] > peakThreshold && 
        energyProfile[i] > energyProfile[i-1] && 
        energyProfile[i] > energyProfile[i+1]) {
      
      const time = i / 100;
      if (lastPeakTime === -1 || (time - lastPeakTime) > minPeakDistance) {
        peaks.push(time);
        lastPeakTime = time;
      }
    }
  }

  // 4. Interval Analysis (Histogram)
  const intervals: number[] = [];
  for (let i = 0; i < peaks.length; i++) {
    for (let j = 1; j <= 4; j++) { // Look up to 4 peaks ahead to find patterns
      if (i + j < peaks.length) {
        const interval = (peaks[i+j] - peaks[i]) / j;
        if (interval >= 0.25 && interval <= 1.5) { // 40 to 240 BPM
          intervals.push(interval);
        }
      }
    }
  }

  const bpm = getBpmFromIntervals(intervals);

  // 5. Detect Tempo Changes (Drifts)
  const tempoChanges: TempoChange[] = [];
  const windowSize = 15; // seconds
  const stepSize = 5; // seconds
  const maxTime = audioBuffer.duration;
  
  let currentBpm = bpm;
  tempoChanges.push({ timeInSeconds: 0, bpm });

  for (let t = 0; t < maxTime - windowSize; t += stepSize) {
    const windowPeaks = peaks.filter(p => p >= t && p < t + windowSize);
    if (windowPeaks.length < 10) continue;

    const windowIntervals: number[] = [];
    for (let i = 1; i < windowPeaks.length; i++) {
        const diff = windowPeaks[i] - windowPeaks[i-1];
        if (diff >= 0.25 && diff <= 1.5) windowIntervals.push(diff);
    }

    if (windowIntervals.length > 5) {
        const detectedBpm = getBpmFromIntervals(windowIntervals);
        if (Math.abs(detectedBpm - currentBpm) > 2) { // 2 BPM threshold for change
            tempoChanges.push({ timeInSeconds: t, bpm: detectedBpm });
            currentBpm = detectedBpm;
        }
    }
  }

  // 6. Calculate Offset (First beat)
  // Look for the first major peak and align it to the grid
  let offset = 0;
  if (peaks.length > 0) {
    const firstPeak = peaks[0];
    const beatDuration = 60 / bpm;
    offset = firstPeak % beatDuration;
    // We want the offset to be the distance from 0 to the first beat, 
    // StepMania offset is usually the time of the first beat.
  }

  return {
    bpm,
    offset,
    peaks,
    energyProfile,
    tempoChanges
  };
}

function getBpmFromIntervals(intervals: number[]): number {
  if (intervals.length === 0) return 120;
  
  const counts: Record<string, number> = {};
  intervals.forEach(interval => {
    const b = 60 / interval;
    // Round to 0.1 for high precision histogram
    const rounded = b.toFixed(1);
    counts[rounded] = (counts[rounded] || 0) + 1;
  });

  let maxCount = 0;
  let bestBpm = 120;
  
  for (const [b, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      bestBpm = parseFloat(b);
    }
  }
  
  // Refine: Check if 2x or 0.5x is more likely (simple check)
  // Often algorithms detect double tempo
  return bestBpm;
}

function calculateMean(data: number[]) {
  if (data.length === 0) return 0;
  return data.reduce((a, b) => a + b, 0) / data.length;
}
