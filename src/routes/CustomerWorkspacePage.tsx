// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { dataSources } from '../data/sources';
import { fieldMatrix } from '../data/fields';
import { guardPolicies } from '../data/guardPolicies';
import { securityDetections as secDetData } from '../data/securityDetections';
import { observabilityDetections as obsDetData } from '../data/observabilityDetections';
import { routingBlueprints } from '../data/routing';
import { calculateFieldReduction, calculateCostSavings } from '../utils/costCalc';
import { loadProfiles, saveProfiles, CustomerProfile } from '../utils/customerStore';

const card: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: 20, boxShadow: 'var(--cds-shadow-sm)',
};
const tag = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--cds-radius-sm)',
  fontSize: 'var(--cds-font-size-xs)', fontWeight: 500, background: bg, color,
});
const btnPrimary: React.CSSProperties = {
  padding: '8px 16px', border: 'none', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, cursor: 'pointer',
  background: 'var(--cds-brand-teal)', color: '#fff',
};
const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: 500, cursor: 'pointer',
  background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)',
};
const btnDanger: React.CSSProperties = {
  ...btnSecondary, borderColor: 'var(--cds-color-danger)', color: 'var(--cds-color-danger)',
};
const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)', width: '100%',
};

const allSources = dataSources.flatMap((c: any) => c.sources).filter((s: any) => s.status === 'available');

function generateCombinedPackYaml(sourceIds: string[], customerName: string): string {
  let yaml = '';
  yaml += `# ============================================================\n`;
  yaml += `# Combined Cribl Stream Pipeline Pack\n`;
  yaml += `# Customer: ${customerName}\n`;
  yaml += `# Sources: ${sourceIds.length}\n`;
  yaml += `# ============================================================\n\n`;

  sourceIds.forEach(sid => {
    const fields = (fieldMatrix as any)[sid] || [];
    const source = allSources.find(s => s.id === sid);
    const droppable = fields.filter(f => f.canDrop === 'Yes').map(f => f.field);
    const maskable = fields.filter(f => f.guardAction === 'Mask').map(f => f.field);
    const redactable = fields.filter(f => f.guardAction === 'Redact').map(f => f.field);

    yaml += `# --- ${source?.name || sid} ---\n`;
    yaml += `- id: ${sid}_optimization\n`;
    yaml += `  name: "${source?.name || sid} - Optimization"\n`;
    yaml += `  disabled: false\n`;
    yaml += `  functions:\n`;

    if (droppable.length > 0) {
      yaml += `    - id: drop_fields\n`;
      yaml += `      filter: "true"\n`;
      yaml += `      conf:\n`;
      yaml += `        remove:\n`;
      droppable.forEach(f => { yaml += `          - ${f}\n`; });
      yaml += `      description: "Drop ${droppable.length} low-value fields"\n`;
    }
    if (maskable.length > 0) {
      yaml += `    - id: guard_mask\n`;
      yaml += `      filter: "true"\n`;
      yaml += `      conf:\n`;
      yaml += `        rules:\n`;
      maskable.forEach(f => { yaml += `          - fieldName: ${f}\n            method: mask\n`; });
      yaml += `      description: "Mask ${maskable.length} PII fields"\n`;
    }
    if (redactable.length > 0) {
      yaml += `    - id: guard_redact\n`;
      yaml += `      filter: "true"\n`;
      yaml += `      conf:\n`;
      yaml += `        rules:\n`;
      redactable.forEach(f => { yaml += `          - fieldName: ${f}\n            method: redact\n`; });
      yaml += `      description: "Redact ${redactable.length} secret fields"\n`;
    }
    yaml += `    - id: route_tag\n`;
    yaml += `      filter: "true"\n`;
    yaml += `      conf:\n`;
    yaml += `        add:\n`;
    yaml += `          - name: __cribl_route\n`;
    yaml += `            value: "'lake'"\n\n`;
  });

  return yaml;
}

