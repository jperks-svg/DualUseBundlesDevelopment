// Diagnostic patch: inspect what the Cribl fetch proxy puts on the Response.
// This file is imported first to capture info about the proxy's behavior.

const origFetch = window.fetch;
(window as any).__dubOrigFetch = origFetch;

(window as any).fetch = async function(input: any, init?: any) {
  const res = await origFetch.call(window, input, init);
  const args = [input, init];
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

  if (url.includes('/kvstore/')) {
    console.log('[DUB-diag] KV response object keys:', Object.getOwnPropertyNames(res));
    console.log('[DUB-diag] KV response type:', Object.prototype.toString.call(res));
    console.log('[DUB-diag] KV response body type:', res.body ? Object.prototype.toString.call(res.body) : 'null');

    // Check for non-standard properties the proxy might add
    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(res))) {
      if (!['constructor', 'type', 'url', 'redirected', 'status', 'ok', 'statusText', 'headers', 'body', 'bodyUsed', 'clone', 'text', 'json', 'blob', 'arrayBuffer', 'formData', 'bytes'].includes(key)) {
        console.log('[DUB-diag] Non-standard proto key:', key, '=', (res as any)[key]);
      }
    }

    // Check own properties
    const ownKeys = Object.getOwnPropertyNames(res);
    for (const key of ownKeys) {
      const val = (res as any)[key];
      const desc = typeof val === 'object' ? JSON.stringify(val)?.slice(0, 100) : String(val).slice(0, 100);
      console.log('[DUB-diag] Own prop:', key, '=', desc);
    }

    // Check if it's actually a real Response or a custom class
    console.log('[DUB-diag] instanceof Response:', res instanceof Response);
    console.log('[DUB-diag] constructor name:', res.constructor?.name);
  }

  return res;
};

console.log('[DUB] Diagnostic fetch wrapper installed');
export {};
