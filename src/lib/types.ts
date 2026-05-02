import { AudioAnalysisResult } from './audioAnalysis';
import { EnhancedAnalysisResult, ChoreographyStyle } from './aiTypes';

export interface SongItem {
  id: string;
  file: File;
  title: string;
  artist: string;
  subtitle?: string;
  titleTranslit?: string;
  subtitleTranslit?: string;
  artistTranslit?: string;
  genre?: string;
  credit?: string;
  artworkUrl?: string;
  bpm?: number;
  offset?: number;
  analysis?: AudioAnalysisResult;
  customBg?: File;
  customBanner?: File;
  customVideo?: File;
  useArtwork?: boolean;
  enhancedAnalysis?: EnhancedAnalysisResult;
  choreographyStyle?: ChoreographyStyle;
}
