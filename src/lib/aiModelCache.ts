/**
 * AI Model Cache — IndexedDB persistence for TensorFlow.js model artifacts.
 * Requirements: 1.4
 *
 * Uses the native IndexedDB API (no external dependencies).
 * Stores topology + weights indexed by modelUrl.
 */

const DB_NAME    = 'stepsync-ai-cache';
const DB_VERSION = 1;
const STORE_NAME = 'models';

/** Minimal representation of TF.js model artifacts stored in the cache. */
export interface CachedModelArtifacts {
  modelTopology: unknown;
  weightSpecs:   WeightSpec[];
  /** Raw binary weights. */
  weightData:    ArrayBuffer;
  savedAt:       number; // ms epoch
}

export interface WeightSpec {
  name:  string;
  shape: number[];
  dtype: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'modelUrl' });
      }
    };

    req.onsuccess  = () => resolve(req.result);
    req.onerror    = () => reject(req.error);
    req.onblocked  = () => reject(new Error('IndexedDB blocked'));
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Saves model artifacts to IndexedDB, keyed by modelUrl.
 * Overwrites any previously cached entry for the same URL.
 */
export async function saveModelToCache(
  modelUrl:  string,
  artifacts: CachedModelArtifacts
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record = { modelUrl, ...artifacts, savedAt: Date.now() };
    const req = store.put(record);
    req.onsuccess  = () => resolve();
    req.onerror    = () => reject(req.error);
    tx.oncomplete  = () => db.close();
    tx.onerror     = () => reject(tx.error);
  });
}

/**
 * Loads model artifacts from IndexedDB.
 * Returns `null` if no cached entry exists for the given URL.
 */
export async function loadModelFromCache(
  modelUrl: string
): Promise<CachedModelArtifacts | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.get(modelUrl);

    req.onsuccess = () => {
      db.close();
      if (req.result) {
        // Strip the primary key field before returning
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { modelUrl: _url, ...rest } = req.result as { modelUrl: string } & CachedModelArtifacts;
        resolve(rest as CachedModelArtifacts);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

/**
 * Clears all cached models from IndexedDB.
 */
export async function clearModelCache(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.clear();
    req.onsuccess  = () => resolve();
    req.onerror    = () => reject(req.error);
    tx.oncomplete  = () => db.close();
    tx.onerror     = () => reject(tx.error);
  });
}
