import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadCloud, Sliders, Download, Music, ImageIcon, Zap, ChevronRight, BookOpen, HelpCircle, Disc3, Edit2, Activity, Hash, ShieldAlert } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = React.useState('start');

  const sections = [
    { id: 'start', label: 'Démarrage', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'metadata', label: 'Métadonnées', icon: <Edit2 className="w-4 h-4" /> },
    { id: 'settings', label: 'Paramètres', icon: <Sliders className="w-4 h-4" /> },
    { id: 'advanced', label: 'Avancé', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'export', label: 'Exportation', icon: <Download className="w-4 h-4" /> },
    { id: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-8 lg:inset-16 z-[101] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Centre d'Aide</h2>
                  <p className="text-xs text-slate-500">Guide complet de StepSync</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Navigation */}
              <nav className="hidden sm:flex flex-col w-56 border-r border-slate-800 bg-slate-900/30 py-4 px-3 space-y-1 overflow-y-auto">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left w-full
                      ${activeSection === section.id
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                      }`}
                  >
                    {section.icon}
                    <span>{section.label}</span>
                  </button>
                ))}
              </nav>

              {/* Mobile Navigation */}
              <div className="sm:hidden flex overflow-x-auto border-b border-slate-800 px-4 py-2 space-x-2 shrink-0">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                      ${activeSection === section.id
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'text-slate-500 hover:text-white'
                      }`}
                  >
                    {section.icon}
                    <span>{section.label}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
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
        </>
      )}
    </AnimatePresence>
  );
};

/* ─── Section Components ──────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-2xl font-black text-white mb-6 tracking-tight">{children}</h3>;
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex space-x-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
      <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm">
        {step}
      </div>
      <div>
        <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start space-x-3 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
      <Zap className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
      <p className="text-xs text-indigo-300/80 leading-relaxed">{children}</p>
    </div>
  );
}

/* ─── Sections ────────────────────────────────────────────── */

function StartSection() {
  return (
    <div className="space-y-6 max-w-2xl">
      <SectionTitle>🚀 Démarrage Rapide</SectionTitle>
      <p className="text-sm text-slate-400 leading-relaxed">
        StepSync transforme automatiquement vos fichiers audio en stepcharts jouables dans <strong className="text-white">StepMania</strong>, <strong className="text-white">ITG</strong> et d'autres simulateurs de danse compatibles.
      </p>

      <div className="space-y-3">
        <StepCard
          step={1}
          title="Importez vos fichiers audio"
          description="Glissez-déposez vos fichiers .mp3, .wav ou .ogg dans la zone de dépôt, ou cliquez dessus pour ouvrir l'explorateur de fichiers. Vous pouvez importer plusieurs fichiers à la fois."
        />
        <StepCard
          step={2}
          title="Configurez vos paramètres"
          description="Choisissez la difficulté cible, forcez un BPM si nécessaire, et ajustez les options avancées selon vos préférences."
        />
        <StepCard
          step={3}
          title="Éditez les métadonnées (optionnel)"
          description="Cliquez sur l'icône d'édition (crayon) sur chaque chanson pour personnaliser le titre, l'artiste, le genre, les translittérations et les crédits."
        />
        <StepCard
          step={4}
          title="Ajoutez des ressources graphiques"
          description="Choisissez une image d'arrière-plan et une bannière dans la section Ressources pour personnaliser l'apparence dans StepMania."
        />
        <StepCard
          step={5}
          title="Exportez votre pack"
          description="Cliquez sur « Exporter le Pack .sm » pour télécharger un fichier .zip contenant tous vos stepcharts, fichiers audio et images prêts à être installés."
        />
      </div>

      <Tip>
        Vous pouvez aussi déposer un <strong>dossier entier</strong> contenant plusieurs fichiers audio pour un traitement par lots instantané !
      </Tip>
    </div>
  );
}

