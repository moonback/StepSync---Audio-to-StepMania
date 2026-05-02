/**
 * AI_Analyzer — Main client-side orchestrator for AI audio analysis.
 *
 * Hierarchy (best → degraded):
 *   1. Web Worker with OfflineAudioContext DSP  (non-blocking)
 *   2. Inline DSP on main thread                (blocks briefly, same quality)
 *   3. Pure processAudio peaks as kick onsets   (lowest quality, always works)
 *
 * "fallback: true" only means the Worker couldn't be used — analysis still
 * runs on the main thread and produces usable EnhancedAnalysisResult data.
 * The style selector is therefore never permanently disabled.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.4, 8.5, 9.1, 9.3, 9.4, 9.5
 */

import type {
  AIAnalyzerState,
  EnhancedAnalysisResult,
  WorkerInMessage,
  WorkerOutMessage,
  OnsetEvent,
  SourceProfile,
  DropInterval,
} from './aiTypes';
import { processAudio } from './audioAnalysis';

// Re-export for consumers
export type { AIAnalyzerState, EnhancedAnalysisResult };

// ---------------------------------------------------------------------------
// Module-level singleton state
// ---------------------------------------------------------------------------
let _worker: Worker | null = null;
let _state: AIAnalyzerState = {
  status:   'idle',
  fallback: false,
  progress: 0,
};

type StateListener = (s: AIAnalyzerState) => void;
const _listeners = new Set<StateListener>();

function setState(partial: Partial<AIAnalyzerState>) {
  _state = { ..._state, ...partial };
  _listeners.forEach(fn => fn(_state));
}

export function subscribeToState(fn: StateListener): () => void {
  _listeners.add(fn);
  fn(_state);
  return () => _listeners.delete(fn);
}

