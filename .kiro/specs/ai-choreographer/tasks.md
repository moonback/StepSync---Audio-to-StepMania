# Plan d'Implémentation : Chorégraphe IA & Modèles d'Apprentissage (Phase 2)

## Vue d'ensemble

Implémentation en TypeScript du module AI_Analyzer (séparation de sources via TensorFlow.js dans un Web Worker) et du Choreographer (trois styles chorégraphiques : Stream, Crossover/Tech, Jump) intégrés dans l'application React/Vite existante StepSync. L'intégration est non-régressive : le pipeline existant reste le comportement par défaut.

## Tâches

- [x] 1. Mettre en place les types partagés et les interfaces de base
  - Créer `src/lib/aiTypes.ts` avec les interfaces `SourceProfile`, `DropInterval`, `OnsetEvent`, `EnhancedAnalysisResult`, `AIAnalyzerState`, `AIAnalyzerError`, `AIErrorCode`, `ChoreographyStyle`
  - Étendre `SongItem` dans `src/lib/types.ts` avec les champs optionnels `enhancedAnalysis` et `choreographyStyle`
  - Étendre `SMOptions` dans `src/lib/smGenerator.ts` avec le champ optionnel `choreographyStyle`
  - _Exigences : 2.3, 7.2, 8.1, 8.3_

- [x] 2. Implémenter le cache IndexedDB pour le modèle TF.js
  - [x] 2.1 Créer `src/lib/aiModelCache.ts` avec les fonctions `saveModelToCache`, `loadModelFromCache`, `clearModelCache`
    - Utiliser l'API IndexedDB native (pas de dépendance externe)
    - Stocker les artefacts du modèle (topologie + poids) indexés par `modelUrl`
    - _Exigences : 1.4_

  - [x]* 2.2 Écrire le test de propriété pour le round-trip du cache modèle
    - **Propriété 3 : Round-trip du cache modèle**
    - **Valide : Exigence 1.4**
    - Installer `fast-check` comme dépendance de développement (version exacte à épingler)
    - Configurer Vitest dans `vite.config.ts` et créer `src/lib/__tests__/aiModelCache.test.ts`
    - Utiliser `fc.record({ modelTopology: fc.object(), weightSpecs: fc.array(fc.record({...})), weightData: fc.uint8Array() })` avec `numRuns: 100`
    - _Exigences : 1.4_

- [x] 3. Implémenter le Web Worker TF.js
  - [x] 3.1 Créer `src/lib/aiWorker.ts` avec le protocole de messages `WorkerInMessage` / `WorkerOutMessage`
    - Implémenter les handlers pour `INIT`, `ANALYZE`, `ABORT`, `DISPOSE`
    - Implémenter les filtres passe-bande via `OfflineAudioContext` (kick : 60–200 Hz, snare : 200–8000 Hz, basse : 40–300 Hz, lead : 1000–16000 Hz)
    - Implémenter le calcul des profils d'énergie normalisés [0.0–1.0] par segments de 2 secondes maximum
    - Implémenter la détection d'onsets avec précision < 10 ms
    - Émettre des messages `PROGRESS` à une fréquence minimale de 1/seconde
    - Utiliser `Transferable` pour le transfert de l'`ArrayBuffer` sans copie mémoire
    - _Exigences : 2.1, 2.2, 2.4, 2.5, 2.6, 9.1, 9.2_

  - [x] 3.2 Implémenter la détection des Drops dans le Worker
    - Détecter les intervalles où l'énergie combinée `kick + bass` dépasse 0.75 pendant au moins 2 secondes consécutives
    - Fusionner les drops séparés de moins de 1 seconde
    - Retourner un tableau vide si aucun drop n'est détecté
    - _Exigences : 3.1, 3.2, 3.3, 3.4_

  - [x]* 3.3 Écrire le test de propriété pour la normalisation des profils d'énergie
    - **Propriété 1 : Normalisation des profils d'énergie**
    - **Valide : Exigences 2.5, 2.6**
    - Créer `src/lib/__tests__/aiWorker.test.ts`
    - Utiliser `fc.array(fc.float({ min: 0, max: 1, noNaN: true }))` × 4 sources avec `numRuns: 100`
    - Vérifier que toutes les valeurs sont dans [0.0, 1.0] et qu'aucune n'est `NaN` ou `undefined`
    - _Exigences : 2.5, 2.6_

  - [x]* 3.4 Écrire le test de propriété pour la validité des Drops détectés
    - **Propriété 4 : Validité des Drops détectés**
    - **Valide : Exigences 3.1, 3.4**
    - Utiliser `fc.array(fc.record({ startTime: fc.float({ min: 0 }), endTime: fc.float({ min: 0 }) }))` avec profils d'énergie aléatoires, `numRuns: 100`
    - Vérifier : énergie combinée > 0.75, durée ≥ 2 s, aucun gap < 1 s entre drops consécutifs
    - _Exigences : 3.1, 3.4_

