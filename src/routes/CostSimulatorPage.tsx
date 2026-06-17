import { useState, useMemo, useCallback } from 'react';
import { dataSources } from '../data/sources';
import { fieldMatrix } from '../data/fields';
import { guardPolicies } from '../data/guardPolicies';
import { runQuery } from '../api/cribl';
import { calculateCostSavings, calculateFieldReduction } from '../utils/costCalc';

const card: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: 20, boxShadow: 'var(--cds-shadow-sm)',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', width: '100%', background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)',
};

const btnStyle: React.CSSProperties = {
  padding: '8px 16px', border: 'none', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, cursor: 'pointer',
  background: 'var(--cds-color-primary)', color: 'var(--cds-color-primary-fg)',
};

const statBox: React.CSSProperties = {
  padding: 12, borderRadius: 'var(--cds-radius-md)', textAlign: 'center' as const,
  background: 'var(--cds-color-bg-muted)',
};

const allSources = dataSources.flatMap((c: any) => c.sources);

interface DatasetMetrics {
  eps: number;
  avgEventSize: number;
  totalEvents: number;
  totalGB: number;
  timeSpanHours: number;
}

export default function CostSimulatorPage() {
  const [selectedSource, setSelectedSource] = useState(allSources[0]?.id || '');
  const [eps, setEps] = useState('5000');
  const [costPerGB, setCostPerGB] = useState('3.50');
  const [avgEventSize, setAvgEventSize] = useState('800');

  const [datasetName, setDatasetName] = useState('');
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [datasetError, setDatasetError] = useState<string | null>(null);
  const [datasetMetrics, setDatasetMetrics] = useState<DatasetMetrics | null>(null);
  const [showDatasetPanel, setShowDatasetPanel] = useState(false);

  const source = allSources.find((s: any) => s.id === selectedSource);
  const fields: any[] = (fieldMatrix as any)[selectedSource] || [];
  const guardPolicy = (guardPolicies as any)[selectedSource];

  const fetchDatasetMetrics = useCallback(async () => {
    if (!datasetName.trim()) { setDatasetError('Enter a dataset name'); return; }
    setDatasetLoading(true); setDatasetError(null); setDatasetMetrics(null);
    try {
      const ds = datasetName.trim();
      const countResults = await runQuery('dataset=' + ds + ' earliest=-24h | summarize totalEvents=count()', '-24h', 'now', 10000);
      if (!countResults.length || !countResults[0].totalEvents || Number(countResults[0].totalEvents) === 0) {
        setDatasetError(`No data found in dataset "${ds}" for the last 24 hours.`);
        setDatasetLoading(false); return;
      }
      const totalEvents = Number(countResults[0].totalEvents) || 0;
      let avgBytes = 800;
      try {
        const sizeResults = await runQuery('dataset=' + ds + ' earliest=-24h | limit 1000 | extend eventSize=len(_raw) | summarize avgSize=avg(eventSize)', '-24h', 'now', 10000);
        if (sizeResults.length && sizeResults[0].avgSize) avgBytes = Math.round(Number(sizeResults[0].avgSize));
      } catch { /* default */ }
      const calculatedEps = Math.round(totalEvents / 86400);
      const totalGB = (totalEvents * avgBytes) / (1024 ** 3);
      setDatasetMetrics({ eps: calculatedEps, avgEventSize: avgBytes, totalEvents, totalGB, timeSpanHours: 24 });
      setEps(String(calculatedEps));
      setAvgEventSize(String(avgBytes));
    } catch (e) {
      setDatasetError(e instanceof Error ? e.message : 'Failed to query dataset.');
    } finally { setDatasetLoading(false); }
  }, [datasetName]);

  const results = useMemo(() => {
    if (!source) return null;
    const epsVal = parseInt(eps.replace(/,/g, ''), 10) || 0;
    const cost = parseFloat(costPerGB) || 3.50;
    const eventBytes = parseInt(avgEventSize, 10) || 800;
    const fieldReduction = calculateFieldReduction(fields);
    return calculateCostSavings(epsVal, eventBytes, cost, fieldReduction);
  }, [source, eps, costPerGB, avgEventSize, fields]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>Data Reduction Calculator</h2>
        <p style={{ fontSize: 'var(--cds-font-size-base)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.6 }}>
          Calculate cost savings from intelligent routing, field-level reduction, and data protection — backed by per-source field analysis.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, marginBottom: 24 }}>
        {/* Left: Config */}
        <div style={card}>
          <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 16 }}>Configuration</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 6 }}>Data Source</label>
            <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {dataSources.map((cat: any) => (
                <optgroup key={cat.category} label={`${cat.icon} ${cat.category}`}>
                  {cat.sources.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 6 }}>Events Per Second (EPS)</label>
            <input type="text" value={eps} onChange={e => setEps(e.target.value)} placeholder="e.g. 5000" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 6 }}>SIEM Cost per GB ($/GB/month)</label>
            <input type="text" value={costPerGB} onChange={e => setCostPerGB(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 6 }}>Average Event Size (bytes)</label>
            <input type="text" value={avgEventSize} onChange={e => setAvgEventSize(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ borderTop: '1px solid var(--cds-color-border-subtle)', paddingTop: 16 }}>
            <button onClick={() => setShowDatasetPanel(!showDatasetPanel)} style={{ ...btnStyle, background: showDatasetPanel ? 'var(--cds-color-primary)' : 'var(--cds-color-bg-muted)', color: showDatasetPanel ? 'var(--cds-color-primary-fg)' : 'var(--cds-color-fg)', width: '100%' }}>
              {showDatasetPanel ? 'Hide Dataset Mapping' : 'Auto-fill from Dataset'}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div>
          {results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div style={statBox}>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 4 }}>EPS</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600 }}>{results.eps.toLocaleString()}</div>
                </div>
                <div style={statBox}>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 4 }}>Monthly Volume</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600 }}>{results.monthlyGB.toFixed(0)} GB</div>
                </div>
                <div style={statBox}>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 4 }}>Fields Analyzed</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600 }}>{results.fieldReduction.totalFields}</div>
                </div>
                <div style={statBox}>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginBottom: 4 }}>Total Reduction</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xl)', fontWeight: 600, color: 'var(--cds-color-success)' }}>{results.savingsPct.toFixed(0)}%</div>
                </div>
              </div>

              {/* Reduction Breakdown */}
              <div style={card}>
                <h3 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 16 }}>Reduction Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Layer 1: Field Drops */}
                  <div style={{ padding: 14, borderRadius: 'var(--cds-radius-md)', border: '1px solid var(--cds-color-border-subtle)', background: 'var(--cds-color-bg-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                        <span style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600 }}>Field Drops</span>
                      </div>
                      <span style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 700, color: '#ef4444' }}>-{results.fieldDropPct}% volume</span>
                    </div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.5 }}>
                      {results.fieldReduction.droppableFields} of {results.fieldReduction.totalFields} fields can be safely dropped for most use cases — removing debug fields, raw payloads, and redundant metadata.
                    </div>
                    <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: 'var(--cds-color-bg-muted)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${results.fieldDropPct}%`, background: '#ef4444', borderRadius: 3 }} />
                    </div>
                  </div>

                  {/* Layer 2: Routing Split */}
                  <div style={{ padding: 14, borderRadius: 'var(--cds-radius-md)', border: '1px solid var(--cds-color-border-subtle)', background: 'var(--cds-color-bg-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cds-brand-teal)', display: 'inline-block' }} />
                        <span style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600 }}>Intelligent Routing</span>
                      </div>
                      <span style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 700, color: 'var(--cds-brand-teal)' }}>{results.routingReductionPct}% to Lake tier</span>
                    </div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.5 }}>
                      Only {results.fieldReduction.securityRequiredFields} of {results.fieldReduction.totalFields} fields are required for Security SIEM. Remaining events route to Cribl Lake at $0.023/GB instead of ${costPerGB}/GB.
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--cds-color-bg-muted)' }}>
                      <div style={{ height: '100%', width: `${100 - results.routingReductionPct}%`, background: 'var(--cds-color-warning)' }} title="To SIEM" />
                      <div style={{ height: '100%', width: `${results.routingReductionPct}%`, background: 'var(--cds-brand-teal)' }} title="To Lake" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--cds-color-fg-subtle)' }}>SIEM ({100 - results.routingReductionPct}%)</span>
                      <span style={{ fontSize: 10, color: 'var(--cds-color-fg-subtle)' }}>Lake ({results.routingReductionPct}%)</span>
                    </div>
                  </div>

                  {/* Layer 3: Guard */}
                  <div style={{ padding: 14, borderRadius: 'var(--cds-radius-md)', border: '1px solid var(--cds-color-border-subtle)', background: 'var(--cds-color-bg-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />
                        <span style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600 }}>Cribl Guard — Data Protection</span>
                      </div>
                      <span style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: '#a855f7' }}>
                        {results.fieldReduction.guardProtectedFields} fields protected
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.5 }}>
                      {results.fieldReduction.guardProtectedFields > 0
                        ? `Guard masks, redacts, or tags ${results.fieldReduction.guardProtectedFields} sensitive fields in-flight — enabling compliance without sacrificing analytics value. Minimal size impact but critical for ${guardPolicy?.complianceFrameworks?.join(', ') || 'data governance'}.`
                        : 'No sensitive fields identified for Guard protection in this source.'}
                    </div>
                    {results.fieldReduction.guardProtectedFields > 0 && guardPolicy && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {guardPolicy.complianceFrameworks?.map((fw: string) => (
                          <span key={fw} style={{ padding: '1px 6px', borderRadius: 'var(--cds-radius-sm)', fontSize: 10, fontWeight: 500, background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>{fw}</span>
                        ))}
                        <span style={{ padding: '1px 6px', borderRadius: 'var(--cds-radius-sm)', fontSize: 10, fontWeight: 500, background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                          ~{guardPolicy.estimatedSensitivePercent}% sensitive
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cost Outcome */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--cds-color-danger-subtle)', borderRadius: 'var(--cds-radius-md)', padding: 16 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', fontWeight: 600, color: 'var(--cds-color-danger)', marginBottom: 4 }}>Without Cribl — Raw to SIEM</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--cds-color-danger)' }}>
                    ${results.monthlyCostRaw.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginTop: 4 }}>{results.monthlyGB.toFixed(0)} GB/mo at ${costPerGB}/GB</div>
                </div>
                <div style={{ background: 'var(--cds-color-success-subtle)', borderRadius: 'var(--cds-radius-md)', padding: 16 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', fontWeight: 600, color: 'var(--cds-color-success)', marginBottom: 4 }}>With Cribl — Optimized</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--cds-color-success)' }}>
                    ${results.optimizedTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginTop: 4 }}>
                    SIEM: ${results.siemCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} + Lake: ${results.lakeCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              {/* Savings Banner */}
              <div style={{ background: 'var(--cds-brand-teal)', borderRadius: 'var(--cds-radius-lg)', padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>Estimated Monthly Savings</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>
                  ${results.savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>
                  {results.savingsPct.toFixed(0)}% cost reduction — ${(results.savings * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/year
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dataset Mapping Panel */}
      {showDatasetPanel && (
        <div style={{ ...card, marginBottom: 24, borderLeft: '4px solid var(--cds-color-primary)' }}>
          <h3 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 8 }}>Map to Cribl Search Dataset</h3>
          <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 16, lineHeight: 1.6 }}>
            Query the last 24 hours of a dataset to auto-fill EPS and average event size from real ingestion data.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, marginBottom: 6 }}>Dataset Name</label>
              <input type="text" value={datasetName} onChange={e => setDatasetName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void fetchDatasetMetrics(); }} placeholder="e.g. pan_traffic, cribl_lake_default" style={inputStyle} />
            </div>
            <button onClick={() => void fetchDatasetMetrics()} disabled={datasetLoading} style={{ ...btnStyle, opacity: datasetLoading ? 0.6 : 1, minWidth: 130 }}>
              {datasetLoading ? 'Querying...' : 'Fetch Metrics'}
            </button>
          </div>
          {datasetError && (
            <div style={{ background: 'var(--cds-color-danger-subtle)', borderRadius: 'var(--cds-radius-md)', padding: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-danger)' }}>{datasetError}</span>
            </div>
          )}
          {datasetMetrics && (
            <div style={{ background: 'var(--cds-color-success-subtle)', borderRadius: 'var(--cds-radius-md)', padding: 12 }}>
              <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-success)', marginBottom: 8 }}>Metrics loaded — inputs updated</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--cds-color-fg-subtle)' }}>EPS</div><div style={{ fontWeight: 600 }}>{datasetMetrics.eps.toLocaleString()}</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--cds-color-fg-subtle)' }}>Avg Size</div><div style={{ fontWeight: 600 }}>{datasetMetrics.avgEventSize} B</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--cds-color-fg-subtle)' }}>Events (24h)</div><div style={{ fontWeight: 600 }}>{datasetMetrics.totalEvents.toLocaleString()}</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--cds-color-fg-subtle)' }}>Volume (24h)</div><div style={{ fontWeight: 600 }}>{datasetMetrics.totalGB.toFixed(2)} GB</div></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      {source && results && (
        <div style={card}>
          <h3 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 16 }}>How Cribl Reduces {source.name} Cost</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ padding: 14, background: 'var(--cds-color-bg-muted)', borderRadius: 'var(--cds-radius-md)' }}>
              <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>1. Drop Low-Value Fields</div>
              <p style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', margin: 0, lineHeight: 1.5 }}>
                Remove {results.fieldReduction.droppableFields} droppable fields (debug data, raw payloads, duplicate metadata) — {results.fieldDropPct}% volume reduction before routing.
              </p>
            </div>
            <div style={{ padding: 14, background: 'var(--cds-color-bg-muted)', borderRadius: 'var(--cds-radius-md)' }}>
              <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-brand-teal)', marginBottom: 6 }}>2. Route by Value</div>
              <p style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', margin: 0, lineHeight: 1.5 }}>
                {results.fieldReduction.securityRequiredFields} security-critical fields to SIEM. Full fidelity to Cribl Lake at {'{<'}1/100th the cost per GB.
              </p>
            </div>
            <div style={{ padding: 14, background: 'var(--cds-color-bg-muted)', borderRadius: 'var(--cds-radius-md)' }}>
              <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: '#a855f7', marginBottom: 6 }}>3. Protect with Guard</div>
              <p style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', margin: 0, lineHeight: 1.5 }}>
                {results.fieldReduction.guardProtectedFields} fields masked/redacted in-flight — meet {guardPolicy?.complianceFrameworks?.join(', ') || 'compliance'} without sacrificing analytics.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