export function getState(): AIAnalyzerState {
  return _state;
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------
export async function initAIAnalyzer(): Promise<void> {
  if (_state.status === 'ready' || _state.status === 'loading') return;

  setState({ status: 'loading', fallback: false, progress: 0 });

  try {
    _worker = createWorker();
    await sendInit(_worker);
    setState({ status: 'ready', fallback: false });
  } catch (err) {
    // Worker failed — we'll use inline analysis instead. Not a hard error.
    console.info('[AI] Worker unavailable, using inline analysis:', (err as Error).message);
    _worker?.terminate();
    _worker = null;
    // fallback: true = "worker not available, but inline DSP still runs"
    setState({ status: 'ready', fallback: true });
  }
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------
export async function analyzeAudio(
  arrayBuffer: ArrayBuffer,
  onProgress?: (pct: number) => void,
  signal?:     AbortSignal
): Promise<EnhancedAnalysisResult> {
  if (_state.fallback || !_worker) {
    // Run DSP analysis inline on the main thread (same algorithm, just synchronous)
    return runInlineAnalysis(arrayBuffer, onProgress, signal);
  }

  setState({ status: 'analyzing', progress: 0 });
  const id = crypto.randomUUID();

  return new Promise<EnhancedAnalysisResult>((resolve, reject) => {
    const worker = _worker!;

    const cleanup = () => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
    };

    const onMessage = (e: MessageEvent<WorkerOutMessage>) => {
      const msg = e.data;
      if (msg.type === 'PROGRESS' && msg.id === id) {
        setState({ progress: msg.pct });
        onProgress?.(msg.pct);
      } else if (msg.type === 'RESULT' && msg.id === id) {
        cleanup();
        setState({ status: 'ready', progress: 100 });
        resolve(msg.result);
      } else if (msg.type === 'ERROR' && msg.id === id) {
        cleanup();
        setState({ status: 'ready', fallback: true });
        runInlineAnalysis(arrayBuffer, onProgress, signal).then(resolve, reject);
      }
    };

    const onError = () => {
      cleanup();
      setState({ status: 'ready', fallback: true });
      runInlineAnalysis(arrayBuffer, onProgress, signal).then(resolve, reject);
    };

    if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    signal?.addEventListener('abort', () => {
      worker.postMessage({ type: 'ABORT', id } as WorkerInMessage);
      cleanup();
      setState({ status: 'ready', progress: 0 });
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);

    const bufferCopy = arrayBuffer.slice(0);
    worker.postMessage(
      { type: 'ANALYZE', id, buffer: bufferCopy, sampleRate: 44100 } as WorkerInMessage,
      [bufferCopy]
    );
  });
}

// ---------------------------------------------------------------------------
// Dispose
// ---------------------------------------------------------------------------
export async function disposeAIAnalyzer(): Promise<void> {
  if (_worker) {
    _worker.postMessage({ type: 'DISPOSE' } as WorkerInMessage);
    await new Promise(r => setTimeout(r, 300));
    _worker.terminate();
    _worker = null;
  }
  setState({ status: 'idle', fallback: false, progress: 0 });
}

// ---------------------------------------------------------------------------
// Inline DSP analysis (main thread — same algorithm as the Worker)
// ---------------------------------------------------------------------------

/**
 * Runs the full bandpass + onset + drop pipeline directly on the main thread.
 * Called when the Worker is unavailable. Produces the same EnhancedAnalysisResult
 * structure so the Choreographer always has real onset data to work with.
 */
async function runInlineAnalysis(
  arrayBuffer: ArrayBuffer,
  onProgress?: (pct: number) => void,
  signal?:     AbortSignal
): Promise<EnhancedAnalysisResult> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  setState({ status: 'analyzing', fallback: true, progress: 0 });
  onProgress?.(5);

  try {
    // 1. Decode audio
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    } finally {
      if (audioCtx.state !== 'closed') audioCtx.close();
    }

    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    onProgress?.(15);

    const sampleRate = audioBuffer.sampleRate;
    const pcm = audioBuffer.getChannelData(0);

    // 2. Extract bandpass energy profiles
    const [kickE, snareE, bassE, leadE] = await Promise.all([
      bandpassEnergy(pcm, sampleRate, 60,   200),
      bandpassEnergy(pcm, sampleRate, 200,  8000),
      bandpassEnergy(pcm, sampleRate, 40,   300),
      bandpassEnergy(pcm, sampleRate, 1000, 16000),
    ]);
    onProgress?.(65);

    const normKick  = normalise(kickE);
    const normSnare = normalise(snareE);
    const normBass  = normalise(bassE);
    const normLead  = normalise(leadE);

    const sourceProfile: SourceProfile = {
      kick: normKick, snare: normSnare, bass: normBass, lead: normLead,
    };

    // 3. Detect onsets
    const onsets: OnsetEvent[] = [
      ...detectOnsets(normKick,  'kick'),
      ...detectOnsets(normSnare, 'snare'),
      ...detectOnsets(normBass,  'bass'),
      ...detectOnsets(normLead,  'lead'),
    ].sort((a, b) => a.timeInSeconds - b.timeInSeconds);

    onProgress?.(80);

    // 4. Detect drops
    const drops = detectDrops(normKick, normBass);

    onProgress?.(90);

    // 5. Base analysis from peaks
    const base = await processAudio(arrayBuffer.slice(0));

    onProgress?.(100);
    setState({ status: 'ready', fallback: true, progress: 100 });

    return {
      ...base,
      sourceProfile,
      drops,
      onsets,
      aiVersion: '1.0.0-inline',
    };

  } catch (err) {
    if ((err as DOMException).name === 'AbortError') throw err;

    // Last resort: use processAudio peaks converted to kick onsets
    console.warn('[AI] Inline DSP failed, using peak-based fallback:', err);
    const base = await processAudio(arrayBuffer.slice(0));
    const kickOnsets: OnsetEvent[] = base.peaks.map(t => ({
      timeInSeconds: t, energy: 0.75, source: 'kick' as const,
    }));
    const snareOnsets: OnsetEvent[] = base.peaks
      .filter((_, i) => i % 2 === 1)
      .map(t => ({ timeInSeconds: t + 0.01, energy: 0.6, source: 'snare' as const }));

    setState({ status: 'ready', fallback: true, progress: 100 });
    return {
      ...base,
      sourceProfile: { kick: [], snare: [], bass: [], lead: [] },
      drops: [],
      onsets: [...kickOnsets, ...snareOnsets].sort((a, b) => a.timeInSeconds - b.timeInSeconds),
      aiVersion: '0.0.0-peaks',
    };
  }
}

// ---------------------------------------------------------------------------
// DSP helpers (mirror of aiWorker.ts — kept in sync manually)
// ---------------------------------------------------------------------------

