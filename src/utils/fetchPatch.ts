// No-op — fetch cannot be patched (proxy locks it as read-only).
// KV store reads are handled directly in customerStore.ts using
// ReadableStream reader to access the pre-parsed body.
export {};
