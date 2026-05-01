# StepSync - Générateur Audio vers StepMania

StepSync est une application web puissante et intuitive conçue pour transformer rapidement et automatiquement vos fichiers musicaux en niveaux prêts à jouer pour StepMania (.sm). Conçu pour être accessible tout en offrant des options avancées, StepSync automatise le processus fastidieux de création de "simfiles" en analysant intelligemment vos musiques.

## 🌟 Fonctionnalités Principales

*   **Conversion Rapide par Glisser-Déposer** : Ajoutez des fichiers audio individuels (.mp3, .wav, .ogg, .flac) ou des dossiers entiers pour un traitement par lots.
*   **Détection Automatique du BPM** : L'algorithme embarqué analyse l'audio pour estimer le tempo et peut détecter les changements de BPM (tempo drifts) au cours de la chanson pour générer une carte de tempo (Tempo Map) précise.
*   **Génération Intelligente des Pas** : Les pas sont générés en fonction de la difficulté cible et de l'intensité de la musique (Energy Threshold). Les passages plus intenses génèrent des séquences de pas plus complexes ou insèrent des mines de manière dynamique.
*   **Ajustement des Silences** : Détecte et ajuste automatiquement le décalage (offset) pour sauter les silences d'introduction.
*   **Extraction des Métadonnées & Visuels** : Récupère les tags de la musique (Artiste, Titre) et télécharge automatiquement la pochette de l'album via l'API iTunes si aucune image de fond n'est fournie.
*   **Aperçus en Temps Réel** : Visualisez la forme d'onde, lisez la musique directement dans la file d'attente et prévisualisez vos images de fond/bannière avant l'exportation.
*   **Paramètres Personnalisables** : Options avancées pour ajuster avec précision la difficulté, forcer un BPM, ou modifier la densité des notes via divers seuils de configuration.
*   **Export Prêt-à-Jouer** : Emballez l'ensemble des chansons et de leurs assets (fichiers `.sm`, musiques, images) dans un fichier `.zip` bien formaté, que vous n'aurez plus qu'à décompresser dans le dossier `Songs` de StepMania.

## 🚀 Utilisation

1.  **Lancement** : Ouvrez l'application web.
2.  **Import** : Glissez-déposez vos fichiers ou dossiers sur la zone d'importation.
3.  **Visualisation** : Vérifiez les métadonnées lues (Artiste/Titre), visualisez la forme d'onde, et écoutez un aperçu depuis la file d'attente.
4.  **Configuration** :
    *   Sélectionnez le niveau de difficulté.
    *   Glissez vos images de fond et bannières (si désiré).
    *   Ajustez les options de génération comme la gestion des silences, le forçage BPM, ou l'ajout de mines pour des défis accrus.
5.  **Export** : Cliquez sur "Exporter le Pack .sm" pour générer la archive contenant les dossiers formatés pour StepMania. Extrayez le résultat dans `StepMania/Songs/VotrePack`.

## 🛠 Technologies
*   **React & Vite** : Framework Frontend, assurant fluidité et rapidité.
*   **Tailwind CSS** : Stylisation "Professional Polish", UI esthétique et responsive.
*   **Web Audio API** : Pour l'analyse de l'audio local et la détection d'énergie/BPM sans nécessiter de serveur distant.
*   **music-metadata-browser** : Pour l'extraction locale des labels ID3.
*   **JSZip & FileSaver** : Pour générer le fichier .zip final côté client.

## 📝 Configuration Technique Avancée (CLI Options)

Bien qu'accessible via l'interface, les paramètres de génération reposent sur des réglages pouvant s'apparenter à des lignes de commandes :
*   `--onset-threshold` : Contrôle la sensibilité de l'algorithme par rapport aux pics d'énergie lors du placement des pas (1.0 = très sensible, 2.5 = ne place des rafales que sur de gros pics).
*   `--mine-probability` : La probabilité de voir apparaître une "Mine" 'M' sur des temps spécifiques lors d'une grande intensité musicale.

---
*Ce projet est pensé pour offrir une transition transparente entre votre bibliothèque musicale moderne et vos parties de jeu de danse sur StepMania.*
