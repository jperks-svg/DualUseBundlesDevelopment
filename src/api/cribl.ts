export function apiUrl(): string {
  return (window as any).CRIBL_API_URL || '';
}

export function isMetadataRow(obj: any): boolean {
  return obj && typeof obj === 'object' && ('isFinished' in obj || 'job' in obj || 'persistedEventCount' in obj);
}

export function parseNdjsonResults(text: string): { finished: boolean; rows: any[] } {
  const lines = text.trim().split('\n').filter(Boolean);
  const rows: any[] = [];
  let finished = false;

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (isMetadataRow(obj)) {
        if (obj.isFinished === true) finished = true;
      } else {
        rows.push(obj);
      }
    } catch { /* skip unparseable lines */ }
  }

  return { finished, rows };
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

  // Poll until job finishes
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const resultsRes = await fetch(`${base}/m/default_search/search/jobs/${id}/results?output=json&offset=0&count=${limit}`);
    if (!resultsRes.ok) continue;

    const text = await resultsRes.text();
    if (!text.trim()) continue;

    const { finished, rows } = parseNdjsonResults(text);
    if (!finished) continue;
    return rows;
  }

  throw new Error('Search job timed out after 60 seconds');
}
