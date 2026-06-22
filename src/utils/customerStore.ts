export interface CustomerProfile {
  id: string;
  name: string;
  company: string;
  sourceIds: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'dub_customer_profiles';

export function loadProfiles(): CustomerProfile[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveProfiles(profiles: CustomerProfile[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {}
}

export function createProfile(name: string, company: string): CustomerProfile {
  const profile: CustomerProfile = {
    id: `cust_${Date.now().toString(36)}`,
    name,
    company,
    sourceIds: [],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const profiles = loadProfiles();
  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
}

export function updateProfile(id: string, updates: Partial<Omit<CustomerProfile, 'id' | 'createdAt'>>): CustomerProfile | null {
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx === -1) return null;
  profiles[idx] = { ...profiles[idx], ...updates, updatedAt: new Date().toISOString() };
  saveProfiles(profiles);
  return profiles[idx];
}

export function deleteProfile(id: string): void {
  const profiles = loadProfiles().filter(p => p.id !== id);
  saveProfiles(profiles);
}
