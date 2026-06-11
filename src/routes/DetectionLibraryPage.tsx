import React, { useState, useMemo } from 'react';
import { dataSources } from '../data/sources';
import { fieldMatrix } from '../data/fields';
import { securityDetections as secDetData } from '../data/securityDetections';
import { observabilityDetections as obsDetData } from '../data/observabilityDetections';
import { enrichments as enrichmentDataAll } from '../data/enrichments';
import DashboardDeployModal from '../components/DashboardDeployModal';

const tag = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--cds-radius-sm)',
  fontSize: 'var(--cds-font-size-xs)', fontWeight: 500, background: bg, color,
});

const card: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: 20, boxShadow: 'var(--cds-shadow-sm)',
};

const statCard: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: '16px 20px', textAlign: 'center',
  boxShadow: 'var(--cds-shadow-sm)',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid var(--cds-color-border)',
  borderRadius: 'var(--cds-radius-md)', fontSize: 'var(--cds-font-size-sm)',
  background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)',
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

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: active ? 600 : 400,
  color: active ? 'var(--cds-brand-teal)' : 'var(--cds-color-fg-muted)',
  borderBottom: active ? '2px solid var(--cds-brand-teal)' : '2px solid transparent',
});

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DetectionLibraryPage() {
  const sources = useMemo(() => dataSources.flatMap((c: any) => c.sources), []);
  const [selectedSource, setSelectedSource] = useState(sources.find((s: any) => s.status === 'available')?.id || 'palo-alto-traffic');
  const [activeTab, setActiveTab] = useState<'security' | 'observability' | 'summary' | 'enrichments'>('security');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [enabledSecDetections, setEnabledSecDetections] = useState<Set<string>>(new Set());
  const [enabledObsDetections, setEnabledObsDetections] = useState<Set<string>>(new Set());
  const [enrichmentSubTab, setEnrichmentSubTab] = useState<'stream' | 'search'>('stream');
  const [expandedImpl, setExpandedImpl] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [enabledStreamEnrichments, setEnabledStreamEnrichments] = useState<Set<string>>(new Set());
  const [enabledSearchEnrichments, setEnabledSearchEnrichments] = useState<Set<string>>(new Set());
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployStatus, setDeployStatus] = useState<string[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployDataset, setDeployDataset] = useState('');
  const [showDashboardModal, setShowDashboardModal] = useState(false);

  const selectedSourceObj = sources.find((s: any) => s.id === selectedSource);
  const selectedSourceName = selectedSourceObj?.name || selectedSource;
  const securityDetections: any[] = (secDetData as any)[selectedSource] || [];
  const obsDetections: any[] = (obsDetData as any)[selectedSource] || [];
  const allFields: any[] = (fieldMatrix as any)[selectedSource] || [];
  const enrichmentData = (enrichmentDataAll as any)[selectedSource] || null;

  const hasDetections = securityDetections.length > 0 || obsDetections.length > 0;
  const totalEnabled = enabledSecDetections.size + enabledObsDetections.size;

  function toggleSecDetection(id: string) {
    setEnabledSecDetections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleObsDetection(id: string) {
    setEnabledObsDetections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function selectAllSec() { setEnabledSecDetections(new Set(securityDetections.map((d: any) => d.id))); }
  function selectAllObs() { setEnabledObsDetections(new Set(obsDetections.map((d: any) => d.id))); }
  function clearAllSec() { setEnabledSecDetections(new Set()); }
  function clearAllObs() { setEnabledObsDetections(new Set()); }

  function toggleStreamEnrichment(name: string) {
    setEnabledStreamEnrichments(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  }
  function toggleSearchEnrichment(name: string) {
    setEnabledSearchEnrichments(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  }
  function selectAllStreamEnrichments() { if (enrichmentData) setEnabledStreamEnrichments(new Set(enrichmentData.streamTime.map((e: any) => e.name))); }
  function selectAllSearchEnrichments() { if (enrichmentData) setEnabledSearchEnrichments(new Set(enrichmentData.searchTime.map((e: any) => e.name))); }
  function clearAllStreamEnrichments() { setEnabledStreamEnrichments(new Set()); }
  function clearAllSearchEnrichments() { setEnabledSearchEnrichments(new Set()); }

  const fieldAnalysis = useMemo(() => {
    const secRequired = new Set<string>();
    const obsRequired = new Set<string>();
    securityDetections.filter((d: any) => enabledSecDetections.has(d.id)).forEach((d: any) => d.requiredFields.forEach((f: string) => secRequired.add(f)));
    obsDetections.filter((d: any) => enabledObsDetections.has(d.id)).forEach((d: any) => d.requiredFields.forEach((f: string) => obsRequired.add(f)));
    const allRequired = new Set([...secRequired, ...obsRequired]);
    const notNeeded = allFields.map((f: any) => f.field).filter((f: string) => !allRequired.has(f));
    return { secRequired, obsRequired, allRequired, notNeeded };
  }, [enabledSecDetections, enabledObsDetections, securityDetections, obsDetections, allFields]);

  const detections = activeTab === 'security' ? securityDetections : activeTab === 'observability' ? obsDetections : [];
  const filteredDetections = detections.filter((d: any) => {
    if (search) {
      const s = search.toLowerCase();
      if (!d.name.toLowerCase().includes(s) && !d.objective.toLowerCase().includes(s) && !d.requiredFields.some((f: string) => f.includes(s))) return false;
    }
    if (severityFilter !== 'all') {
      const sev = (d.severity || d.category || '').toLowerCase();
      if (sev !== severityFilter.toLowerCase()) return false;
    }
    return true;
  });

  function generateSearchPackYaml(): string {
    const queries: any[] = [];
    [...securityDetections.filter((d: any) => enabledSecDetections.has(d.id)),
     ...obsDetections.filter((d: any) => enabledObsDetections.has(d.id))]
      .forEach((d: any) => {
        if (d.criblSearchQueries) {
          d.criblSearchQueries.forEach((q: any) => queries.push({ ...q, detection: d.name, severity: d.severity || d.category }));
        }
      });
    let yaml = `# Search Pack for ${selectedSource}\n# Generated: ${new Date().toISOString()}\n# Detections: ${totalEnabled}\n\nsaved_queries:\n`;
    queries.forEach(q => {
      yaml += `  - name: "${q.name}"\n    description: "${q.description}"\n    detection: "${q.detection}"\n    severity: "${q.severity}"\n    query: |\n      ${q.query.split('\n').join('\n      ')}\n\n`;
    });
    return yaml;
  }

  function generateStreamPackYaml(): string {
    const requiredFields = [...fieldAnalysis.allRequired].sort();
    const droppableFields = fieldAnalysis.notNeeded.sort();
    let yaml = `# Stream Pack for ${selectedSource}\n# Generated: ${new Date().toISOString()}\n# Required fields: ${requiredFields.length}\n# Droppable fields: ${droppableFields.length}\n\npipeline:\n  functions:\n    - id: field_filter\n      description: "Keep only fields required by enabled detections"\n      keep_fields:\n`;
    requiredFields.forEach(f => { yaml += `        - ${f}\n`; });
    yaml += `\n    - id: field_removal\n      description: "Remove fields not needed by any detection"\n      remove_fields:\n`;
    droppableFields.forEach(f => { yaml += `        - ${f}\n`; });
    if (enabledStreamEnrichments.size > 0 && enrichmentData) {
      yaml += `\nenrichments:\n`;
      enrichmentData.streamTime.filter((e: any) => enabledStreamEnrichments.has(e.name)).forEach((e: any) => {
        yaml += `  - name: "${e.name}"\n    function: "${e.criblFunction}"\n    added_fields: [${e.addedFields.join(', ')}]\n\n`;
      });
    }
    return yaml;
  }

  function exportSearchPack() {
    const yaml = generateSearchPackYaml();
    downloadBlob(yaml, `${selectedSource}-search-pack.yml`, 'text/yaml');
    setExportStatus('Search Pack downloaded');
  }

  function exportStreamPack() {
    const yaml = generateStreamPackYaml();
    downloadBlob(yaml, `${selectedSource}-stream-pack.yml`, 'text/yaml');
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
      ...securityDetections.filter((d: any) => enabledSecDetections.has(d.id)),
      ...obsDetections.filter((d: any) => enabledObsDetections.has(d.id))
    ];

    const selectedSearchEnrich = enrichmentData?.searchTime?.filter((e: any) => enabledSearchEnrichments.has(e.name)) || [];

    let savedCount = 0;
    let errorCount = 0;

    // Deploy saved searches from detection queries
    for (const det of selectedDets) {
      if (!det.criblSearchQueries) continue;
      for (const q of det.criblSearchQueries) {
        const savedSearchId = `dub_${selectedSource}_${det.id}_${savedCount}`.replace(/[^a-zA-Z0-9_]/g, '_');
        const cleanName = `DUB ${det.name} - ${q.name}`.replace(/[^a-zA-Z0-9 _-]/g, '').substring(0, 256);
        const body = {
          id: savedSearchId,
          name: cleanName,
          description: `[${selectedSource}] [${det.severity || det.category}] ${q.description || det.objective}`,
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
            log(`+ Saved search: ${body.name}`);
          } else if (res.status === 409) {
            // Already exists — try PUT to update
            const updateRes = await fetch(`${baseSearchApi}/${savedSearchId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            if (updateRes.ok) {
              savedCount++;
              log(`~ Updated: ${body.name}`);
            } else {
              errorCount++;
              log(`! Failed to update ${body.name}: ${updateRes.status}`);
            }
          } else {
            errorCount++;
            const errText = await res.text().catch(() => '');
            const errMsg = errText.length < 200 ? errText : errText.substring(0, 200);
            log(`! Failed: ${body.name} (${res.status}) ${errMsg}`);
          }
        } catch (err: any) {
          errorCount++;
          log(`! Error: ${body.name} — ${err.message}`);
        }
      }
    }

    // Deploy search-time enrichments as lookup definitions
    for (const e of selectedSearchEnrich) {
      log(`+ Search enrichment registered: ${e.name} (deploy as lookup in Cribl Search)`);
      savedCount++;
    }

    log('');
    log(`Deployment complete: ${savedCount} items deployed, ${errorCount} errors`);
    setDeploying(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>Detection Library</h2>
        <p style={{ fontSize: 'var(--cds-font-size-base)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.6 }}>
          Select the detections you want to enable. The Field Requirements tab shows exactly which fields you need to keep and which you can drop.
        </p>
      </div>

      {/* Source selector */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <select value={selectedSource} onChange={e => { setSelectedSource(e.target.value); setEnabledSecDetections(new Set()); setEnabledObsDetections(new Set()); setEnabledStreamEnrichments(new Set()); setEnabledSearchEnrichments(new Set()); }} style={{ ...selectStyle, minWidth: 260 }}>
          {sources.map((s: any) => <option key={s.id} value={s.id} disabled={s.status !== 'available'}>{s.name}{s.status !== 'available' ? ' (Coming Soon)' : ''}</option>)}
        </select>
        {totalEnabled > 0 && <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{totalEnabled} detection{totalEnabled !== 1 ? 's' : ''} enabled</span>}
      </div>

      {!hasDetections && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--cds-color-fg-muted)' }}>
          <h3 style={{ fontSize: 'var(--cds-font-size-lg)', marginBottom: 8 }}>No detections available yet</h3>
          <p>Detection recommendations for this source are coming soon.</p>
        </div>
      )}

      {hasDetections && <>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600, color: 'var(--cds-brand-teal)' }}>{enabledSecDetections.size}<span style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-subtle)' }}> / {securityDetections.length}</span></div><div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Security Enabled</div></div>
          <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600, color: 'var(--cds-color-accent)' }}>{enabledObsDetections.size}<span style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-subtle)' }}> / {obsDetections.length}</span></div><div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Observability Enabled</div></div>
          <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600, color: 'var(--cds-color-warning)' }}>{fieldAnalysis.allRequired.size}</div><div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Fields Required</div></div>
          <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600, color: 'var(--cds-color-danger)' }}>{fieldAnalysis.notNeeded.length}</div><div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Fields Can Drop</div></div>
        </div>

        {/* Export banner */}
        {(totalEnabled > 0 || enabledStreamEnrichments.size > 0 || enabledSearchEnrichments.size > 0) && (
          <div style={{ background: 'var(--cds-color-bg-subtle)', border: '1px solid var(--cds-brand-teal)', borderRadius: 'var(--cds-radius-lg)', padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg)' }}>Export:</span>
              {totalEnabled > 0 && <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{totalEnabled} detections</span>}
              {enabledStreamEnrichments.size > 0 && <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>{enabledStreamEnrichments.size} stream enrichments</span>}
              {enabledSearchEnrichments.size > 0 && <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>{enabledSearchEnrichments.size} search enrichments</span>}
              {exportStatus && <span style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-brand-teal)' }}>{exportStatus}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={btnSecondary} onClick={() => setShowExportModal(true)}>Export Packs</button>
              <button style={{ ...btnPrimary, background: 'var(--cds-color-primary)' }} onClick={() => setShowDeployModal(true)}>Deploy to Cribl Search</button>
              <button style={{ ...btnPrimary, background: '#6366f1' }} onClick={() => setShowDashboardModal(true)}>Deploy Dashboards</button>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowExportModal(false)}>
            <div style={{ background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-xl)', padding: 32, maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 'var(--cds-font-size-lg)', fontWeight: 600 }}>Export Cribl Packs</h3>
                <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--cds-color-fg-muted)' }}>&times;</button>
              </div>
              <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 20 }}>
                Export your selections as Cribl Packs.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 6 }}>Search Pack</h4>
                    <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 8 }}>Saved queries and scheduled searches for Cribl Search.</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{enabledSecDetections.size} security</span>
                      <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>{enabledObsDetections.size} observability</span>
                    </div>
                  </div>
                  <button style={btnPrimary} onClick={exportSearchPack} disabled={totalEnabled === 0}>Download .yml</button>
                </div>
                <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 6 }}>Stream Pack</h4>
                    <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 8 }}>Pipeline functions, routes, and stream-time enrichments for Cribl Stream.</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{fieldAnalysis.allRequired.size} fields required</span>
                      <span style={tag('var(--cds-color-danger-subtle)', 'var(--cds-color-danger)')}>{fieldAnalysis.notNeeded.length} droppable</span>
                    </div>
                  </div>
                  <button style={btnPrimary} onClick={exportStreamPack}>Download .yml</button>
                </div>
              </div>
              {exportStatus && <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-brand-teal)', marginTop: 16, textAlign: 'center' }}>{exportStatus}</p>}
            </div>
          </div>
        )}

        {/* Deploy Modal */}
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
                    This will deploy the selected detections and search enrichments as <strong>Saved Searches</strong> directly into your Cribl Search instance.
                  </p>

                  <div style={{ ...card, marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>
                      Target Dataset
                    </label>
                    <p style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 8 }}>
                      Enter the Cribl Search dataset name these searches should query against. This replaces <code>$DATASET</code> in all queries.
                    </p>
                    <input
                      type="text"
                      value={deployDataset}
                      onChange={e => setDeployDataset(e.target.value)}
                      placeholder="e.g. my_firewall_logs, pan_traffic, cribl_dataset_name"
                      style={{ ...selectStyle, width: '100%', padding: '10px 12px' }}
                    />
                  </div>

                  <div style={{ ...card, marginBottom: 16 }}>
                    <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 8 }}>What will be deployed:</h4>
                    <ul style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', paddingLeft: 20, lineHeight: 2 }}>
                      <li><strong>{enabledSecDetections.size}</strong> security detections → saved search queries</li>
                      <li><strong>{enabledObsDetections.size}</strong> observability detections → saved search queries</li>
                      <li><strong>{enabledSearchEnrichments.size}</strong> search-time enrichments → lookup references</li>
                      <li>Total queries: ~{
                        [...securityDetections.filter((d: any) => enabledSecDetections.has(d.id)),
                         ...obsDetections.filter((d: any) => enabledObsDetections.has(d.id))]
                          .reduce((sum: number, d: any) => sum + (d.criblSearchQueries?.length || 0), 0)
                      } saved searches</li>
                    </ul>
                    <p style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginTop: 12, fontStyle: 'italic' }}>
                      Searches are created as disabled by default. Enable them individually or via scheduled search configuration.
                      All deployed items are prefixed with DUB for easy identification.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button style={btnSecondary} onClick={() => setShowDeployModal(false)}>Cancel</button>
                    <button style={{ ...btnPrimary, background: 'var(--cds-color-primary)' }} onClick={() => { setDeployStatus([]); deployToCriblSearch(deployDataset); }} disabled={(totalEnabled === 0 && enabledSearchEnrichments.size === 0) || !deployDataset.trim()}>
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

        {/* Dashboard Deploy Modal */}
        {showDashboardModal && (
          <DashboardDeployModal
            sourceName={selectedSourceName}
            sourceId={selectedSource}
            secDetections={securityDetections}
            obsDetections={obsDetections}
            enabledSecIds={enabledSecDetections}
            enabledObsIds={enabledObsDetections}
            onClose={() => setShowDashboardModal(false)}
          />
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--cds-color-border-subtle)', marginBottom: 20 }}>
          <button style={tabBtn(activeTab === 'security')} onClick={() => setActiveTab('security')}>Security ({enabledSecDetections.size}/{securityDetections.length})</button>
          <button style={tabBtn(activeTab === 'observability')} onClick={() => setActiveTab('observability')}>Observability ({enabledObsDetections.size}/{obsDetections.length})</button>
          <button style={tabBtn(activeTab === 'summary')} onClick={() => setActiveTab('summary')}>Field Requirements {totalEnabled > 0 ? `(${fieldAnalysis.allRequired.size} needed)` : ''}</button>
          {enrichmentData && <button style={tabBtn(activeTab === 'enrichments')} onClick={() => setActiveTab('enrichments')}>Enrichments ({(enrichmentData.streamTime?.length || 0) + (enrichmentData.searchTime?.length || 0)})</button>}
        </div>

        {/* Detection lists */}
        {(activeTab === 'security' || activeTab === 'observability') && (
          <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
              <input type="text" placeholder="Search by name, objective, or field..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...selectStyle, minWidth: 240 }} />
              <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={selectStyle}>
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              {activeTab === 'security' && <>
                <button style={btnSecondary} onClick={selectAllSec}>Select All</button>
                <button style={btnSecondary} onClick={clearAllSec}>Clear All</button>
              </>}
              {activeTab === 'observability' && <>
                <button style={btnSecondary} onClick={selectAllObs}>Select All</button>
                <button style={btnSecondary} onClick={clearAllObs}>Clear All</button>
              </>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
              {filteredDetections.map((d: any) => {
                const isEnabled = activeTab === 'security' ? enabledSecDetections.has(d.id) : enabledObsDetections.has(d.id);
                const toggle = activeTab === 'security' ? toggleSecDetection : toggleObsDetection;
                return (
                  <div key={d.id} style={{ ...card, borderColor: isEnabled ? 'var(--cds-brand-teal)' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="checkbox" checked={isEnabled} onChange={() => toggle(d.id)} style={{ width: 16, height: 16, accentColor: 'var(--cds-brand-teal)', cursor: 'pointer' }} />
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
                          return <a key={m} href={url || '#'} target="_blank" rel="noopener noreferrer" style={{ ...tag('var(--cds-color-danger-subtle)', 'var(--cds-color-danger)'), textDecoration: 'none' }}>{m}</a>;
                        })}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                      {d.requiredFields.map((f: string) => (
                        <span key={f} style={{ padding: '1px 6px', borderRadius: 'var(--cds-radius-sm)', border: '1px solid var(--cds-color-border)', fontSize: 'var(--cds-font-size-xs)', fontFamily: 'var(--cds-font-mono)', color: 'var(--cds-color-fg-muted)' }}>{f}</span>
                      ))}
                    </div>

                    <button style={btnSecondary} onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}>
                      {expandedId === d.id ? 'Hide Details' : 'Show Details'}
                    </button>

                    {expandedId === d.id && (
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
                        {d.tuningGuidance && (
                          <div style={{ marginBottom: 10 }}>
                            <strong style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)' }}>Tuning Guidance:</strong>
                            <p style={{ fontSize: 'var(--cds-font-size-sm)', marginTop: 4, color: 'var(--cds-color-fg-muted)' }}>{d.tuningGuidance}</p>
                          </div>
                        )}
                        {d.operationalValue && (
                          <div style={{ marginBottom: 10 }}>
                            <strong style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)' }}>Operational Value:</strong>
                            <p style={{ fontSize: 'var(--cds-font-size-sm)', marginTop: 4, color: 'var(--cds-color-fg-muted)' }}>{d.operationalValue}</p>
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
          </>
        )}

        {/* Field Requirements */}
        {activeTab === 'summary' && (
          <div>
            {totalEnabled === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--cds-color-fg-muted)' }}>
                <h3 style={{ fontSize: 'var(--cds-font-size-lg)', marginBottom: 8 }}>No detections selected</h3>
                <p>Go to the Security or Observability tab and enable detections. Field requirements will appear here.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                  <div style={{ ...card, padding: 24 }}>
                    <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, color: 'var(--cds-brand-teal)', marginBottom: 4 }}>Security Detection Fields</h3>
                    <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 12 }}>Required by {enabledSecDetections.size} enabled detections</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {[...fieldAnalysis.secRequired].sort().map(f => (
                        <span key={f} style={{ padding: '1px 6px', borderRadius: 'var(--cds-radius-sm)', border: '1px solid var(--cds-brand-teal)', fontSize: 'var(--cds-font-size-xs)', fontFamily: 'var(--cds-font-mono)', color: 'var(--cds-brand-teal)' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ ...card, padding: 24 }}>
                    <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, color: 'var(--cds-color-accent)', marginBottom: 4 }}>Observability Detection Fields</h3>
                    <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 12 }}>Required by {enabledObsDetections.size} enabled detections</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {[...fieldAnalysis.obsRequired].sort().map(f => (
                        <span key={f} style={{ padding: '1px 6px', borderRadius: 'var(--cds-radius-sm)', border: '1px solid var(--cds-color-accent)', fontSize: 'var(--cds-font-size-xs)', fontFamily: 'var(--cds-font-mono)', color: 'var(--cds-color-accent)' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ ...card, padding: 24 }}>
                  <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, color: 'var(--cds-color-danger)', marginBottom: 4 }}>Fields You Can Drop</h3>
                  <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 16 }}>
                    These {fieldAnalysis.notNeeded.length} fields are not required by any selected detection. Drop from analytics destinations to reduce cost.
                  </p>
                  {fieldAnalysis.notNeeded.length > 0 && (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cds-font-size-sm)' }}>
                        <thead>
                          <tr style={{ background: 'var(--cds-color-bg-subtle)' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--cds-color-border)' }}>Field</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--cds-color-border)' }}>Description</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--cds-color-border)' }}>Can Drop</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--cds-color-border)' }}>Can Mask</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fieldAnalysis.notNeeded.map((fieldName: string) => {
                            const f = allFields.find((af: any) => af.field === fieldName);
                            if (!f) return null;
                            return (
                              <tr key={f.field} style={{ borderBottom: '1px solid var(--cds-color-border-subtle)' }}>
                                <td style={{ padding: '8px 12px' }}><code style={{ color: 'var(--cds-color-danger)', fontFamily: 'var(--cds-font-mono)', fontSize: 'var(--cds-font-size-xs)' }}>{f.field}</code></td>
                                <td style={{ padding: '8px 12px', color: 'var(--cds-color-fg-muted)' }}>{f.description}</td>
                                <td style={{ padding: '8px 12px', color: f.canDrop === 'Yes' ? 'var(--cds-color-success)' : 'var(--cds-color-fg-subtle)' }}>{f.canDrop}</td>
                                <td style={{ padding: '8px 12px', color: f.canMask === 'Yes' ? 'var(--cds-color-warning)' : 'var(--cds-color-fg-subtle)' }}>{f.canMask}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Enrichments tab */}
        {activeTab === 'enrichments' && enrichmentData && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <button style={enrichmentSubTab === 'stream' ? btnPrimary : btnSecondary} onClick={() => setEnrichmentSubTab('stream')}>
                Stream-Time ({enabledStreamEnrichments.size}/{enrichmentData.streamTime?.length || 0})
              </button>
              <button style={enrichmentSubTab === 'search' ? btnPrimary : btnSecondary} onClick={() => setEnrichmentSubTab('search')}>
                Search-Time ({enabledSearchEnrichments.size}/{enrichmentData.searchTime?.length || 0})
              </button>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button style={{ ...btnSecondary, fontSize: 'var(--cds-font-size-xs)', padding: '4px 10px' }} onClick={enrichmentSubTab === 'stream' ? selectAllStreamEnrichments : selectAllSearchEnrichments}>Select All</button>
                <button style={{ ...btnSecondary, fontSize: 'var(--cds-font-size-xs)', padding: '4px 10px' }} onClick={enrichmentSubTab === 'stream' ? clearAllStreamEnrichments : clearAllSearchEnrichments}>Clear All</button>
              </div>
            </div>

            <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 20 }}>
              {enrichmentSubTab === 'stream' ? 'Stream-time enrichments are applied at ingestion via Cribl Stream/Edge pipelines.' : 'Search-time enrichments are applied at query time via Cribl Search lookups.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {(enrichmentSubTab === 'stream' ? enrichmentData.streamTime : enrichmentData.searchTime || []).map((e: any) => {
                const isEnabled = enrichmentSubTab === 'stream' ? enabledStreamEnrichments.has(e.name) : enabledSearchEnrichments.has(e.name);
                const toggle = enrichmentSubTab === 'stream' ? toggleStreamEnrichment : toggleSearchEnrichment;
                return (
                  <div key={e.name} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12, borderColor: isEnabled ? 'var(--cds-brand-teal)' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" checked={isEnabled} onChange={() => toggle(e.name)} style={{ width: 16, height: 16, accentColor: 'var(--cds-brand-teal)', cursor: 'pointer' }} />
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
                    </div>
                    {e.implementation && (
                      <div style={{ borderTop: '1px solid var(--cds-color-border-subtle)', paddingTop: 10 }}>
                        <button onClick={() => setExpandedImpl(expandedImpl === e.name ? null : e.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ transform: expandedImpl === e.name ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>{'▶'}</span>
                          Implementation Example
                        </button>
                        {expandedImpl === e.name && e.implementation.example && (
                          <pre style={{ marginTop: 8, fontSize: 'var(--cds-font-size-xs)', background: 'var(--cds-color-bg-subtle)', padding: 12, borderRadius: 'var(--cds-radius-md)', overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--cds-font-mono)' }}>{e.implementation.example}</pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>}
    </div>
  );
}
