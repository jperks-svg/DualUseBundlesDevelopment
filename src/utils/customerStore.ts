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

// Read the response body by consuming the ReadableStream directly.
// The Cribl fetch proxy enqueues the pre-parsed JS object as a chunk
// into the Response's ReadableStream. Standard .text()/.json() fail
// because they expect string/Uint8Array chunks, but reading chunks
// directly gives us the actual parsed data.
async function readResponseBody(res: Response): Promise<any> {
  // First try .body stream reader (gets raw chunks from proxy)
  if (res.body) {
    try {
      const reader = res.body.getReader();
      const chunks: any[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      console.log('[DUB] Stream chunks:', chunks.length, 'types:', chunks.map(c => typeof c));
      if (chunks.length === 1 && typeof chunks[0] === 'object' && !(chunks[0] instanceof Uint8Array)) {
        // Proxy delivered pre-parsed object directly as stream chunk
        return chunks[0];
      }
      if (chunks.length > 0 && chunks[0] instanceof Uint8Array) {
        // Normal response — decode and parse
        const text = new TextDecoder().decode(chunks[0]);
        return JSON.parse(text);
      }
      // Multiple object chunks — likely an array split
      if (chunks.length > 0 && typeof chunks[0] === 'object') {
        return chunks;
      }
    } catch (err) {
      console.warn('[DUB] Stream read failed:', err);
    }
  }

  // Fallback: try .text() in case it works this time
  try {
    const text = await res.text();
    if (text && text[0] === '[' || text[0] === '{') {
      return JSON.parse(text);
    }
  } catch (err) {
    console.warn('[DUB] .text() fallback failed:', err);
  }

  return null;
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
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      console.log('[DUB] No CRIBL_API_URL — using localStorage only');
      profileCache = loadFromLocalStorage();
      return profileCache;
    }

    try {
      const url = `${apiUrl}/kvstore/${KV_KEY}`;
      console.log('[DUB] Loading projects from:', url);
      const res = await fetch(url);
      console.log('[DUB] KV load response:', res.status, 'bodyUsed:', res.bodyUsed);

      if (res.status === 404) {
        console.log('[DUB] KV key not found (first use)');
        profileCache = [];
        return profileCache;
      }

      if (res.ok) {
        const data = await readResponseBody(res);
        console.log('[DUB] KV parsed data type:', typeof data, 'isArray:', Array.isArray(data));

        if (Array.isArray(data)) {
          profileCache = data;
        } else if (data && typeof data.d === 'string') {
          profileCache = JSON.parse(data.d);
        } else {
          profileCache = [];
        }
        console.log('[DUB] Loaded', profileCache!.length, 'projects from KV');
        return profileCache!;
      }
    } catch (err) {
      console.warn('[DUB] KV load failed:', err);
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
    console.log('[DUB] Saving', profiles.length, 'projects to:', url);
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
      body: JSON.stringify(profiles),
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
