# 🗺️ Roadmap de StepSync

La roadmap suivante décrit notre vision pour le développement futur de StepSync. Notre but est de passer d'un simple générateur probabiliste à un chorégraphe complet assisté par l'IA, tout en offrant plus de flexibilité à l'utilisateur.

---

## 🟢 Phase 1 : Éditeur Manuel & Expérience Utilisateur

### 🎵 Expérience Musicale
*   **Lecteur Audio Avancé** : Remplacer le player basique par une scrub-bar interactive superposée à la forme d'onde.
*   **Visualisation des Pas Générés** : Afficher un aperçu visuel (en mode 2D défilant ou en "piano roll") du pattern généré, directement superposé à l'audio, avant même d'exporter le fichier.

### ✏️ Retouche & Flexibilité
*   **Éditeur de pas léger** : Permettre à l'utilisateur de cliquer sur la waveform pour ajouter, supprimer ou déplacer un pas avant de finaliser le fichier `.sm`.
*   **Recalibrage manuel du BPM/Offset** : Tapotez sur le rythme ("Tap Tempo") pour corriger d'éventuelles erreurs de l'analyseur sur des sections complexes.

### 🖼️ Gestion des Packs et Assets
*   **Génération par lots avancée** : Gérer de plus grands packs avec création automatique d'une arborescence complète, triée par artiste ou par style.
*   **Outils d'image** : Outil de rognage/redimensionnement (cropping) intégré pour adapter précisément l'image importée au standard des bannières (256x80px) ou fonds carrés/widescreen 16:9.

---

## 🟡 Phase 2 : Chorégraphe IA & Modèles d'Apprentissage

### 🧠 Modèles de Détection Améliorés
*   **Réseaux de Neurones Côté Client** : Intégrer de petits modèles TensorFlow.js, formés spécifiquement sur de la musique électronique (pour le jeu de danse), capable d'isoler la batterie (kick, snare), la basse et le lead pour une détection rythmique quasi parfaite.
*   **Styles Chorégraphiques** : Introduction de différents algorithmes de placement :
    *   *Stream* : Génère des enchaînements constants pour le cardio.
    *   *Crossover/Tech* : Favorise des patterns croisant les pieds.
    *   *Jump* : Intensifie l'utilisation des Doubles (deux flèches simultanées) sur les drops.

### 🕺 Modes de Jeu Supplémentaires
*   **Pump It Up (5-panel)** : Prise en charge du format `pump-single` et `pump-double`.
*   **StepMania Double (8-panel / 10-panel)** : Génération sur 2 tapis.

---

## 🔴 Phase 3 : Plateforme d'Écosystème & Collaboration

### ☁️ Sauvegarde et Partage Cloud
*   **Profils Utilisateurs** : Sauvegarder les configurations (`onset`, `mine probability`, styles) en ligne.
*   **Registry de Créateurs** : Mettre en place un moyen de partager les fichiers `.sm` générés avec une communauté ou d'explorer les packs générés par d'autres algorithmes.

### 🎥 Aperçu Multimédia
*   **Support Vidéo** : Permettre l'importation de fichiers `.mp4` ou le lien vers des vidéos YouTube pour ajouter une vidéo d'arrière-plan avec synchronisation automatique.
*   **Prévisualisation WebGL** : Une vue 3D tournant en temps réel dans le navigateur montrant le gameplay StepMania finalisé sans avoir besoin d'ouvrir le jeu.

---
*Cette roadmap est sujette à évolution selon les retours des utilisateurs de la communauté Rhythm Gaming.*
