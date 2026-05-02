# 💫 StepSync Platinum — Audio-to-StepMania Intelligence 🌟 par Maysson.D

![Version](https://img.shields.io/badge/version-2.0.0-indigo)
![License](https://img.shields.io/badge/license-MIT-purple)
![Tech](https://img.shields.io/badge/tech-React%20%7C%20Vite%20%7C%20Framer-blue)
![AI](https://img.shields.io/badge/AI-Choreographer-pink)

> **L'ultime pipeline de création pour StepMania.** Transformez vos musiques préférées en packs d'arcade professionnels en quelques secondes grâce à l'intelligence artificielle de pointe.

---

## 🚀 Vision du Projet
StepSync Platinum n'est pas qu'un simple convertisseur. C'est un studio de création complet conçu pour les passionnés de jeux de rythme. En combinant l'analyse audio avancée et la chorégraphie assistée par IA, StepSync automatise les tâches fastidieuses pour vous laisser vous concentrer sur le plaisir du jeu.

---

## ✨ Fonctionnalités Premium (v2.0)

### 🧠 AI Choreographer Pipeline
Notre moteur de chorégraphie a été entièrement réécrit pour proposer trois styles distincts basés sur l'analyse fréquentielle (Kick, Snare, Lead, Bass) :
*   **Style Stream** : Flux constant de notes simples sur les kicks et snares. Inclut un algorithme **anti-jackhammer** (rotation intelligente des panneaux) pour une fluidité maximale.
*   **Style Crossover / Tech** : Analyse les mélodies (Lead) pour forcer des croisements de pieds techniques et alternés.
*   **Style Jump** : Intensifie les doubles flèches durant les **Drops** musicaux détectés par analyse d'énergie combinée.

### ⚡ Architecture Hybride Worker/Inline
*   **Web Worker Isolation** : L'analyse audio lourde est déportée dans un thread séparé pour garantir une interface fluide (60 FPS).
*   **Smart Fallback** : Si votre navigateur limite l'accès audio dans les workers, StepSync bascule instantanément en **Mode Analyse Intégré** (Inline DSP) sans aucune perte de qualité.
*   **IndexedDB Cache** : Mise en cache locale des analyses pour un re-export instantané.

### 🎨 Pipeline Graphique & Multimédia
*   **Suggestions IA (Modal)** : Recherche automatique de pochettes via iTunes API.
*   **Générateur de Bannières** : Création instantanée (`418x164`) avec typographie moderne.
*   **Mode Vidéo (BGA)** : Support complet des vidéos de fond (`.mp4`, `.avi`).

### 🕹️ Support Multi-Arcade
*   **Dance (DDR/ITG)** : Single (4 touches) et Double (8 touches).
*   **Pump It Up (PIU)** : Single (5 touches) et Double (10 touches) avec patterns spécifiques.

---

## 🛠️ Stack Technologique
*   **Frontend** : [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/).
*   **DSP / Audio** : [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/Audio_API) (Biquad Filters, OfflineAudioContext).
*   **Animations** : [Framer Motion](https://www.framer.com/motion/).
*   **Design** : CSS Vanilla (Glassmorphism & Neon Aesthetics).
*   **Logic** : Algorithmes de détection d'onsets propriétaires (< 10 ms de précision).

---

## 📖 Guide d'Utilisation

1.  **Importation** : Glissez vos fichiers audio (`MP3`, `WAV`, `OGG`).
2.  **Configuration** : Choisissez vos modes de jeu et votre style chorégraphique (**Stream**, **Crossover** ou **Jump**).
3.  **Analyse** : Observez la progression de l'analyse IA en temps réel.
4.  **Habillage** : Générez une bannière ou utilisez la recherche automatique d'artwork.
5.  **Export** : Téléchargez votre pack `.zip` et jouez !

---

## 🔮 Roadmap & Futur
- [ ] Éditeur de patterns visuel direct dans le navigateur.
- [ ] Support des fichiers `.ssc` (StepMania 5.x).
- [ ] Intégration de modèles de Machine Learning (TensorFlow.js) pour la séparation de sources encore plus fine.

---

## 🤝 Contribution & Support
Développé avec passion pour la communauté des jeux de rythme. Si vous souhaitez contribuer ou signaler un bug, n'hésitez pas à ouvrir une Issue.

**StepSync Platinum — Maysson.D**
