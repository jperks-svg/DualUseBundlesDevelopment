// Minimal tar + gzip implementation for building .crbl packs in the browser.
// A .crbl file is just a .tgz (gzipped tar) with a specific internal structure.

function createTarHeader(filename: string, size: number): Uint8Array {
  const header = new Uint8Array(512);
  const encoder = new TextEncoder();

  // Name (0-99)
  const nameBytes = encoder.encode(filename);
  header.set(nameBytes.subarray(0, 100), 0);

  // Mode (100-107) - 0644
  header.set(encoder.encode('0000644\0'), 100);

  // UID (108-115)
  header.set(encoder.encode('0001000\0'), 108);

  // GID (116-123)
  header.set(encoder.encode('0001000\0'), 116);

  // Size (124-135) - octal
  header.set(encoder.encode(size.toString(8).padStart(11, '0') + '\0'), 124);

  // Mtime (136-147)
  const mtime = Math.floor(Date.now() / 1000);
  header.set(encoder.encode(mtime.toString(8).padStart(11, '0') + '\0'), 136);

  // Checksum placeholder (148-155) - spaces for calculation
  header.set(encoder.encode('        '), 148);

  // Type flag (156) - '0' = regular file, '5' = directory
  header[156] = filename.endsWith('/') ? 53 : 48; // '5' or '0'

  // USTAR magic (257-262)
  header.set(encoder.encode('ustar\0'), 257);

  // Version (263-264)
  header.set(encoder.encode('00'), 263);

  // Calculate checksum
  let checksum = 0;
  for (let i = 0; i < 512; i++) checksum += header[i];
  header.set(encoder.encode(checksum.toString(8).padStart(6, '0') + '\0 '), 148);

  return header;
}

function addFileToTar(parts: Uint8Array[], filename: string, content: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  parts.push(createTarHeader(filename, data.length));
  parts.push(data);
  // Pad to 512-byte boundary
  const remainder = data.length % 512;
  if (remainder > 0) parts.push(new Uint8Array(512 - remainder));
}

function addDirToTar(parts: Uint8Array[], dirname: string) {
  parts.push(createTarHeader(dirname.endsWith('/') ? dirname : dirname + '/', 0));
}

function finalizeTar(parts: Uint8Array[]): Uint8Array {
  // Two 512-byte zero blocks to end the archive
  parts.push(new Uint8Array(1024));
  const totalSize = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

async function gzipCompress(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream !== 'undefined') {
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(data);
    writer.close();
    const reader = cs.readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const totalSize = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
  // Fallback: return uncompressed tar if CompressionStream not available
  return data;
}

export interface PackFile {
  path: string;
  content: string;
}

export interface PackMeta {
  name: string;
  version: string;
  displayName: string;
  description: string;
}

export async function buildSearchPack(
  meta: PackMeta,
  searches: { id: string; name: string; description: string; query: string; earliest: string; latest: string }[],
): Promise<Blob> {
  const parts: Uint8Array[] = [];

  const packageJson = JSON.stringify({
    name: meta.name,
    version: meta.version,
    displayName: meta.displayName,
    description: meta.description,
    type: 'search',
    author: 'Dual-Use Resource Bundles',
  }, null, 2);

  addFileToTar(parts, 'package.json', packageJson);
  addDirToTar(parts, 'default/');
  addDirToTar(parts, 'default/saved-searches/');

  for (const search of searches) {
    const searchYaml = [
      `id: "${search.id}"`,
      `name: "${search.name}"`,
      `description: "${search.description.replace(/"/g, '\\"')}"`,
      `query: |`,
      ...search.query.split('\n').map(line => `  ${line}`),
      `earliest: "${search.earliest}"`,
      `latest: "${search.latest}"`,
      '',
    ].join('\n');
    addFileToTar(parts, `default/saved-searches/${search.id}.yml`, searchYaml);
  }

  const tar = finalizeTar(parts);
  const compressed = await gzipCompress(tar);
  return new Blob([compressed], { type: 'application/gzip' });
}

export async function buildStreamPack(
  meta: PackMeta,
  pipeline: {
    keepFields: string[];
    removeFields: string[];
    enrichments?: { name: string; criblFunction: string; addedFields: string[] }[];
  },
): Promise<Blob> {
  const parts: Uint8Array[] = [];

  const packageJson = JSON.stringify({
    name: meta.name,
    version: meta.version,
    displayName: meta.displayName,
    description: meta.description,
    type: 'stream',
    author: 'Dual-Use Resource Bundles',
  }, null, 2);

  addFileToTar(parts, 'package.json', packageJson);
  addDirToTar(parts, 'default/');
  addDirToTar(parts, 'default/pipelines/');
  addDirToTar(parts, `default/pipelines/${meta.name}/`);

  const functions: any[] = [];

  if (pipeline.removeFields.length > 0) {
    functions.push({
      id: 'field_removal',
      filter: 'true',
      conf: { remove: pipeline.removeFields },
      description: `Remove ${pipeline.removeFields.length} fields not needed by selected detections`,
    });
  }

  if (pipeline.enrichments && pipeline.enrichments.length > 0) {
    for (const e of pipeline.enrichments) {
      functions.push({
        id: `enrich_${e.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        filter: 'true',
        conf: { function: e.criblFunction, addedFields: e.addedFields },
        description: e.name,
      });
    }
  }

  const pipelineConf = JSON.stringify({
    id: meta.name,
    functions,
    description: meta.description,
  }, null, 2);

  addFileToTar(parts, `default/pipelines/${meta.name}/conf.json`, pipelineConf);

  // Also include a human-readable summary
  let readme = `# ${meta.displayName}\n\n${meta.description}\n\n`;
  readme += `## Fields to Keep (${pipeline.keepFields.length})\n\n`;
  pipeline.keepFields.forEach(f => { readme += `- ${f}\n`; });
  readme += `\n## Fields to Remove (${pipeline.removeFields.length})\n\n`;
  pipeline.removeFields.forEach(f => { readme += `- ${f}\n`; });
  if (pipeline.enrichments && pipeline.enrichments.length > 0) {
    readme += `\n## Enrichments (${pipeline.enrichments.length})\n\n`;
    pipeline.enrichments.forEach(e => { readme += `- ${e.name} (${e.criblFunction}): adds ${e.addedFields.join(', ')}\n`; });
  }
  addFileToTar(parts, 'README.md', readme);

  const tar = finalizeTar(parts);
  const compressed = await gzipCompress(tar);
  return new Blob([compressed], { type: 'application/gzip' });
}
