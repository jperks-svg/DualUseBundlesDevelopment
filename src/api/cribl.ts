export function apiUrl(): string {
  return (window as any).CRIBL_API_URL || '';
}

export async function runQuery(kql: string, earliest: string, latest: string, limit = 10000): Promise<any[]> {
  const base = apiUrl();
  if (!base) throw new Error('Not running inside Cribl Search — this feature requires the Cribl Search App environment.');
  const createRes = await fetch(`${base}/m/default_search/search/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: kql, earliest, latest, limit }),
  });
  if (!createRes.ok) {
    const body = await createRes.text().catch(() => '');
    throw new Error(`Failed to create search job (${createRes.status}): ${body}`);
  }
  const createBody = await createRes.json();
  const id = createBody.id || createBody.jobId || createBody.items?.[0]?.id;
  if (!id) {
    throw new Error(`Search job created but no ID returned. Response: ${JSON.stringify(createBody).slice(0, 300)}`);
  }

  let status = 'running';
  let errorMsg = '';
  while (status === 'running') {
    await new Promise(r => setTimeout(r, 1000));
    const pollRes = await fetch(`${base}/m/default_search/search/jobs/${id}`);
    const job = await pollRes.json();
    status = job.status || job.state;
    if (status === 'failed' || status === 'error') {
      errorMsg = job.error || job.message || 'Search job failed';
      break;
    }
    if (status === 'finished' || status === 'done' || status === 'completed') {
      break;
    }
  }

  if (status === 'failed' || status === 'error') {
    throw new Error(`Search job failed: ${errorMsg}`);
  }

  const resultsRes = await fetch(`${base}/m/default_search/search/jobs/${id}/results?output=json`);
  if (!resultsRes.ok) return [];
  const text = await resultsRes.text();
  return text.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
}
