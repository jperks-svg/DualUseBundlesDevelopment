export interface AppSettings {
  [key: string]: unknown;
}

const API_URL = () => (window as any).CRIBL_API_URL || '';

export async function loadSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_URL()}/kvstore/settings`);
  if (!res.ok) return {};
  return res.json();
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await fetch(`${API_URL()}/kvstore/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
}
