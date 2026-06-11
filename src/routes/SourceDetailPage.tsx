import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dataSources } from '../data/sources';
import { fieldMatrix } from '../data/fields';
import { routingBlueprints } from '../data/routing';
import { securityDetections as secDetData } from '../data/securityDetections';
import { observabilityDetections as obsDetData } from '../data/observabilityDetections';
import { enrichments as enrichmentData } from '../data/enrichments';
import DashboardDeployModal from '../components/DashboardDeployModal';


const tag = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--cds-radius-sm)',
  fontSize: 'var(--cds-font-size-xs)', fontWeight: 500, background: bg, color,
});

const card: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: 20, boxShadow: 'var(--cds-shadow-sm)',
};

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: active ? 600 : 400,
  color: active ? 'var(--cds-brand-teal)' : 'var(--cds-color-fg-muted)',
  borderBottom: active ? '2px solid var(--cds-brand-teal)' : '2px solid transparent',
});

const statCard: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: '16px 20px', textAlign: 'center',
  boxShadow: 'var(--cds-shadow-sm)',
};

const btnPrimary: React.CSSProperties = {
  padding: '6px 14px', border: 'none', borderRadius: 'var(--cds-radius-md)',
  background: 'var(--cds-brand-teal)', color: '#fff', cursor: 'pointer',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: 500,
};

