/**
 * AI Choreographer — Shared Types & Interfaces (Phase 2)
 * Requirements: 2.3, 7.2, 8.1, 8.3
 */

import { AudioAnalysisResult } from './audioAnalysis';

// ---------------------------------------------------------------------------
// Source separation
// ---------------------------------------------------------------------------

/** Normalised energy profile [0.0–1.0] at 100 samples/second for each source. */
export interface SourceProfile {
  kick:  number[];
  snare: number[];
  bass:  number[];
  lead:  number[];
}

/** A high-energy section detected in the audio (kick + bass > 0.75 for ≥ 2s). */
export interface DropInterval {
  startTime: number; // seconds
  endTime:   number; // seconds
}

/** A single transient event detected in a source. */
export interface OnsetEvent {
  timeInSeconds: number;
  energy:        number; // [0.0–1.0]
  source:        'kick' | 'snare' | 'bass' | 'lead';
}

/**
 * Extends AudioAnalysisResult without modifying any existing field.
 * Requirements: 2.3, 8.3
 */
export interface EnhancedAnalysisResult extends AudioAnalysisResult {
  sourceProfile: SourceProfile;
  drops:         DropInterval[];
  /** Sorted ascending by timeInSeconds. */
  onsets:        OnsetEvent[];
  /** Semantic version string for traceability, e.g. "1.0.0". */
  aiVersion:     string;
}

// ---------------------------------------------------------------------------
// Choreography
// ---------------------------------------------------------------------------

/** The three supported choreographic styles. */
export type ChoreographyStyle = 'stream' | 'crossover' | 'jump';

// ---------------------------------------------------------------------------
// AI Analyzer state
// ---------------------------------------------------------------------------

export interface AIAnalyzerState {
  status:   'idle' | 'loading' | 'ready' | 'analyzing' | 'error';
  fallback: boolean;
  /** Progress percentage 0–100 during analysis. */
  progress: number;
  error?:   string;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type AIErrorCode =
  | 'MODEL_LOAD_FAILED'
  | 'WEBGL_UNAVAILABLE'
  | 'ANALYSIS_FAILED'
  | 'WORKER_TIMEOUT'
  | 'ABORT'
  | 'MEMORY_EXCEEDED';

export class AIAnalyzerError extends Error {
  constructor(
    message: string,
    public readonly code: AIErrorCode,
    public readonly recoverable: boolean
  ) {
    super(message);
    this.name = 'AIAnalyzerError';
  }
}

// ---------------------------------------------------------------------------
// Worker message protocol
// ---------------------------------------------------------------------------

export type WorkerInMessage =
  | { type: 'INIT';    modelUrl: string }
  | { type: 'ANALYZE'; id: string; buffer: ArrayBuffer; sampleRate: number }
  | { type: 'ABORT';   id: string }
  | { type: 'DISPOSE' };

export type WorkerOutMessage =
  | { type: 'INIT_OK' }
  | { type: 'INIT_FALLBACK'; reason: string }
  | { type: 'PROGRESS';      id: string; pct: number }
  | { type: 'RESULT';        id: string; result: EnhancedAnalysisResult }
  | { type: 'ERROR';         id: string; message: string };