export default function CustomerWorkspacePage() {
  const [profiles, setProfiles] = useState<CustomerProfile[]>(() => loadProfiles());
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [editNotes, setEditNotes] = useState(false);

  // Set initial active profile after first render
  useEffect(() => {
    if (!activeProfileId && profiles.length > 0) setActiveProfileId(profiles[0].id);
  }, []);

  // Persist to localStorage whenever profiles change
  useEffect(() => { saveProfiles(profiles); }, [profiles]);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

  function handleCreate() {
    if (!newName.trim()) return;
    const newProfile: CustomerProfile = {
      id: `proj_${Date.now().toString(36)}`,
      name: newName.trim(),
      company: newCompany.trim(),
      sourceIds: [],
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    setNewName(''); setNewCompany(''); setShowCreate(false);
  }

  function handleDelete(id: string) {
    setProfiles(prev => {
      const updated = prev.filter(p => p.id !== id);
      setActiveProfileId(updated[0]?.id || null);
      return updated;
    });
  }

  function toggleSource(sourceId: string) {
    if (!activeProfile) return;
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfile.id) return p;
      const sourceIds = p.sourceIds.includes(sourceId)
        ? p.sourceIds.filter(s => s !== sourceId)
        : [...p.sourceIds, sourceId];
      return { ...p, sourceIds, updatedAt: new Date().toISOString() };
    }));
  }

  function handleNotesChange(notes: string) {
    if (!activeProfile) return;
    setProfiles(prev => prev.map(p =>
      p.id === activeProfile.id ? { ...p, notes, updatedAt: new Date().toISOString() } : p
    ));
  }

  // Aggregate analysis for active profile
  const analysis = useMemo(() => {
    if (!activeProfile || activeProfile.sourceIds.length === 0) return null;

    let totalFields = 0, totalDroppable = 0, totalGuard = 0, totalSecRequired = 0, totalObsFields = 0;
    let totalSecDetections = 0, totalObsDetections = 0;
    const coverageGaps: string[] = [];
    const allDestinations = new Set<string>();
    const sourceAnalyses: any[] = [];

    activeProfile.sourceIds.forEach(sid => {
      const fields = (fieldMatrix as any)[sid] || [];
      const secDets = (secDetData as any)[sid] || [];
      const obsDets = (obsDetData as any)[sid] || [];
      const source = allSources.find(s => s.id === sid);
      const guard = (guardPolicies as any)[sid];

      const droppable = fields.filter(f => f.canDrop === 'Yes').length;
      const secReq = fields.filter(f => f.securitySiem === 'Yes').length;
      const obsReq = fields.filter(f => f.observability === 'Yes' || f.observability === 'Sometimes').length;
      const guardCount = fields.filter(f => f.guardAction && f.guardAction !== 'None').length;

      totalFields += fields.length;
      totalDroppable += droppable;
      totalGuard += guardCount;
      totalSecRequired += secReq;
      totalObsFields += obsReq;
      totalSecDetections += secDets.length;
      totalObsDetections += obsDets.length;

      source?.destinations?.forEach((d: string) => allDestinations.add(d));

      if (secDets.length === 0) coverageGaps.push(`${source?.name || sid}: No security detections`);
      if (obsDets.length === 0) coverageGaps.push(`${source?.name || sid}: No observability detections`);

      sourceAnalyses.push({
        id: sid,
        name: source?.name || sid,
        fields: fields.length,
        droppable,
        secDetections: secDets.length,
        obsDetections: obsDets.length,
        guardCount,
        dropPct: fields.length > 0 ? Math.round(droppable / fields.length * 100) : 0,
      });
    });

    const fieldReduction = {
      totalFields, droppableFields: totalDroppable, securityRequiredFields: totalSecRequired,
      observabilityFields: totalObsFields, guardProtectedFields: totalGuard, maskableFields: totalGuard,
    };
    const costResult = calculateCostSavings(5000, 800, 3.50, fieldReduction);

    return {
      totalFields, totalDroppable, totalGuard, totalSecRequired, totalObsFields,
      totalSecDetections, totalObsDetections, coverageGaps,
      destinations: [...allDestinations], sourceAnalyses, costResult, fieldReduction,
    };
  }, [activeProfile]);

  // Correlation coverage between selected sources
  const correlationCoverage = useMemo(() => {
    if (!activeProfile || activeProfile.sourceIds.length < 2) return [];
    const fieldSets: Record<string, Set<string>> = {};
    activeProfile.sourceIds.forEach(sid => {
      const fields = (fieldMatrix as any)[sid] || [];
      fieldSets[sid] = new Set(fields.filter(f => f.securitySiem === 'Yes').map(f => f.field));
    });

    const sharedFields: { field: string; sources: string[] }[] = [];
    const allFields = new Set<string>();
    Object.values(fieldSets).forEach(s => s.forEach(f => allFields.add(f)));

    allFields.forEach(field => {
      const sources = activeProfile.sourceIds.filter(sid => fieldSets[sid]?.has(field));
      if (sources.length > 1) {
        sharedFields.push({ field, sources: sources.map(sid => allSources.find(s => s.id === sid)?.name || sid) });
      }
    });

    return sharedFields.sort((a, b) => b.sources.length - a.sources.length).slice(0, 20);
  }, [activeProfile]);

  function downloadCombinedPack() {
    if (!activeProfile || activeProfile.sourceIds.length === 0) return;
    const yaml = generateCombinedPackYaml(activeProfile.sourceIds, activeProfile.name);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProfile.company || activeProfile.name}-combined-pipeline.yml`.toLowerCase().replace(/\s+/g, '-');
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>Project Workspace</h2>
        <p style={{ fontSize: 'var(--cds-font-size-base)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.6 }}>
          Build project-specific views across multiple sources. Aggregate reduction potential, export combined packs, and identify correlation coverage gaps.
        </p>
      </div>

      {/* Profile selector */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        {profiles.map(p => (
          <button key={p.id} onClick={() => setActiveProfileId(p.id)} style={{
            padding: '8px 16px', borderRadius: 'var(--cds-radius-md)', cursor: 'pointer',
            fontSize: 'var(--cds-font-size-sm)', fontWeight: activeProfileId === p.id ? 600 : 400,
            border: activeProfileId === p.id ? '2px solid var(--cds-brand-teal)' : '1px solid var(--cds-color-border)',
            background: activeProfileId === p.id ? 'var(--cds-color-bg-subtle)' : 'var(--cds-color-bg)',
            color: activeProfileId === p.id ? 'var(--cds-brand-teal)' : 'var(--cds-color-fg-muted)',
          }}>
            {p.name} {p.company && <span style={{ opacity: 0.6 }}>({p.company})</span>}
          </button>
        ))}
        <button onClick={() => setShowCreate(true)} style={{ ...btnPrimary, padding: '8px 14px' }}>+ New Project</button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ ...card, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 4 }}>Project Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Q3 Optimization" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 4 }}>Organization</label>
            <input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="Optional" style={inputStyle} />
          </div>
          <button onClick={handleCreate} style={btnPrimary}>Create</button>
          <button onClick={() => setShowCreate(false)} style={btnSecondary}>Cancel</button>
        </div>
      )}

      {!activeProfile && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--cds-color-fg-muted)' }}>
          <p style={{ fontSize: 'var(--cds-font-size-lg)', marginBottom: 12 }}>No projects yet</p>
          <p style={{ fontSize: 'var(--cds-font-size-sm)' }}>Create a project to start building multi-source analysis</p>
        </div>
      )}

      {activeProfile && (
        <div>
          {/* Source selector */}
          <div style={{ ...card, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, margin: 0 }}>
                Data Sources ({activeProfile.sourceIds.length} selected)
              </h3>
              <button onClick={() => handleDelete(activeProfile.id)} style={btnDanger}>Delete Project</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {allSources.map((s: any) => {
                const selected = activeProfile.sourceIds.includes(s.id);
                return (
                  <label key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer',
                    borderRadius: 'var(--cds-radius-md)',
                    background: selected ? 'var(--cds-color-accent-subtle)' : 'var(--cds-color-bg-subtle)',
                    border: selected ? '1px solid var(--cds-brand-teal)' : '1px solid transparent',
                  }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleSource(s.id)}
                      style={{ width: 14, height: 14, accentColor: 'var(--cds-brand-teal)' }} />
                    <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg)' }}>{s.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div style={{ ...card, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, margin: 0 }}>Notes</h4>
              <button onClick={() => setEditNotes(!editNotes)} style={{ ...btnSecondary, padding: '4px 10px', fontSize: 'var(--cds-font-size-xs)' }}>
                {editNotes ? 'Done' : 'Edit'}
              </button>
            </div>
            {editNotes ? (
              <textarea value={activeProfile.notes} onChange={e => handleNotesChange(e.target.value)}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Add context about this customer's environment..." />
            ) : (
              <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0, whiteSpace: 'pre-wrap' }}>
                {activeProfile.notes || 'No notes yet — click Edit to add context'}
              </p>
            )}
          </div>

          {/* Aggregate Analysis */}
          {analysis && (
            <>
              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
                <div style={{ ...card, textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: 'var(--cds-brand-teal)' }}>{analysis.totalFields}</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Total Fields</div>
                </div>
                <div style={{ ...card, textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: '#ef4444' }}>{analysis.totalDroppable}</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Droppable</div>
                </div>
                <div style={{ ...card, textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: '#a855f7' }}>{analysis.totalGuard}</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Guard Protected</div>
                </div>
                <div style={{ ...card, textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: 'var(--cds-color-warning)' }}>{analysis.totalSecDetections}</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Security Detections</div>
                </div>
                <div style={{ ...card, textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: '#3b82f6' }}>{analysis.totalObsDetections}</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Obs Detections</div>
                </div>
              </div>

              {/* Reduction potential */}
              <div style={{ ...card, marginBottom: 24, border: '1px solid var(--cds-brand-teal)' }}>
                <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 16 }}>Aggregate Reduction Potential</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: '#ef4444' }}>
                      {analysis.totalFields > 0 ? Math.round(analysis.totalDroppable / analysis.totalFields * 100) : 0}%
                    </div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Field Drop Rate</div>
                  </div>
                  <div style={{ background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: 'var(--cds-brand-teal)' }}>
                      {analysis.costResult.routingReductionPct}%
                    </div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>SIEM Routing Reduction</div>
                  </div>
                  <div style={{ background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: '#3b82f6' }}>
                      {analysis.costResult.obsRoutingReductionPct}%
                    </div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Obs Routing Reduction</div>
                  </div>
                </div>
                <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0, lineHeight: 1.6 }}>
                  Across {activeProfile.sourceIds.length} sources: {analysis.totalDroppable} of {analysis.totalFields} total fields can be dropped.
                  Only {analysis.totalSecRequired} fields are required for SIEM detections. Remaining events route to Cribl Lake at storage-tier pricing.
                </p>
              </div>

              {/* Per-source breakdown */}
              <div style={{ ...card, marginBottom: 24 }}>
                <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 16 }}>Per-Source Breakdown</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cds-font-size-sm)' }}>
                    <thead>
                      <tr style={{ background: 'var(--cds-color-bg-subtle)' }}>
                        {['Source', 'Fields', 'Droppable', 'Drop %', 'Security Det.', 'Obs Det.', 'Guard'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--cds-color-border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.sourceAnalyses.map((sa: any) => (
                        <tr key={sa.id} style={{ borderBottom: '1px solid var(--cds-color-border-subtle)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 500 }}>{sa.name}</td>
                          <td style={{ padding: '8px 12px' }}>{sa.fields}</td>
                          <td style={{ padding: '8px 12px', color: '#ef4444' }}>{sa.droppable}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: 'var(--cds-color-bg-muted)', borderRadius: 3 }}>
                                <div style={{ width: `${sa.dropPct}%`, height: '100%', background: '#ef4444', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>{sa.dropPct}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px' }}>{sa.secDetections}</td>
                          <td style={{ padding: '8px 12px' }}>{sa.obsDetections}</td>
                          <td style={{ padding: '8px 12px', color: '#a855f7' }}>{sa.guardCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cross-source correlation fields */}
              {correlationCoverage.length > 0 && (
                <div style={{ ...card, marginBottom: 24 }}>
                  <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 8 }}>Cross-Source Correlation Fields</h3>
                  <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 16 }}>
                    Fields shared across multiple sources — these enable cross-source correlation and pivot-based investigation.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                    {correlationCoverage.map(cf => (
                      <div key={cf.field} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)' }}>
                        <code style={{ fontSize: 'var(--cds-font-size-xs)', fontFamily: 'var(--cds-font-mono)', color: 'var(--cds-color-accent)', fontWeight: 600 }}>{cf.field}</code>
                        <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>in {cf.sources.length} sources</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coverage gaps */}
              {analysis.coverageGaps.length > 0 && (
                <div style={{ ...card, marginBottom: 24, borderColor: 'var(--cds-color-warning)' }}>
                  <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 12, color: 'var(--cds-color-warning)' }}>Coverage Gaps</h3>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', lineHeight: 2 }}>
                    {analysis.coverageGaps.map((gap, i) => <li key={i}>{gap}</li>)}
                  </ul>
                </div>
              )}

              {/* Destinations */}
              <div style={{ ...card, marginBottom: 24 }}>
                <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 12 }}>Relevant Destinations</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {analysis.destinations.map(d => <span key={d} style={tag('var(--cds-color-success-subtle)', 'var(--cds-color-success)')}>{d}</span>)}
                </div>
              </div>

              {/* Export combined pack */}
              <div style={{ ...card, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 4 }}>Export Combined Pack</h3>
                    <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0 }}>
                      Single pipeline YAML with optimization functions for all {activeProfile.sourceIds.length} selected sources
                    </p>
                  </div>
                  <button onClick={downloadCombinedPack} style={btnPrimary}>Download Combined YAML</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
