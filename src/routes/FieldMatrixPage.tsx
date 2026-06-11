import React, { useState, useMemo } from 'react';
import { dataSources } from '../data/sources';
import { fieldMatrix } from '../data/fields';

const tag = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--cds-radius-sm)',
  fontSize: 'var(--cds-font-size-xs)', fontWeight: 500, background: bg, color,
});

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

const inputStyle: React.CSSProperties = {
  ...selectStyle, minWidth: 240,
};

export default function FieldMatrixPage() {
  const sources = useMemo(() =>
    dataSources.flatMap((c: any) => c.sources).filter((s: any) => s.status === 'available'),
    []
  );

  const [selectedSource, setSelectedSource] = useState(sources[0]?.id || 'palo-alto-traffic');
  const [search, setSearch] = useState('');
  const [filterDest, setFilterDest] = useState('all');
  const [filterDroppable, setFilterDroppable] = useState('all');

  const fields: any[] = (fieldMatrix as any)[selectedSource] || [];

  const filteredFields = useMemo(() => {
    return fields.filter((f: any) => {
      if (search && !f.field.toLowerCase().includes(search.toLowerCase()) && !f.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterDest === 'security' && f.securitySiem !== 'Yes') return false;
      if (filterDest === 'observability' && f.observability !== 'Yes') return false;
      if (filterDest === 'both' && !(f.securitySiem === 'Yes' && (f.observability === 'Yes' || f.observability === 'Sometimes'))) return false;
      if (filterDroppable === 'droppable' && f.canDrop !== 'Yes') return false;
      if (filterDroppable === 'required' && f.canDrop !== 'No') return false;
      return true;
    });
  }, [fields, search, filterDest, filterDroppable]);

  const securityCount = fields.filter((f: any) => f.securitySiem === 'Yes').length;
  const obsCount = fields.filter((f: any) => f.observability === 'Yes' || f.observability === 'Sometimes').length;
  const droppableCount = fields.filter((f: any) => f.canDrop === 'Yes').length;
  const maskableCount = fields.filter((f: any) => f.canMask === 'Yes' || f.canMask === 'Sometimes').length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>Field Matrix Explorer</h2>
        <p style={{ fontSize: 'var(--cds-font-size-base)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.6 }}>
          Interactive field-by-field guidance showing which fields are needed for each destination, which can be dropped, and which require masking.
        </p>
      </div>

      {/* Source selector */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} style={{ ...selectStyle, minWidth: 260 }}>
          {sources.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>
          {sources.find((s: any) => s.id === selectedSource)?.name || selectedSource}
        </span>
        <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>
          {fields.length} fields
        </span>
      </div>

      {fields.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--cds-color-fg-muted)' }}>
          <h3 style={{ fontSize: 'var(--cds-font-size-lg)', marginBottom: 8 }}>No fields available</h3>
          <p>Field matrix data is not available for this source.</p>
        </div>
      )}

      {fields.length > 0 && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600, color: 'var(--cds-brand-teal)' }}>{fields.length}</div><div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Total Fields</div></div>
            <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600, color: 'var(--cds-brand-teal)' }}>{securityCount}</div><div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Security SIEM</div></div>
            <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600, color: 'var(--cds-color-accent)' }}>{obsCount}</div><div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Observability</div></div>
            <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600, color: 'var(--cds-color-danger)' }}>{droppableCount}</div><div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Can Drop</div></div>
            <div style={statCard}><div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600, color: 'var(--cds-color-warning)' }}>{maskableCount}</div><div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Can Mask</div></div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search fields by name or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={inputStyle}
            />
            <select value={filterDest} onChange={e => setFilterDest(e.target.value)} style={selectStyle}>
              <option value="all">All Destinations</option>
              <option value="security">Security SIEM Required</option>
              <option value="observability">Observability Required</option>
              <option value="both">Both Security + Observability</option>
            </select>
            <select value={filterDroppable} onChange={e => setFilterDroppable(e.target.value)} style={selectStyle}>
              <option value="all">All Fields</option>
              <option value="droppable">Can Drop</option>
              <option value="required">Cannot Drop</option>
            </select>
            <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>
              {filteredFields.length} of {fields.length} fields
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-lg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cds-font-size-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--cds-color-bg-subtle)' }}>
                  {['Field', 'Description', 'Security SIEM', 'Observability', 'Full Fidelity', 'Can Drop', 'Can Mask', 'Notes'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--cds-color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFields.map((f: any) => (
                  <tr key={f.field} style={{ borderBottom: '1px solid var(--cds-color-border-subtle)' }}>
                    <td style={{ padding: '8px 12px' }}><code style={{ color: 'var(--cds-color-accent)', fontFamily: 'var(--cds-font-mono)', fontSize: 'var(--cds-font-size-xs)' }}>{f.field}</code></td>
                    <td style={{ padding: '8px 12px', color: 'var(--cds-color-fg-muted)', maxWidth: 200 }}>{f.description}</td>
                    <td style={{ padding: '8px 12px', color: f.securitySiem === 'Yes' ? 'var(--cds-color-success)' : f.securitySiem === 'Sometimes' ? 'var(--cds-color-warning)' : 'var(--cds-color-fg-subtle)' }}>{f.securitySiem}</td>
                    <td style={{ padding: '8px 12px', color: f.observability === 'Yes' ? 'var(--cds-color-success)' : f.observability === 'Sometimes' ? 'var(--cds-color-warning)' : 'var(--cds-color-fg-subtle)' }}>{f.observability}</td>
                    <td style={{ padding: '8px 12px', color: f.fullFidelity === 'Yes' ? 'var(--cds-color-success)' : 'var(--cds-color-fg-subtle)' }}>{f.fullFidelity}</td>
                    <td style={{ padding: '8px 12px', color: f.canDrop === 'Yes' ? 'var(--cds-color-danger)' : f.canDrop === 'Sometimes' ? 'var(--cds-color-warning)' : 'var(--cds-color-fg-subtle)' }}>{f.canDrop}</td>
                    <td style={{ padding: '8px 12px', color: f.canMask === 'Yes' ? 'var(--cds-color-warning)' : f.canMask === 'Sometimes' ? 'var(--cds-color-warning)' : 'var(--cds-color-fg-subtle)' }}>{f.canMask}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--cds-color-fg-subtle)', maxWidth: 160 }}>{f.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