- [x] 4. Checkpoint — S'assurer que les tests du cache et du Worker passent
  - S'assurer que tous les tests passent, poser des questions à l'utilisateur si nécessaire.

- [x] 5. Implémenter le module principal AI_Analyzer
  - [x] 5.1 Créer `src/lib/aiAudioAnalysis.ts` avec les fonctions `initAIAnalyzer`, `analyzeAudio`, `disposeAIAnalyzer`
    - Instancier le Worker une seule fois et le réutiliser entre les fichiers (Exigence 9.5)
    - Implémenter le chargement du modèle depuis le cache IndexedDB, puis depuis le CDN/bundle en fallback
    - Exposer l'état `AIAnalyzerState` via un `EventEmitter` léger (callbacks) pour rester découplé de React
    - Implémenter le fallback automatique vers `processAudio` existant en cas d'erreur (`MODEL_LOAD_FAILED`, `WEBGL_UNAVAILABLE`, `ANALYSIS_FAILED`, `WORKER_TIMEOUT`)
    - Détecter l'absence de WebGL/WASM au démarrage et activer le mode `fallback` immédiatement
    - Utiliser `import()` dynamique pour ne pas augmenter le bundle initial de plus de 50 Ko
    - Implémenter l'annulation via `AbortSignal` avec libération des ressources en < 2 s
    - Traiter les fichiers > 10 minutes par fenêtres glissantes sans discontinuité
    - _Exigences : 1.1, 1.2, 1.3, 1.4, 1.5, 8.4, 8.5, 9.1, 9.3, 9.4, 9.5_

  - [x]* 5.2 Écrire le test de propriété pour la rétrocompatibilité de `EnhancedAnalysisResult`
    - **Propriété 2 : Rétrocompatibilité de `EnhancedAnalysisResult`**
    - **Valide : Exigences 2.3, 8.3**
    - Créer `src/lib/__tests__/aiAudioAnalysis.test.ts`
    - Utiliser `fc.record({ bpm: fc.float({ min: 60, max: 240 }), offset: fc.float({ min: 0 }), peaks: fc.array(fc.float({ min: 0 })), energyProfile: fc.array(fc.float({ min: 0, max: 1 })), tempoChanges: fc.array(fc.record({ timeInSeconds: fc.float({ min: 0 }), bpm: fc.float({ min: 60, max: 240 }) })) })` avec `numRuns: 100`
    - Vérifier que tous les champs de `AudioAnalysisResult` sont présents et non-nuls dans `EnhancedAnalysisResult`
    - _Exigences : 2.3, 8.3_

  - [x]* 5.3 Écrire les tests unitaires pour les scénarios d'erreur et de fallback
    - Tester : initialisation réussie, fallback réseau (`MODEL_LOAD_FAILED`), fallback WebGL (`WEBGL_UNAVAILABLE`), annulation utilisateur (`ABORT`)
    - _Exigences : 1.3, 8.4, 9.4_

- [x] 6. Créer le hook React `useAIAnalyzer`
  - Créer `src/hooks/useAIAnalyzer.ts` exposant `{ state: AIAnalyzerState, analyzeAudio }`
  - S'abonner aux événements de l'`AI_Analyzer` et mettre à jour l'état React
  - Appeler `initAIAnalyzer` au montage et `disposeAIAnalyzer` au démontage
  - _Exigences : 1.2, 7.3, 7.4, 9.2_

