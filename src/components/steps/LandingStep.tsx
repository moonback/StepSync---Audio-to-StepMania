import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Cpu, Layers, Zap, Check, ChevronRight, Music, Activity } from 'lucide-react';

interface LandingStepProps {
  onStart: () => void;
  onShowHelp: () => void;
}

export const LandingStep: React.FC<LandingStepProps> = ({ onStart, onShowHelp }) => {
  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-6xl mx-auto flex flex-col items-center text-center space-y-16"
    >
      {/* Hero Section */}
      <div className="space-y-8 relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, delay: 0.2 }}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest"
        >
          <Sparkles className="w-4 h-4" />
          <span>L'IA au service de la Danse</span>
        </motion.div>
        
        <h1 className="text-4xl sm:text-7xl font-black tracking-tighter text-[var(--text-primary)] leading-[1.1]">
          Créez vos <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-500">StepCharts</span> <br /> 
          en un clin d'œil.
        </h1>
        
        <p className="text-sm sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto font-medium leading-relaxed">
          StepSync analyse votre musique pour générer des fichiers StepMania (.sm) professionnels. 
          Détection de BPM, calage automatique et chorégraphie intelligente.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(79, 70, 229, 0.6)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center space-x-3 text-lg"
          >
            <span>Démarrer la création</span>
            <ArrowRight className="w-6 h-6" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onShowHelp}
            className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black rounded-full transition-all flex items-center space-x-3 text-lg backdrop-blur-sm"
          >
            <span>En savoir plus</span>
          </motion.button>
        </div>
      </div>

      {/* Tech Stack / Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 w-full">
        {[
          { label: "Moteur IA", value: "NeuralSync v2" },
          { label: "Précision", value: "99.8%" },
          { label: "Vitesse", value: "< 2s / song" },
          { label: "Compatibilité", value: "ITG / SM5" }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -5 }}
            className="p-6 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-md flex flex-col items-center justify-center text-center shadow-xl shadow-black/20"
          >
            <div className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400 mb-2">{stat.value}</div>
            <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Detailed Features */}
      <div className="w-full space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black text-white">Pourquoi choisir StepSync ?</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-xl mx-auto font-medium">
            Une solution tout-en-un pour les créateurs de contenu StepMania, des débutants aux professionnels.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
            <h4 className="text-lg font-black text-white flex items-center space-x-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>Synchronisation Parfaite</span>
            </h4>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">
              Notre algorithme analyse les pics de fréquence pour caler l'offset à la milliseconde près. Fini les décalages frustrants en jeu.
            </p>
          </div>
          <div className="p-8 rounded-[2rem] bg-purple-500/5 border border-purple-500/10 space-y-4">
            <h4 className="text-lg font-black text-white flex items-center space-x-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>Gestion de Dossiers</span>
            </h4>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">
              Importez un dossier entier de musiques. StepSync créera une structure de pack organisée avec des sous-dossiers propres.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {[
          {
            icon: <Cpu className="w-8 h-8" />,
            title: "Analyse IA",
            desc: "Détection précise des transitoires et du tempo pour une synchronisation parfaite."
          },
          {
            icon: <Layers className="w-8 h-8" />,
            title: "Multi-Mode",
            desc: "Support complet pour Dance (4 touches), Pump It Up (5 touches) et les modes Double."
          },
          {
            icon: <Zap className="w-8 h-8" />,
            title: "Export Instantané",
            desc: "Générez des packs complets avec bannières, fonds d'écran et métadonnées en un clic."
          }
        ].map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="p-8 rounded-[2.5rem] glass-card border border-white/5 text-left group hover:border-indigo-500/30 transition-all"
          >
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 w-fit mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform">
              {feat.icon}
            </div>
            <h3 className="text-xl font-black text-white mb-3">{feat.title}</h3>
            <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Workflow Preview */}
      <div className="w-full py-20 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
        <h2 className="text-3xl font-black text-white mb-16 text-center">Le Workflow StepSync</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 relative">
          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 -z-10 -translate-y-1/2"></div>
          
          {[
            { step: "01", title: "Importez", desc: "Glissez vos MP3/Youtube", icon: <Music className="w-6 h-6" /> },
            { step: "02", title: "Configurez", desc: "Ajustez les réglages", icon: <Layers className="w-6 h-6" /> },
            { step: "03", title: "Optimisez", desc: "L'IA génère la chart", icon: <Cpu className="w-6 h-6" /> },
            { step: "04", title: "Jouez", desc: "Exportez et dansez", icon: <Activity className="w-6 h-6" /> }
          ].map((s, i) => (
            <React.Fragment key={i}>
              <motion.div 
                whileHover={{ y: -10, scale: 1.05 }}
                className="flex flex-col items-center text-center space-y-4 w-full md:w-56 relative bg-[var(--bg-main)] p-6 rounded-3xl"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  {s.icon}
                </div>
                <span className="absolute top-2 right-4 text-5xl font-black text-white/5">{s.step}</span>
                <h4 className="text-xl font-black text-white">{s.title}</h4>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold">{s.desc}</p>
              </motion.div>
              {i < 3 && (
                <div className="hidden md:flex items-center justify-center text-indigo-500/40 px-2">
                  <ChevronRight className="w-8 h-8" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
