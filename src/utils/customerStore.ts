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

export async function loadProfilesFromKV(): Promise<CustomerProfile[]> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return loadProfilesLocal();
  try {
    const res = await fetch(`${apiUrl}/kvstore/${KV_KEY}`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    if (res.status === 404) return [];
    return loadProfilesLocal();
  } catch {
    return loadProfilesLocal();
  }
}

export async function saveProfilesToKV(profiles: CustomerProfile[]): Promise<void> {
  const apiUrl = getApiUrl();
  if (!apiUrl) { saveProfilesLocal(profiles); return; }
  try {
    await fetch(`${apiUrl}/kvstore/${KV_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profiles),
    });
  } catch {}
  saveProfilesLocal(profiles);
}

// localStorage fallback for local dev or when KV is unavailable
const STORAGE_KEY = 'dub_customer_profiles';

function loadProfilesLocal(): CustomerProfile[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProfilesLocal(profiles: CustomerProfile[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {}
}

// Synchronous versions for components that need immediate reads (use cached state)
export function loadProfiles(): CustomerProfile[] {
  return loadProfilesLocal();
}

export function saveProfiles(profiles: CustomerProfile[]): void {
  saveProfilesLocal(profiles);
  saveProfilesToKV(profiles);
}
