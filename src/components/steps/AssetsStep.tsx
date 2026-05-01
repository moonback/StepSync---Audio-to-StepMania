import React from 'react';
import { motion } from 'motion/react';
import { ImageIcon, Music, Sparkles, X } from 'lucide-react';
import { ImagePreview } from '../ImagePreview';
import { VideoPreview } from '../VideoPreview';
import { SongItem } from '../../lib/types';
import { AnimatePresence } from 'motion/react';

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
  globalUseArtwork: boolean;
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

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, rotateY: -15, z: -100, x: -50 }}
      animate={{ opacity: 1, rotateY: 0, z: 0, x: 0 }}
      exit={{ opacity: 0, rotateY: 15, z: -100, x: 50 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="max-w-4xl mx-auto w-full pb-12 sm:pb-24"
    >
      <div className="p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] glass-card tilt-card">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 sm:mb-10">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2.5 sm:p-3 bg-indigo-500/10 rounded-xl sm:rounded-2xl text-indigo-400">
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">Ressources Graphiques</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium">Personnalisez l'esthétique de votre pack.</p>
            </div>
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start sm:self-center">
            <button
              onClick={() => setBgType('image')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${bgType === 'image' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-white'}`}
            >
              Mode Image
            </button>
            <button
              onClick={() => setBgType('video')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${bgType === 'video' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-white'}`}
            >
              Mode Vidéo
            </button>
          </div>
        </div>

        <div className="flex flex-col space-y-10">
          {/* Song Selector */}
          {songs.length > 1 && (
            <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Music className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Édition : {selectedSongId ? "Musique Spécifique" : "Pack Global"}</h4>
                </div>
                <button
                  onClick={() => setSelectedSongId(null)}
                  className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${!selectedSongId ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                >
                  Appliquer à tout le pack
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {songs.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => setSelectedSongId(song.id)}
                    className={`flex-shrink-0 flex items-center space-x-3 border px-4 py-2.5 rounded-xl transition-all ${selectedSongId === song.id ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-white/5 border-slate-700/20 hover:border-slate-700'}`}
                  >
                    {song.artworkUrl ? (
                      <img src={song.artworkUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                        <Music className="w-4 h-4 text-indigo-400" />
                      </div>
                    )}
                    <div className="min-w-0 max-w-[120px] text-left">
                      <p className="text-[10px] font-black text-white truncate leading-tight mb-0.5">{song.title}</p>
                      <p className="text-[8px] font-bold text-slate-500 truncate uppercase tracking-tighter">{song.artist}</p>
                    </div>
                    {(song.customBg || song.customBanner || song.customVideo) && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="flex flex-col md:grid-cols-2 gap-8">
            {/* Column 1: Background & Banner & Suggestions */}
            <div className="space-y-8">
              <div className="space-y-6">
                {/* Suggestions Trigger Button */}
                {bgType === 'image' && (
                  <button
                    onClick={() => setShowSuggestions(true)}
                    className="w-full p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between group hover:bg-indigo-500 hover:border-indigo-400 transition-all shadow-lg shadow-indigo-500/5"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:bg-white/20 text-indigo-400 group-hover:text-white transition-colors">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 group-hover:text-white">Suggestions Magiques</h4>
                        <p className="text-[9px] text-[var(--text-muted)] group-hover:text-white/80 font-medium">Laissez l'IA trouver vos images</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-indigo-500/30 flex items-center justify-center group-hover:border-white/40 transition-colors">
                      <span className="text-indigo-400 group-hover:text-white text-lg font-black">+</span>
                    </div>
                  </button>
                )}
                {bgType === 'image' ? (
                  <ImagePreview
                    label="Fond d'écran (Background)"
                    description={selectedSongId ? "Image spécifique pour cette musique" : "Image par défaut pour tout le pack"}
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
                    label="Vidéo de fond (BGA)"
                    description={selectedSongId ? "Vidéo spécifique pour cette musique" : "Vidéo par défaut pour tout le pack"}
                    file={selectedSongId ? currentSong?.customVideo : globalVideo}
                    onFileSelect={(file) => selectedSongId ? onUpdateSong(selectedSongId, { customVideo: file }) : onSetGlobalVideo(file)}
                    onRemove={() => selectedSongId ? onUpdateSong(selectedSongId, { customVideo: undefined }) : onRemoveGlobalVideo()}
                  />
                )}

                <div className="relative group">
                  <ImagePreview
                    label="Bannière (Banner)"
                    description={selectedSongId ? "Bannière spécifique pour cette musique" : "Bannière par défaut pour tout le pack"}
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

                  {/* <button
                    onClick={async () => {
                      const { generateBannerWithText } = await import('../../lib/bannerGenerator');
                      const targetSong = currentSong || songs[0];
                      const title = targetSong ? (targetSong.title || targetSong.file.name.replace(/\.[^/.]+$/, "")) : "MON PACK";
                      const artist = targetSong ? (targetSong.artist || "STEPSYNC") : "STEPSYNC";
                      const file = await generateBannerWithText(title || "Sans Titre", artist || "Inconnu");
                      if (selectedSongId) onUpdateSong(selectedSongId, { customBanner: file, useArtwork: false });
                      else onSetGlobalBanner(file);
                    }}
                    className="absolute bottom-2 left-2 px-3 py-1.5 bg-indigo-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500"
                  >
                    Générer avec Texte
                  </button> */}
                </div>


              </div>
            </div>


          </div>

          {/* Bottom Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Lexique Graphique</h4>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                Le <strong>Fond</strong> est l'image/vidéo de jeu. La <strong>Bannière</strong> est l'image du menu.
              </p>
            </div>

            {bgType === 'image' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Conseil Pro</h4>
                <p className="text-[10px] text-amber-500/80 leading-relaxed italic">
                  Sans image, StepSync utilisera la pochette détectée par l'IA.
                </p>
              </div>
            )}
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
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--bg-card)] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              {/* Modal Background Decor */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-white">Suggestions IA</h3>
                  </div>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {(selectedSongId ? currentSong?.artworkUrl : songs.find(s => s.artworkUrl)?.artworkUrl) ? (
                    <div className="space-y-6">
                      <div className="relative group overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
                        <img
                          src={selectedSongId ? currentSong?.artworkUrl : songs.find(s => s.artworkUrl)?.artworkUrl}
                          alt="Suggestion"
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">IA : Image Détectée</p>
                          <p className="text-sm text-white font-bold leading-tight">
                            {selectedSongId ? `Artwork pour ${currentSong?.title}` : "Thème suggéré pour votre pack"}
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
                        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all flex items-center justify-center space-x-3"
                      >
                        <ImageIcon className="w-5 h-5" />
                        <span>Appliquer au Fond d'écran</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center py-10">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-sm text-slate-400 font-medium italic">Aucune image trouvée automatiquement.</p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Recherche Manuelle</p>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Ex: Nom de l'album, Titre..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
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
