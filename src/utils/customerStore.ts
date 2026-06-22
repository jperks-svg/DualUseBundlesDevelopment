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
    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}/kvstore/${KV_KEY}`);
        if (res.ok) {
          const data = await res.json();
          profileCache = Array.isArray(data) ? data : [];
          return profileCache;
        }
      } catch {}
    }
    // Fallback: try localStorage
    profileCache = loadFromLocalStorage();
    return profileCache;
  })();

  return loadPromise;
}

export async function saveProfilesToKV(profiles: CustomerProfile[]): Promise<void> {
  profileCache = profiles;
  saveToLocalStorage(profiles);

  const apiUrl = getApiUrl();
  if (!apiUrl) return;
  try {
    await fetch(`${apiUrl}/kvstore/${KV_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profiles),
    });
  } catch {}
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
  // Fire KV save in background
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