- [x] 7. Implémenter le Choreographer — Style Stream
  - [x] 7.1 Créer `src/lib/choreographer.ts` avec la fonction `buildChoreography` et le contexte `ChoreographerContext`
    - Implémenter le style `stream` : placer une note sur chaque onset de `kick` ou `snare`
    - Appliquer la règle anti-jackhammer (aucun panneau identique deux fois consécutivement)
    - Appliquer le cycle de rotation des panneaux : gauche → bas → haut → droite (ou inverse)
    - Limiter la densité à 8 notes/seconde en supprimant les onsets les moins énergétiques
    - Placer des `Jump` uniquement sur les beats 1 et 3 pendant les sections `Drop`
    - _Exigences : 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x]* 7.2 Écrire le test de propriété pour la règle anti-jackhammer du style Stream
    - **Propriété 5 : Règle anti-jackhammer du style Stream**
    - **Valide : Exigence 4.2**
    - Créer `src/lib/__tests__/choreographer.test.ts`
    - Utiliser `fc.array(fc.record({ timeInSeconds: fc.float({ min: 0 }), energy: fc.float({ min: 0, max: 1 }), source: fc.constantFrom('kick', 'snare') }))` avec `numRuns: 100`
    - Vérifier qu'aucune paire de notes consécutives n'occupe le même panneau
    - _Exigences : 4.2_

  - [x]* 7.3 Écrire le test de propriété pour la densité maximale du style Stream
    - **Propriété 6 : Densité maximale du style Stream**
    - **Valide : Exigence 4.3**
    - Utiliser `fc.array(fc.float({ min: 0, max: 300 }))` (timestamps d'onsets haute densité) avec `numRuns: 100`
    - Vérifier que pour toute fenêtre glissante d'une seconde, le nombre de notes ≤ 8
    - _Exigences : 4.3_

- [x] 8. Implémenter le Choreographer — Style Crossover/Tech
  - [x] 8.1 Étendre `buildChoreography` dans `src/lib/choreographer.ts` pour le style `crossover`
    - Alterner systématiquement entre panneaux gauche et droite pour forcer les croisements
    - Utiliser les onsets de `lead` en priorité, `kick`/`snare` en remplissage
    - Éviter plus de 3 notes consécutives du même côté
    - En mode `dance-double`/`pump-double` : traverser la ligne centrale au moins une fois toutes les 4 mesures
    - Utiliser les onsets de `snare` comme substitut si l'énergie `lead` < 0.1 sur toute la durée
    - _Exigences : 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x]* 8.2 Écrire le test de propriété pour la limite de notes consécutives d'un même côté en Crossover
    - **Propriété 10 : Limite de notes consécutives d'un même côté en Crossover**
    - **Valide : Exigences 5.1, 5.4**
    - Utiliser `fc.array(fc.nat({ max: 3 }))` (séquences de panneaux en dance-single) avec `numRuns: 100`
    - Vérifier qu'aucune séquence de plus de 3 notes consécutives n'est placée exclusivement côté gauche (panneaux 0, 1) ou côté droit (panneaux 2, 3)
    - _Exigences : 5.1, 5.4_

- [x] 9. Implémenter le Choreographer — Style Jump
  - [x] 9.1 Étendre `buildChoreography` dans `src/lib/choreographer.ts` pour le style `jump`
    - Placer un `Jump` sur chaque onset de `kick` dans les sections `Drop`
    - Placer des notes simples sur `kick` et `snare` en dehors des sections `Drop`
    - Garantir au moins une note simple entre deux `Jump` consécutifs
    - Sélectionner des panneaux non-adjacents pour chaque `Jump` (préférer gauche+droite ou haut+bas)
    - En mode `dance-single` : limiter les `Jump` à 40% maximum des notes totales dans une section `Drop`
    - _Exigences : 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x]* 9.2 Écrire le test de propriété pour le placement des Jumps selon les sections Drop
    - **Propriété 7 : Placement des Jumps selon les sections Drop**
    - **Valide : Exigences 6.1, 6.2**
    - Utiliser `fc.array(fc.record({ isKick: fc.boolean(), inDrop: fc.boolean(), time: fc.float({ min: 0 }) }))` avec `numRuns: 100`
    - Vérifier : dans un Drop, chaque onset kick → Jump ; hors Drop, aucun Jump
    - _Exigences : 6.1, 6.2_

  - [x]* 9.3 Écrire le test de propriété pour la séparation des Jumps consécutifs
    - **Propriété 8 : Séparation des Jumps consécutifs**
    - **Valide : Exigence 6.3**
    - Utiliser `fc.array(fc.boolean())` (is_jump par beat) avec `numRuns: 100`
    - Vérifier qu'aucune paire de Jumps consécutifs n'apparaît sans note simple entre eux
    - _Exigences : 6.3_

  - [x]* 9.4 Écrire le test de propriété pour les panneaux non-adjacents et la limite de Jumps en dance-single
    - **Propriété 9 : Panneaux non-adjacents et limite de Jumps en dance-single**
    - **Valide : Exigences 6.4, 6.5**
    - Utiliser `fc.array(fc.record({ isJump: fc.boolean(), inDrop: fc.boolean() }))` en mode dance-single avec `numRuns: 100`
    - Vérifier : paires interdites absentes ((0,1), (1,2), (2,3) et inverses) ; ratio Jumps/total ≤ 0.40 dans les sections Drop
    - _Exigences : 6.4, 6.5_