async function bandpassEnergy(
  pcm: Float32Array<ArrayBufferLike>, sampleRate: number, freqLow: number, freqHigh: number
): Promise<number[]> {
  const offCtx = new OfflineAudioContext(1, pcm.length, sampleRate);
  const src = offCtx.createBufferSource();
  const buf = offCtx.createBuffer(1, pcm.length, sampleRate);
  // Ensure strict ArrayBuffer (getChannelData returns ArrayBufferLike which may be SharedArrayBuffer)
  buf.copyToChannel(new Float32Array(pcm), 0);
  src.buffer = buf;

  const hpf = offCtx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = freqLow;
  hpf.Q.value = 0.707;

  const lpf = offCtx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = freqHigh;
  lpf.Q.value = 0.707;

  src.connect(hpf); hpf.connect(lpf); lpf.connect(offCtx.destination);
  src.start(0);

  const rendered = await offCtx.startRendering();
  const data = rendered.getChannelData(0);
  const bucketSz = Math.floor(sampleRate / 100);
  const profile: number[] = [];

  for (let i = 0; i < data.length; i += bucketSz) {
    let sumSq = 0, cnt = 0;
    for (let j = 0; j < bucketSz && i + j < data.length; j++) {
      sumSq += data[i + j] ** 2; cnt++;
    }
    profile.push(Math.sqrt(sumSq / (cnt || 1)));
  }
  return profile;
}

function normalise(profile: number[]): number[] {
  if (!profile.length) return [];
  const max = Math.max(...profile);
  if (max === 0) return profile.map(() => 0);
  return profile.map(v => Math.min(1, Math.max(0, v / max)));
}

function detectOnsets(profile: number[], source: OnsetEvent['source']): OnsetEvent[] {
  const onsets: OnsetEvent[] = [];
  const WIN = 5, MULT = 1.4, COOL = 3;
  let lastOnset = -COOL;
  for (let i = WIN; i < profile.length - 1; i++) {
    if (i - lastOnset < COOL) continue;
    let s = 0;
    for (let w = i - WIN; w < i; w++) s += profile[w];
    const mean = s / WIN;
    if (profile[i] > mean * MULT && profile[i] > profile[i - 1] && profile[i] >= profile[i + 1]) {
      onsets.push({ timeInSeconds: i / 100, energy: profile[i], source });
      lastOnset = i;
    }
  }
  return onsets;
}

function detectDrops(kick: number[], bass: number[]): DropInterval[] {
  const len = Math.min(kick.length, bass.length);
  const raw: DropInterval[] = [];
  let inDrop = false, dropStart = 0;

  for (let i = 0; i < len; i++) {
    const t = i / 100;
    const combined = (kick[i] + bass[i]) / 2;
    if (!inDrop && combined > 0.75) { inDrop = true; dropStart = t; }
    else if (inDrop && combined <= 0.75) {
      if (t - dropStart >= 2) raw.push({ startTime: dropStart, endTime: t });
      inDrop = false;
    }
  }
  if (inDrop) {
    const t = len / 100;
    if (t - dropStart >= 2) raw.push({ startTime: dropStart, endTime: t });
  }

  const merged: DropInterval[] = [];
  for (const d of raw) {
    if (merged.length > 0 && d.startTime - merged[merged.length - 1].endTime < 1) {
      merged[merged.length - 1].endTime = Math.max(merged[merged.length - 1].endTime, d.endTime);
    } else {
      merged.push({ ...d });
    }
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Worker helpers
// ---------------------------------------------------------------------------
function createWorker(): Worker {
  return new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' });
}

function sendInit(worker: Worker): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('[AI] Starting worker init...');
    const timeout = setTimeout(() => {
      worker.removeEventListener('message', onMsg);
      worker.removeEventListener('error', onErr);
      reject(new Error('Worker init timeout (10s)'));
    }, 10_000);

    const done = () => {
      clearTimeout(timeout);
      worker.removeEventListener('message', onMsg);
      worker.removeEventListener('error', onErr);
    };

    const onMsg = (e: MessageEvent<WorkerOutMessage>) => {
      console.log('[AI] Received worker message:', e.data.type);
      if (e.data.type === 'INIT_OK') {
        done();
        resolve();
      } else if (e.data.type === 'INIT_FALLBACK') {
        done();
        reject(new Error(e.data.reason));
      }
    };
    const onErr = (ev: ErrorEvent) => {
      console.error('[AI] Worker script error during init:', ev.message);
      done();
      reject(new Error(ev.message || 'Worker error'));
    };

    worker.addEventListener('message', onMsg);
    worker.addEventListener('error', onErr);
    worker.postMessage({ type: 'INIT', modelUrl: '' } as WorkerInMessage);
  });
}
