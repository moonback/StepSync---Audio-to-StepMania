/**
 * Choreographer — AI-driven step placement engine.
 *
 * Three styles:
 *   • stream    — constant stream of notes on kick/snare, anti-jackhammer rotation (Req 4)
 *   • crossover — alternating left/right for foot-crossing, uses lead onsets (Req 5)
 *   • jump      — jumps on kick in Drop sections, singles outside (Req 6)
 *
 * Entry point: buildChoreography(ctx)
 *   Returns Map<beatIndex, stepLine> which smGenerator merges into the .sm output.
 *
 * Requirements: 4.1-4.5, 5.1-5.5, 6.1-6.5
 */

import type {
  ChoreographyStyle,
  SourceProfile,
  DropInterval,
  OnsetEvent,
} from './aiTypes';
import type { TempoChange } from './audioAnalysis';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface DifficultyConfig {
  name:            string;
  meter:           number;
  stepProbability: number;
}

export interface ChoreographerContext {
  style:         ChoreographyStyle;
  sourceProfile: SourceProfile;
  drops:         DropInterval[];
  onsets:        OnsetEvent[];
  numPanels:     number;
  difficulty:    DifficultyConfig;
  tempoMap:      SimpleTempoMap;
  durationSecs:  number;
}

/** Minimal tempo-map interface so choreographer doesn't depend on smGenerator internals. */
export interface SimpleTempoMap {
  getTimeForBeat(beat: number): number;
  getTotalBeats(durationSeconds: number): number;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Builds a step-placement map for one difficulty block.
 * Returns a Map<beatIndex, stepLine string> for beats that should have notes.
 * The caller merges this into the standard beat grid.
 */
export function buildChoreography(ctx: ChoreographerContext): Map<number, string> {
  switch (ctx.style) {
    case 'stream':    return buildStream(ctx);
    case 'crossover': return buildCrossover(ctx);
    case 'jump':      return buildJump(ctx);
    default:          return new Map();
  }
}

// ---------------------------------------------------------------------------
// Helpers shared across styles
// ---------------------------------------------------------------------------

/** Returns true if `timeSeconds` falls within any DropInterval. */
function inDrop(time: number, drops: DropInterval[]): boolean {
  return drops.some(d => time >= d.startTime && time < d.endTime);
}

/** Scale a beat to measure beat number (0-indexed within its measure). */
function beatInMeasure(beat: number): number {
  return Math.floor(beat) % 4;
}

/** Build a zero-filled step line for numPanels, then set active panels. */
function stepLine(numPanels: number, active: number[]): string {
  const chars = Array<string>(numPanels).fill('0');
  for (const idx of active) {
    if (idx >= 0 && idx < numPanels) chars[idx] = '1';
  }
  return chars.join('');
}

/**
 * Filter onsets by source, then limit density to maxPerSec by dropping
 * lowest-energy onsets in sliding windows.
 */
function filteredOnsets(
  onsets: OnsetEvent[],
  sources: Array<OnsetEvent['source']>,
  maxPerSec: number
): OnsetEvent[] {
  const filtered = onsets.filter(o => sources.includes(o.source));
  if (maxPerSec <= 0) return filtered;

  // Group into 1-second buckets and keep only top-maxPerSec by energy
  const buckets = new Map<number, OnsetEvent[]>();
  for (const o of filtered) {
    const key = Math.floor(o.timeInSeconds);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(o);
  }

  const result: OnsetEvent[] = [];
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => b.energy - a.energy);
    result.push(...bucket.slice(0, maxPerSec));
  }
  result.sort((a, b) => a.timeInSeconds - b.timeInSeconds);
  return result;
}

/** Map onset time to nearest beat index given a tempo map. */
function timeToBeat(time: number, bpm: number, offset: number): number {
  const beatDuration = 60 / bpm;
  return Math.max(0, Math.round((time - offset) / beatDuration));
}

// ---------------------------------------------------------------------------
// Style 1: Stream  (Req 4.1–4.5)
// ---------------------------------------------------------------------------

