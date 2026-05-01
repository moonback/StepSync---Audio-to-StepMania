import { AudioAnalysisResult } from './audioAnalysis';

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
}
