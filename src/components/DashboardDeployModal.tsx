import React, { useState, useEffect } from 'react';
import { listDashboards, createDashboard, updateDashboard, getDashboard, buildDashboards } from '../api/dashboards';
import type { Dashboard } from '../api/dashboards';

const card: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: 20, boxShadow: 'var(--cds-shadow-sm)',
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

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid var(--cds-color-border)',
  borderRadius: 'var(--cds-radius-md)', fontSize: 'var(--cds-font-size-sm)',
  background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)',
};

const tag = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--cds-radius-sm)',
  fontSize: 'var(--cds-font-size-xs)', fontWeight: 500, background: bg, color,
});

interface Props {
  sourceName: string;
  sourceId: string;
  secDetections: any[];
  obsDetections: any[];
  enabledSecIds: Set<string>;
  enabledObsIds: Set<string>;
  onClose: () => void;
}

export default function DashboardDeployModal({ sourceName, sourceId, secDetections, obsDetections, enabledSecIds, enabledObsIds, onClose }: Props) {
  const [dataset, setDataset] = useState('');
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [existingDashboards, setExistingDashboards] = useState<Dashboard[]>([]);
  const [selectedSecDashId, setSelectedSecDashId] = useState('');
  const [selectedObsDashId, setSelectedObsDashId] = useState('');
  const [loadingDashboards, setLoadingDashboards] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<string[]>([]);

  const totalSecQueries = secDetections.filter(d => enabledSecIds.has(d.id)).reduce((sum, d) => sum + (d.criblSearchQueries?.length || 0), 0);
  const totalObsQueries = obsDetections.filter(d => enabledObsIds.has(d.id)).reduce((sum, d) => sum + (d.criblSearchQueries?.length || 0), 0);

  useEffect(() => {
    if (mode === 'existing') {
      setLoadingDashboards(true);
      listDashboards().then(dbs => {
        setExistingDashboards(dbs);
        setLoadingDashboards(false);
      }).catch(() => setLoadingDashboards(false));
    }
  }, [mode]);

  async function deploy() {
    const apiUrlVal = (window as any).CRIBL_API_URL || '';
    if (!apiUrlVal) { setDeployStatus(['Error: Not running inside Cribl Search (CRIBL_API_URL not set)']); return; }
    if (!dataset.trim()) { setDeployStatus(['Error: No dataset specified']); return; }

    setDeploying(true);
    const log = (msg: string) => setDeployStatus(prev => [...prev, msg]);
    log(`Building dashboards for ${sourceName} against dataset: ${dataset.trim()}...`);

    const { security, observability } = buildDashboards(
      sourceName, sourceId, dataset.trim(),
      secDetections, obsDetections, enabledSecIds, enabledObsIds,
    );

    let successCount = 0;
    let errorCount = 0;

    if (security && enabledSecIds.size > 0) {
      if (mode === 'new') {
        log(`Creating new dashboard: ${security.name} (${security.elements.length} panels)...`);
        const result = await createDashboard(security);
        if (result.ok) {
          successCount++;
          log(`+ Created: ${security.name}`);
        } else if (result.status === 409) {
          log(`~ Dashboard already exists, updating: ${security.name}...`);
          const updateResult = await updateDashboard(security.id, security);
          if (updateResult.ok) {
            successCount++;
            log(`~ Updated: ${security.name}`);
          } else {
            errorCount++;
            log(`! Failed to update ${security.name}: ${updateResult.status} ${updateResult.message || ''}`);
          }
        } else {
          errorCount++;
          log(`! Failed to create ${security.name}: ${result.status} ${result.message || ''}`);
        }
      } else {
        if (selectedSecDashId) {
          log(`Adding ${security.elements.length} security panels to existing dashboard...`);
          const existing = await getDashboard(selectedSecDashId);
          if (existing) {
            const merged: Dashboard = {
              ...existing,
              elements: [...(existing.elements || []), ...security.elements],
            };
            const result = await updateDashboard(selectedSecDashId, merged);
            if (result.ok) {
              successCount++;
              log(`+ Added ${security.elements.length} panels to: ${existing.name}`);
            } else {
              errorCount++;
              log(`! Failed to update ${existing.name}: ${result.status} ${result.message || ''}`);
            }
          } else {
            errorCount++;
            log(`! Could not retrieve existing dashboard ${selectedSecDashId}`);
          }
        }
      }
    }

    if (observability && enabledObsIds.size > 0) {
      if (mode === 'new') {
        log(`Creating new dashboard: ${observability.name} (${observability.elements.length} panels)...`);
        const result = await createDashboard(observability);
        if (result.ok) {
          successCount++;
          log(`+ Created: ${observability.name}`);
        } else if (result.status === 409) {
          log(`~ Dashboard already exists, updating: ${observability.name}...`);
          const updateResult = await updateDashboard(observability.id, observability);
          if (updateResult.ok) {
            successCount++;
            log(`~ Updated: ${observability.name}`);
          } else {
            errorCount++;
            log(`! Failed to update ${observability.name}: ${updateResult.status} ${updateResult.message || ''}`);
          }
        } else {
          errorCount++;
          log(`! Failed to create ${observability.name}: ${result.status} ${result.message || ''}`);
        }
      } else {
        if (selectedObsDashId) {
          log(`Adding ${observability.elements.length} observability panels to existing dashboard...`);
          const existing = await getDashboard(selectedObsDashId);
          if (existing) {
            const merged: Dashboard = {
              ...existing,
              elements: [...(existing.elements || []), ...observability.elements],
            };
            const result = await updateDashboard(selectedObsDashId, merged);
            if (result.ok) {
              successCount++;
              log(`+ Added ${observability.elements.length} panels to: ${existing.name}`);
            } else {
              errorCount++;
              log(`! Failed to update ${existing.name}: ${result.status} ${result.message || ''}`);
            }
          } else {
            errorCount++;
            log(`! Could not retrieve existing dashboard ${selectedObsDashId}`);
          }
        }
      }
    }

    log('');
    log(`Dashboard deployment complete: ${successCount} dashboard${successCount !== 1 ? 's' : ''} deployed, ${errorCount} error${errorCount !== 1 ? 's' : ''}`);
    setDeploying(false);
  }

  const canDeploy = dataset.trim() && (enabledSecIds.size > 0 || enabledObsIds.size > 0) && (
    mode === 'new' || (mode === 'existing' && (
      (enabledSecIds.size === 0 || selectedSecDashId) &&
      (enabledObsIds.size === 0 || selectedObsDashId)
    ))
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => !deploying && onClose()}>
      <div style={{ background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-xl)', padding: 32, maxWidth: 700, width: '90%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 'var(--cds-font-size-lg)', fontWeight: 600 }}>Deploy Dashboards</h3>
          {!deploying && <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--cds-color-fg-muted)' }}>&times;</button>}
        </div>

        {deployStatus.length === 0 ? (
          <div>
            <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 16 }}>
              Deploy selected detections as <strong>Dashboard panels</strong> in Cribl Search. Security and Observability
              detections are deployed to separate dashboards.
            </p>

            {/* Dataset input */}
            <div style={{ ...card, marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>
                Target Dataset
              </label>
              <p style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 8 }}>
                Enter the dataset name. This replaces <code>$DATASET</code> in all panel queries.
              </p>
              <input
                type="text"
                value={dataset}
                onChange={e => setDataset(e.target.value)}
                placeholder="e.g. pan_traffic, my_firewall_logs"
                style={{ ...selectStyle, width: '100%', padding: '10px 12px' }}
              />
            </div>

            {/* Mode selection */}
            <div style={{ ...card, marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 12 }}>
                Dashboard Mode
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--cds-font-size-sm)' }}>
                  <input type="radio" name="dashMode" checked={mode === 'new'} onChange={() => setMode('new')} style={{ accentColor: 'var(--cds-brand-teal)' }} />
                  Create New Dashboards
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--cds-font-size-sm)' }}>
                  <input type="radio" name="dashMode" checked={mode === 'existing'} onChange={() => setMode('existing')} style={{ accentColor: 'var(--cds-brand-teal)' }} />
                  Add to Existing Dashboard
                </label>
              </div>
            </div>

            {/* Existing dashboard selection */}
            {mode === 'existing' && (
              <div style={{ ...card, marginBottom: 16 }}>
                {loadingDashboards ? (
                  <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>Loading existing dashboards...</p>
                ) : existingDashboards.length === 0 ? (
                  <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>No existing dashboards found. Create new ones instead.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {enabledSecIds.size > 0 && (
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 6 }}>
                          Security panels → add to:
                        </label>
                        <select value={selectedSecDashId} onChange={e => setSelectedSecDashId(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                          <option value="">-- Select a dashboard --</option>
                          {existingDashboards.map(d => <option key={d.id} value={d.id}>{d.name} ({(d.elements || []).length} panels)</option>)}
                        </select>
                      </div>
                    )}
                    {enabledObsIds.size > 0 && (
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 6 }}>
                          Observability panels → add to:
                        </label>
                        <select value={selectedObsDashId} onChange={e => setSelectedObsDashId(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                          <option value="">-- Select a dashboard --</option>
                          {existingDashboards.map(d => <option key={d.id} value={d.id}>{d.name} ({(d.elements || []).length} panels)</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            <div style={{ ...card, marginBottom: 16 }}>
              <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 8 }}>What will be deployed:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {enabledSecIds.size > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>
                    <span style={tag('var(--cds-color-danger-subtle)', 'var(--cds-color-danger)')}>Security</span>
                    <span>{mode === 'new' ? `${sourceName} - Security` : 'Appended to selected dashboard'}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{totalSecQueries} panels</span>
                  </div>
                )}
                {enabledObsIds.size > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>
                    <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>Observability</span>
                    <span>{mode === 'new' ? `${sourceName} - Observability` : 'Appended to selected dashboard'}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{totalObsQueries} panels</span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginTop: 12, fontStyle: 'italic' }}>
                Each detection query becomes a dashboard panel. Panels are named "{'{Detection Name}'} - {'{Query Name}'}" for easy identification.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={btnSecondary} onClick={onClose}>Cancel</button>
              <button
                style={{ ...btnPrimary, background: 'var(--cds-color-primary)', opacity: canDeploy ? 1 : 0.5 }}
                onClick={deploy}
                disabled={!canDeploy}
              >
                Deploy Dashboards
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
                <button style={btnSecondary} onClick={onClose}>Close</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
