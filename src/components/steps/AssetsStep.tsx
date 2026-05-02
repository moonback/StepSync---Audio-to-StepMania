import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageIcon, Music, Sparkles, X, Check, Film, Layers } from 'lucide-react';
import { ImagePreview } from '../ImagePreview';
import { VideoPreview } from '../VideoPreview';
import { SongItem } from '../../lib/types';

interface AssetsStepProps {
  songs: SongItem[];
  selectedSongId: string | null;
  setSelectedSongId: (id: string | null) => void;
  onUpdateSong: (id: string, updated: Partial<SongItem>) => void;
  onSetGlobalBg: (file: File) => void;
  onSetGlobalBanner: (file: File) => void;
  onSetGlobalVideo: (file: File) => void;
  onRemoveGlobalBg: () => void;
  onRemoveGlobalBanner: () => void;
  onRemoveGlobalVideo: () => void;
  globalBg?: File;
  globalBanner?: File;
  globalVideo?: File;
  bgType: 'image' | 'video';
  setBgType: (type: 'image' | 'video') => void;
  globalUseArtwork: boolean | undefined;
  setGlobalUseArtwork: (val: boolean) => void;
}

export const AssetsStep: React.FC<AssetsStepProps> = ({
  songs,
  selectedSongId,
  setSelectedSongId,
  onUpdateSong,
  onSetGlobalBg,
  onSetGlobalBanner,
  onSetGlobalVideo,
  onRemoveGlobalBg,
  onRemoveGlobalBanner,
  onRemoveGlobalVideo,
  globalBg,
  globalBanner,
  globalVideo,
  bgType,
  setBgType,
  globalUseArtwork,
  setGlobalUseArtwork
}) => {
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const currentSong = songs.find(s => s.id === selectedSongId);

  // Auto-apply Magic Suggestions (Artwork)
  React.useEffect(() => {
    if (bgType !== 'image') return;

    if (selectedSongId) {
      if (currentSong && currentSong.artworkUrl && !currentSong.customBg && currentSong.useArtwork === undefined) {
        onUpdateSong(selectedSongId, { useArtwork: true });
      }
    } else {
      const hasAnyArtwork = songs.some(s => s.artworkUrl);
      if (hasAnyArtwork && !globalBg && globalUseArtwork === undefined) {
        setGlobalUseArtwork(true);
      }
    }
  }, [selectedSongId, bgType, songs, globalBg, globalUseArtwork, onUpdateSong, setGlobalUseArtwork, currentSong]);

  const ARROWS = ['←', '↓', '↑', '→'];
  const COLORS = ['#e83f9a', '#3fd4e8', '#27e86b', '#f5e542'];

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="max-w-5xl mx-auto w-full pb-12 sm:pb-24"
    >
      <div className="sm-panel sm-scanlines rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-10 relative overflow-hidden">
        <div className="absolute inset-0 sm-beat-grid opacity-20 pointer-events-none" />
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 sm:mb-10 relative z-10">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex space-x-0.5">
              {ARROWS.map((a, i) => (
                <span key={i} className="sm-arrow text-lg" style={{ color: COLORS[i], animationDelay: `${i * 0.1}s` }}>{a}</span>
              ))}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white sm-glow-cyan uppercase tracking-tighter">Ressources Graphiques</h3>
              <p className="text-[10px] font-bold text-[#00f5ff]/50 uppercase tracking-widest">Multimedia · Assets</p>
            </div>
          </div>

          <div className="flex bg-black/40 p-1 rounded-xl border border-[#00f5ff]/20 self-start sm:self-center">
            <button
              onClick={() => setBgType('image')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${bgType === 'image' ? 'bg-[#00f5ff] text-black shadow-[0_0_15px_rgba(0,245,255,0.4)]' : 'text-slate-500 hover:text-white'}`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Image</span>
            </button>
            <button
              onClick={() => setBgType('video')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${bgType === 'video' ? 'bg-[#ff2edb] text-white shadow-[0_0_15px_rgba(255,46,219,0.4)]' : 'text-slate-500 hover:text-white'}`}
            >
              <Film className="w-3 h-3" />
              <span>Vidéo</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col space-y-8 relative z-10">
          {/* Song Selector */}
          {songs.length > 1 && (
            <div className="sm-panel rounded-2xl p-4 bg-black/40 border-[#00f5ff]/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#00f5ff]" />
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-[#00f5ff]/70">Cible : {selectedSongId ? "Piste Unique" : "Pack Complet"}</h4>
                </div>
                <button
                  onClick={() => setSelectedSongId(null)}
                  className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${!selectedSongId ? 'bg-[#00f5ff] text-black' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                >
                  Appliquer à tout
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {songs.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => setSelectedSongId(song.id)}
                    className={`flex-shrink-0 flex items-center space-x-3 border px-4 py-2 rounded-xl transition-all ${selectedSongId === song.id ? 'bg-[#00f5ff]/10 border-[#00f5ff]/40' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                  >
                    {song.artworkUrl ? (
                      <img src={song.artworkUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
                    ) : (
                      <div className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center">
                        <Music className="w-3 h-3 text-slate-500" />
                      </div>
                    )}
                    <div className="min-w-0 max-w-[100px] text-left">
                      <p className="text-[9px] font-black text-white truncate leading-tight">{song.title}</p>
                      <p className="text-[7px] font-bold text-slate-500 truncate uppercase">{song.artist}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Background / Video Preview */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00f5ff]/60">Fond d'écran</span>
                {bgType === 'image' && (
                  <button
                    onClick={() => setShowSuggestions(true)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all ${(selectedSongId ? currentSong?.useArtwork : globalUseArtwork) ? 'bg-[#f5e542] text-black border-[#f5e542]' : 'bg-black/40 border-[#f5e542]/30 text-[#f5e542] hover:bg-[#f5e542]/10'}`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Magie IA</span>
                  </button>
                )}
              </div>
              
              <div className="sm-panel rounded-2xl overflow-hidden p-3 bg-black/50 border-white/10">
                {bgType === 'image' ? (
                  <ImagePreview
                    label=""
                    description=""
                    file={selectedSongId ? currentSong?.customBg : globalBg}
                    imageUrl={(selectedSongId ? currentSong?.useArtwork : globalUseArtwork) ? (selectedSongId ? currentSong?.artworkUrl : songs.find(s => s.artworkUrl)?.artworkUrl) : undefined}
                    onFileSelect={(file) => {
                      if (selectedSongId) onUpdateSong(selectedSongId, { customBg: file, useArtwork: false });
                      else { onSetGlobalBg(file); setGlobalUseArtwork(false); }
                    }}
                    onRemove={() => {
                      if (selectedSongId) onUpdateSong(selectedSongId, { customBg: undefined, useArtwork: false });
                      else { onRemoveGlobalBg(); setGlobalUseArtwork(false); }
                    }}
                  />
                ) : (
                  <VideoPreview
                    label=""
                    description=""
                    file={selectedSongId ? currentSong?.customVideo : globalVideo}
                    onFileSelect={(file) => selectedSongId ? onUpdateSong(selectedSongId, { customVideo: file }) : onSetGlobalVideo(file)}
                    onRemove={() => selectedSongId ? onUpdateSong(selectedSongId, { customVideo: undefined }) : onRemoveGlobalVideo()}
                  />
                )}
              </div>
            </div>

            {/* Banner Preview */}
            <div className="space-y-6">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff2edb]/60 block mb-2">Bannière Arcade</span>
              <div className="sm-panel rounded-2xl overflow-hidden p-3 bg-black/50 border-white/10">
                <ImagePreview
                  label=""
                  description=""
                  file={selectedSongId ? currentSong?.customBanner : (globalBanner || songs[0]?.customBanner)}
                  onFileSelect={(file) => {
                    if (selectedSongId) onUpdateSong(selectedSongId, { customBanner: file, useArtwork: false });
                    else { onSetGlobalBanner(file); setGlobalUseArtwork(false); }
                  }}
                  onRemove={() => {
                    if (selectedSongId) onUpdateSong(selectedSongId, { customBanner: undefined, useArtwork: false });
                    else { onRemoveGlobalBanner(); setGlobalUseArtwork(false); }
                  }}
                  className="aspect-[418/164]"
                />
              </div>
              
              <div className="p-4 rounded-xl bg-[#00f5ff]/5 border border-[#00f5ff]/10">
                <p className="text-[8px] font-bold text-[#00f5ff]/60 uppercase tracking-widest leading-relaxed">
                  TIP: Utilisez des images haute résolution (1920x1080) pour un rendu optimal sur les écrans modernes d'arcade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Modal */}
      <AnimatePresence>
        {showSuggestions && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuggestions(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: 20 }}
              className="relative w-full max-w-lg sm-panel rounded-[2rem] p-8 overflow-hidden shadow-[0_0_50px_rgba(0,245,255,0.2)]"
            >
              <div className="absolute inset-0 sm-scanlines opacity-40 pointer-events-none" />
              <div className="absolute inset-0 sm-beat-grid opacity-10 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-5 h-5 text-[#f5e542] sm-glow-yellow" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter sm-glow-cyan">Magie IA</h3>
                  </div>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="p-2 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {(selectedSongId ? currentSong?.artworkUrl : songs.find(s => s.artworkUrl)?.artworkUrl) ? (
                    <div className="space-y-6">
                      <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                        <img
                          src={selectedSongId ? currentSong?.artworkUrl : songs.find(s => s.artworkUrl)?.artworkUrl}
                          alt="Suggestion"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-[9px] font-black uppercase text-[#00f5ff] mb-1">Image trouvée</p>
                          <p className="text-xs text-white font-bold truncate">
                            {selectedSongId ? currentSong?.title : "Thème global"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (selectedSongId) {
                            onUpdateSong(selectedSongId, { customBg: undefined, useArtwork: true });
                          } else {
                            onRemoveGlobalBg();
                            setGlobalUseArtwork(true);
                          }
                          setShowSuggestions(false);
                        }}
                        className="w-full py-4 bg-[#00f5ff] text-black font-black rounded-xl shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 uppercase tracking-widest text-[10px]"
                      >
                        <Check className="w-4 h-4" />
                        <span>Appliquer ce Fond</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                        <X className="w-8 h-8 text-slate-700" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Aucun Artwork détecté</p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 text-center">Recherche Manuelle</p>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="TITRE / ARTISTE / ALBUM..."
                        className="sm-input flex-1 rounded-xl px-4 py-3 text-[10px]"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const term = (e.target as HTMLInputElement).value;
                            const { fetchArtwork } = await import('../../lib/itunesSearch');
                            const url = await fetchArtwork(term);
                            if (url) {
                              if (selectedSongId) onUpdateSong(selectedSongId, { artworkUrl: url });
                              else if (songs[0]) onUpdateSong(songs[0].id, { artworkUrl: url });
                            } else {
                              alert("Aucun résultat.");
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
