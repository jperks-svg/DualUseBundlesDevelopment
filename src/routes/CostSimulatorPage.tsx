import React, { useState, useMemo } from 'react';
import { dataSources } from '../data/sources';

const card: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: 20, boxShadow: 'var(--cds-shadow-sm)',
};

const tag = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--cds-radius-sm)',
  fontSize: 'var(--cds-font-size-xs)', fontWeight: 500, background: bg, color,
});

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', width: '100%', background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)',
};

const allSources = dataSources.flatMap((c: any) => c.sources);

function parseEPS(epsStr: string): number {
  const match = epsStr.match(/([\d,]+)/);
  if (!match) return 5000;
  return parseInt(match[1].replace(/,/g, ''), 10);
}

function getReductionPercent(source: any): number {
  const desc = (source.jobsToBeDone || [])
    .flatMap((c: any) => c.jobs)
    .map((j: any) => j.job)
    .join(' ');
  const match = desc.match(/(\d+)-?(\d+)?%/);
  if (match) return match[2] ? parseInt(match[2], 10) : parseInt(match[1], 10);
  return 50;
}

export default function CostSimulatorPage() {
  const [selectedSource, setSelectedSource] = useState(allSources[0]?.id || '');
  const [customEPS, setCustomEPS] = useState('');
  const [costPerGB, setCostPerGB] = useState('3.50');
  const [avgEventSize, setAvgEventSize] = useState('800');

  const source = allSources.find((s: any) => s.id === selectedSource);

  const results = useMemo(() => {
    if (!source) return null;
    const eps = customEPS ? parseInt(customEPS.replace(/,/g, ''), 10) : parseEPS(source.avgEPS || '5000');
    const cost = parseFloat(costPerGB) || 3.50;
    const eventBytes = parseInt(avgEventSize, 10) || 800;
    const reductionPct = getReductionPercent(source);

    const dailyEvents = eps * 86400;
    const dailyGB = (dailyEvents * eventBytes) / (1024 ** 3);
    const monthlyGB = dailyGB * 30;
    const monthlyCostRaw = monthlyGB * cost;

    const siemGB = monthlyGB * (1 - reductionPct / 100);
    const siemCost = siemGB * cost;
    const lakeCostPerGB = 0.023;
    const lakeCost = monthlyGB * lakeCostPerGB;
    const optimizedTotal = siemCost + lakeCost;
    const savings = monthlyCostRaw - optimizedTotal;
    const savingsPct = (savings / monthlyCostRaw) * 100;

    return {
      eps, dailyGB, monthlyGB, monthlyCostRaw,
      reductionPct, siemGB, siemCost, lakeCost, optimizedTotal, savings, savingsPct,
    };
  }, [source, customEPS, costPerGB, avgEventSize]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>Cost Savings Simulator</h2>
        <p style={{ fontSize: 'var(--cds-font-size-base)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.6 }}>
          See how much you could save by routing data intelligently with Cribl — security events to SIEM, full fidelity to Lake.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Inputs */}
        <div style={card}>
          <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 16 }}>Configuration</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 6 }}>Data Source</label>
            <select
              value={selectedSource}
              onChange={(e) => { setSelectedSource(e.target.value); setCustomEPS(''); }}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {dataSources.map((cat: any) => (
                <optgroup key={cat.category} label={`${cat.icon} ${cat.category}`}>
                  {cat.sources.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 6 }}>
              Events Per Second (EPS)
            </label>
            <input
              type="text"
              value={customEPS}
              onChange={(e) => setCustomEPS(e.target.value)}
              placeholder={source ? `Default: ${source.avgEPS}` : 'Enter EPS'}
              style={inputStyle}
            />
            <p style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginTop: 4 }}>
              Leave blank to use the typical range for this source type.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 6 }}>
              SIEM Cost per GB ($/GB/month)
            </label>
            <input
              type="text"
              value={costPerGB}
              onChange={(e) => setCostPerGB(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 6 }}>
              Average Event Size (bytes)
            </label>
            <input
              type="text"
              value={avgEventSize}
              onChange={(e) => setAvgEventSize(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Results */}
        <div style={card}>
          <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 16 }}>Monthly Cost Comparison</h3>
          {results && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ background: 'var(--cds-color-bg-muted)', borderRadius: 'var(--cds-radius-md)', padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 4 }}>EPS</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600, color: 'var(--cds-color-fg)' }}>{results.eps.toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--cds-color-bg-muted)', borderRadius: 'var(--cds-radius-md)', padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 4 }}>Monthly Volume</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600, color: 'var(--cds-color-fg)' }}>{results.monthlyGB.toFixed(0)} GB</div>
                </div>
              </div>

              {/* Before - raw to SIEM */}
              <div style={{ background: 'var(--cds-color-danger-subtle)', borderRadius: 'var(--cds-radius-md)', padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-danger)' }}>Without Cribl — Raw to SIEM</div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginTop: 4 }}>{results.monthlyGB.toFixed(0)} GB/month at ${costPerGB}/GB</div>
                  </div>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: 'var(--cds-color-danger)' }}>
                    ${results.monthlyCostRaw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              {/* After - optimized */}
              <div style={{ background: 'var(--cds-color-success-subtle)', borderRadius: 'var(--cds-radius-md)', padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-success)' }}>With Cribl — Intelligent Routing</div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginTop: 4 }}>Security events to SIEM + full fidelity to Lake</div>
                  </div>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: 'var(--cds-color-success)' }}>
                    ${results.optimizedTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'flex', gap: 16 }}>
                  <span>SIEM: {results.siemGB.toFixed(0)} GB = ${results.siemCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span>Lake: {results.monthlyGB.toFixed(0)} GB = ${results.lakeCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* Savings */}
              <div style={{ background: 'var(--cds-brand-teal)', borderRadius: 'var(--cds-radius-md)', padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>Monthly Savings</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>
                  ${results.savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                  {results.savingsPct.toFixed(0)}% reduction — ${(results.savings * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/year
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      {source && results && (
        <div style={card}>
          <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 16 }}>How Cribl Optimizes {source.name}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ padding: 16, background: 'var(--cds-color-bg-muted)', borderRadius: 'var(--cds-radius-md)' }}>
              <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-brand-teal)', marginBottom: 8 }}>1. Collect Once</div>
              <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0, lineHeight: 1.6 }}>
                Ingest via {source.collectionMethod?.split('/')[0]?.trim() || 'syslog'} into Cribl Stream. Single collection point for all downstream consumers.
              </p>
            </div>
            <div style={{ padding: 16, background: 'var(--cds-color-bg-muted)', borderRadius: 'var(--cds-radius-md)' }}>
              <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-brand-teal)', marginBottom: 8 }}>2. Route Intelligently</div>
              <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0, lineHeight: 1.6 }}>
                Security-critical events ({100 - results.reductionPct}% of volume) route to SIEM at full fidelity. Everything goes to Lake at storage-tier cost.
              </p>
            </div>
            <div style={{ padding: 16, background: 'var(--cds-color-bg-muted)', borderRadius: 'var(--cds-radius-md)' }}>
              <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-brand-teal)', marginBottom: 8 }}>3. Search on Demand</div>
              <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0, lineHeight: 1.6 }}>
                Cribl Search queries Lake data directly — full forensic capability without paying SIEM pricing for historical data.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)')}>Volume reduction: {results.reductionPct}%</span>
            <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>Products: {source.criblProducts?.join(', ')}</span>
            <span style={tag('var(--cds-color-bg-muted)', 'var(--cds-color-fg-muted)')}>Destinations: {source.destinations?.length || 0} supported</span>
          </div>
        </div>
      )}
    </div>
  );
}
