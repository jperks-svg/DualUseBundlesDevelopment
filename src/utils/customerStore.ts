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
      console.log('[DUB] KV load response:', res.status);

      if (res.status === 404) {
        console.log('[DUB] KV key not found (first use)');
        profileCache = [];
        return profileCache;
      }

      if (res.ok) {
        const text = await res.text();
        console.log('[DUB] KV load text length:', text.length, 'first 100:', text.slice(0, 100));

        if (text && text[0] === '[') {
          // Direct array format
          profileCache = JSON.parse(text);
        } else if (text && text[0] === '{') {
          // Envelope format {d: "..."}
          const obj = JSON.parse(text);
          if (typeof obj.d === 'string') {
            profileCache = JSON.parse(obj.d);
          } else {
            profileCache = [];
          }
        } else {
          console.warn('[DUB] KV unexpected format:', text.slice(0, 50));
          profileCache = loadFromLocalStorage();
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
    // Save as plain JSON array — the KV store accepts objects/arrays
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
