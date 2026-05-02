/**
 * useAIAnalyzer — React hook that bridges AIAnalyzerState to component tree.
 *
 * - Calls initAIAnalyzer on mount, disposeAIAnalyzer on unmount (Req 1.1)
 * - Subscribes to state updates and exposes them reactively (Req 7.3, 7.4, 9.2)
 * - Exposes an analyzeAudio wrapper that accepts AbortSignal (Req 9.4)
 *
 * Requirements: 1.2, 7.3, 7.4, 9.2
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initAIAnalyzer,
  disposeAIAnalyzer,
  analyzeAudio as _analyzeAudio,
  subscribeToState,
  getState,
} from '../lib/aiAudioAnalysis';
import type { AIAnalyzerState, EnhancedAnalysisResult } from '../lib/aiTypes';

export interface UseAIAnalyzerReturn {
  state: AIAnalyzerState;
  analyzeAudio: (
    buffer: ArrayBuffer,
    signal?: AbortSignal
  ) => Promise<EnhancedAnalysisResult>;
}

export function useAIAnalyzer(): UseAIAnalyzerReturn {
  const [state, setState] = useState<AIAnalyzerState>(getState);

  useEffect(() => {
    // Subscribe to state changes from the AI module
    const unsubscribe = subscribeToState(setState);

    // Initialise the analyzer once on mount (non-blocking)
    initAIAnalyzer().catch(err =>
      console.warn('[useAIAnalyzer] init error:', err)
    );

    return () => {
      unsubscribe();
      disposeAIAnalyzer().catch(() => {/* best-effort cleanup */});
    };
  }, []);

  const analyzeAudio = useCallback(
    (buffer: ArrayBuffer, signal?: AbortSignal): Promise<EnhancedAnalysisResult> =>
      _analyzeAudio(buffer, undefined, signal),
    []
  );

  return { state, analyzeAudio };
}