function MetadataSection() {
  return (
    <div className="space-y-6 max-w-2xl">
      <SectionTitle>📝 Métadonnées des Chansons</SectionTitle>
      <p className="text-sm text-slate-400 leading-relaxed">
        Chaque chanson importée possède des métadonnées qui seront inscrites dans le fichier <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-xs">.sm</code>. StepSync les extrait automatiquement des tags ID3 de vos fichiers audio.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-3 px-4 text-slate-400 font-bold uppercase tracking-wider">Champ</th>
              <th className="text-left py-3 px-4 text-slate-400 font-bold uppercase tracking-wider">Description</th>
              <th className="text-left py-3 px-4 text-slate-400 font-bold uppercase tracking-wider">Exemple</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            <tr><td className="py-3 px-4 text-white font-semibold">Titre</td><td className="py-3 px-4 text-slate-400">Nom affiché dans le jeu</td><td className="py-3 px-4 text-slate-500 font-mono">Butterfly</td></tr>
            <tr><td className="py-3 px-4 text-white font-semibold">Sous-titre</td><td className="py-3 px-4 text-slate-400">Sous-titre optionnel (remix, version)</td><td className="py-3 px-4 text-slate-500 font-mono">Dance Mix</td></tr>
            <tr><td className="py-3 px-4 text-white font-semibold">Artiste</td><td className="py-3 px-4 text-slate-400">Nom de l'artiste ou du groupe</td><td className="py-3 px-4 text-slate-500 font-mono">Smile.dk</td></tr>
            <tr><td className="py-3 px-4 text-white font-semibold">Genre</td><td className="py-3 px-4 text-slate-400">Genre musical</td><td className="py-3 px-4 text-slate-500 font-mono">Eurobeat</td></tr>
            <tr><td className="py-3 px-4 text-white font-semibold">Titre Translit.</td><td className="py-3 px-4 text-slate-400">Translittération romanisée du titre (pour les titres non-latins)</td><td className="py-3 px-4 text-slate-500 font-mono">Choucho</td></tr>
            <tr><td className="py-3 px-4 text-white font-semibold">Artiste Translit.</td><td className="py-3 px-4 text-slate-400">Translittération de l'artiste</td><td className="py-3 px-4 text-slate-500 font-mono">Nakata Yasutaka</td></tr>
            <tr><td className="py-3 px-4 text-white font-semibold">Crédit</td><td className="py-3 px-4 text-slate-400">Auteur du stepchart</td><td className="py-3 px-4 text-slate-500 font-mono">StepSync par Maysson.D</td></tr>
          </tbody>
        </table>
      </div>

      <Tip>
        Les tags ID3 de vos fichiers audio sont automatiquement lus pour pré-remplir le titre et l'artiste. Vous pouvez toujours les modifier manuellement.
      </Tip>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-6 max-w-2xl">
      <SectionTitle>⚙️ Paramètres de Génération</SectionTitle>

      <div className="space-y-4">
        <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h4 className="text-sm font-bold text-white">Difficulté Cible (1–5)</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Contrôle la densité des notes générées. Chaque niveau correspond à une difficulté StepMania standard :
          </p>
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { level: '1', name: 'Débutant', meter: '2', color: 'text-emerald-400 bg-emerald-500/10' },
              { level: '2', name: 'Facile', meter: '4', color: 'text-cyan-400 bg-cyan-500/10' },
              { level: '3', name: 'Moyen', meter: '6', color: 'text-yellow-400 bg-yellow-500/10' },
              { level: '4', name: 'Difficile', meter: '8', color: 'text-orange-400 bg-orange-500/10' },
              { level: '5', name: 'Expert', meter: '10', color: 'text-red-400 bg-red-500/10' },
            ].map(d => (
              <div key={d.level} className={`p-2 rounded-lg ${d.color}`}>
                <div className="text-lg font-black">{d.level}</div>
                <div className="text-[9px] font-bold uppercase">{d.name}</div>
                <div className="text-[9px] opacity-60">Meter {d.meter}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 mb-3">
            <Hash className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">Forcer le BPM</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Par défaut, StepSync détecte automatiquement le BPM de chaque fichier audio à l'aide de l'algorithme d'analyse Web Audio. Si la détection est incorrecte ou que vous connaissez déjà le BPM exact, vous pouvez le forcer ici. Laissez le champ vide pour la détection automatique.
          </p>
        </div>

        <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">Ajuster le silence</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Quand activé, StepSync analyse le début de l'audio pour détecter le silence initial et ajuste automatiquement le décalage (<code className="text-indigo-400 bg-indigo-500/10 px-1 rounded text-[10px]">#OFFSET</code>) dans le fichier .sm. Cela garantit que les notes sont synchronisées avec la musique dès le premier beat.
          </p>
        </div>
      </div>
    </div>
  );
}

function AdvancedSection() {
  return (
    <div className="space-y-6 max-w-2xl">
      <SectionTitle>🔬 Options Avancées</SectionTitle>
      <p className="text-sm text-slate-400 leading-relaxed">
        Ces paramètres contrôlent l'algorithme interne de génération des notes. Modifiez-les avec précaution.
      </p>

      <div className="space-y-4">
        <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-800">
          <h4 className="text-sm font-bold text-white mb-3">Seuil d'Énergie (1.0 – 2.5)</h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Contrôle la sensibilité de la détection d'événements sonores (onsets). Une valeur <strong className="text-white">basse</strong> (ex: 1.0) rend le système plus sensible et génère plus de notes. Une valeur <strong className="text-white">haute</strong> (ex: 2.5) ne capture que les moments les plus intenses de la musique.
          </p>
          <div className="flex space-x-4 text-[10px]">
            <div className="flex-1 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-center">
              <div className="font-bold text-emerald-400">1.0</div>
              <div className="text-slate-500 mt-1">Très sensible</div>
              <div className="text-slate-600">+ de notes</div>
            </div>
            <div className="flex-1 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg text-center">
              <div className="font-bold text-yellow-400">1.5</div>
              <div className="text-slate-500 mt-1">Par défaut</div>
              <div className="text-slate-600">Équilibré</div>
            </div>
            <div className="flex-1 p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-center">
              <div className="font-bold text-red-400">2.5</div>
              <div className="text-slate-500 mt-1">Peu sensible</div>
              <div className="text-slate-600">- de notes</div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-800">
          <h4 className="text-sm font-bold text-white mb-3">Densité de Mines (0% – 100%)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Détermine la probabilité qu'une mine (note piégée) apparaisse lors des moments de haute énergie. Les mines n'apparaissent qu'à partir du niveau de difficulté <strong className="text-white">Moyen</strong> (meter ≥ 6). À 0%, aucune mine ne sera générée. À 100%, chaque moment d'énergie intense aura une mine.
          </p>
        </div>
      </div>

      <Tip>
        La commande CLI équivalente est affichée en bas du panneau pour référence.
      </Tip>
    </div>
  );
}

function ExportSection() {
  return (
    <div className="space-y-6 max-w-2xl">
      <SectionTitle>📦 Exportation</SectionTitle>
      <p className="text-sm text-slate-400 leading-relaxed">
        Quand vous cliquez sur « Exporter le Pack .sm », StepSync génère un fichier <strong className="text-white">.zip</strong> contenant un dossier par chanson.
      </p>

      <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-800 font-mono text-xs">
        <div className="text-slate-300 mb-2 font-sans font-bold text-sm">Structure du fichier exporté :</div>
        <div className="space-y-1 text-slate-400">
          <div className="text-indigo-400">📁 StepSync_Output.zip</div>
          <div className="pl-4">📁 nom_de_la_chanson/</div>
          <div className="pl-8">📄 nom_de_la_chanson.sm</div>
          <div className="pl-8">🎵 chanson.mp3</div>
          <div className="pl-8">🖼️ background.jpg <span className="text-slate-600">(si fourni)</span></div>
          <div className="pl-8">🖼️ banner.png <span className="text-slate-600">(si fourni)</span></div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-white">Installation dans StepMania</h4>
        <StepCard
          step={1}
          title="Décompressez le .zip"
          description="Extrayez le fichier téléchargé avec votre outil de décompression préféré (7-Zip, WinRAR, etc.)"
        />
        <StepCard
          step={2}
          title="Copiez dans le dossier Songs"
          description="Déplacez le dossier de la chanson vers le répertoire Songs/ de votre installation StepMania. Chemin typique : StepMania/Songs/MonPack/"
        />
        <StepCard
          step={3}
          title="Rechargez la liste"
          description="Redémarrez StepMania ou appuyez sur la touche de rechargement pour voir vos nouvelles chansons apparaître."
        />
      </div>

      <Tip>
        Si aucune image d'arrière-plan n'est fournie, StepSync tentera de récupérer automatiquement la pochette de l'album via l'API iTunes.
      </Tip>
    </div>
  );
}

function FaqSection() {
  const faqs = [
    {
      q: "Quels formats audio sont supportés ?",
      a: "StepSync supporte les fichiers .mp3, .wav, .ogg, .flac et .m4a. Les fichiers .mp3 et .ogg sont recommandés pour la compatibilité avec StepMania."
    },
    {
      q: "La détection de BPM est incorrecte, que faire ?",
      a: "Utilisez le champ « Forcer le BPM » dans les paramètres pour indiquer manuellement le BPM correct. Vous pouvez vérifier le BPM avec des outils comme bpmtap.com ou le logiciel MixMeister BPM Analyzer."
    },
    {
      q: "Puis-je générer plusieurs difficultés ?",
      a: "Actuellement, StepSync génère une seule difficulté par export. Pour créer plusieurs niveaux, exportez la même chanson plusieurs fois avec différents réglages de difficulté, puis fusionnez les fichiers .sm manuellement."
    },
    {
      q: "Les notes ne sont pas bien synchronisées ?",
      a: "Activez l'option « Ajuster le silence » pour corriger le décalage initial. Si le problème persiste, vérifiez que le BPM détecté est correct et ajustez le seuil d'énergie dans les options avancées."
    },
    {
      q: "Puis-je éditer le stepchart après l'export ?",
      a: "Oui ! Le fichier .sm est un fichier texte standard. Vous pouvez l'ouvrir dans n'importe quel éditeur de texte ou utiliser un éditeur spécialisé comme ArrowVortex pour affiner les patterns de notes."
    },
    {
      q: "Quelle est la taille recommandée pour les images ?",
      a: "L'arrière-plan doit idéalement être en 640×480 ou 1280×720. La bannière doit être en 418×164. Les formats .png et .jpg sont acceptés."
    },
    {
      q: "Est-ce que mes fichiers sont envoyés sur un serveur ?",
      a: "Non ! StepSync fonctionne entièrement dans votre navigateur. Aucun fichier audio n'est uploadé. Tout le traitement est fait localement sur votre machine."
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionTitle>❓ Foire aux Questions</SectionTitle>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          >
            <summary className="flex items-center justify-between text-sm font-semibold text-white list-none">
              <span>{faq.q}</span>
              <ChevronRight className="w-4 h-4 text-slate-500 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
