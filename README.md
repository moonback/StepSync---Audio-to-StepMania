# 💿 StepSync — Audio to StepMania

<div align="center">
  <img src="https://img.shields.io/badge/Version-1.8-indigo?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/License-Apache--2.0-blue?style=for-the-badge" alt="License">
</div>

---

**StepSync** est un générateur de simfiles intelligent et moderne. Il transforme instantanément vos morceaux favoris en niveaux jouables pour **StepMania**, **ITG**, et autres simulateurs de danse, en automatisant l'analyse rythmique et la synchronisation multimédia.

## ✨ Caractéristiques Premium

### 🎨 Interface "SaaS" Moderne
*   **Design Glassmorphism** : Une interface épurée, semi-transparente et responsive, pensée pour le confort d'utilisation.
*   **Système de Thèmes** : Basculez entre le **Mode Sombre** (immersion totale) et le **Mode Clair** (clarté maximale) en un clic.
*   **Animations Fluides** : Transitions douces et micro-interactions via `motion/react` pour une expérience utilisateur premium.

### 🧠 Algorithme d'Analyse Intelligent
*   **Détection de BPM & Tempo Map** : Analyse automatique du tempo, incluant la détection des dérives de BPM pour une synchronisation parfaite.
*   **Ajustement du Silence (Offset)** : Détection intelligente du silence au début de l'audio pour caler le premier pas exactement sur le beat.
*   **Densité Dynamique** : Les pas sont générés en fonction de l'énergie locale du morceau, avec placement intelligent de mines sur les pics d'intensité.

### 🎥 Gestion Multimédia Complète
*   **Support Vidéo Arrière-plan** : Importez un fichier `.mp4` qui sera automatiquement configuré comme vidéo de fond dans StepMania.
*   **Renommage Automatique** : Pour une compatibilité maximale, les vidéos sont renommées en `videoplayback.mp4` et référencées dans les balises `#BACKGROUND` et `#BGCHANGES`.
*   **Artwork Auto-Fetch** : Si vous ne fournissez pas d'image, StepSync récupère automatiquement la pochette d'album haute résolution via l'API iTunes.

### 🛠️ Paramètres de Précision
*   **Difficulté Cible** : Choisissez parmi 5 niveaux (Débutant à Expert).
*   **Options Avancées** : Ajustez le seuil d'énergie (`Onset Threshold`) et la probabilité de mines pour corser vos défis.
*   **Forçage BPM** : Possibilité d'outrepasser la détection automatique pour les BPM connus.

## 🚀 Guide d'Utilisation

1.  **Import** : Glissez-déposez vos fichiers audio ou un dossier complet.
2.  **Personnalisation** :
    *   Éditez les métadonnées (Titre, Artiste) si nécessaire.
    *   Ajoutez une image de fond ou une vidéo.
    *   Basculez le thème selon vos préférences.
3.  **Génération** : Cliquez sur **"Exporter le Pack .sm"**.
4.  **Installation** : Décompressez le `.zip` obtenu dans le dossier `Songs/` de votre installation StepMania.

## 💻 Installation (Développement)

Pour faire tourner StepSync localement :

```bash
# Cloner le dépôt
git clone https://github.com/moonback/StepSync---Audio-to-StepMania.git

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## 📚 Centre d'Aide
L'application inclut un **Centre d'Aide** complet accessible via l'icône point d'interrogation dans le header. Vous y trouverez des détails techniques sur chaque paramètre et la structure des fichiers exportés.

---

<div align="center">
  <p>Créé avec ❤️ par <b>Maysson.D</b></p>
  <a href="https://github.com/moonback/StepSync---Audio-to-StepMania">
    <img src="https://img.shields.io/github/stars/moonback/StepSync---Audio-to-StepMania?style=social" alt="Stars">
  </a>
</div>
