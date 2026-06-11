export function apiUrl(): string {
  return (window as any).CRIBL_API_URL || '';
}

export async function runQuery(kql: string, earliest: string, latest: string, limit = 10000): Promise<any[]> {
  const base = apiUrl();
  const createRes = await fetch(`${base}/m/default_search/search/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: kql, earliest, latest, limit }),
  });
  if (!createRes.ok) throw new Error('Failed to create search job');
  const { id } = await createRes.json();

  let status = 'running';
  while (status === 'running') {
    await new Promise(r => setTimeout(r, 1000));
    const pollRes = await fetch(`${base}/m/default_search/search/jobs/${id}`);
    const job = await pollRes.json();
    status = job.status;
  }

  const resultsRes = await fetch(`${base}/m/default_search/search/jobs/${id}/results?output=json`);
  if (!resultsRes.ok) return [];
  const text = await resultsRes.text();
  return text.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
}
