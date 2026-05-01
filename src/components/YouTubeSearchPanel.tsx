import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Youtube, X, Download, Loader2, Music, Eye, Clock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { searchYouTube, YouTubeSearchResult, formatDuration, formatViewCount } from '../lib/youtubeSearch';
import { downloadYouTubeAsMP3 } from '../lib/youtubeDownload';
import { parseAudioMetadata } from '../lib/metadataParser';
import { fetchArtwork } from '../lib/itunesSearch';
import { SongItem } from '../lib/types';

interface YouTubeSearchPanelProps {
  onSongAdded: (song: SongItem) => void;
  isDark: boolean;
}

interface DownloadState {
  videoId: string;
  progress: number;
  status: 'downloading' | 'done' | 'error';
  error?: string;
}

export function YouTubeSearchPanel({ onSongAdded, isDark }: YouTubeSearchPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [downloads, setDownloads] = useState<Map<string, DownloadState>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError(null);
    setResults([]);

    try {
      const data = await searchYouTube(q);
      setResults(data);
    } catch (err: any) {
      setSearchError(err.message || 'Recherche échouée');
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleDownload = useCallback(async (video: YouTubeSearchResult) => {
    if (downloads.has(video.videoId)) return;

    setDownloads(prev => new Map(prev).set(video.videoId, {
      videoId: video.videoId,
      progress: 0,
      status: 'downloading',
    }));

    try {
      const file = await downloadYouTubeAsMP3(
        video.videoId,
        video.title,
        (pct) => {
          setDownloads(prev => {
            const next = new Map(prev);
            const state = next.get(video.videoId);
            if (state) next.set(video.videoId, { ...state, progress: pct });
            return next;
          });
        }
      );

      // Parse metadata and fetch artwork
      const meta = await parseAudioMetadata(file).catch(() => ({
        title: video.title,
        artist: video.author,
      }));

      const artworkQuery = `${video.author} ${video.title}`.trim();
      const artUrl = await fetchArtwork(artworkQuery).catch(() => null);

      const newSong: SongItem = {
        id: crypto.randomUUID(),
        file,
        title: meta.title || video.title,
        artist: meta.artist || video.author,
        subtitle: '',
        titleTranslit: '',
        subtitleTranslit: '',
        artistTranslit: '',
        genre: '',
        credit: 'StepSync par Maysson.D',
        artworkUrl: artUrl || undefined,
      };

      onSongAdded(newSong);

      setDownloads(prev => {
        const next = new Map(prev);
        next.set(video.videoId, { videoId: video.videoId, progress: 100, status: 'done' });
        return next;
      });

      // Remove the "done" badge after 3 seconds
      setTimeout(() => {
        setDownloads(prev => {
          const next = new Map(prev);
          next.delete(video.videoId);
          return next;
        });
      }, 3000);

    } catch (err: any) {
      setDownloads(prev => {
        const next = new Map(prev);
        next.set(video.videoId, {
          videoId: video.videoId,
          progress: 0,
          status: 'error',
          error: err.message || 'Erreur inconnue',
        });
        return next;
      });
    }
  }, [downloads, onSongAdded]);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSearchError(null);
    setDownloads(new Map());
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl border-2 border-dashed font-semibold text-sm transition-all duration-200
          ${isDark
            ? 'border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 bg-red-500/5'
            : 'border-red-400/40 text-red-600 hover:border-red-500/70 hover:bg-red-50 bg-red-50/50'
          }`}
        id="youtube-search-trigger"
      >
        <Youtube className="w-5 h-5 flex-shrink-0" />
        <span>Importer depuis YouTube</span>
        <span className={`ml-auto text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded
          ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
          MP3
        </span>
      </motion.button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className={`fixed inset-x-4 top-[5vh] bottom-[5vh] z-[101] flex flex-col rounded-3xl shadow-2xl overflow-hidden max-w-3xl mx-auto
                ${isDark
                  ? 'bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/60'
                  : 'bg-gradient-to-b from-white to-slate-50 border border-slate-200'
                }`}
            >
              {/* Header */}
              <div className={`flex-shrink-0 px-6 pt-6 pb-5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 flex items-center justify-center">
                      <div className="absolute inset-0 bg-red-500/20 rounded-xl blur-md" />
                      <div className="relative w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
                        <Youtube className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Recherche YouTube
                      </h2>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Télécharge en MP3 et génère le stepchart automatiquement
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Titre d'une musique, artiste..."
                      className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50
                        ${isDark
                          ? 'bg-slate-800 text-white placeholder-slate-500 border border-slate-700 hover:border-slate-600'
                          : 'bg-slate-100 text-slate-900 placeholder-slate-400 border border-slate-200 hover:border-slate-300'
                        }`}
                      id="youtube-search-input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !query.trim()}
                    className="px-5 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-red-900/20"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    {isSearching ? 'Recherche...' : 'Chercher'}
                  </button>
                </form>
              </div>

              {/* Results Area */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* Loading skeleton */}
                  {isSearching && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 space-y-3"
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`flex gap-4 p-4 rounded-2xl animate-pulse ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
                          <div className={`w-24 h-16 rounded-xl flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className={`h-3 rounded-full w-3/4 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                            <div className={`h-2.5 rounded-full w-1/2 ${isDark ? 'bg-slate-700/70' : 'bg-slate-200'}`} />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Error */}
                  {!isSearching && searchError && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-8 flex flex-col items-center text-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <AlertCircle className="w-7 h-7 text-red-400" />
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          Recherche échouée
                        </p>
                        <p className={`text-xs mt-1 max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {searchError}
                        </p>
                        <p className={`text-[10px] mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Conseil : essayez à nouveau dans quelques secondes (limite de l'API publique)
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Empty state */}
                  {!isSearching && !searchError && results.length === 0 && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-12 flex flex-col items-center text-center gap-4"
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <Music className={`w-8 h-8 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                      </div>
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Tape un titre de musique pour commencer
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                          ex: "Bad Apple", "Camellia", "Daft Punk..."
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Results */}
                  {!isSearching && results.length > 0 && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 space-y-2"
                    >
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {results.length} résultats — Cliquer sur ↓ pour télécharger en MP3
                      </p>
                      {results.map((video, idx) => {
                        const dl = downloads.get(video.videoId);
                        const isDownloading = dl?.status === 'downloading';
                        const isDone = dl?.status === 'done';
                        const isError = dl?.status === 'error';

                        return (
                          <motion.div
                            key={video.videoId}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className={`relative flex gap-4 p-3.5 rounded-2xl border transition-all group
                              ${isDark
                                ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                              }
                              ${isDone ? (isDark ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-emerald-400/50 bg-emerald-50') : ''}
                              ${isError ? (isDark ? 'border-red-500/40 bg-red-500/5' : 'border-red-400/40 bg-red-50') : ''}
                            `}
                          >
                            {/* Thumbnail */}
                            <div className="relative flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden bg-slate-900">
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={e => { (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`; }}
                              />
                              {/* Duration badge */}
                              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[9px] text-white font-mono font-bold">
                                {formatDuration(video.lengthSeconds)}
                              </div>
                              {/* Download progress overlay */}
                              {isDownloading && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <div className="text-center">
                                    <Loader2 className="w-5 h-5 text-white animate-spin mx-auto mb-1" />
                                    <span className="text-[9px] text-white font-bold">{dl?.progress}%</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-semibold leading-tight line-clamp-2 mb-1.5
                                ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {video.title}
                              </h4>
                              <div className={`flex items-center gap-3 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                <span className="font-medium truncate max-w-[120px]">{video.author}</span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-2.5 h-2.5" />
                                  {formatViewCount(video.viewCount)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatDuration(video.lengthSeconds)}
                                </span>
                              </div>

                              {/* Error message */}
                              {isError && (
                                <p className="text-[10px] text-red-400 mt-1 truncate">
                                  ⚠ {dl?.error}
                                </p>
                              )}

                              {/* Progress bar */}
                              {isDownloading && (
                                <div className={`mt-2 h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                  <motion.div
                                    className="h-full bg-red-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${dl?.progress}%` }}
                                    transition={{ ease: 'linear' }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Action button */}
                            <div className="flex-shrink-0 flex items-center">
                              {isDone ? (
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                </div>
                              ) : isDownloading ? (
                                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                                  <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleDownload(video)}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
                                    ${isDark
                                      ? 'bg-slate-700 hover:bg-red-600 text-slate-400 hover:text-white'
                                      : 'bg-slate-100 hover:bg-red-500 text-slate-500 hover:text-white'
                                    }
                                    ${isError ? (isDark ? '!bg-red-900/40 !text-red-400' : '!bg-red-100 !text-red-500') : ''}
                                  `}
                                  title="Télécharger en MP3 et générer le stepchart"
                                  id={`yt-download-${video.videoId}`}
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer notice */}
              <div className={`flex-shrink-0 px-6 py-3 border-t text-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <p className={`text-[9px] font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  Recherche &amp; téléchargement via{' '}
                  <a href="https://invidious.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">Invidious</a>
                  {' '}· API publique open-source, sans clé requise · Format m4a/webm
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
