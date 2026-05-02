# Document de Spécifications — Chorégraphe IA & Modèles d'Apprentissage

## Introduction

Cette fonctionnalité (Phase 2 de la roadmap StepSync) augmente le pipeline d'analyse audio et de génération de stepcharts en deux axes complémentaires :

1. **Détection multi-source via TensorFlow.js** : remplacer le filtre lowpass mono-bande par un modèle de séparation de sources côté client capable d'isoler indépendamment le kick, la snare, la basse et le lead. Cela fournit un signal rythmique de haute précision à chaque couche instrumentale.

2. **Styles chorégraphiques** : introduire trois algorithmes de placement de notes — *Stream*, *Crossover/Tech* et *Jump* — qui exploitent les données multi-sources pour produire des stepcharts jouables, cohérents et stylistiquement distincts.

Le tout s'intègre dans l'application React/TypeScript existante (Vite) sans modifier l'interface publique de `AudioAnalysisResult` ni casser les modes de génération actuels.

---

## Glossaire

- **AI_Analyzer** : module `src/lib/aiAudioAnalysis.ts` qui orchestre le chargement du modèle TensorFlow.js et l'extraction des sources audio.
- **SM_Generator** : module `src/lib/smGenerator.ts` existant, étendu pour consommer les données multi-sources et les styles chorégraphiques.
- **Choreographer** : sous-système de `SM_Generator` responsable du placement des notes selon le style sélectionné.
- **Source_Profile** : structure de données contenant les profils d'énergie temporels pour chaque source isolée (kick, snare, basse, lead).
- **Choreography_Style** : énumération des styles disponibles : `stream`, `crossover`, `jump`.
- **Beat_Grid** : grille temporelle quantifiée sur laquelle les notes sont placées (résolution minimale : double-croche, soit 1/16 de mesure).
- **Drop** : section musicale à haute énergie basse/kick détectée par l'AI_Analyzer.
- **Stream_Pattern** : séquence de notes simples consécutives sans répétition de panneau immédiate.
- **Crossover_Pattern** : séquence de notes alternant entre panneaux opposés (gauche/droite) pour forcer un croisement de pieds.
- **Jump** : note double (deux panneaux simultanés) placée sur un temps fort.
- **Onset** : instant précis de déclenchement d'un événement sonore détecté dans une source isolée.
- **TF_Model** : modèle TensorFlow.js chargé en mémoire côté client.
- **EnhancedAnalysisResult** : extension de `AudioAnalysisResult` incluant le `Source_Profile`.

---

## Exigences

### Exigence 1 : Chargement et initialisation du modèle TensorFlow.js

**User Story :** En tant que développeur intégrant le module IA, je veux que le modèle TensorFlow.js se charge de façon asynchrone et non bloquante, afin que l'interface reste réactive pendant l'initialisation.

#### Critères d'acceptation

1. WHEN l'utilisateur ouvre l'application pour la première fois, THE AI_Analyzer SHALL télécharger et initialiser le TF_Model depuis un CDN ou un bundle local en arrière-plan.
2. WHILE le TF_Model est en cours de chargement, THE AI_Analyzer SHALL exposer un état `loading` consultable par les composants React.
3. IF le chargement du TF_Model échoue (réseau indisponible, modèle corrompu), THEN THE AI_Analyzer SHALL basculer automatiquement sur le pipeline d'analyse existant (filtre lowpass) et exposer un état `fallback: true`.
4. THE AI_Analyzer SHALL mettre en cache le TF_Model dans IndexedDB après le premier téléchargement afin d'éviter un rechargement réseau lors des sessions suivantes.
5. WHEN le TF_Model est disponible en cache, THE AI_Analyzer SHALL l'initialiser en moins de 3 secondes sur un appareil de milieu de gamme (CPU 4 cœurs, 8 Go RAM).

---

### Exigence 2 : Séparation de sources audio multi-bandes

**User Story :** En tant qu'utilisateur, je veux que l'analyse audio identifie séparément le kick, la snare, la basse et le lead, afin que les notes générées reflètent fidèlement la structure rythmique de la musique.

#### Critères d'acceptation

1. WHEN un fichier audio est soumis à l'analyse, THE AI_Analyzer SHALL produire un `Source_Profile` contenant quatre profils d'énergie temporels distincts : `kick`, `snare`, `bass`, `lead`.
2. THE AI_Analyzer SHALL traiter l'audio en segments de 2 secondes maximum pour limiter la consommation mémoire à moins de 512 Mo de RAM GPU/CPU.
3. WHEN l'analyse est terminée, THE AI_Analyzer SHALL retourner un `EnhancedAnalysisResult` qui étend `AudioAnalysisResult` sans en modifier les champs existants.
4. THE AI_Analyzer SHALL détecter les onsets de kick avec une précision temporelle inférieure à 10 ms par rapport à la position réelle du transitoire.
5. IF la durée du fichier audio dépasse 10 minutes, THEN THE AI_Analyzer SHALL traiter l'audio par fenêtres glissantes et assembler les résultats sans discontinuité perceptible dans le `Source_Profile`.
6. THE AI_Analyzer SHALL normaliser chaque profil d'énergie entre 0.0 et 1.0 pour permettre une comparaison inter-sources cohérente.