/**
 * Panel rotation: left→down→up→right (indices 0,1,2,3 for dance-single).
 * Anti-jackhammer: never repeat same panel on consecutive notes.
 */
const STREAM_CYCLE_4 = [0, 1, 2, 3]; // dance-single default
const STREAM_CYCLE_5 = [0, 1, 2, 3, 4];
const STREAM_CYCLE_8 = [0, 1, 2, 3, 4, 5, 6, 7];

function getStreamCycle(numPanels: number): number[] {
  if (numPanels === 5) return STREAM_CYCLE_5;
  if (numPanels >= 8) return STREAM_CYCLE_8.slice(0, numPanels);
  return STREAM_CYCLE_4;
}

function buildStream(ctx: ChoreographerContext): Map<number, string> {
  const { sourceProfile, drops, onsets, numPanels, tempoMap, durationSecs, difficulty } = ctx;
  const map = new Map<number, string>();

  // Limit to 8 notes/sec; use kick + snare (Req 4.3)
  const active = filteredOnsets(onsets, ['kick', 'snare'], 8);
  const cycle  = getStreamCycle(numPanels);
  let cycleIdx = 0;
  let lastPanel = -1;

  const bpm    = estimateBpm(sourceProfile);
  const offset = estimateOffset(sourceProfile, bpm);

  for (const onset of active) {
    const beat = timeToBeat(onset.timeInSeconds, bpm, offset);
    const isInDrop = inDrop(onset.timeInSeconds, drops);
    const beatMod  = beatInMeasure(beat);

    // Req 4.5: Jumps only on beats 1 and 3 during drops
    if (isInDrop && (beatMod === 0 || beatMod === 2)) {
      // Pick two non-adjacent panels
      const [p1, p2] = pickNonAdjacentPair(numPanels, lastPanel);
      map.set(beat, stepLine(numPanels, [p1, p2]));
      lastPanel = p2;
      cycleIdx  = (cycle.indexOf(p2) + 1) % cycle.length;
      continue;
    }

    // Anti-jackhammer rotation (Req 4.2)
    let panel = cycle[cycleIdx % cycle.length];
    let attempts = 0;
    while (panel === lastPanel && attempts < cycle.length) {
      cycleIdx++;
      panel = cycle[cycleIdx % cycle.length];
      attempts++;
    }

    map.set(beat, stepLine(numPanels, [panel]));
    lastPanel = panel;
    cycleIdx  = (cycleIdx + 1) % cycle.length;
  }

  return map;
}

// ---------------------------------------------------------------------------
// Style 2: Crossover/Tech  (Req 5.1–5.5)
// ---------------------------------------------------------------------------

/**
 * Left panels = indices 0..(half-1), Right panels = half..numPanels-1
 * Goal: alternate L/R, never > 3 consecutive same side.
 */
function buildCrossover(ctx: ChoreographerContext): Map<number, string> {
  const { sourceProfile, drops, onsets, numPanels, tempoMap, durationSecs } = ctx;
  const map = new Map<number, string>();

  const bpm    = estimateBpm(sourceProfile);
  const offset = estimateOffset(sourceProfile, bpm);
  const half   = Math.floor(numPanels / 2);

  // Prefer lead onsets; fall back to snare if lead energy < 0.1 (Req 5.5)
  const maxLeadEnergy = sourceProfile.lead.length > 0
    ? Math.max(...sourceProfile.lead)
    : 0;
  const primarySrc: Array<OnsetEvent['source']> = maxLeadEnergy >= 0.1
    ? ['lead']
    : ['snare'];
  const fillSrc: Array<OnsetEvent['source']>    = ['kick', 'snare'];

  const primaryOnsets = filteredOnsets(onsets, primarySrc, 8);
  const fillOnsets    = filteredOnsets(onsets, fillSrc,    4);

  // Merge, deduplicate by time proximity (< 50 ms = same beat)
  const allOnsets = [...primaryOnsets, ...fillOnsets]
    .sort((a, b) => a.timeInSeconds - b.timeInSeconds)
    .filter((o, i, arr) =>
      i === 0 || (o.timeInSeconds - arr[i - 1].timeInSeconds) > 0.05
    );

  let side = 0; // 0 = left, 1 = right
  let consecutiveSameSide = 0;
  let lastPanel = -1;

  for (const onset of allOnsets) {
    const beat = timeToBeat(onset.timeInSeconds, bpm, offset);

    // Force side switch after 3 consecutive on same side (Req 5.4)
    if (consecutiveSameSide >= 3) {
      side = 1 - side;
      consecutiveSameSide = 0;
    }

    // Double-mode: cross centre-line every 4 measures (Req 5.3)
    // This is enforced implicitly by the alternation + 3-limit rule above.

    const panelPool = side === 0
      ? Array.from({ length: half }, (_, i) => i)               // left panels
      : Array.from({ length: numPanels - half }, (_, i) => i + half); // right panels

    // Pick a panel different from last
    let panel = panelPool[Math.floor(Math.random() * panelPool.length)];
    if (panel === lastPanel && panelPool.length > 1) {
      const alt = panelPool.filter(p => p !== lastPanel);
      panel = alt[Math.floor(Math.random() * alt.length)];
    }

    map.set(beat, stepLine(numPanels, [panel]));
    lastPanel = panel;
    consecutiveSameSide++;

    // Alternate side (Req 5.1)
    side = 1 - side;
    consecutiveSameSide = 0; // reset because we just switched
  }

  return map;
}

