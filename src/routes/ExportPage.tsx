import React, { useState, useMemo } from 'react';
import { dataSources } from '../data/sources';
import { fieldMatrix } from '../data/fields';
import { routingBlueprints } from '../data/routing';
import { securityDetections as secDetData } from '../data/securityDetections';
import { observabilityDetections as obsDetData } from '../data/observabilityDetections';
import { enrichments as enrichmentDataAll } from '../data/enrichments';

const card: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: 20, boxShadow: 'var(--cds-shadow-sm)',
};

const tag = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--cds-radius-sm)',
  fontSize: 'var(--cds-font-size-xs)', fontWeight: 500, background: bg, color,
});

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid var(--cds-color-border)',
  borderRadius: 'var(--cds-radius-md)', fontSize: 'var(--cds-font-size-sm)',
  background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)',
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

export default function ExportPage() {
  const sources = useMemo(() =>
    dataSources.flatMap((c: any) => c.sources).filter((s: any) => s.status === 'available'), []
  );
  const [selectedSource, setSelectedSource] = useState(sources[0]?.id || 'palo-alto-traffic');
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'fields', 'securityDetections', 'observabilityDetections', 'routing', 'enrichments'
  ]);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const sections = [
    { id: 'fields', name: 'Field Matrix', description: 'Complete field-by-field guidance for all destinations' },
    { id: 'securityDetections', name: 'Security Detections', description: 'All security detection recommendations with required fields' },
    { id: 'observabilityDetections', name: 'Observability Detections', description: 'All observability detection recommendations' },
    { id: 'routing', name: 'Routing Blueprint', description: 'Data flow, destination strategy, and pack functions' },
    { id: 'enrichments', name: 'Enrichments', description: 'Stream-time and search-time enrichment recommendations' },
  ];

  function toggleSection(id: string) {
    setSelectedSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  function handleExport(format: string) {
    setExportStatus(null);
    const fields = (fieldMatrix as any)[selectedSource] || [];
    const secDets = (secDetData as any)[selectedSource] || [];
    const obsDets = (obsDetData as any)[selectedSource] || [];
    const routing = (routingBlueprints as any)[selectedSource] || null;
    const enrichments = (enrichmentDataAll as any)[selectedSource] || null;

    try {
      if (format === 'json') {
        const bundle: any = { source: selectedSource, exportedAt: new Date().toISOString() };
        if (selectedSections.includes('fields')) bundle.fields = fields;
        if (selectedSections.includes('securityDetections')) bundle.securityDetections = secDets;
        if (selectedSections.includes('observabilityDetections')) bundle.observabilityDetections = obsDets;
        if (selectedSections.includes('routing')) bundle.routing = routing;
        if (selectedSections.includes('enrichments')) bundle.enrichments = enrichments;
        downloadBlob(JSON.stringify(bundle, null, 2), `${selectedSource}-bundle.json`, 'application/json');
        setExportStatus('JSON bundle downloaded');
      } else if (format === 'cribl-pack') {
        let yaml = `# Cribl Pack for ${selectedSource}\n# Generated: ${new Date().toISOString()}\n\n`;
        if (routing) {
          yaml += `pipeline:\n  description: "${routing.sourceDescription}"\n  functions:\n`;
          (routing.packFunctions || []).forEach((fn: any, i: number) => {
            yaml += `    - id: step_${i + 1}\n      name: "${fn.name}"\n      description: "${fn.description}"\n\n`;
          });
          yaml += `\nroutes:\n`;
          routing.destinations.forEach((dest: any) => {
            yaml += `  - name: "${dest.type}"\n    strategy: "${dest.strategy}"\n    field_count: ${dest.fieldCount}\n    reduction: "${dest.estimatedReduction}"\n    filters:\n`;
            dest.filters.forEach((f: string) => { yaml += `      - "${f}"\n`; });
            yaml += `\n`;
          });
        }
        downloadBlob(yaml, `${selectedSource}-cribl-pack.yml`, 'text/yaml');
        setExportStatus('Cribl Pack YAML downloaded');
      } else if (format === 'csv-fields') {
        let csv = 'Field,Description,Security SIEM,Observability,Full Fidelity,Can Drop,Can Mask,Notes\n';
        fields.forEach((f: any) => {
          csv += `"${f.field}","${f.description}","${f.securitySiem}","${f.observability}","${f.fullFidelity}","${f.canDrop}","${f.canMask}","${f.notes}"\n`;
        });
        downloadBlob(csv, `${selectedSource}-field-matrix.csv`, 'text/csv');
        setExportStatus('CSV field matrix downloaded');
      } else if (format === 'detection-yaml') {
        let yaml = `# Detection YAML for ${selectedSource}\n# Generated: ${new Date().toISOString()}\n\n`;
        const allDets = [...(selectedSections.includes('securityDetections') ? secDets : []), ...(selectedSections.includes('observabilityDetections') ? obsDets : [])];
        allDets.forEach((d: any) => {
          yaml += `- id: ${d.id}\n  name: "${d.name}"\n  objective: "${d.objective}"\n  severity: "${d.severity || d.category || ''}"\n`;
          if (d.mitre && d.mitre.length > 0) {
            yaml += `  mitre:\n`;
            d.mitre.forEach((m: string) => { yaml += `    - "${m}"\n`; });
          }
          yaml += `  required_fields:\n`;
          d.requiredFields.forEach((f: string) => { yaml += `    - ${f}\n`; });
          yaml += `  detection_logic: |\n    ${d.detectionLogic}\n\n`;
        });
        downloadBlob(yaml, `${selectedSource}-detections.yml`, 'text/yaml');
        setExportStatus('Detection YAML downloaded');
      }
    } catch {
      setExportStatus('Export failed — check that the source has data available.');
    }
  }

  const selectedSourceName = sources.find((s: any) => s.id === selectedSource)?.name || selectedSource;

  const exportOptions = [
    { id: 'json', name: 'JSON Bundle', description: 'Machine-readable JSON with all selected sections. Useful for automation and programmatic consumption.', tagText: 'Recommended', tagColor: 'var(--cds-brand-teal)' },
    { id: 'cribl-pack', name: 'Cribl Pack (YAML)', description: 'Ready-to-import Cribl Pack with pipelines, routes, and field removal recommendations.', tagText: 'Import via Stream UI', tagColor: 'var(--cds-brand-teal)' },
    { id: 'csv-fields', name: 'CSV Field Matrix', description: 'Spreadsheet-friendly format for sharing field recommendations with stakeholders.', tagText: 'Stakeholder-Friendly', tagColor: 'var(--cds-color-accent)' },
    { id: 'detection-yaml', name: 'Detection YAML', description: 'Sigma-compatible YAML detection rules with MITRE tags and Cribl Search queries.', tagText: 'Sigma-Compatible', tagColor: 'var(--cds-color-accent)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>Export Bundle</h2>
        <p style={{ fontSize: 'var(--cds-font-size-base)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.6 }}>
          Export bundle data for deployment, stakeholder review, or SIEM import. Select a source and choose your format.
        </p>
      </div>

      {/* Source selector */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} style={{ ...selectStyle, minWidth: 260 }}>
          {sources.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>{selectedSourceName}</span>
      </div>

      {/* Section selection */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 16 }}>Select Sections to Export</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {sections.map(s => (
            <div
              key={s.id}
              style={{ ...card, cursor: 'pointer', borderColor: selectedSections.includes(s.id) ? 'var(--cds-brand-teal)' : undefined }}
              onClick={() => toggleSection(s.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={selectedSections.includes(s.id)} onChange={() => toggleSection(s.id)} style={{ width: 16, height: 16, accentColor: 'var(--cds-brand-teal)', cursor: 'pointer' }} />
                <div>
                  <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 4 }}>{s.name}</h4>
                  <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0 }}>{s.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export format options */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 16 }}>Export Format</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {exportOptions.map(opt => (
            <div
              key={opt.id}
              style={{ ...card, cursor: 'pointer', transition: 'var(--cds-transition-normal)' }}
              onClick={() => handleExport(opt.id)}
            >
              <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 8 }}>{opt.name}</h4>
              <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 10, lineHeight: 1.5 }}>{opt.description}</p>
              <span style={tag('var(--cds-color-accent-subtle)', opt.tagColor)}>{opt.tagText}</span>
            </div>
          ))}
          {/* Coming soon items */}
          <div style={{ ...card, opacity: 0.5, cursor: 'default' }}>
            <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 8 }}>PDF Guide</h4>
            <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 10, lineHeight: 1.5 }}>Customer-facing PDF document with architecture diagrams and deployment guide.</p>
            <span style={tag('var(--cds-color-warning-subtle)', 'var(--cds-color-warning)')}>Coming Soon</span>
          </div>
          <div style={{ ...card, opacity: 0.5, cursor: 'default' }}>
            <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 8 }}>Slide Summary</h4>
            <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 10, lineHeight: 1.5 }}>Executive-ready slide content summarizing value proposition and key metrics.</p>
            <span style={tag('var(--cds-color-warning-subtle)', 'var(--cds-color-warning)')}>Coming Soon</span>
          </div>
        </div>
      </div>

      {exportStatus && <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-brand-teal)', marginTop: 16 }}>{exportStatus}</p>}
    </div>
  );
}
