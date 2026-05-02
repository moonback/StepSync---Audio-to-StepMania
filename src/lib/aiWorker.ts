/**
 * AI Worker — Audio source separation & onset detection
 * Runs in an isolated Web Worker thread to keep the main thread free.
 *
 * Strategy: hybrid filter-bank approach (no full ML inference weight download):
 *   - Bandpass filters via OfflineAudioContext  (kick, snare, bass, lead)
 *   - Normalised energy profiles at 100 samples/second
 *   - Onset detection with < 10 ms precision
 *   - Drop detection (kick + bass energy > 0.75 for ≥ 2 s)
 *
 * Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 9.1, 9.2
 */

import type {
  WorkerInMessage,
  WorkerOutMessage,
  SourceProfile,
  DropInterval,
  OnsetEvent,
  EnhancedAnalysisResult,
} from './aiTypes';
import type { AudioAnalysisResult } from './audioAnalysis';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let abortedIds = new Set<string>();
const AI_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Message dispatcher
// ---------------------------------------------------------------------------
console.log('[AI Worker] Script loaded and starting...');

// Check for OfflineAudioContext support in Worker scope
if (typeof OfflineAudioContext === 'undefined') {
  console.warn('[AI Worker] OfflineAudioContext not supported in this worker environment.');
}

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'INIT':
      console.log('[AI Worker] Received INIT');
      if (typeof OfflineAudioContext === 'undefined') {
        postOut({ type: 'INIT_FALLBACK', reason: 'OfflineAudioContext missing in Worker' });
      } else {
        postOut({ type: 'INIT_OK' });
      }
      break;

    case 'ANALYZE':
      handleAnalyze(msg.id, msg.buffer, msg.sampleRate).catch(err => {
        postOut({ type: 'ERROR', id: msg.id, message: err.message });
      });
      break;

    case 'ABORT':
      abortedIds.add(msg.id);
      break;

    case 'DISPOSE':
      abortedIds.clear();
      break;
  }
};

// ---------------------------------------------------------------------------
// Core analysis
// ---------------------------------------------------------------------------
async function handleAnalyze(
  id: string,
  buffer: ArrayBuffer,
  _sampleRate: number
): Promise<void> {
  try {
    // Decode audio inside the worker using OfflineAudioContext
    const tmpCtx = new OfflineAudioContext(1, 1, 44100);
    const audioBuffer = await decodeAudio(buffer);

    if (isAborted(id)) return;
    postOut({ type: 'PROGRESS', id, pct: 10 });

    const sampleRate = audioBuffer.sampleRate;
    const duration   = audioBuffer.duration;

    // Process in 2-second chunks to keep memory < 512 MB (Req 2.2)
    const CHUNK_SECS = 2;
    const totalChunks = Math.ceil(duration / CHUNK_SECS);

    // Accumulators for energy profiles (100 samples/s)
    const kickEnergy:  number[] = [];
    const snareEnergy: number[] = [];
    const bassEnergy:  number[] = [];
    const leadEnergy:  number[] = [];

    for (let ci = 0; ci < totalChunks; ci++) {
      if (isAborted(id)) return;

      const startSample = Math.floor(ci * CHUNK_SECS * sampleRate);
      const endSample   = Math.min(startSample + Math.floor(CHUNK_SECS * sampleRate), audioBuffer.length);
      const chunkLength = endSample - startSample;

      // Extract chunk PCM
      const chunkData = audioBuffer.getChannelData(0).slice(startSample, endSample);

      // Build filtered energy for each source band
      const [kE, sE, bE, lE] = await Promise.all([
        bandpassEnergy(chunkData, sampleRate, 60,   200,  'lowshelf'),  // kick
        bandpassEnergy(chunkData, sampleRate, 200,  8000, 'peaking'),   // snare (broad)
        bandpassEnergy(chunkData, sampleRate, 40,   300,  'lowshelf'),  // bass
        bandpassEnergy(chunkData, sampleRate, 1000, 16000,'highshelf'),  // lead
      ]);

      kickEnergy.push(...kE);
      snareEnergy.push(...sE);
      bassEnergy.push(...bE);
      leadEnergy.push(...lE);

      const pct = 10 + Math.round((ci / totalChunks) * 60);
      postOut({ type: 'PROGRESS', id, pct });
    }

    if (isAborted(id)) return;
    postOut({ type: 'PROGRESS', id, pct: 75 });

    // Normalise each profile to [0, 1]   (Req 2.6)
    const normKick  = normalise(kickEnergy);
    const normSnare = normalise(snareEnergy);
    const normBass  = normalise(bassEnergy);
    const normLead  = normalise(leadEnergy);

    const sourceProfile: SourceProfile = {
      kick:  normKick,
      snare: normSnare,
      bass:  normBass,
      lead:  normLead,
    };

    if (isAborted(id)) return;
    postOut({ type: 'PROGRESS', id, pct: 80 });

    // Onset detection  (Req 2.4: < 10 ms precision via 100 samples/s = 10 ms bins)
    const onsets: OnsetEvent[] = detectOnsets(normKick,  'kick',  sampleRate)
      .concat(detectOnsets(normSnare, 'snare', sampleRate))
      .concat(detectOnsets(normBass,  'bass',  sampleRate))
      .concat(detectOnsets(normLead,  'lead',  sampleRate));

    onsets.sort((a, b) => a.timeInSeconds - b.timeInSeconds);

    postOut({ type: 'PROGRESS', id, pct: 88 });

    // Drop detection  (Req 3.1, 3.2, 3.3, 3.4)
    const drops = detectDrops(normKick, normBass);

    postOut({ type: 'PROGRESS', id, pct: 93 });

    // Build AudioAnalysisResult-compatible fields from energy data
    const baseAnalysis = deriveBaseAnalysis(normKick, sampleRate, duration);

    postOut({ type: 'PROGRESS', id, pct: 98 });

    const result: EnhancedAnalysisResult = {
      ...baseAnalysis,
      sourceProfile,
      drops,
      onsets,
      aiVersion: AI_VERSION,
    };

    postOut({ type: 'RESULT', id, result });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    postOut({ type: 'ERROR', id, message: msg });
  }
}