const btnSecondary: React.CSSProperties = {
  padding: '6px 14px', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)',
  background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg-muted)', cursor: 'pointer',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: 500,
};

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SourceDetailPage() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSample, setExpandedSample] = useState(false);
  const [expandedDetection, setExpandedDetection] = useState<string | null>(null);
  const [detectionSubTab, setDetectionSubTab] = useState<'security' | 'observability'>('security');
  const [enrichmentSubTab, setEnrichmentSubTab] = useState<'stream' | 'search'>('stream');
  const [expandedImpl, setExpandedImpl] = useState<string | null>(null);

  // Selection state
  const [enabledSecDetections, setEnabledSecDetections] = useState<Set<string>>(new Set());
  const [enabledObsDetections, setEnabledObsDetections] = useState<Set<string>>(new Set());
  const [enabledStreamEnrichments, setEnabledStreamEnrichments] = useState<Set<string>>(new Set());
  const [enabledSearchEnrichments, setEnabledSearchEnrichments] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployStatus, setDeployStatus] = useState<string[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployDataset, setDeployDataset] = useState('');
  const [showDashboardModal, setShowDashboardModal] = useState(false);

  // Find source across all categories
  const source = dataSources.flatMap((c: any) => c.sources).find((s: any) => s.id === sourceId);
  if (!source) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--cds-color-fg-muted)' }}>Source not found</div>;

  const routing = (routingBlueprints as any)[sourceId!] || null;
  const secDetections: any[] = (secDetData as any)[sourceId!] || [];
  const obsDetections: any[] = (obsDetData as any)[sourceId!] || [];
  const enrichments = (enrichmentData as any)[sourceId!] || null;
  const fields: any[] = (fieldMatrix as any)[sourceId!] || [];
  const hasDetections = secDetections.length > 0 || obsDetections.length > 0;
  const totalEnabled = enabledSecDetections.size + enabledObsDetections.size;

  // Detection toggle helpers
  function toggleSecDetection(id: string) {
    setEnabledSecDetections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleObsDetection(id: string) {
    setEnabledObsDetections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function selectAllSec() { setEnabledSecDetections(new Set(secDetections.map((d: any) => d.id))); }
  function selectAllObs() { setEnabledObsDetections(new Set(obsDetections.map((d: any) => d.id))); }
  function clearAllSec() { setEnabledSecDetections(new Set()); }
  function clearAllObs() { setEnabledObsDetections(new Set()); }

  // Enrichment toggle helpers
  function toggleStreamEnrichment(name: string) {
    setEnabledStreamEnrichments(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  }
  function toggleSearchEnrichment(name: string) {
    setEnabledSearchEnrichments(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  }
  function selectAllStreamEnrichments() { if (enrichments) setEnabledStreamEnrichments(new Set(enrichments.streamTime.map((e: any) => e.name))); }
  function selectAllSearchEnrichments() { if (enrichments) setEnabledSearchEnrichments(new Set(enrichments.searchTime.map((e: any) => e.name))); }
  function clearAllStreamEnrichments() { setEnabledStreamEnrichments(new Set()); }
  function clearAllSearchEnrichments() { setEnabledSearchEnrichments(new Set()); }

  // Field analysis based on enabled detections
  const fieldAnalysis = useMemo(() => {
    const secRequired = new Set<string>();
    const obsRequired = new Set<string>();
    secDetections.filter((d: any) => enabledSecDetections.has(d.id)).forEach((d: any) => d.requiredFields.forEach((f: string) => secRequired.add(f)));
    obsDetections.filter((d: any) => enabledObsDetections.has(d.id)).forEach((d: any) => d.requiredFields.forEach((f: string) => obsRequired.add(f)));
    const allRequired = new Set([...secRequired, ...obsRequired]);
    const notNeeded = fields.map((f: any) => f.field).filter((f: string) => !allRequired.has(f));
    return { secRequired, obsRequired, allRequired, notNeeded };
  }, [enabledSecDetections, enabledObsDetections, secDetections, obsDetections, fields]);

  // Client-side YAML generation
  function generateSearchPackYaml(): string {
    const queries: any[] = [];
    [...secDetections.filter((d: any) => enabledSecDetections.has(d.id)),
     ...obsDetections.filter((d: any) => enabledObsDetections.has(d.id))]
      .forEach((d: any) => {
        if (d.criblSearchQueries) {
          d.criblSearchQueries.forEach((q: any) => queries.push({ ...q, detection: d.name, severity: d.severity || d.category }));
        }
      });
    let yaml = `# Search Pack for ${sourceId}\n# Generated: ${new Date().toISOString()}\n# Detections: ${totalEnabled}\n\nsaved_queries:\n`;
    queries.forEach(q => {
      yaml += `  - name: "${q.name}"\n    description: "${q.description}"\n    detection: "${q.detection}"\n    severity: "${q.severity}"\n    query: |\n      ${q.query.split('\n').join('\n      ')}\n\n`;
    });
    return yaml;
  }

  function generateStreamPackYaml(): string {
    const requiredFields = [...fieldAnalysis.allRequired].sort();
    const droppableFields = fieldAnalysis.notNeeded.sort();
    let yaml = `# Stream Pack for ${sourceId}\n# Generated: ${new Date().toISOString()}\n# Required fields: ${requiredFields.length}\n# Droppable fields: ${droppableFields.length}\n\npipeline:\n  functions:\n    - id: field_filter\n      description: "Keep only fields required by enabled detections"\n      keep_fields:\n`;
    requiredFields.forEach(f => { yaml += `        - ${f}\n`; });
    yaml += `\n    - id: field_removal\n      description: "Remove fields not needed by any detection"\n      remove_fields:\n`;
    droppableFields.forEach(f => { yaml += `        - ${f}\n`; });
    if (enabledStreamEnrichments.size > 0 && enrichments) {
      yaml += `\nenrichments:\n`;
      enrichments.streamTime.filter((e: any) => enabledStreamEnrichments.has(e.name)).forEach((e: any) => {
        yaml += `  - name: "${e.name}"\n    function: "${e.criblFunction}"\n    added_fields: [${e.addedFields.join(', ')}]\n\n`;
      });
    }
    return yaml;
  }

  function exportSearchPack() {
    const yaml = generateSearchPackYaml();
    downloadBlob(yaml, `${sourceId}-search-pack.yml`, 'text/yaml');
    setExportStatus('Search Pack downloaded');
  }

  function exportStreamPack() {
    const yaml = generateStreamPackYaml();
    downloadBlob(yaml, `${sourceId}-stream-pack.yml`, 'text/yaml');
    setExportStatus('Stream Pack downloaded');
  }

  async function deployToCriblSearch(dataset: string) {
    const apiUrl = (window as any).CRIBL_API_URL || '';
    if (!apiUrl) { setDeployStatus(['Error: Not running inside Cribl Search (CRIBL_API_URL not set)']); return; }
    if (!dataset.trim()) { setDeployStatus(['Error: No dataset specified']); return; }

    setDeploying(true);
    setDeployStatus([`Starting deployment to dataset: ${dataset.trim()}...`]);
    const log = (msg: string) => setDeployStatus(prev => [...prev, msg]);
    const baseSearchApi = `${apiUrl}/m/default_search/search/saved`;

    const selectedDets = [
      ...secDetections.filter((d: any) => enabledSecDetections.has(d.id)),
      ...obsDetections.filter((d: any) => enabledObsDetections.has(d.id))
    ];

    let savedCount = 0;
    let errorCount = 0;

    for (const det of selectedDets) {
      if (!det.criblSearchQueries) continue;
      for (const q of det.criblSearchQueries) {
        const savedSearchId = `dub_${sourceId}_${det.id}_${savedCount}`.replace(/[^a-zA-Z0-9_]/g, '_');
        const cleanName = `DUB ${det.name} - ${q.name}`.replace(/[^a-zA-Z0-9 _-]/g, '').substring(0, 256);
        const body = {
          id: savedSearchId,
          name: cleanName,
          description: `[${sourceId}] [${det.severity || det.category}] ${q.description || det.objective}`,
          query: q.query.replace(/\$DATASET/g, dataset.trim()),
          earliest: '-24h',
          latest: 'now',
        };

        try {
          const res = await fetch(`${baseSearchApi}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (res.ok) {
            savedCount++;
            log(`+ Saved search: ${cleanName}`);
          } else if (res.status === 409) {
            const updateRes = await fetch(`${baseSearchApi}/${savedSearchId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            if (updateRes.ok) {
              savedCount++;
              log(`~ Updated: ${cleanName}`);
            } else {
              errorCount++;
              log(`! Failed to update ${cleanName}: ${updateRes.status}`);
            }
          } else {
            errorCount++;
            const errText = await res.text().catch(() => '');
            const errMsg = errText.length < 200 ? errText : errText.substring(0, 200);
            log(`! Failed: ${cleanName} (${res.status}) ${errMsg}`);
          }
        } catch (err: any) {
          errorCount++;
          log(`! Error: ${cleanName} — ${err.message}`);
        }
      }
    }

    log('');
    log(`Deployment complete: ${savedCount} items deployed, ${errorCount} errors`);
    setDeploying(false);
  }


  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'fields', label: `Fields (${fields.length})` },
    ...(hasDetections ? [{ id: 'detections', label: `Detections (${secDetections.length + obsDetections.length})` }] : []),
    ...(enrichments ? [{ id: 'enrichments', label: `Enrichments (${(enrichments.streamTime?.length || 0) + (enrichments.searchTime?.length || 0)})` }] : []),
    ...(routing ? [{ id: 'routing', label: 'Routing' }] : []),
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link to="/" style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', textDecoration: 'none', marginBottom: 8, display: 'inline-block' }}>
          &larr; Back to Catalog
        </Link>
        <h2 style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>{source.name}</h2>
        <p style={{ fontSize: 'var(--cds-font-size-base)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.6 }}>{source.description}</p>
      </div>


      {/* Export action bar */}
      {(totalEnabled > 0 || enabledStreamEnrichments.size > 0 || enabledSearchEnrichments.size > 0) && (
        <div style={{
          background: 'var(--cds-color-bg-subtle)', border: '1px solid var(--cds-brand-teal)', borderRadius: 'var(--cds-radius-lg)',
          padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg)' }}>Export:</span>
            {totalEnabled > 0 && <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{totalEnabled} detection{totalEnabled !== 1 ? 's' : ''}</span>}
            {enabledStreamEnrichments.size > 0 && <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>{enabledStreamEnrichments.size} stream enrichment{enabledStreamEnrichments.size !== 1 ? 's' : ''}</span>}
            {enabledSearchEnrichments.size > 0 && <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>{enabledSearchEnrichments.size} search enrichment{enabledSearchEnrichments.size !== 1 ? 's' : ''}</span>}
            {exportStatus && <span style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-brand-teal)' }}>{exportStatus}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnSecondary} onClick={() => setShowExportModal(true)}>Export Packs</button>
            <button style={{ ...btnPrimary, background: 'var(--cds-color-primary)' }} onClick={() => setShowDeployModal(true)}>Deploy to Cribl Search</button>
            <button style={{ ...btnPrimary, background: '#6366f1' }} onClick={() => setShowDashboardModal(true)}>Deploy Dashboards</button>
          </div>
        </div>
      )}

      {/* Deploy modal */}
      {showDeployModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => !deploying && setShowDeployModal(false)}>
          <div style={{ background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-xl)', padding: 32, maxWidth: 650, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 'var(--cds-font-size-lg)', fontWeight: 600 }}>Deploy to Cribl Search</h3>
              {!deploying && <button onClick={() => setShowDeployModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--cds-color-fg-muted)' }}>&times;</button>}
            </div>

            {deployStatus.length === 0 ? (
              <div>
                <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 16 }}>
                  Deploy selected detections as <strong>Saved Searches</strong> directly into Cribl Search.
                </p>
                <div style={{ ...card, marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>
                    Target Dataset
                  </label>
                  <p style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 8 }}>
                    Enter the Cribl Search dataset name these searches should query against.
                  </p>
                  <input
                    type="text"
                    value={deployDataset}
                    onChange={e => setDeployDataset(e.target.value)}
                    placeholder="e.g. my_firewall_logs, pan_traffic"
                    style={{ padding: '10px 12px', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)', fontSize: 'var(--cds-font-size-sm)', width: '100%', background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)' }}
                  />
                </div>
                <div style={{ ...card, marginBottom: 16 }}>
                  <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 8 }}>What will be deployed:</h4>
                  <ul style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', paddingLeft: 20, lineHeight: 2 }}>
                    <li><strong>{enabledSecDetections.size}</strong> security detections</li>
                    <li><strong>{enabledObsDetections.size}</strong> observability detections</li>
                    <li>Total queries: ~{
                      [...secDetections.filter((d: any) => enabledSecDetections.has(d.id)),
                       ...obsDetections.filter((d: any) => enabledObsDetections.has(d.id))]
                        .reduce((sum: number, d: any) => sum + (d.criblSearchQueries?.length || 0), 0)
                    } saved searches</li>
                  </ul>
                  <p style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginTop: 12, fontStyle: 'italic' }}>
                    Searches are created as disabled by default. All prefixed with DUB for easy identification.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button style={btnSecondary} onClick={() => setShowDeployModal(false)}>Cancel</button>
                  <button style={{ ...btnPrimary, background: 'var(--cds-color-primary)' }} onClick={() => { setDeployStatus([]); deployToCriblSearch(deployDataset); }} disabled={totalEnabled === 0 || !deployDataset.trim()}>
                    Deploy Now
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: 'var(--cds-color-bg-muted)', borderRadius: 'var(--cds-radius-md)', padding: 16, maxHeight: 400, overflowY: 'auto', fontFamily: 'var(--cds-font-mono)', fontSize: 'var(--cds-font-size-xs)', lineHeight: 1.8 }}>
                  {deployStatus.map((line, i) => (
                    <div key={i} style={{ color: line.startsWith('!') ? 'var(--cds-color-danger)' : line.startsWith('+') ? 'var(--cds-color-success)' : line.startsWith('~') ? 'var(--cds-color-warning)' : 'var(--cds-color-fg-muted)' }}>
                      {line}
                    </div>
                  ))}
                  {deploying && <div style={{ color: 'var(--cds-brand-teal)' }}>Deploying...</div>}
                </div>
                {!deploying && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button style={btnSecondary} onClick={() => { setShowDeployModal(false); setDeployStatus([]); }}>Close</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowExportModal(false)}>
          <div style={{ background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-xl)', padding: 32, maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 'var(--cds-font-size-lg)', fontWeight: 600 }}>Export Cribl Packs</h3>
              <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--cds-color-fg-muted)' }}>&times;</button>
            </div>
            <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 20 }}>
              Export your selections for <strong>{source.name}</strong> as Cribl Packs.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Search Pack */}
              <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 6 }}>Search Pack</h4>
                  <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 8 }}>Saved queries and scheduled searches for Cribl Search.</p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{enabledSecDetections.size} security</span>
                    <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>{enabledObsDetections.size} observability</span>
                    <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>{enabledSearchEnrichments.size} search enrichments</span>
                  </div>
                </div>
                <button style={{ ...btnPrimary, whiteSpace: 'nowrap' }} onClick={exportSearchPack} disabled={totalEnabled === 0 && enabledSearchEnrichments.size === 0}>Download .yml</button>
              </div>
              {/* Stream Pack */}
              <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 6 }}>Stream Pack</h4>
                  <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 8 }}>Pipeline functions, routes, and stream-time enrichments for Cribl Stream.</p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{fieldAnalysis.allRequired.size} fields required</span>
                    <span style={tag('var(--cds-color-danger-subtle)', 'var(--cds-color-danger)')}>{fieldAnalysis.notNeeded.length} droppable</span>
                    <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>{enabledStreamEnrichments.size} stream enrichments</span>
                  </div>
                </div>
                <button style={{ ...btnPrimary, whiteSpace: 'nowrap' }} onClick={exportStreamPack}>Download .yml</button>
              </div>
            </div>
            {(enabledStreamEnrichments.size === 0 && enabledSearchEnrichments.size === 0) && (
              <p style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginTop: 12, textAlign: 'center', fontStyle: 'italic' }}>
                Tip: Select enrichments in the Enrichments tab to include them in your pack exports.
              </p>
            )}
            {exportStatus && <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-brand-teal)', marginTop: 16, textAlign: 'center' }}>{exportStatus}</p>}
          </div>
        </div>
      )}

      {/* Dashboard Deploy Modal */}
      {showDashboardModal && (
        <DashboardDeployModal
          sourceName={source.name}
          sourceId={sourceId!}
          secDetections={secDetections}
          obsDetections={obsDetections}
          enabledSecIds={enabledSecDetections}
          enabledObsIds={enabledObsDetections}
          onClose={() => setShowDashboardModal(false)}
        />
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--cds-color-border-subtle)', marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} style={tabBtn(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-brand-teal)' }}>{source.useCases.length}</div><div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>Use Cases</div></div>
            <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-brand-teal)' }}>{source.personas.length}</div><div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>Personas</div></div>
            <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-brand-teal)' }}>{source.destinations?.length || 0}</div><div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>Destinations</div></div>
            <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-brand-teal)' }}>{source.criblProducts.length}</div><div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>Products</div></div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 10 }}>Use Cases</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {source.useCases.map((uc: string) => <span key={uc} style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{uc}</span>)}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 10 }}>Target Personas</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {source.personas.map((p: string) => <span key={p} style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>{p}</span>)}
            </div>
          </div>

          {source.jobsToBeDone && source.jobsToBeDone.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 12 }}>Jobs to Be Done</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
                {source.jobsToBeDone.map((cat: any) => (
                  <div key={cat.category} style={{ ...card, padding: 16 }}>
                    <h4 style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-brand-teal)', marginBottom: 10 }}>{cat.category}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cat.jobs.map((j: any, i: number) => (
                        <div key={i} style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{ ...tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)'), flexShrink: 0 }}>{j.persona}</span>
                          <span style={{ lineHeight: 1.5 }}>{j.job}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 10 }}>Destinations</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {source.destinations?.map((d: string) => <span key={d} style={tag('var(--cds-color-success-subtle)', 'var(--cds-color-success)')}>{d}</span>)}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 10 }}>Collection Method</h3>
            <p style={{ color: 'var(--cds-color-fg-muted)' }}>{source.collectionMethod}</p>
          </div>

          {source.sampleEvent && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 10 }}>Sample Event</h3>
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedSample(!expandedSample)}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--cds-color-bg-subtle)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}
                >
                  <span>Sample Raw Event</span>
                  <span>{expandedSample ? '▼' : '▶'}</span>
                </button>
                {expandedSample && (
                  <pre style={{ padding: 16, margin: 0, fontSize: 'var(--cds-font-size-xs)', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--cds-font-mono)' }}>
                    {source.sampleEvent}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fields Tab */}
      {activeTab === 'fields' && (
        <div>
          {fields.length === 0 ? (
            <p style={{ color: 'var(--cds-color-fg-muted)' }}>No field data available for this source.</p>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-lg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cds-font-size-sm)' }}>
                <thead>
                  <tr style={{ background: 'var(--cds-color-bg-subtle)' }}>
                    {['Field', 'Description', 'Security', 'Observability', 'Full Fidelity', 'Can Drop', 'Can Mask'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--cds-color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f: any) => (
                    <tr key={f.field} style={{ borderBottom: '1px solid var(--cds-color-border-subtle)' }}>
                      <td style={{ padding: '8px 12px' }}><code style={{ color: 'var(--cds-color-accent)', fontFamily: 'var(--cds-font-mono)', fontSize: 'var(--cds-font-size-xs)' }}>{f.field}</code></td>
                      <td style={{ padding: '8px 12px', color: 'var(--cds-color-fg-muted)' }}>{f.description}</td>
                      <td style={{ padding: '8px 12px', color: f.securitySiem === 'Yes' ? 'var(--cds-color-success)' : 'var(--cds-color-fg-subtle)' }}>{f.securitySiem}</td>
                      <td style={{ padding: '8px 12px', color: f.observability === 'Yes' ? 'var(--cds-color-success)' : 'var(--cds-color-fg-subtle)' }}>{f.observability}</td>
                      <td style={{ padding: '8px 12px', color: f.fullFidelity === 'Yes' ? 'var(--cds-color-success)' : 'var(--cds-color-fg-subtle)' }}>{f.fullFidelity}</td>
                      <td style={{ padding: '8px 12px', color: f.canDrop === 'Yes' ? 'var(--cds-color-danger)' : 'var(--cds-color-fg-subtle)' }}>{f.canDrop}</td>
                      <td style={{ padding: '8px 12px', color: f.canMask === 'Yes' ? 'var(--cds-color-warning)' : 'var(--cds-color-fg-subtle)' }}>{f.canMask}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detections Tab */}
      {activeTab === 'detections' && hasDetections && (
        <div>
          {/* Field requirements summary when detections are selected */}
          {totalEnabled > 0 && (
            <div style={{
              background: 'var(--cds-color-bg-subtle)', border: '1px solid var(--cds-color-border-subtle)', borderRadius: 'var(--cds-radius-lg)',
              padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg)', fontWeight: 600 }}>Field Impact:</span>
              <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{fieldAnalysis.allRequired.size} fields required</span>
              <span style={tag('var(--cds-color-danger-subtle)', 'var(--cds-color-danger)')}>{fieldAnalysis.notNeeded.length} fields can drop</span>
              <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-brand-teal)')}>{fieldAnalysis.secRequired.size} security fields</span>
              <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-accent)')}>{fieldAnalysis.obsRequired.size} observability fields</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setDetectionSubTab('security')} style={{ ...(detectionSubTab === 'security' ? btnPrimary : btnSecondary) }}>
              Security ({enabledSecDetections.size}/{secDetections.length})
            </button>
            <button onClick={() => setDetectionSubTab('observability')} style={{ ...(detectionSubTab === 'observability' ? btnPrimary : btnSecondary) }}>
              Observability ({enabledObsDetections.size}/{obsDetections.length})
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
              {detectionSubTab === 'security' ? (
                <>
                  <button style={{ ...btnSecondary, fontSize: 'var(--cds-font-size-xs)', padding: '4px 10px' }} onClick={selectAllSec}>Select All</button>
                  <button style={{ ...btnSecondary, fontSize: 'var(--cds-font-size-xs)', padding: '4px 10px' }} onClick={clearAllSec}>Clear All</button>
                </>
              ) : (
                <>
                  <button style={{ ...btnSecondary, fontSize: 'var(--cds-font-size-xs)', padding: '4px 10px' }} onClick={selectAllObs}>Select All</button>
                  <button style={{ ...btnSecondary, fontSize: 'var(--cds-font-size-xs)', padding: '4px 10px' }} onClick={clearAllObs}>Clear All</button>
                </>
              )}
              <Link to="/detections" style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-accent)', textDecoration: 'none' }}>
                Open Full Detection Library &rarr;
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {(detectionSubTab === 'security' ? secDetections : obsDetections).map((d: any) => {
              const isEnabled = detectionSubTab === 'security' ? enabledSecDetections.has(d.id) : enabledObsDetections.has(d.id);
              const toggle = detectionSubTab === 'security' ? toggleSecDetection : toggleObsDetection;
              return (
                <div key={d.id} style={{ ...card, borderColor: isEnabled ? 'var(--cds-brand-teal)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggle(d.id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--cds-brand-teal)', cursor: 'pointer' }}
                      />
                      <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, margin: 0 }}>{d.name}</h4>
                    </div>
                    <span style={tag(
                      d.severity === 'Critical' ? 'var(--cds-color-danger-subtle)' : d.severity === 'High' ? 'var(--cds-color-warning-subtle)' : 'var(--cds-color-bg-muted)',
                      d.severity === 'Critical' ? 'var(--cds-color-danger)' : d.severity === 'High' ? 'var(--cds-color-warning)' : 'var(--cds-color-fg-muted)'
                    )}>{d.severity || d.category}</span>
                  </div>
                  <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 10, lineHeight: 1.5 }}>{d.objective}</p>

                  {d.mitre && d.mitre.length > 0 && (
                    <div style={{ marginBottom: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {d.mitre.map((m: string) => {
                        const id = m.split(' - ')[0]?.trim();
                        const url = id ? `https://attack.mitre.org/techniques/${id.replace('.', '/')}/` : null;
                        return (
                          <a key={m} href={url || '#'} target="_blank" rel="noopener noreferrer" style={{ ...tag('var(--cds-color-danger-subtle)', 'var(--cds-color-danger)'), textDecoration: 'none' }}>{m}</a>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                    {d.requiredFields.slice(0, 5).map((f: string) => (
                      <span key={f} style={{ padding: '1px 6px', borderRadius: 'var(--cds-radius-sm)', border: '1px solid var(--cds-color-border)', fontSize: 'var(--cds-font-size-xs)', fontFamily: 'var(--cds-font-mono)', color: 'var(--cds-color-fg-muted)' }}>{f}</span>
                    ))}
                    {d.requiredFields.length > 5 && <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', alignSelf: 'center' }}>+{d.requiredFields.length - 5} more</span>}
                  </div>

                  <button
                    onClick={() => setExpandedDetection(expandedDetection === d.id ? null : d.id)}
                    style={{ ...btnSecondary, fontSize: 'var(--cds-font-size-xs)' }}
                  >
                    {expandedDetection === d.id ? 'Hide Details' : 'Show Details'}
                  </button>

                  {expandedDetection === d.id && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--cds-color-border-subtle)' }}>
                      <div style={{ marginBottom: 10 }}>
                        <strong style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)' }}>Detection Logic:</strong>
                        <p style={{ fontSize: 'var(--cds-font-size-sm)', marginTop: 4, color: 'var(--cds-color-fg-muted)' }}>{d.detectionLogic}</p>
                      </div>
                      {d.falsePositives && (
                        <div style={{ marginBottom: 10 }}>
                          <strong style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)' }}>False Positives:</strong>
                          <ul style={{ fontSize: 'var(--cds-font-size-sm)', paddingLeft: 16, marginTop: 4, color: 'var(--cds-color-fg-muted)' }}>
                            {d.falsePositives.map((fp: string, i: number) => <li key={i}>{fp}</li>)}
                          </ul>
                        </div>
                      )}
                      {d.criblSearchQueries && d.criblSearchQueries.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--cds-color-border-subtle)' }}>
                          <strong style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-brand-teal)' }}>Cribl Search Queries</strong>
                          {d.criblSearchQueries.map((q: any, qi: number) => (
                            <div key={qi} style={{ marginTop: 8, border: '1px solid var(--cds-color-border-subtle)', borderRadius: 'var(--cds-radius-md)', overflow: 'hidden' }}>
                              <div style={{ padding: '8px 12px', background: 'var(--cds-color-bg-subtle)', borderBottom: '1px solid var(--cds-color-border-subtle)' }}>
                                <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600 }}>{q.name}</div>
                                <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)' }}>{q.description}</div>
                              </div>
                              <pre style={{ padding: '8px 12px', margin: 0, fontSize: 'var(--cds-font-size-xs)', lineHeight: 1.5, color: 'var(--cds-brand-teal)', whiteSpace: 'pre-wrap', fontFamily: 'var(--cds-font-mono)' }}>{q.query}</pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enrichments Tab */}
      {activeTab === 'enrichments' && enrichments && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setEnrichmentSubTab('stream')} style={{ ...(enrichmentSubTab === 'stream' ? btnPrimary : btnSecondary) }}>
              Stream-Time ({enabledStreamEnrichments.size}/{enrichments.streamTime?.length || 0})
            </button>
            <button onClick={() => setEnrichmentSubTab('search')} style={{ ...(enrichmentSubTab === 'search' ? btnPrimary : btnSecondary) }}>
              Search-Time ({enabledSearchEnrichments.size}/{enrichments.searchTime?.length || 0})
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button style={{ ...btnSecondary, fontSize: 'var(--cds-font-size-xs)', padding: '4px 10px' }} onClick={enrichmentSubTab === 'stream' ? selectAllStreamEnrichments : selectAllSearchEnrichments}>Select All</button>
              <button style={{ ...btnSecondary, fontSize: 'var(--cds-font-size-xs)', padding: '4px 10px' }} onClick={enrichmentSubTab === 'stream' ? clearAllStreamEnrichments : clearAllSearchEnrichments}>Clear All</button>
            </div>
          </div>

          <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 20 }}>
            {enrichmentSubTab === 'stream'
              ? 'Stream-time enrichments are applied at ingestion via Cribl Stream/Edge pipelines.'
              : 'Search-time enrichments are applied at query time via Cribl Search lookups.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {(enrichmentSubTab === 'stream' ? enrichments.streamTime : enrichments.searchTime || []).map((e: any) => {
              const isEnabled = enrichmentSubTab === 'stream' ? enabledStreamEnrichments.has(e.name) : enabledSearchEnrichments.has(e.name);
              const toggle = enrichmentSubTab === 'stream' ? toggleStreamEnrichment : toggleSearchEnrichment;
              return (
                <div key={e.name} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12, borderColor: isEnabled ? 'var(--cds-brand-teal)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggle(e.name)}
                        style={{ width: 16, height: 16, accentColor: 'var(--cds-brand-teal)', cursor: 'pointer' }}
                      />
                      <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, margin: 0 }}>{e.name}</h4>
                    </div>
                    <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{e.criblFunction}</span>
                  </div>
                  <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0 }}>{e.description}</p>
                  <div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 4 }}>Added Fields:</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {e.addedFields.map((f: string) => (
                        <span key={f} style={{ padding: '1px 6px', borderRadius: 'var(--cds-radius-sm)', border: '1px solid var(--cds-color-border)', fontSize: 'var(--cds-font-size-xs)', fontFamily: 'var(--cds-font-mono)', color: 'var(--cds-color-fg-muted)' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--cds-color-border-subtle)', paddingTop: 10 }}>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 2 }}>Security Value:</div>
                    <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0 }}>{e.securityValue}</p>
                    {e.observabilityValue && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 2 }}>Observability Value:</div>
                        <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0 }}>{e.observabilityValue}</p>
                      </div>
                    )}
                  </div>
                  {e.implementation && (
                    <div style={{ borderTop: '1px solid var(--cds-color-border-subtle)', paddingTop: 10 }}>
                      <button
                        onClick={() => setExpandedImpl(expandedImpl === e.name ? null : e.name)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-accent)', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <span style={{ transform: expandedImpl === e.name ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>{'▶'}</span>
                        Implementation Example
                      </button>
                      {expandedImpl === e.name && (
                        <div style={{ marginTop: 10 }}>
                          {e.implementation.example && (
                            <pre style={{ fontSize: 'var(--cds-font-size-xs)', background: 'var(--cds-color-bg-subtle)', padding: 12, borderRadius: 'var(--cds-radius-md)', margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--cds-font-mono)' }}>{e.implementation.example}</pre>
                          )}
                          {e.implementation.notes && (
                            <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', fontStyle: 'italic', marginTop: 8, padding: '6px 10px', background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-sm)', borderLeft: '3px solid var(--cds-brand-teal)' }}>{e.implementation.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Routing Tab */}
      {activeTab === 'routing' && routing && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 10 }}>Data Flow</h3>
            <p style={{ color: 'var(--cds-color-fg-muted)', marginBottom: 16 }}>{routing.sourceDescription}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {routing.dataFlow.map((step: any) => (
                <div key={step.step} style={{ ...card, flex: '1 1 180px', minWidth: 180 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: 'var(--cds-brand-teal)', marginBottom: 4 }}>{step.step}</div>
                  <h4 style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>{step.name}</h4>
                  <p style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', margin: 0 }}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 16 }}>Destinations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {routing.destinations.map((dest: any) => (
                <div key={dest.type} style={card}>
                  <h4 style={{ color: 'var(--cds-brand-teal)', fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 8 }}>{dest.type}</h4>
                  <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 12 }}>{dest.strategy}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{dest.fieldCount} fields</span>
                    <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>{dest.estimatedReduction}</span>
                  </div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 6 }}>Examples:</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {dest.examples.map((ex: string) => <span key={ex} style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>{ex}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {routing.packFunctions && (
            <div>
              <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 16 }}>Pack Functions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {routing.packFunctions.map((fn: any, i: number) => (
                  <div key={fn.name} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--cds-brand-teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'var(--cds-font-size-sm)', flexShrink: 0 }}>{i + 1}</div>
                    <div>
                      <h5 style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 4 }}>{fn.name}</h5>
                      <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0 }}>{fn.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
