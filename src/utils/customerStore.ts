export interface CustomerProfile {
  id: string;
  name: string;
  company: string;
  sourceIds: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const KV_KEY = 'projects_data';

function getApiUrl(): string {
  return (window as any).CRIBL_API_URL || '';
}

// Read from KV store using fetch. The Cribl service worker intercepts
// all requests (including XHR), so we can't bypass it. Instead, we
// save data as text/plain so the SW won't JSON.parse the response body.
async function kvRead(): Promise<CustomerProfile[] | null> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;

  const url = `${apiUrl}/kvstore/${KV_KEY}`;
  console.log('[DUB] Reading from:', url);
  try {
    const res = await fetch(url);
    console.log('[DUB] KV read status:', res.status);
    if (res.status === 404) return null;
    if (!res.ok) return null;

    // Try to read as text
    let text: string;
    try {
      text = await res.text();
    } catch (e) {
      console.warn('[DUB] .text() failed:', e);
      return null;
    }

    console.log('[DUB] KV responseText length:', text.length, 'first 120:', text.slice(0, 120));

    // If text is corrupted ("[object Object]"), try to recover
    if (!text || text.startsWith('[object') || text === 'undefined' || text === 'null') {
      console.warn('[DUB] KV response corrupted or empty');
      return null;
    }

    // Valid JSON?
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) return data;
      // Maybe it's wrapped: {profiles: [...]}
      if (data && Array.isArray(data.profiles)) return data.profiles;
    } catch (e) {
      console.warn('[DUB] KV JSON parse failed:', e);
    }

    return null;
  } catch (err) {
    console.warn('[DUB] KV read error:', err);
    return null;
  }
}

// Save to KV store. Try both application/json and text/plain to find
// a format that the server accepts AND the service worker doesn't corrupt on read.
async function kvWrite(profiles: CustomerProfile[]): Promise<boolean> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return false;

  const jsonBody = JSON.stringify(profiles);

  // Strategy 1: Save as text/plain body (SW might not JSON.parse text/plain responses)
  const textUrl = `${apiUrl}/kvstore/${KV_KEY}`;
  console.log('[DUB] Saving', profiles.length, 'projects (text/plain) to:', textUrl);
  try {
    const res = await fetch(textUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: jsonBody,
    });
    console.log('[DUB] KV save (text/plain) response:', res.status);
    if (res.ok) return true;
  } catch (err) {
    console.warn('[DUB] KV save (text/plain) error:', err);
  }

  // Strategy 2: Fallback to application/json
  console.log('[DUB] Trying application/json save');
  try {
    const res = await fetch(textUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: jsonBody,
    });
    console.log('[DUB] KV save (json) response:', res.status);
    if (res.ok) return true;
  } catch (err) {
    console.warn('[DUB] KV save (json) error:', err);
  }

  return false;
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
    const data = await kvRead();
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
  await kvWrite(profiles);
}

// Synchronous API
export function loadProfiles(): CustomerProfile[] {
  if (profileCache !== null) return profileCache;
  return [];
}

export function saveProfiles(profiles: CustomerProfile[]): void {
  profileCache = profiles;
  kvWrite(profiles).catch(() => {});
}
