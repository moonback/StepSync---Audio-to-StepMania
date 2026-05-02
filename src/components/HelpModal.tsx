import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadCloud, Sliders, Download, BookOpen, Rocket, HelpCircle, Edit2, Activity, Hash, ShieldAlert, Zap, ChevronRight } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = React.useState('start');

  const sections = [
    { id: 'start', label: 'START', icon: <UploadCloud className="w-4 h-4" />, color: '#e83f9a' },
    { id: 'metadata', label: 'TAGS', icon: <Edit2 className="w-4 h-4" />, color: '#3fd4e8' },
    { id: 'settings', label: 'CONFIG', icon: <Sliders className="w-4 h-4" />, color: '#27e86b' },
    { id: 'advanced', label: 'AI', icon: <ShieldAlert className="w-4 h-4" />, color: '#f5e542' },
    { id: 'export', label: 'OUTPUT', icon: <Download className="w-4 h-4" />, color: '#00f5ff' },
    { id: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" />, color: '#ffffff' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-12">
          {/* Backdrop */}
          <motion.div
            key="help-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            key="help-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, rotateX: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full h-full max-w-6xl sm-panel sm-scanlines rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border border-white/10"
          >
            <div className="absolute inset-0 sm-beat-grid opacity-10 pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-black/40 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-[#00f5ff]/10 rounded-lg border border-[#00f5ff]/30">
                  <BookOpen className="w-5 h-5 text-[#00f5ff] sm-glow-cyan" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Information Panel</h2>
                  <p className="text-[9px] font-black text-[#00f5ff]/50 uppercase tracking-[0.3em]">Operational Guide v2.0</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden relative z-10">
              {/* Sidebar Navigation */}
              <nav className="hidden sm:flex flex-col w-52 border-r border-white/5 bg-black/20 py-6 px-4 space-y-2 overflow-y-auto">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                      ${activeSection === section.id
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <span style={{ color: activeSection === section.id ? 'black' : section.color }}>{section.icon}</span>
                    <span>{section.label}</span>
                  </button>
                ))}
              </nav>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 sm:p-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeSection === 'start' && <StartSection />}
                    {activeSection === 'metadata' && <MetadataSection />}
                    {activeSection === 'settings' && <SettingsSection />}
                    {activeSection === 'advanced' && <AdvancedSection />}
                    {activeSection === 'export' && <ExportSection />}
                    {activeSection === 'faq' && <FaqSection />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ─── Section Components ──────────────────────────────────── */

const SectionTitle = ({ icon, title, color }: { icon: React.ReactNode, title: string, color: string }) => (
  <div className="flex items-center space-x-3 mb-8">
    <div className="p-2 rounded-lg bg-black/40 border border-white/10" style={{ color }}>{icon}</div>
    <h3 className="text-2xl font-black text-white uppercase tracking-tighter" style={{ textShadow: `0 0 20px ${color}44` }}>{title}</h3>
  </div>
);

const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start space-x-3 p-4 bg-[#39ff14]/5 rounded-xl border border-[#39ff14]/20 mt-8">
    <Zap className="w-4 h-4 text-[#39ff14] mt-0.5 shrink-0 sm-glow-green" />
    <p className="text-[10px] text-[#39ff14]/70 font-bold uppercase tracking-tight leading-relaxed">{children}</p>
  </div>
);

const StartSection = () => (
  <div className="space-y-8 max-w-2xl">
    <SectionTitle icon={<Rocket className="w-6 h-6" />} title="Démarrage Rapide" color="#e83f9a" />
    <div className="grid grid-cols-1 gap-4">
      {[
        { t: "IMPORT AUDIO", d: "Glissez vos fichiers .mp3, .wav ou .ogg. Support multi-fichiers et dossiers." },
        { t: "CONFIG PACK", d: "Ajustez le BPM et choisissez les modes de jeu (Dance, Pump, Single, Double)." },
        { t: "META EDIT", d: "Personnalisez titres, artistes et crédits pour un pack professionnel." },
        { t: "ASSET SYNC", d: "L'IA trouve automatiquement les artworks. Ajoutez vos vidéos de fond." },
        { t: "DOWNLOAD", d: "Récupérez votre .ZIP prêt à être extrait dans le dossier Songs/ de StepMania." }
      ].map((s, i) => (
        <div key={i} className="flex space-x-4 p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-[#e83f9a]/30 transition-all group">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-[#e83f9a]/10 border border-[#e83f9a]/20 flex items-center justify-center text-[#e83f9a] font-black text-xs">
            {i + 1}
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1 group-hover:text-[#e83f9a] transition-colors">{s.t}</h4>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{s.d}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MetadataSection = () => (
  <div className="space-y-8 max-w-2xl">
    <SectionTitle icon={<Edit2 className="w-6 h-6" />} title="Métadonnées TAGS" color="#3fd4e8" />
    <p className="text-xs text-slate-400 font-medium leading-relaxed">StepSync extrait automatiquement les tags ID3 de vos fichiers audio pour pré-remplir les données du pack.</p>
    <div className="sm-panel rounded-2xl overflow-hidden border border-white/5">
      <table className="w-full text-[10px]">
        <thead className="bg-white/5">
          <tr>
            <th className="text-left py-3 px-4 text-slate-500 font-black uppercase tracking-widest">Champ</th>
            <th className="text-left py-3 px-4 text-slate-500 font-black uppercase tracking-widest">Impact .sm</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {[
            { f: "TITRE", i: "#TITLE" },
            { f: "ARTISTE", i: "#ARTIST" },
            { f: "SUBTITLE", i: "#SUBTITLE (Remix/Ver)" },
            { f: "GENRE", i: "#GENRE" },
            { f: "CREDIT", i: "#CREDIT (Author)" }
          ].map(r => (
            <tr key={r.f} className="hover:bg-white/5">
              <td className="py-3 px-4 text-white font-black">{r.f}</td>
              <td className="py-3 px-4 text-[#3fd4e8] font-mono font-bold tracking-tighter">{r.i}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SettingsSection = () => (
  <div className="space-y-8 max-w-2xl">
    <SectionTitle icon={<Sliders className="w-6 h-6" />} title="Configuration" color="#27e86b" />
    <div className="grid grid-cols-1 gap-6">
      <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-4 h-4 text-[#27e86b]" />
          <h4 className="text-xs font-black text-white uppercase tracking-widest">Niveaux de Difficulté</h4>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[
            { l: '1', n: 'BEG', c: '#39ff14' },
            { l: '3', n: 'EZ', c: '#00f5ff' },
            { l: '6', n: 'MED', c: '#f5e542' },
            { l: '8', n: 'HARD', c: '#ff8a00' },
            { l: '10', n: 'XPT', c: '#ff2edb' },
          ].map(d => (
            <div key={d.l} className="p-2 rounded-lg bg-black border border-white/5 flex flex-col items-center">
              <div className="text-xl font-black mb-1" style={{ color: d.c }}>{d.l}</div>
              <div className="text-[7px] font-black uppercase tracking-widest text-slate-500">{d.n}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
        <div className="flex items-center space-x-2 mb-3">
          <Hash className="w-4 h-4 text-[#27e86b]" />
          <h4 className="text-xs font-black text-white uppercase tracking-widest">BPM Engine</h4>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">StepSync utilise une analyse WebAudio pour détecter le BPM. Si le résultat est instable, utilisez le mode "FORCER BPM" pour fixer une valeur constante.</p>
      </div>
    </div>
  </div>
);

const AdvancedSection = () => (
  <div className="space-y-8 max-w-2xl">
    <SectionTitle icon={<ShieldAlert className="w-6 h-6" />} title="Algorithme IA" color="#f5e542" />
    <div className="space-y-4">
      <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Seuil d'Énergie (Onsets)</h4>
        <p className="text-[10px] text-slate-500 leading-relaxed mb-4 font-medium">Contrôle la sensibilité de la détection de notes. Plus la valeur est basse, plus l'algorithme générera de notes sur les variations audio subtiles.</p>
        <div className="flex space-x-2">
          {['SENSITIVE', 'BALANCED', 'RELAXED'].map((l, i) => (
            <div key={l} className="flex-1 p-2 rounded bg-black border border-white/5 text-center">
              <div className="text-[7px] font-black text-slate-600 uppercase tracking-widest">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Densité de Mines</h4>
        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Génère des pièges (Shock Arrows) sur les pics de fréquence négatifs. Recommandé pour les styles "Technical".</p>
      </div>
    </div>
  </div>
);

const ExportSection = () => (
  <div className="space-y-8 max-w-2xl">
    <SectionTitle icon={<Download className="w-6 h-6" />} title="Exportation Pack" color="#00f5ff" />
    <div className="p-6 sm-panel rounded-2xl bg-black/40 border border-[#00f5ff]/20">
      <div className="text-[9px] font-black text-[#00f5ff] uppercase tracking-[0.3em] mb-4">Structure Fichier .ZIP</div>
      <div className="space-y-1 font-mono text-[10px] text-white/60">
        <div className="text-[#ff2edb]">📁 MyPack_Output.zip</div>
        <div className="pl-4">📁 Song_Folder/</div>
        <div className="pl-8 text-white">📄 song.sm (StepChart)</div>
        <div className="pl-8 text-white">🎵 audio.mp3</div>
        <div className="pl-8 text-white">🖼️ bg.png & banner.png</div>
      </div>
    </div>
    <Tip>Copiez le dossier extrait dans <code className="text-white">StepMania/Songs/MyPacks/</code> pour jouer instantanément.</Tip>
  </div>
);

const FaqSection = () => (
  <div className="space-y-8 max-w-2xl">
    <SectionTitle icon={<HelpCircle className="w-6 h-6" />} title="Foire aux Questions" color="#ffffff" />
    <div className="grid grid-cols-1 gap-3">
      {[
        { q: "FORMATS SUPPORTÉS ?", a: ".MP3, .WAV, .OGG, .FLAC. Le .MP3 est recommandé pour StepMania." },
        { q: "BPM INCORRECT ?", a: "Utilisez le champ 'FORCER BPM' dans l'étape Config." },
        { q: "PAS DE NOTES ?", a: "Vérifiez que le volume du fichier n'est pas trop bas et baissez le seuil d'énergie." },
        { q: "SÉCURITÉ ?", a: "Tout le traitement est LOCAL. Vos musiques ne quittent jamais votre ordinateur." }
      ].map((faq, i) => (
        <details key={i} className="group p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-white/20 transition-all cursor-pointer list-none">
          <summary className="flex items-center justify-between text-[10px] font-black text-white uppercase tracking-widest list-none">
            <span>{faq.q}</span>
            <ChevronRight className="w-4 h-4 text-slate-600 group-open:rotate-90 transition-transform" />
          </summary>
          <p className="mt-4 text-[10px] text-slate-500 font-medium leading-relaxed border-t border-white/5 pt-4">{faq.a}</p>
        </details>
      ))}
    </div>
  </div>
);
