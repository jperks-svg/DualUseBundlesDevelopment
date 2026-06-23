export interface CustomerProfile {
  id: string;
  name: string;
  company: string;
  sourceIds: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const KV_KEY = 'projects/profiles';

function getApiUrl(): string {
  return (window as any).CRIBL_API_URL || '';
}

function getPackId(): string {
  const basePath: string = (window as any).CRIBL_BASE_PATH || '';
  const parts = basePath.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

// Build the real KV store URL that bypasses the fetch proxy rewriting.
// The proxy rewrites CRIBL_API_URL/kvstore/x → /api/v1/p/{packId}/kvstore/x
// We construct this URL ourselves for XHR (which the proxy can't intercept).
function getKvUrl(): string | null {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;
  const packId = getPackId();
  if (!packId) return null;
  const origin = new URL(apiUrl).origin;
  return `${origin}/api/v1/p/${packId}/kvstore/${KV_KEY}`;
}

// XHR-based KV read — bypasses the fetch proxy entirely.
// The proxy only hooks window.fetch, not XMLHttpRequest.
// Since the iframe is same-origin with the parent, session cookies
// provide authentication automatically with withCredentials.
function kvReadXHR(): Promise<string | null> {
  return new Promise((resolve) => {
    const url = getKvUrl();
    if (!url) { resolve(null); return; }

    console.log('[DUB] XHR read from:', url);
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onload = () => {
      console.log('[DUB] XHR read status:', xhr.status, 'length:', xhr.responseText?.length);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
        resolve(xhr.responseText);
      } else if (xhr.status === 404) {
        console.log('[DUB] XHR: key not found (first use)');
        resolve(null);
      } else {
        console.warn('[DUB] XHR read failed:', xhr.status, xhr.responseText?.slice(0, 100));
        resolve(null);
      }
    };
    xhr.onerror = () => {
      console.warn('[DUB] XHR network error');
      resolve(null);
    };
    xhr.send();
  });
}

// IndexedDB for local persistence (reliable, fast, survives refresh)
const DB_NAME = 'dub_projects';
const STORE_NAME = 'profiles';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
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
  } catch { return []; }
}

async function writeToIDB(profiles: CustomerProfile[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const p of profiles) store.put(p);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

// In-memory cache
let profileCache: CustomerProfile[] | null = null;
let loadPromise: Promise<CustomerProfile[]> | null = null;

export function getProfilesSync(): CustomerProfile[] {
  return profileCache || [];
}

export async function loadProfilesFromKV(): Promise<CustomerProfile[]> {
  if (profileCache !== null) return profileCache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // Try XHR read from KV store first (cross-machine source of truth)
    const raw = await kvReadXHR();
    if (raw) {
      try {
        const data = JSON.parse(raw);
        const profiles = Array.isArray(data) ? data : [];
        profileCache = profiles;
        await writeToIDB(profiles); // Sync to local IDB
        console.log('[DUB] Loaded', profiles.length, 'projects from KV (XHR)');
        return profiles;
      } catch (err) {
        console.warn('[DUB] KV parse failed:', err);
      }
    }

    // Fallback: load from IndexedDB (local cache)
    const local = await readFromIDB();
    if (local.length > 0) {
      console.log('[DUB] Loaded', local.length, 'projects from IndexedDB (local)');
      profileCache = local;
      return local;
    }

    console.log('[DUB] No projects found (KV or local)');
    profileCache = [];
    return profileCache;
  })();

  return loadPromise;
}

export async function saveProfilesToKV(profiles: CustomerProfile[]): Promise<void> {
  profileCache = profiles;
  loadPromise = null;

  // Write to IndexedDB (local, reliable)
  await writeToIDB(profiles);

  // Write to KV store via fetch (proxy handles auth for writes)
  const apiUrl = getApiUrl();
  if (!apiUrl) return;
  try {
    const url = `${apiUrl}/kvstore/${KV_KEY}`;
    console.log('[DUB] Saving', profiles.length, 'projects to KV');
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profiles),
    });
    console.log('[DUB] KV save response:', res.status);
    if (!res.ok) {
      console.warn('[DUB] KV save failed:', res.status);
    }
  } catch (err) {
    console.warn('[DUB] KV save error:', err);
  }
}

// Synchronous API
export function loadProfiles(): CustomerProfile[] {
  if (profileCache !== null) return profileCache;
  return [];
}

export function saveProfiles(profiles: CustomerProfile[]): void {
  profileCache = profiles;
  writeToIDB(profiles).catch(() => {});
  const apiUrl = getApiUrl();
  if (apiUrl) {
    fetch(`${apiUrl}/kvstore/${KV_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profiles),
    }).catch(() => {});
  }
}
