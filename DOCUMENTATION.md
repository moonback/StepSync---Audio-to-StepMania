# 📘 Documentation de StepSync v1.8 Platinum

Bienvenue dans la documentation officielle de **StepSync**, l'outil ultime pour transformer vos fichiers audio en packs StepMania professionnels en quelques secondes.

---

## 🚀 Introduction
StepSync est un assistant intelligent (Wizard) conçu pour automatiser la création de StepCharts. Il utilise des algorithmes avancés d'analyse audio pour détecter le rythme, l'énergie et la structure de vos musiques, tout en offrant une interface utilisateur premium en 3D.

---

## 🛠 Fonctionnalités Clés
- **Détection BPM Ultra-Précise** : Analyse des transitoires pour un calcul automatique du tempo et de l'offset.
- **Interface 3D "Glassmorphism"** : Une expérience utilisateur moderne avec transitions en perspective et effets de profondeur.
- **Optimisation Magique** : Ajustement automatique des paramètres algorithmiques basé sur le profil sonore.
- **Gestion Multimédia** : Support pour les fonds d'écran (Image), les vidéos (BGA) et les bannières.
- **Exportation Instantanée** : Génération d'un fichier `.zip` prêt à être extrait dans votre dossier `Songs` de StepMania.

---

## 📖 Guide de l'Utilisateur (Étape par Étape)

### Étape 1 : Sélection des Chansons
Glissez-déposez vos fichiers audio (MP3, WAV, OGG, etc.) dans la zone centrale. 
- StepSync extraira automatiquement les métadonnées (Titre, Artiste) et les pochettes d'album.
- Vous pouvez pré-écouter vos titres et éditer les informations manuellement.

### Étape 2 : Paramètres de Génération
Configurez les bases de votre pack.
- **BPM** : L'algorithme suggère une valeur. Vous pouvez la forcer si nécessaire.
- **Difficultés** : StepSync génère automatiquement 5 niveaux de difficulté (Beginner à Challenge).

### Étape 3 : Algorithmes Avancés
C'est ici que la magie opère pour la création des flèches.
- **Seuil d'Énergie** : Règle la sensibilité. Un seuil bas détecte plus de notes.
- **Densité de Mines** : Ajoute des obstacles pour augmenter le challenge technique.
- **Optimisation Magique** : Cliquez sur "Recommander les réglages" pour laisser l'IA choisir les meilleures valeurs pour vous.

### Étape 4 : Ressources Graphiques
Donnez un look pro à votre pack.
- **Background** : Choisissez entre une image fixe ou une vidéo de fond (BGA).
- **Banner** : Ajoutez une bannière pour l'écran de sélection de StepMania.
- **Suggestions** : Utilisez les pochettes d'album détectées à l'étape 1 comme fond d'écran en un clic.

### Étape 5 : Finalisation
Cliquez sur **"Générer le Pack"**. StepSync compile tous les fichiers `.sm`, `.ssc`, et les ressources multimédias dans une archive optimisée.

---

## ⚙️ Paramètres Techniques Détaillés

### Seuil d'Énergie (Onset Threshold)
L'algorithme analyse les pics de fréquence. 
- **Valeur recommandée (Pop/EDM)** : 0.15 - 0.20
- **Valeur recommandée (Musique calme)** : 0.08 - 0.12
- **Valeur recommandée (Hardcore/Speed)** : 0.25 - 0.35

### Densité de Mines
Les mines sont placées intelligemment entre les notes pour forcer des mouvements complexes.
- **0%** : Pas de mines.
- **10%** : Challenge modéré.
- **20%** : Expert / Technique.

### 🕺 Modes de Jeu Arcade (Multi-Pad)
StepSync permet de générer des charts pour différentes bornes d'arcade simultanément :
- **Dance Single (4-panel)** : Le classique (StepMania, DDR).
- **Dance Double (8-panel)** : Mode Solo sur deux tapis.
- **Pump Single (5-panel)** : Mode "Pump It Up" avec un panneau central.
- **Pump Double (10-panel)** : Mode "Pump It Up" sur deux tapis.
L'algorithme adapte le placement et crée des *Jumps* et des *Hands* selon la configuration.

---

## 💻 Stack Technique
- **Framework** : React + TypeScript
- **Styling** : Tailwind CSS (Custom Tokens)
- **Animations** : Framer Motion (3D Perspective)
- **Analyse Audio** : Web Audio API (OfflineAudioContext)
- **Export** : JSZip + FileSaver

---

## ❓ FAQ & Dépannage

**Q : Mon BPM est détecté à 140 alors qu'il est à 70.**
*R : C'est une détection en double tempo. Vous pouvez diviser la valeur par 2 dans les paramètres de l'étape 2.*

**Q : Les vidéos ne s'affichent pas dans StepMania.**
*R : Assurez-vous d'utiliser le format MP4. StepSync renomme automatiquement vos vidéos en `videoplayback.mp4` pour une compatibilité maximale.*

**Q : Comment installer le pack dans StepMania ?**
*R : Extrayez le contenu du fichier ZIP téléchargé dans le dossier `StepMania/Songs/StepSync_Pack/`.*

---

© 2026 moonback - Fait avec passion pour la communauté StepMania.