- [x] 10. Checkpoint — S'assurer que tous les tests du Choreographer passent
  - S'assurer que tous les tests passent, poser des questions à l'utilisateur si nécessaire.

- [x] 11. Intégrer le Choreographer dans `smGenerator.ts`
  - [x] 11.1 Modifier `generateSM` dans `src/lib/smGenerator.ts` pour accepter `EnhancedAnalysisResult` en plus de `AudioAnalysisResult`
    - Activer le `Choreographer` uniquement si `EnhancedAnalysisResult` est fourni et `choreographyStyle` est défini
    - Conserver le comportement probabiliste existant comme valeur par défaut (aucun `choreographyStyle`)
    - Passer le `TempoMap` existant au `ChoreographerContext`
    - _Exigences : 8.1, 8.2_

  - [x]* 11.2 Écrire le test de propriété pour la non-régression du générateur existant
    - **Propriété 11 : Non-régression du générateur existant**
    - **Valide : Exigences 8.1, 8.2**
    - Créer `src/lib/__tests__/smGenerator.test.ts`
    - Utiliser `fc.record({ bpm: fc.float({ min: 60, max: 240 }), offset: fc.float({ min: 0 }), peaks: fc.array(fc.float({ min: 0 })), energyProfile: fc.array(fc.float({ min: 0, max: 1 })), tempoChanges: fc.array(fc.record({ timeInSeconds: fc.float({ min: 0 }), bpm: fc.float({ min: 60, max: 240 }) })) })` avec `numRuns: 100`
    - Vérifier que `generateSM` avec un `AudioAnalysisResult` standard (sans `sourceProfile`, sans `choreographyStyle`) produit une sortie structurellement identique à l'implémentation actuelle
    - _Exigences : 8.1, 8.2_

- [x] 12. Mettre à jour `AlgorithmStep.tsx` avec le sélecteur de style et l'état IA
  - [x] 12.1 Étendre les props de `AlgorithmStep` avec `choreographyStyle`, `setChoreographyStyle`, `aiStatus`, `aiFallback`, `aiProgress`
    - Ajouter le sélecteur de `ChoreographyStyle` avec les trois options : `Stream`, `Crossover/Tech`, `Jump`
    - Afficher un indicateur de progression et désactiver le sélecteur pendant l'état `loading`
    - Afficher un bandeau d'avertissement pendant l'état `fallback`
    - Afficher une infobulle ou un panneau d'aide contextuel (≤ 2 phrases) au survol de chaque option
    - Conserver tous les contrôles existants (seuil d'énergie, densité de mines, trim silence) sans les supprimer ni les déplacer
    - _Exigences : 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x]* 12.2 Écrire les tests unitaires pour `AlgorithmStep`
    - Tester : affichage du sélecteur, état loading (sélecteur désactivé), état fallback (bandeau affiché), tooltip au survol
    - _Exigences : 7.1, 7.3, 7.4, 7.6_

- [x] 13. Câbler les nouveaux modules dans `App.tsx`
  - Appeler `initAIAnalyzer` au démarrage de l'application via le hook `useAIAnalyzer`
  - Passer `choreographyStyle` et les setters à `AlgorithmStep`
  - Passer `aiStatus`, `aiFallback`, `aiProgress` à `AlgorithmStep`
  - Appeler `analyzeAudio` (AI_Analyzer) en parallèle de `processAudio` lors de l'analyse d'un fichier
  - Stocker `enhancedAnalysis` dans `SongItem` et le transmettre à `generateSM` lors de l'export
  - Réutiliser le Worker déjà chargé pour les analyses en séquence (mode pack)
  - _Exigences : 1.1, 7.2, 9.5_

- [x] 14. Checkpoint final — S'assurer que tous les tests passent
  - Lancer `npm run lint` pour vérifier l'absence d'erreurs TypeScript
  - S'assurer que tous les tests passent, poser des questions à l'utilisateur si nécessaire.

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les tests de propriétés utilisent `fast-check` avec `numRuns: 100` minimum
- Les checkpoints garantissent une validation incrémentale
- Le comportement existant de `generateSM` est préservé en l'absence de `choreographyStyle`
