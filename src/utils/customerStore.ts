export interface CustomerProfile {
  id: string;
  name: string;
  company: string;
  sourceIds: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const DB_NAME = 'dub_projects';
const STORE_NAME = 'profiles';
const DB_VERSION = 1;

// Open (or create) the IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Read all profiles from IndexedDB
async function readFromIDB(): Promise<CustomerProfile[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[DUB] IndexedDB read failed:', err);
    return [];
  }
}

// Write all profiles to IndexedDB (clear + re-add)
async function writeToIDB(profiles: CustomerProfile[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const p of profiles) {
        store.put(p);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[DUB] IndexedDB write failed:', err);
  }
}

// In-memory cache — survives across route changes within the same session
let profileCache: CustomerProfile[] | null = null;
let loadPromise: Promise<CustomerProfile[]> | null = null;

export function getProfilesSync(): CustomerProfile[] {
  return profileCache || [];
}

export async function loadProfilesFromKV(): Promise<CustomerProfile[]> {
  if (profileCache !== null) return profileCache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const profiles = await readFromIDB();
    console.log('[DUB] Loaded', profiles.length, 'projects from IndexedDB');
    profileCache = profiles;
    return profiles;
  })();

  return loadPromise;
}

export async function saveProfilesToKV(profiles: CustomerProfile[]): Promise<void> {
  profileCache = profiles;
  loadPromise = null;
  await writeToIDB(profiles);
  console.log('[DUB] Saved', profiles.length, 'projects to IndexedDB');
}

// Synchronous API — reads/writes the in-memory cache only
export function loadProfiles(): CustomerProfile[] {
  if (profileCache !== null) return profileCache;
  return [];
}

export function saveProfiles(profiles: CustomerProfile[]): void {
  profileCache = profiles;
  writeToIDB(profiles).catch(() => {});
}

export function getProfilesSync2(): CustomerProfile[] {
  return profileCache || [];
}
