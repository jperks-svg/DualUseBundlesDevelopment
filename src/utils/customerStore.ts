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
  // CRIBL_BASE_PATH is like "/app-ui/my-pack-id"
  const parts = basePath.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

// XHR-based KV read — bypasses the fetch proxy which corrupts response bodies
function kvGet(key: string): Promise<string | null> {
  return new Promise((resolve) => {
    const apiUrl = getApiUrl();
    if (!apiUrl) { resolve(null); return; }

    const packId = getPackId();
    const origin = new URL(apiUrl).origin;
    // The fetch proxy rewrites /kvstore/x to /api/v1/p/{packId}/kvstore/x
    // We replicate that rewriting manually for XHR
    const url = packId
      ? `${origin}/api/v1/p/${packId}/kvstore/${key}`
      : `${apiUrl}/kvstore/${key}`;

    console.log('[DUB] XHR GET:', url, '(packId:', packId, ')');
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.withCredentials = true;
    xhr.onload = () => {
      console.log('[DUB] XHR status:', xhr.status, 'length:', xhr.responseText.length);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText);
      } else if (xhr.status === 404) {
        resolve(null);
      } else {
        console.warn('[DUB] XHR unexpected status:', xhr.status);
        resolve(null);
      }
    };
    xhr.onerror = (e) => {
      console.warn('[DUB] XHR error:', e);
      resolve(null);
    };
    xhr.send();
  });
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
    const raw = await kvGet(KV_KEY);
    if (raw !== null) {
      try {
        const data = JSON.parse(raw);
        // Support both envelope format {d:"..."} and direct array
        let parsed: CustomerProfile[];
        if (data && typeof data.d === 'string') {
          parsed = JSON.parse(data.d);
        } else if (Array.isArray(data)) {
          parsed = data;
        } else {
          parsed = [];
        }
        profileCache = parsed;
        console.log('[DUB] Loaded', parsed.length, 'projects from KV');
        return parsed;
      } catch (err) {
        console.warn('[DUB] KV parse error:', err, 'raw:', raw.slice(0, 200));
      }
    } else {
      console.log('[DUB] KV returned null (first use or XHR failed)');
    }
    profileCache = loadFromLocalStorage();
    return profileCache;
  })();

  return loadPromise;
}

export async function saveProfilesToKV(profiles: CustomerProfile[]): Promise<void> {
  profileCache = profiles;
  loadPromise = null;
  saveToLocalStorage(profiles);

  const apiUrl = getApiUrl();
  if (!apiUrl) return;
  try {
    const url = `${apiUrl}/kvstore/${KV_KEY}`;
    const envelope = JSON.stringify({ d: JSON.stringify(profiles) });
    console.log('[DUB] Saving', profiles.length, 'projects to:', url);
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: envelope,
    });
    console.log('[DUB] KV save response:', res.status);
    if (!res.ok) {
      console.warn('[DUB] KV save failed:', res.status);
    }
  } catch (err) {
    console.warn('[DUB] KV save error:', err);
  }
}

// Synchronous API — reads/writes the in-memory cache + localStorage
export function loadProfiles(): CustomerProfile[] {
  if (profileCache !== null) return profileCache;
  profileCache = loadFromLocalStorage();
  return profileCache;
}

export function saveProfiles(profiles: CustomerProfile[]): void {
  profileCache = profiles;
  saveToLocalStorage(profiles);
  const apiUrl = getApiUrl();
  if (apiUrl) {
    fetch(`${apiUrl}/kvstore/${KV_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ d: JSON.stringify(profiles) }),
    }).catch(() => {});
  }
}

// localStorage helpers
const STORAGE_KEY = 'dub_customer_profiles';

function loadFromLocalStorage(): CustomerProfile[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToLocalStorage(profiles: CustomerProfile[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {}
}