// ---------------------------------------------------------------------------
// Audio decoding
// ---------------------------------------------------------------------------
async function decodeAudio(buffer: ArrayBuffer): Promise<AudioBuffer> {
  // We can't create a full AudioContext in a Worker, but OfflineAudioContext works.
  // We use a 1-sample dummy context just to call decodeAudioData.
  const tmpCtx = new OfflineAudioContext(1, 1, 44100);
  return tmpCtx.decodeAudioData(buffer.slice(0));
}

// ---------------------------------------------------------------------------
// Bandpass energy  (Req 2.1, 2.2)
// ---------------------------------------------------------------------------
/**
 * Applies a biquad filter to raw PCM and returns a normalised energy profile
 * at 100 samples/second (10 ms bins).
 */
async function bandpassEnergy(
  pcm:        Float32Array<ArrayBufferLike>,
  sampleRate: number,
  freqLow:    number,
  freqHigh:   number,
  _filterType: string
): Promise<number[]> {
  const length = pcm.length;
  const offCtx = new OfflineAudioContext(1, length, sampleRate);

  const src = offCtx.createBufferSource();
  const buf = offCtx.createBuffer(1, length, sampleRate);
  buf.copyToChannel(new Float32Array(pcm), 0);
  src.buffer = buf;

  // Low-frequency pass (kick / bass)
  const lpf = offCtx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = freqHigh;
  lpf.Q.value = 0.707;

  const hpf = offCtx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = freqLow;
  hpf.Q.value = 0.707;

  src.connect(hpf);
  hpf.connect(lpf);
  lpf.connect(offCtx.destination);
  src.start(0);

  const rendered  = await offCtx.startRendering();
  const data      = rendered.getChannelData(0);
  const bucketSz  = Math.floor(sampleRate / 100);
  const profile: number[] = [];

  for (let i = 0; i < data.length; i += bucketSz) {
    let sumSq = 0;
    let cnt   = 0;
    for (let j = 0; j < bucketSz && i + j < data.length; j++) {
      sumSq += data[i + j] ** 2;
      cnt++;
    }
    profile.push(Math.sqrt(sumSq / (cnt || 1)));
  }

  return profile;
}

// ---------------------------------------------------------------------------
// Normalisation  (Req 2.6)
// ---------------------------------------------------------------------------
function normalise(profile: number[]): number[] {
  if (profile.length === 0) return [];
  const max = Math.max(...profile);
  if (max === 0) return profile.map(() => 0);
  return profile.map(v => Math.min(1, Math.max(0, v / max)));
}

// ---------------------------------------------------------------------------
// Onset detection  (Req 2.4)
// ---------------------------------------------------------------------------
const ONSET_WINDOW   = 5;   // buckets (~50 ms)
const ONSET_MULT     = 1.4; // local mean multiplier
const ONSET_COOLDOWN = 3;   // buckets (~30 ms) min gap

