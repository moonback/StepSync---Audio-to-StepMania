import React from 'react';
import { motion } from 'motion/react';
import { ImageIcon, Music } from 'lucide-react';
import { ImagePreview } from '../ImagePreview';
import { VideoPreview } from '../VideoPreview';
import { SongItem } from '../../lib/types';

interface AssetsStepProps {
  songs: SongItem[];
  selectedSongId: string | null;
  setSelectedSongId: (id: string | null) => void;
  isDark: boolean;
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
  isDark,
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
                    { (song.customBg || song.customBanner || song.customVideo) && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> }
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Column 1: Background & Banner & Suggestions */}
            <div className="space-y-8">
              <div className="space-y-6">
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
                    isDark={isDark}
                  />
                ) : (
                  <VideoPreview 
                    label="Vidéo de fond (BGA)" 
                    description={selectedSongId ? "Vidéo spécifique pour cette musique" : "Vidéo par défaut pour tout le pack"}
                    file={selectedSongId ? currentSong?.customVideo : globalVideo}
                    onFileSelect={(file) => selectedSongId ? onUpdateSong(selectedSongId, { customVideo: file }) : onSetGlobalVideo(file)}
                    onRemove={() => selectedSongId ? onUpdateSong(selectedSongId, { customVideo: undefined }) : onRemoveGlobalVideo()}
                    isDark={isDark}
                  />
                )}

                <ImagePreview 
                  label="Bannière (Banner)" 
                  description={selectedSongId ? "Bannière spécifique pour cette musique" : "Bannière par défaut pour tout le pack"}
                  file={selectedSongId ? currentSong?.customBanner : globalBanner}
                  imageUrl={(selectedSongId ? currentSong?.useArtwork : globalUseArtwork) ? (selectedSongId ? currentSong?.artworkUrl : songs.find(s => s.artworkUrl)?.artworkUrl) : undefined}
                  onFileSelect={(file) => {
                    if (selectedSongId) onUpdateSong(selectedSongId, { customBanner: file, useArtwork: false });
                    else { onSetGlobalBanner(file); setGlobalUseArtwork(false); }
                  }}
                  onRemove={() => {
                    if (selectedSongId) onUpdateSong(selectedSongId, { customBanner: undefined, useArtwork: false });
                    else { onRemoveGlobalBanner(); setGlobalUseArtwork(false); }
                  }}
                  isDark={isDark}
                  className="aspect-[418/164]"
                />
              </div>

              {/* Suggestions Section */}
              {bgType === 'image' && (
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Suggestions Graphiques</h4>
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    </div>
                    {(selectedSongId ? currentSong?.artworkUrl : songs.find(s => s.artworkUrl)?.artworkUrl) && (
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">IA : Détectée</span>
                    )}
                  </div>

                  {(selectedSongId ? currentSong?.artworkUrl : songs.find(s => s.artworkUrl)?.artworkUrl) ? (
                    <div className="flex items-center space-x-4">
                      <img 
                        src={selectedSongId ? currentSong?.artworkUrl : songs.find(s => s.artworkUrl)?.artworkUrl} 
                        alt="Suggestion" 
                        className="w-16 h-16 rounded-xl object-cover shadow-lg border border-white/10" 
                      />
                      <div className="flex-1 space-y-2">
                        <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                          {selectedSongId 
                            ? "Image trouvée pour cette musique." 
                            : "Image suggérée basée sur le contenu du pack."} Elle sera utilisée pour le <strong>fond</strong> et la <strong>bannière</strong>.
                        </p>
                        <button 
                          onClick={() => {
                            if (selectedSongId) {
                              onUpdateSong(selectedSongId, { customBg: undefined, customBanner: undefined, useArtwork: true });
                            } else {
                              onRemoveGlobalBg();
                              onRemoveGlobalBanner();
                              setGlobalUseArtwork(true);
                            }
                          }} 
                          className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"
                        >
                          Appliquer la suggestion
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[10px] text-[var(--text-muted)] leading-tight italic">
                        {selectedSongId 
                          ? "Aucune image trouvée automatiquement pour cette musique." 
                          : "Aucune image détectée dans le pack."} Essayez une recherche :
                      </p>
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          placeholder="Rechercher une pochette..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-indigo-500"
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const term = (e.target as HTMLInputElement).value;
                              const { fetchArtwork } = await import('../../lib/itunesSearch');
                              const url = await fetchArtwork(term);
                              if (url) {
                                if (selectedSongId) {
                                  onUpdateSong(selectedSongId, { artworkUrl: url });
                                } else {
                                  if (songs[0]) onUpdateSong(songs[0].id, { artworkUrl: url });
                                }
                              } else {
                                alert("Aucun résultat.");
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Column 2: Mode Info & Status */}
            <div className="space-y-6">
              {bgType === 'image' ? (
                <div className="p-6 rounded-3xl bg-indigo-600/5 border border-indigo-500/10 h-full flex flex-col justify-center text-center">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mx-auto mb-4">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Mode Image Actif</h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Vous avez choisi d'utiliser des images statiques. C'est le mode le plus compatible et léger pour StepMania.
                  </p>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-purple-600/5 border border-purple-500/10 h-full flex flex-col justify-center text-center">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mx-auto mb-4">
                    <Music className="w-6 h-6" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-2">Mode Vidéo Actif</h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Les vidéos de fond (BGA) remplacent les images statiques. Notez que cela augmentera considérablement la taille de votre pack.
                  </p>
                </div>
              )}
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
    </motion.div>
  );
};
