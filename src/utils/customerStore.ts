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

// Try multiple XHR URL patterns to find the right KV endpoint
function kvReadXHR(): Promise<CustomerProfile[] | null> {
  return new Promise((resolve) => {
    const apiUrl = getApiUrl();
    if (!apiUrl) { resolve(null); return; }
    const packId = getPackId();
    const origin = new URL(apiUrl).origin;

    // Try multiple path patterns the proxy might be rewriting to
    const urls = [
      `${origin}/api/v1/a/${packId}/kvstore/${KV_KEY}`,
      `${origin}/api/v1/p/${packId}/kvstore/${KV_KEY}`,
      `${origin}/api/v1/packs/${packId}/kvstore/${KV_KEY}`,
      `${apiUrl}/kvstore/${KV_KEY}`,
    ];

    let completed = 0;
    let resolved = false;

    for (const url of urls) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.withCredentials = true;
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.onload = () => {
        completed++;
        if (resolved) return;
        console.log('[DUB] XHR try:', url, 'status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (Array.isArray(data)) {
              resolved = true;
              console.log('[DUB] XHR success from:', url, 'count:', data.length);
              resolve(data);
              return;
            }
          } catch {}
        }
        if (completed === urls.length && !resolved) resolve(null);
      };
      xhr.onerror = () => {
        completed++;
        if (completed === urls.length && !resolved) resolve(null);
      };
      xhr.send();
    }
  });
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
    const data = await kvReadXHR();
    if (data && data.length > 0) {
      profileCache = data;
      console.log('[DUB] Loaded', data.length, 'projects');
      return data;
    }

    console.log('[DUB] No projects found');
    profileCache = [];
    return profileCache;
  })();

  return loadPromise;
}

export async function saveProfilesToKV(profiles: CustomerProfile[]): Promise<void> {
  profileCache = profiles;
  loadPromise = null;

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
  const apiUrl = getApiUrl();
  if (apiUrl) {
    fetch(`${apiUrl}/kvstore/${KV_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profiles),
    }).catch(() => {});
  }
}
