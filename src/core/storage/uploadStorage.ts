/**
 * Native IndexedDB persistent storage for user uploads (raster images & vector SVGs).
 * Zero external dependencies.
 */

export interface StoredImage {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
  width: number;
  height: number;
}

export interface StoredVector {
  id: string;
  name: string;
  svgString: string;
  createdAt: number;
  isConverted?: boolean;
}

const DB_NAME = 'openbiofigure_uploads';
const DB_VERSION = 1;
const STORE_IMAGES = 'images';
const STORE_VECTORS = 'vectors';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_VECTORS)) {
        db.createObjectStore(STORE_VECTORS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

// ---------------------------------------------------------------------------
// Image Storage Helpers
// ---------------------------------------------------------------------------

export async function saveImage(image: StoredImage): Promise<StoredImage> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);
    const req = store.put(image);
    req.onsuccess = () => resolve(image);
    req.onerror = () => reject(req.error);
  });
}

export async function getImages(): Promise<StoredImage[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readonly');
    const store = tx.objectStore(STORE_IMAGES);
    const req = store.getAll();
    req.onsuccess = () => {
      const results = req.result as StoredImage[];
      // Sort newest first
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// Vector Storage Helpers
// ---------------------------------------------------------------------------

export async function saveVector(vector: StoredVector): Promise<StoredVector> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VECTORS, 'readwrite');
    const store = tx.objectStore(STORE_VECTORS);
    const req = store.put(vector);
    req.onsuccess = () => resolve(vector);
    req.onerror = () => reject(req.error);
  });
}

export async function getVectors(): Promise<StoredVector[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VECTORS, 'readonly');
    const store = tx.objectStore(STORE_VECTORS);
    const req = store.getAll();
    req.onsuccess = () => {
      const results = req.result as StoredVector[];
      // Sort newest first
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteVector(id: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VECTORS, 'readwrite');
    const store = tx.objectStore(STORE_VECTORS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