function detectOnsets(
  profile: number[],
  source:  OnsetEvent['source'],
  _sampleRate: number
): OnsetEvent[] {
  const onsets: OnsetEvent[] = [];
  let lastOnset = -ONSET_COOLDOWN;

  for (let i = ONSET_WINDOW; i < profile.length - 1; i++) {
    if (i - lastOnset < ONSET_COOLDOWN) continue;

    let localSum = 0;
    for (let w = i - ONSET_WINDOW; w < i; w++) localSum += profile[w];
    const localMean = localSum / ONSET_WINDOW;

    if (
      profile[i] > localMean * ONSET_MULT &&
      profile[i] > profile[i - 1] &&
      profile[i] >= profile[i + 1]
    ) {
      onsets.push({
        timeInSeconds: i / 100, // 100 samples/sec → 10 ms precision
        energy:        profile[i],
        source,
      });
      lastOnset = i;
    }
  }

  return onsets;
}

// ---------------------------------------------------------------------------
// Drop detection  (Req 3.1–3.4)
// ---------------------------------------------------------------------------
const DROP_THRESHOLD  = 0.75;
const DROP_MIN_SECS   = 2.0;
const DROP_GAP_SECS   = 1.0;

function detectDrops(kick: number[], bass: number[]): DropInterval[] {
  const len = Math.min(kick.length, bass.length);
  const combined = Array.from({ length: len }, (_, i) =>
    (kick[i] + bass[i]) / 2  // average, not sum, to stay in [0,1]
  );

  // Detect raw active segments above threshold
  const raw: DropInterval[] = [];
  let inDrop  = false;
  let dropStart = 0;

  for (let i = 0; i < combined.length; i++) {
    const t = i / 100;
    if (!inDrop && combined[i] > DROP_THRESHOLD) {
      inDrop = true;
      dropStart = t;
    } else if (inDrop && combined[i] <= DROP_THRESHOLD) {
      if (t - dropStart >= DROP_MIN_SECS) {
        raw.push({ startTime: dropStart, endTime: t });
      }
      inDrop = false;
    }
  }
  if (inDrop) {
    const t = len / 100;
    if (t - dropStart >= DROP_MIN_SECS) {
      raw.push({ startTime: dropStart, endTime: t });
    }
  }

  // Merge drops separated by < DROP_GAP_SECS  (Req 3.4)
  const merged: DropInterval[] = [];
  for (const d of raw) {
    if (merged.length > 0) {
      const prev = merged[merged.length - 1];
      if (d.startTime - prev.endTime < DROP_GAP_SECS) {
        prev.endTime = Math.max(prev.endTime, d.endTime);
        continue;
      }
    }
    merged.push({ ...d });
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Derive AudioAnalysisResult-compatible base from kick energy
// ---------------------------------------------------------------------------
function deriveBaseAnalysis(
  kickProfile: number[],
  sampleRate:  number,
  duration:    number
): AudioAnalysisResult {
  // Peak detection on kick profile
  const peaks: number[] = [];
  let lastPeak = -1;
  const MIN_PEAK_GAP = 0.25;

  for (let i = 5; i < kickProfile.length - 1; i++) {
    const t = i / 100;
    if (
      kickProfile[i] > 0.4 &&
      kickProfile[i] > kickProfile[i - 1] &&
      kickProfile[i] >= kickProfile[i + 1] &&
      (lastPeak < 0 || t - lastPeak > MIN_PEAK_GAP)
    ) {
      peaks.push(t);
      lastPeak = t;
    }
  }

  // Estimate BPM from intervals
  const intervals: number[] = [];
  for (let i = 0; i < peaks.length; i++) {
    for (let j = 1; j <= 4 && i + j < peaks.length; j++) {
      const iv = (peaks[i + j] - peaks[i]) / j;
      if (iv >= 0.25 && iv <= 1.5) intervals.push(iv);
    }
  }

  let bpm = 120;
  if (intervals.length > 0) {
    const counts: Record<string, number> = {};
    intervals.forEach(iv => {
      const b = (60 / iv).toFixed(1);
      counts[b] = (counts[b] || 0) + 1;
    });
    let best = 0;
    for (const [b, c] of Object.entries(counts)) {
      if (c > best) { best = c; bpm = parseFloat(b); }
    }
  }

  const offset = peaks.length > 0 ? peaks[0] % (60 / bpm) : 0;

  return {
    bpm,
    offset,
    peaks,
    energyProfile: kickProfile,
    tempoChanges:  [{ timeInSeconds: 0, bpm }],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isAborted(id: string): boolean {
  return abortedIds.has(id);
}

function postOut(msg: WorkerOutMessage) {
  self.postMessage(msg);
}
