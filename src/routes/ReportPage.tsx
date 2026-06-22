// @ts-nocheck
import React, { useState, useMemo, useRef } from 'react';
import { dataSources } from '../data/sources';
import { fieldMatrix } from '../data/fields';
import { guardPolicies } from '../data/guardPolicies';
import { securityDetections as secDetData } from '../data/securityDetections';
import { observabilityDetections as obsDetData } from '../data/observabilityDetections';
import { routingBlueprints } from '../data/routing';
import { calculateFieldReduction, calculateCostSavings } from '../utils/costCalc';

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid var(--cds-color-border)',
  borderRadius: 'var(--cds-radius-md)', fontSize: 'var(--cds-font-size-sm)',
  background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)',
};
const btnPrimary: React.CSSProperties = {
  padding: '10px 20px', border: 'none', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, cursor: 'pointer',
  background: 'var(--cds-brand-teal)', color: '#fff',
};
const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: 500, cursor: 'pointer',
  background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)',
};
const tag = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
  fontSize: '11px', fontWeight: 500, background: bg, color,
});

const allSources = dataSources.flatMap((c: any) => c.sources).filter((s: any) => s.status === 'available');

function ReportContent({ sourceId, customerName, showCost, eps, eventSize, costPerGB }: {
  sourceId: string; customerName: string; showCost: boolean; eps: number; eventSize: number; costPerGB: number;
}) {
  const source = allSources.find((s: any) => s.id === sourceId);
  const fields: any[] = (fieldMatrix as any)[sourceId] || [];
  const guardPolicy = (guardPolicies as any)[sourceId];
  const secDetections: any[] = (secDetData as any)[sourceId] || [];
  const obsDetections: any[] = (obsDetData as any)[sourceId] || [];
  const routing = (routingBlueprints as any)[sourceId];

  const droppable = fields.filter(f => f.canDrop === 'Yes');
  const secRequired = fields.filter(f => f.securitySiem === 'Yes');
  const obsFields = fields.filter(f => f.observability === 'Yes' || f.observability === 'Sometimes');
  const guardFields = fields.filter(f => f.guardAction && f.guardAction !== 'None');

  const fieldReduction = calculateFieldReduction(fields);
  const cost = showCost ? calculateCostSavings(eps, eventSize, costPerGB, fieldReduction) : null;

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a', maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #00b4a0', paddingBottom: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>
              {source?.name || sourceId}
            </h1>
            <p style={{ fontSize: 14, color: '#666', margin: '4px 0 0' }}>Dual-Use Resource Bundle Summary</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            {customerName && <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{customerName}</div>}
            <div style={{ fontSize: 12, color: '#888' }}>Cribl | {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Executive summary */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#00b4a0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Executive Summary</h2>
        <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, margin: 0 }}>
          {source?.name} provides <strong>{source?.useCases?.length || 0} use cases</strong> across{' '}
          <strong>{source?.personas?.length || 0} team personas</strong>. With Cribl, you can optimize this source
          by dropping {droppable.length} of {fields.length} fields ({fields.length > 0 ? Math.round(droppable.length / fields.length * 100) : 0}% reduction),
          while protecting {guardFields.length} sensitive fields with Cribl Guard and preserving all {secRequired.length} security-critical
          and {obsFields.length} observability-required fields.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { value: fields.length, label: 'Total Fields', color: '#00b4a0' },
          { value: droppable.length, label: 'Droppable', color: '#ef4444' },
          { value: secRequired.length, label: 'Security Required', color: '#f59e0b' },
          { value: guardFields.length, label: 'Guard Protected', color: '#a855f7' },
        ].map(s => (
          <div key={s.label} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Cost savings */}
      {cost && (
        <div style={{ background: '#f0fdf9', border: '1px solid #00b4a0', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#00b4a0', marginBottom: 10, margin: '0 0 10px' }}>Projected Cost Savings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#666' }}>Current Monthly</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>${Math.round(cost.monthlyCostRaw).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#666' }}>Optimized Monthly</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#00b4a0' }}>${Math.round(cost.optimizedTotal).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#666' }}>Monthly Savings</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#ef4444' }}>${Math.round(cost.savings).toLocaleString()} ({Math.round(cost.savingsPct)}%)</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
            Based on {eps.toLocaleString()} EPS, {eventSize}B avg event, ${costPerGB}/GB SIEM, $0.023/GB Lake
          </div>
        </div>
      )}

      {/* Detection coverage */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#00b4a0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Detection Coverage</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Security ({secDetections.length})</h3>
            {secDetections.slice(0, 8).map((d: any) => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 12, color: '#444' }}>{d.name}</span>
                <span style={tag(d.severity === 'Critical' ? '#fef2f2' : d.severity === 'High' ? '#fffbeb' : '#f3f4f6', d.severity === 'Critical' ? '#ef4444' : d.severity === 'High' ? '#f59e0b' : '#666')}>
                  {d.severity || 'Info'}
                </span>
              </div>
            ))}
            {secDetections.length > 8 && <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>+{secDetections.length - 8} more</div>}
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Observability ({obsDetections.length})</h3>
            {obsDetections.slice(0, 8).map((d: any) => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 12, color: '#444' }}>{d.name}</span>
                <span style={tag('#eff6ff', '#3b82f6')}>{d.category || 'Monitor'}</span>
              </div>
            ))}
            {obsDetections.length > 8 && <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>+{obsDetections.length - 8} more</div>}
          </div>
        </div>
      </div>

      {/* Guard posture */}
      {guardPolicy && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#00b4a0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Data Protection (Cribl Guard)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Sensitive Data Types</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {guardPolicy.sensitiveDataTypes?.map((t: string) => <span key={t} style={tag('#faf5ff', '#a855f7')}>{t}</span>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Compliance Frameworks</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {guardPolicy.complianceFrameworks?.map((f: string) => <span key={f} style={tag('#f0fdf4', '#16a34a')}>{f}</span>)}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
            Estimated {guardPolicy.estimatedSensitivePercent}% of fields contain sensitive data. Recommended placement: {guardPolicy.recommendedPlacement}.
          </div>
        </div>
      )}

      {/* Routing strategy */}
      {routing && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#00b4a0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Routing Strategy</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {routing.destinations?.slice(0, 4).map((d: any) => (
              <div key={d.type} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, flex: '1 1 160px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#00b4a0', marginBottom: 4 }}>{d.type}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{d.fieldCount} fields | {d.estimatedReduction}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended fields to drop */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#00b4a0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recommended Field Drops ({droppable.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {droppable.slice(0, 30).map(f => (
            <div key={f.field} style={{ fontSize: 11, fontFamily: 'monospace', color: '#ef4444', padding: '2px 4px' }}>{f.field}</div>
          ))}
        </div>
        {droppable.length > 30 && <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>+{droppable.length - 30} more fields</div>}
      </div>

      {/* Cribl products */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#00b4a0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cribl Products Required</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {source?.criblProducts?.map((p: string) => <span key={p} style={tag('#ecfdf5', '#00b4a0')}>{p}</span>)}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#888' }}>
          Generated from Dual-Use Bundles App | Cribl Customer Success Engineering
        </div>
        <div style={{ fontSize: 11, color: '#888' }}>
          {new Date().toLocaleDateString()} | {source?.name}
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const [selectedSource, setSelectedSource] = useState(allSources[0]?.id || 'palo-alto-traffic');
  const [customerName, setCustomerName] = useState('');
  const [showCost, setShowCost] = useState(true);
  const [eps, setEps] = useState(5000);
  const [eventSize, setEventSize] = useState(800);
  const [costPerGB, setCostPerGB] = useState(3.5);
  const [showPreview, setShowPreview] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !reportRef.current) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>${allSources.find(s => s.id === selectedSource)?.name} - Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>
      ${reportRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  }

  function handleCopyHtml() {
    if (!reportRef.current) return;
    navigator.clipboard.writeText(reportRef.current.innerHTML);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>Shareable Report</h2>
        <p style={{ fontSize: 'var(--cds-font-size-base)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.6 }}>
          Generate a print-ready one-pager for customer leave-behinds. Includes field analysis, cost projections, detection coverage, Guard posture, and routing strategy.
        </p>
      </div>

      {/* Config */}
      <div style={{ background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)', borderRadius: 'var(--cds-radius-lg)', padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginBottom: 4 }}>Data Source</label>
            <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
              {dataSources.map((cat: any) => (
                <optgroup key={cat.category} label={`${cat.icon} ${cat.category}`}>
                  {cat.sources.filter((s: any) => s.status === 'available').map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginBottom: 4 }}>Customer Name (optional)</label>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Acme Corp"
              style={{ ...selectStyle, width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginBottom: 4 }}>
              <input type="checkbox" checked={showCost} onChange={e => setShowCost(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: 'var(--cds-brand-teal)' }} />
              Include Cost Projections
            </label>
            {showCost && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input type="number" value={eps} onChange={e => setEps(Number(e.target.value))} placeholder="EPS" style={{ ...selectStyle, width: 80 }} title="Events per second" />
                <input type="number" value={eventSize} onChange={e => setEventSize(Number(e.target.value))} placeholder="Size" style={{ ...selectStyle, width: 70 }} title="Avg event size (bytes)" />
                <input type="number" value={costPerGB} onChange={e => setCostPerGB(Number(e.target.value))} step="0.5" placeholder="$/GB" style={{ ...selectStyle, width: 70 }} title="SIEM cost per GB" />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setShowPreview(true)} style={btnPrimary}>Generate Report</button>
          {showPreview && <button onClick={handlePrint} style={btnSecondary}>Print / Save as PDF</button>}
          {showPreview && <button onClick={handleCopyHtml} style={btnSecondary}>Copy HTML</button>}
        </div>
      </div>

      {/* Report preview */}
      {showPreview && (
        <div style={{ border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-lg)', overflow: 'hidden', background: '#fff' }}>
          <div ref={reportRef}>
            <ReportContent sourceId={selectedSource} customerName={customerName} showCost={showCost} eps={eps} eventSize={eventSize} costPerGB={costPerGB} />
          </div>
        </div>
      )}
    </div>
  );
}
