export interface CustomerProfile {
  id: string;
  name: string;
  company: string;
  sourceIds: string[];
  droppedFields?: Record<string, string[]>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const KV_KEY = 'projects_data';

function getApiUrl(): string {
  return (window as any).CRIBL_API_URL || '';
}

async function kvRead(): Promise<CustomerProfile[] | null> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/kvstore/${KV_KEY}`);
    if (res.status === 404) return null;
    if (!res.ok) return null;

    const text = await res.text();
    if (!text || text.startsWith('[object')) return null;

    const data = JSON.parse(text);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function kvWrite(profiles: CustomerProfile[]): Promise<void> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return;

  // text/plain prevents the proxy from JSON-parsing the response on read
  await fetch(`${apiUrl}/kvstore/${KV_KEY}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(profiles),
  });
}

// In-memory cache — survives route changes within the SPA session
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
    profileCache = data && data.length > 0 ? data : [];
    return profileCache;
  })();

  return loadPromise;
}

export async function saveProfilesToKV(profiles: CustomerProfile[]): Promise<void> {
  profileCache = profiles;
  loadPromise = null;
  await kvWrite(profiles);
}

export function loadProfiles(): CustomerProfile[] {
  if (profileCache !== null) return profileCache;
  return [];
}

export function saveProfiles(profiles: CustomerProfile[]): void {
  profileCache = profiles;
  kvWrite(profiles).catch(() => {});
}