---

### Exigence 3 : Détection des Drops et sections à haute énergie

**User Story :** En tant qu'utilisateur, je veux que le générateur identifie automatiquement les drops et les sections intenses, afin que les styles chorégraphiques puissent y placer des patterns plus denses ou spectaculaires.

#### Critères d'acceptation

1. WHEN le `Source_Profile` est disponible, THE AI_Analyzer SHALL identifier les intervalles temporels qualifiés de `Drop` en détectant les zones où l'énergie combinée `kick + bass` dépasse 0.75 (sur l'échelle normalisée 0–1) pendant au moins 2 secondes consécutives.
2. THE AI_Analyzer SHALL retourner la liste des `Drop` sous forme de tableau de `{ startTime: number, endTime: number }` dans l'`EnhancedAnalysisResult`.
3. IF aucun `Drop` n'est détecté dans un fichier audio, THEN THE AI_Analyzer SHALL retourner un tableau vide sans lever d'erreur.
4. WHEN deux `Drop` candidats sont séparés de moins de 1 seconde, THE AI_Analyzer SHALL les fusionner en un seul `Drop` continu.

---

### Exigence 4 : Style chorégraphique Stream

**User Story :** En tant que joueur orienté cardio, je veux un style Stream qui génère des enchaînements constants de notes simples, afin d'obtenir un stepchart fluide et physiquement exigeant.

#### Critères d'acceptation

1. WHEN le style `stream` est sélectionné, THE Choreographer SHALL placer une note sur chaque onset de `kick` ou de `snare` détecté dans le `Source_Profile`.
2. WHILE le style `stream` est actif, THE Choreographer SHALL garantir qu'aucun panneau identique n'est répété deux fois consécutivement (règle anti-jackhammer).
3. WHEN le style `stream` est actif et que la densité de notes dépasse 8 notes par seconde, THE Choreographer SHALL supprimer les onsets les moins énergétiques pour ramener la densité à 8 notes par seconde maximum.
4. THE Choreographer SHALL produire des `Stream_Pattern` en alternant les panneaux selon un cycle gauche → bas → haut → droite (ou son inverse) pour favoriser un mouvement naturel des pieds.
5. WHEN le style `stream` est actif, THE Choreographer SHALL ne placer aucun `Jump` sauf sur les temps forts de mesure (beat 1 et beat 3) pendant les sections `Drop`.

---

### Exigence 5 : Style chorégraphique Crossover/Tech

**User Story :** En tant que joueur technique, je veux un style Crossover/Tech qui favorise les croisements de pieds, afin d'obtenir un stepchart stimulant sur le plan de la coordination.

#### Critères d'acceptation

1. WHEN le style `crossover` est sélectionné, THE Choreographer SHALL placer les notes de façon à alterner systématiquement entre les panneaux gauche et droite (ou leurs équivalents diagonaux en mode Pump) pour forcer un croisement de pieds.
2. WHILE le style `crossover` est actif, THE Choreographer SHALL utiliser les onsets de `lead` en priorité pour placer les notes de croisement, et les onsets de `kick`/`snare` pour les notes de remplissage.
3. WHEN le style `crossover` est actif sur un mode `dance-double` ou `pump-double`, THE Choreographer SHALL générer des patterns qui traversent la ligne centrale entre les deux tapis au moins une fois toutes les 4 mesures.
4. THE Choreographer SHALL éviter de placer plus de 3 notes consécutives sur le même côté (gauche ou droite) en style `crossover`.
5. IF le `Source_Profile` ne contient pas de données `lead` exploitables (énergie `lead` < 0.1 sur toute la durée), THEN THE Choreographer SHALL utiliser les onsets de `snare` comme substitut pour le style `crossover`.

---

### Exigence 6 : Style chorégraphique Jump

**User Story :** En tant que joueur cherchant de l'intensité, je veux un style Jump qui intensifie les doubles flèches sur les drops, afin d'obtenir un stepchart physiquement percutant sur les moments forts.

#### Critères d'acceptation

