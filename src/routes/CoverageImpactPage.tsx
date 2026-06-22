// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { dataSources } from '../data/sources';
import { fieldMatrix } from '../data/fields';
import { securityDetections as secDetData } from '../data/securityDetections';
import { observabilityDetections as obsDetData } from '../data/observabilityDetections';

const card: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: 20, boxShadow: 'var(--cds-shadow-sm)',
};
const tag = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--cds-radius-sm)',
  fontSize: 'var(--cds-font-size-xs)', fontWeight: 500, background: bg, color,
});
const btnPrimary: React.CSSProperties = {
  padding: '6px 14px', border: 'none', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, cursor: 'pointer',
  background: 'var(--cds-brand-teal)', color: '#fff',
};
const btnSecondary: React.CSSProperties = {
  padding: '6px 14px', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: 500, cursor: 'pointer',
  background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)',
};
const selectStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid var(--cds-color-border)',
  borderRadius: 'var(--cds-radius-md)', fontSize: 'var(--cds-font-size-sm)',
  background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)',
};

const allSources = dataSources.flatMap((c: any) => c.sources).filter((s: any) => s.status === 'available');

export default function CoverageImpactPage() {
  const [selectedSource, setSelectedSource] = useState(allSources[0]?.id || 'palo-alto-traffic');
  const [droppedFields, setDroppedFields] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'droppable' | 'security' | 'observability'>('all');

  const source = allSources.find((s: any) => s.id === selectedSource);
  const fields: any[] = (fieldMatrix as any)[selectedSource] || [];
  const secDetections: any[] = (secDetData as any)[selectedSource] || [];
  const obsDetections: any[] = (obsDetData as any)[selectedSource] || [];

  // Reset dropped fields when source changes
  function handleSourceChange(sid: string) {
    setSelectedSource(sid);
    setDroppedFields(new Set());
  }

  function toggleField(fieldName: string) {
    setDroppedFields(prev => {
      const next = new Set(prev);
      next.has(fieldName) ? next.delete(fieldName) : next.add(fieldName);
      return next;
    });
  }

  function dropAllDroppable() {
    const droppable = fields.filter(f => f.canDrop === 'Yes').map(f => f.field);
    setDroppedFields(new Set(droppable));
  }

  function clearAll() { setDroppedFields(new Set()); }

  // Compute impact of dropped fields on detections
  const impact = useMemo(() => {
    const secImpact = secDetections.map((d: any) => {
      const required = new Set(d.requiredFields || []);
      const missing = [...required].filter(f => droppedFields.has(f));
      const coverage = required.size > 0 ? Math.round(((required.size - missing.length) / required.size) * 100) : 100;
      const broken = missing.length > 0;
      return { ...d, missing, coverage, broken, type: 'security' };
    });

    const obsImpact = obsDetections.map((d: any) => {
      const required = new Set(d.requiredFields || []);
      const missing = [...required].filter(f => droppedFields.has(f));
      const coverage = required.size > 0 ? Math.round(((required.size - missing.length) / required.size) * 100) : 100;
      const broken = missing.length > 0;
      return { ...d, missing, coverage, broken, type: 'observability' };
    });

    const allImpact = [...secImpact, ...obsImpact];
    const brokenCount = allImpact.filter(d => d.broken).length;
    const totalCount = allImpact.length;
    const healthyCount = totalCount - brokenCount;

    return { secImpact, obsImpact, brokenCount, healthyCount, totalCount };
  }, [droppedFields, secDetections, obsDetections]);

  // Filter fields displayed
  const filteredFields = useMemo(() => {
    switch (filterMode) {
      case 'droppable': return fields.filter(f => f.canDrop === 'Yes');
      case 'security': return fields.filter(f => f.securitySiem === 'Yes');
      case 'observability': return fields.filter(f => f.observability === 'Yes' || f.observability === 'Sometimes');
      default: return fields;
    }
  }, [fields, filterMode]);

  const droppedFieldsList = [...droppedFields];
  const volumeReduction = fields.length > 0 ? Math.round(droppedFields.size / fields.length * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>Coverage Impact Analysis</h2>
        <p style={{ fontSize: 'var(--cds-font-size-base)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.6 }}>
          Toggle fields on/off to see how dropping them affects detection coverage in real-time. Answer "what do I lose if I drop these fields?"
        </p>
      </div>

      {/* Source selector */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <select value={selectedSource} onChange={e => handleSourceChange(e.target.value)} style={{ ...selectStyle, minWidth: 260 }}>
          {dataSources.map((cat: any) => (
            <optgroup key={cat.category} label={`${cat.icon} ${cat.category}`}>
              {cat.sources.filter((s: any) => s.status === 'available').map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </optgroup>
          ))}
        </select>
        <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{fields.length} fields</span>
        <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>{secDetections.length + obsDetections.length} detections</span>
      </div>

      {/* Impact summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ ...card, textAlign: 'center', padding: 16, borderColor: droppedFields.size > 0 ? '#ef4444' : undefined }}>
          <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: '#ef4444' }}>{droppedFields.size}</div>
          <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Fields Dropped</div>
        </div>
        <div style={{ ...card, textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: 'var(--cds-brand-teal)' }}>{volumeReduction}%</div>
          <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Volume Reduction</div>
        </div>
        <div style={{ ...card, textAlign: 'center', padding: 16, borderColor: impact.brokenCount > 0 ? 'var(--cds-color-warning)' : undefined }}>
          <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: impact.brokenCount > 0 ? 'var(--cds-color-warning)' : 'var(--cds-color-success)' }}>
            {impact.brokenCount}
          </div>
          <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Detections Affected</div>
        </div>
        <div style={{ ...card, textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: 'var(--cds-color-success)' }}>{impact.healthyCount}</div>
          <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Detections Healthy</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Field toggles */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, margin: 0 }}>Fields</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={dropAllDroppable} style={{ ...btnSecondary, padding: '4px 10px', fontSize: 'var(--cds-font-size-xs)' }}>Drop All Droppable</button>
              <button onClick={clearAll} style={{ ...btnSecondary, padding: '4px 10px', fontSize: 'var(--cds-font-size-xs)' }}>Reset</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['all', 'droppable', 'security', 'observability'] as const).map(mode => (
              <button key={mode} onClick={() => setFilterMode(mode)} style={{
                padding: '4px 10px', border: filterMode === mode ? '2px solid var(--cds-brand-teal)' : '1px solid var(--cds-color-border)',
                borderRadius: 'var(--cds-radius-sm)', cursor: 'pointer', fontSize: 'var(--cds-font-size-xs)',
                fontWeight: filterMode === mode ? 600 : 400, background: 'var(--cds-color-bg)',
                color: filterMode === mode ? 'var(--cds-brand-teal)' : 'var(--cds-color-fg-muted)',
              }}>
                {mode === 'all' ? `All (${fields.length})` : mode === 'droppable' ? `Droppable (${fields.filter(f => f.canDrop === 'Yes').length})` : mode === 'security' ? `Security (${fields.filter(f => f.securitySiem === 'Yes').length})` : `Obs (${fields.filter(f => f.observability === 'Yes' || f.observability === 'Sometimes').length})`}
              </button>
            ))}
          </div>

          <div style={{ maxHeight: 600, overflowY: 'auto', border: '1px solid var(--cds-color-border-subtle)', borderRadius: 'var(--cds-radius-md)' }}>
            {filteredFields.map((f: any) => {
              const isDropped = droppedFields.has(f.field);
              return (
                <div key={f.field} onClick={() => toggleField(f.field)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer',
                  background: isDropped ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                  borderBottom: '1px solid var(--cds-color-border-subtle)',
                  opacity: isDropped ? 0.6 : 1,
                }}>
                  <input type="checkbox" checked={!isDropped} readOnly
                    style={{ width: 14, height: 14, accentColor: 'var(--cds-brand-teal)', pointerEvents: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <code style={{ fontSize: 'var(--cds-font-size-xs)', fontFamily: 'var(--cds-font-mono)', color: isDropped ? '#ef4444' : 'var(--cds-color-accent)', textDecoration: isDropped ? 'line-through' : 'none' }}>
                      {f.field}
                    </code>
                    <div style={{ fontSize: 10, color: 'var(--cds-color-fg-subtle)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.description}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    {f.securitySiem === 'Yes' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cds-color-warning)' }} title="Security required" />}
                    {(f.observability === 'Yes' || f.observability === 'Sometimes') && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} title="Observability" />}
                    {f.canDrop === 'Yes' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} title="Safe to drop" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 8, fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cds-color-warning)' }} /> Security</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> Observability</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> Droppable</span>
          </div>
        </div>

        {/* Right: Detection impact */}
        <div>
          <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 12 }}>Detection Impact</h3>

          {droppedFields.size === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--cds-color-fg-muted)' }}>
              <p style={{ fontSize: 'var(--cds-font-size-base)', marginBottom: 8 }}>Click fields on the left to simulate dropping them</p>
              <p style={{ fontSize: 'var(--cds-font-size-sm)' }}>You'll see which detections break in real-time</p>
            </div>
          )}

          {droppedFields.size > 0 && (
            <div style={{ maxHeight: 650, overflowY: 'auto' }}>
              {/* Broken detections first */}
              {[...impact.secImpact, ...impact.obsImpact].filter(d => d.broken).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-danger)', marginBottom: 8 }}>
                    Affected Detections ({[...impact.secImpact, ...impact.obsImpact].filter(d => d.broken).length})
                  </div>
                  {[...impact.secImpact, ...impact.obsImpact].filter(d => d.broken).map(d => (
                    <div key={d.id} style={{ ...card, marginBottom: 8, padding: 14, borderColor: 'var(--cds-color-danger)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: 'var(--cds-color-danger)', fontSize: 'var(--cds-font-size-sm)' }}>&#9888;</span>
                          <span style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600 }}>{d.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={tag(d.type === 'security' ? 'var(--cds-color-warning-subtle)' : 'rgba(59,130,246,0.1)', d.type === 'security' ? 'var(--cds-color-warning)' : '#3b82f6')}>
                            {d.type}
                          </span>
                          <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-danger)', fontWeight: 600 }}>{d.coverage}%</span>
                        </div>
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <div style={{ height: 4, background: 'var(--cds-color-bg-muted)', borderRadius: 2 }}>
                          <div style={{ width: `${d.coverage}%`, height: '100%', background: d.coverage > 50 ? 'var(--cds-color-warning)' : 'var(--cds-color-danger)', borderRadius: 2 }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginTop: 6 }}>
                        Missing: {d.missing.map((f: string) => (
                          <code key={f} style={{ color: '#ef4444', marginRight: 4, fontFamily: 'var(--cds-font-mono)' }}>{f}</code>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Healthy detections */}
              {[...impact.secImpact, ...impact.obsImpact].filter(d => !d.broken).length > 0 && (
                <div>
                  <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-success)', marginBottom: 8 }}>
                    Healthy Detections ({[...impact.secImpact, ...impact.obsImpact].filter(d => !d.broken).length})
                  </div>
                  {[...impact.secImpact, ...impact.obsImpact].filter(d => !d.broken).map(d => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', marginBottom: 4, borderRadius: 'var(--cds-radius-sm)', background: 'var(--cds-color-bg-subtle)' }}>
                      <span style={{ color: 'var(--cds-color-success)', fontSize: 'var(--cds-font-size-xs)' }}>&#10003;</span>
                      <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', flex: 1 }}>{d.name}</span>
                      <span style={tag(d.type === 'security' ? 'var(--cds-color-warning-subtle)' : 'rgba(59,130,246,0.1)', d.type === 'security' ? 'var(--cds-color-warning)' : '#3b82f6')}>
                        {d.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