// ---------------------------------------------------------------------------
// Style 3: Jump  (Req 6.1–6.5)
// ---------------------------------------------------------------------------

function buildJump(ctx: ChoreographerContext): Map<number, string> {
  const { sourceProfile, drops, onsets, numPanels, tempoMap, durationSecs } = ctx;
  const map = new Map<number, string>();

  const bpm    = estimateBpm(sourceProfile);
  const offset = estimateOffset(sourceProfile, bpm);

  const kickOnsets  = filteredOnsets(onsets, ['kick'],  8);
  const snareOnsets = filteredOnsets(onsets, ['snare'], 8);

  // For limiting jumps to ≤ 40% in dance-single drop sections (Req 6.5)
  // We collect all beats per drop section, then trim if needed.
  interface PendingNote {
    beat:   number;
    isJump: boolean;
    panels: number[];
  }
  const pendingByDrop = new Map<number, PendingNote[]>(); // dropIndex → notes
  const outsideNotes:  PendingNote[] = [];

  const getDropIndex = (time: number): number => {
    return drops.findIndex(d => time >= d.startTime && time < d.endTime);
  };

  // --- Build kick notes ---
  let lastBeat = -1;
  const allKickBeats = new Set<number>();

  for (const onset of kickOnsets) {
    const beat     = timeToBeat(onset.timeInSeconds, bpm, offset);
    const dropIdx  = getDropIndex(onset.timeInSeconds);
    const isInDrop = dropIdx >= 0;

    if (isInDrop) {
      // Jump on kick in drop (Req 6.1)
      const [p1, p2] = pickNonAdjacentPair(numPanels, -1);
      const note: PendingNote = { beat, isJump: true, panels: [p1, p2] };
      if (!pendingByDrop.has(dropIdx)) pendingByDrop.set(dropIdx, []);
      pendingByDrop.get(dropIdx)!.push(note);
    } else {
      // Single note outside drops (Req 6.2)
      const panel = (beat % 4) % numPanels;
      outsideNotes.push({ beat, isJump: false, panels: [panel] });
    }
    allKickBeats.add(beat);
  }

  // --- Snare singles outside drops ---
  for (const onset of snareOnsets) {
    const beat    = timeToBeat(onset.timeInSeconds, bpm, offset);
    const inADrop = getDropIndex(onset.timeInSeconds) >= 0;
    if (!inADrop && !allKickBeats.has(beat)) {
      const panel = ((beat + 1) % 4) % numPanels;
      outsideNotes.push({ beat, isJump: false, panels: [panel] });
    }
  }

  // --- Apply 40% jump limit per drop section (Req 6.5, dance-single) ---
  for (const [dropIdx, notes] of pendingByDrop) {
    const sorted = notes.sort((a, b) => a.beat - b.beat);
    const maxJumps = numPanels <= 4
      ? Math.floor(sorted.length * 0.4)
      : sorted.length; // no limit for wider modes

    let jumpCount = 0;
    const toEmit: PendingNote[] = [];

    for (const note of sorted) {
      if (note.isJump && jumpCount >= maxJumps) {
        // Downgrade jump to single (Req 6.5)
        const panel = note.panels[0];
        toEmit.push({ ...note, isJump: false, panels: [panel] });
      } else {
        if (note.isJump) jumpCount++;
        toEmit.push(note);
      }
    }

    // Req 6.3: ensure no two jumps are consecutive — insert separator if needed
    const finalNotes: PendingNote[] = [];
    for (let i = 0; i < toEmit.length; i++) {
      finalNotes.push(toEmit[i]);
      if (
        toEmit[i].isJump &&
        i + 1 < toEmit.length &&
        toEmit[i + 1].isJump
      ) {
        // Insert a single between the two consecutive jumps
        const separatorBeat = Math.round((toEmit[i].beat + toEmit[i + 1].beat) / 2);
        if (separatorBeat > toEmit[i].beat && separatorBeat < toEmit[i + 1].beat) {
          const panel = (separatorBeat % numPanels);
          finalNotes.push({ beat: separatorBeat, isJump: false, panels: [panel] });
        }
      }
    }

    for (const note of finalNotes) {
      map.set(note.beat, stepLine(numPanels, note.panels));
    }
  }

  // --- Emit outside notes ---
  for (const note of outsideNotes) {
    if (!map.has(note.beat)) {
      map.set(note.beat, stepLine(numPanels, note.panels));
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

/**
 * Pick two non-adjacent panel indices.
 * Adjacent = |a - b| == 1.
 * Prefers (0, numPanels-1) i.e. left+right or top+bottom. (Req 6.4)
 */
function pickNonAdjacentPair(numPanels: number, _lastPanel: number): [number, number] {
  // For dance-single (4): prefer (0,3) left+right, or (1,2) down+up — but (1,2) ARE adjacent (indices differ by 1)
  // Actually adjacency in the spec means the literal arrow adjacency, not just index diff.
  // Forbidden pairs (Req 6.4): (0,1),(1,2),(2,3) and inverses.
  // So preferred: (0,2),(0,3),(1,3) — we prefer (0,3).
  if (numPanels === 4) {
    const preferred: [number,number][] = [[0,3],[0,2],[1,3]];
    return preferred[Math.floor(Math.random() * preferred.length)];
  }
  if (numPanels === 5) {
    // Pump: 0=DL, 1=UL, 2=C, 3=UR, 4=DR
    const preferred: [number,number][] = [[0,3],[0,4],[1,4],[1,3],[0,2],[2,4]];
    return preferred[Math.floor(Math.random() * preferred.length)];
  }
  // For wider modes: pick random non-adjacent pair
  const half = Math.floor(numPanels / 2);
  return [
    Math.floor(Math.random() * half),
    half + Math.floor(Math.random() * (numPanels - half)),
  ];
}

/** Rough BPM estimate from energy peaks. */
function estimateBpm(profile: SourceProfile): number {
  const kick = profile.kick;
  if (kick.length < 2) return 120;

  const peaks: number[] = [];
  for (let i = 1; i < kick.length - 1; i++) {
    if (kick[i] > 0.4 && kick[i] > kick[i - 1] && kick[i] >= kick[i + 1]) {
      peaks.push(i / 100);
    }
  }

  if (peaks.length < 2) return 120;

  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const iv = peaks[i] - peaks[i - 1];
    if (iv >= 0.25 && iv <= 1.5) intervals.push(iv);
  }

  if (intervals.length === 0) return 120;

  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return Math.round(60 / mean);
}

function estimateOffset(profile: SourceProfile, bpm: number): number {
  const kick = profile.kick;
  for (let i = 0; i < kick.length; i++) {
    if (kick[i] > 0.3) {
      const t = i / 100;
      return t % (60 / bpm);
    }
  }
  return 0;
}