1. WHEN le style `jump` est sélectionné et qu'une section `Drop` est active, THE Choreographer SHALL placer un `Jump` (deux panneaux simultanés) sur chaque onset de `kick` détecté dans cette section.
2. WHILE le style `jump` est actif en dehors des sections `Drop`, THE Choreographer SHALL placer des notes simples sur les onsets de `kick` et de `snare`, sans `Jump`.
3. WHEN le style `jump` est actif, THE Choreographer SHALL s'assurer que deux `Jump` consécutifs sont séparés d'au moins une note simple pour éviter les séquences de doubles non jouables.
4. THE Choreographer SHALL sélectionner les deux panneaux d'un `Jump` de façon à ce qu'ils ne soient pas adjacents (ex. : gauche+droite ou haut+bas sont préférés à gauche+bas).
5. WHEN le style `jump` est actif sur un mode `dance-single` (4 panneaux), THE Choreographer SHALL limiter les `Jump` à 40% maximum des notes totales de la section `Drop` pour maintenir la jouabilité.

---

### Exigence 7 : Intégration dans l'interface utilisateur

**User Story :** En tant qu'utilisateur de StepSync, je veux sélectionner le style chorégraphique depuis l'interface existante, afin de personnaliser le stepchart généré sans avoir à modifier de fichiers manuellement.

#### Critères d'acceptation

1. THE AlgorithmStep SHALL afficher un sélecteur de `Choreography_Style` avec les trois options : `Stream`, `Crossover/Tech` et `Jump`.
2. WHEN l'utilisateur sélectionne un style, THE AlgorithmStep SHALL mettre à jour l'état global de l'application et transmettre le style sélectionné au `SM_Generator` lors de l'export.
3. WHILE le TF_Model est en état `loading`, THE AlgorithmStep SHALL afficher un indicateur de progression et désactiver le sélecteur de style.
4. WHEN le TF_Model est en état `fallback`, THE AlgorithmStep SHALL afficher un message d'avertissement indiquant que l'analyse IA est indisponible et que le mode classique est utilisé.
5. THE AlgorithmStep SHALL conserver la compatibilité avec les contrôles existants (seuil d'énergie, densité de mines, trim silence) sans les supprimer ni les déplacer.
6. WHEN l'utilisateur survole chaque option de style, THE AlgorithmStep SHALL afficher une description courte du style (≤ 2 phrases) dans une infobulle ou un panneau d'aide contextuel.

---

### Exigence 8 : Compatibilité et non-régression

**User Story :** En tant que développeur, je veux que la nouvelle fonctionnalité n'altère pas les comportements existants, afin de garantir la stabilité de l'application pour les utilisateurs actuels.

#### Critères d'acceptation

1. THE SM_Generator SHALL continuer à fonctionner avec un `AudioAnalysisResult` standard (sans `Source_Profile`) en utilisant le comportement probabiliste existant comme valeur par défaut.
2. WHEN aucun style chorégraphique n'est explicitement sélectionné, THE SM_Generator SHALL utiliser le comportement de génération actuel (placement pondéré par énergie) sans modification.
3. THE AI_Analyzer SHALL exporter une interface `EnhancedAnalysisResult` qui étend `AudioAnalysisResult` de façon rétrocompatible (aucun champ existant supprimé ou renommé).
4. IF le navigateur ne supporte pas WebGL ou WebAssembly requis par TensorFlow.js, THEN THE AI_Analyzer SHALL détecter cette limitation au démarrage et activer automatiquement le mode `fallback`.
5. THE AI_Analyzer SHALL être importable de façon optionnelle (dynamic import) pour ne pas augmenter le bundle initial de plus de 50 Ko (hors modèle TF.js).

---

### Exigence 9 : Performance et expérience utilisateur pendant l'analyse

**User Story :** En tant qu'utilisateur, je veux que l'analyse IA se déroule sans bloquer l'interface, afin de pouvoir continuer à configurer mes options pendant le traitement.

#### Critères d'acceptation

1. THE AI_Analyzer SHALL exécuter l'inférence TensorFlow.js dans un Web Worker dédié pour ne pas bloquer le thread principal.
2. WHEN l'analyse est en cours, THE AI_Analyzer SHALL émettre des événements de progression (0–100%) à une fréquence minimale de 1 mise à jour par seconde.
3. THE AI_Analyzer SHALL compléter l'analyse d'un fichier audio de 3 minutes en moins de 30 secondes sur un appareil de milieu de gamme (CPU 4 cœurs, 8 Go RAM, sans GPU dédié).
4. IF l'utilisateur annule l'analyse en cours, THEN THE AI_Analyzer SHALL libérer les ressources TensorFlow.js allouées (tenseurs, mémoire GPU) dans un délai de 2 secondes.
5. WHEN plusieurs fichiers sont analysés en séquence (mode pack), THE AI_Analyzer SHALL réutiliser le TF_Model déjà chargé sans le recharger entre chaque fichier.
