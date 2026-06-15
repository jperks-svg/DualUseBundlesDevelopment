import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dataSources } from '../data/sources';

const card: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: 20, boxShadow: 'var(--cds-shadow-sm)',
};

const tag = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--cds-radius-sm)',
  fontSize: 'var(--cds-font-size-xs)', fontWeight: 500, background: bg, color,
});

interface Technique {
  id: string;
  name: string;
  tactic: string;
  sourcesCovering: string[];
}

interface OperationalScenario {
  id: string;
  name: string;
  category: string;
  sourcesCovering: string[];
}

const tactics = [
  'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation',
  'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement',
  'Collection', 'Exfiltration', 'Command & Control', 'Impact'
];

const allSources = dataSources.flatMap((c: any) => c.sources);

const techniques: Technique[] = [
  { id: 'T1566', name: 'Phishing', tactic: 'Initial Access', sourcesCovering: ['palo-alto-traffic', 'prisma-access-traffic', 'cisco-secure-email', 'fortinet-fortigate', 'cloudflare', 'netskope'] },
  { id: 'T1190', name: 'Exploit Public-Facing App', tactic: 'Initial Access', sourcesCovering: ['cloudflare', 'f5-bigip-ltm', 'suricata-ids', 'aws-cloudwatch', 'nginx-access'] },
  { id: 'T1078', name: 'Valid Accounts', tactic: 'Initial Access', sourcesCovering: ['okta-system-logs', 'azure-activity', 'aws-cloudtrail', 'active-directory', 'duo-mfa', 'cisco-ise'] },
  { id: 'T1059', name: 'Command & Scripting Interpreter', tactic: 'Execution', sourcesCovering: ['crowdstrike-edr', 'microsoft-defender-endpoint', 'windows-sysmon', 'carbon-black', 'trellix-hx'] },
  { id: 'T1053', name: 'Scheduled Task/Job', tactic: 'Execution', sourcesCovering: ['windows-security', 'crowdstrike-edr', 'microsoft-defender-endpoint', 'linux-auditd'] },
  { id: 'T1547', name: 'Boot/Logon Autostart', tactic: 'Persistence', sourcesCovering: ['crowdstrike-edr', 'microsoft-defender-endpoint', 'windows-sysmon', 'carbon-black'] },
  { id: 'T1136', name: 'Create Account', tactic: 'Persistence', sourcesCovering: ['aws-cloudtrail', 'azure-activity', 'gcp-audit-logs', 'active-directory', 'okta-system-logs'] },
  { id: 'T1548', name: 'Abuse Elevation Control', tactic: 'Privilege Escalation', sourcesCovering: ['crowdstrike-edr', 'microsoft-defender-endpoint', 'linux-auditd', 'windows-security'] },
  { id: 'T1098', name: 'Account Manipulation', tactic: 'Privilege Escalation', sourcesCovering: ['aws-cloudtrail', 'azure-activity', 'gcp-audit-logs', 'okta-system-logs', 'active-directory'] },
  { id: 'T1562', name: 'Impair Defenses', tactic: 'Defense Evasion', sourcesCovering: ['crowdstrike-edr', 'microsoft-defender-endpoint', 'aws-cloudtrail', 'gcp-audit-logs', 'windows-security'] },
  { id: 'T1070', name: 'Indicator Removal', tactic: 'Defense Evasion', sourcesCovering: ['windows-sysmon', 'linux-auditd', 'crowdstrike-edr', 'gcp-audit-logs'] },
  { id: 'T1003', name: 'OS Credential Dumping', tactic: 'Credential Access', sourcesCovering: ['crowdstrike-edr', 'microsoft-defender-endpoint', 'windows-sysmon', 'windows-security'] },
  { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', sourcesCovering: ['okta-system-logs', 'azure-activity', 'fortinet-fortigate', 'cisco-ise', 'suricata-ids', 'active-directory'] },
  { id: 'T1046', name: 'Network Service Scanning', tactic: 'Discovery', sourcesCovering: ['zeek-logs', 'suricata-ids', 'palo-alto-traffic', 'fortinet-fortigate', 'cisco-meraki'] },
  { id: 'T1087', name: 'Account Discovery', tactic: 'Discovery', sourcesCovering: ['active-directory', 'aws-cloudtrail', 'azure-activity', 'crowdstrike-edr', 'windows-security'] },
  { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement', sourcesCovering: ['zeek-logs', 'windows-security', 'crowdstrike-edr', 'cisco-ise', 'fortinet-fortigate'] },
  { id: 'T1563', name: 'Remote Service Session Hijacking', tactic: 'Lateral Movement', sourcesCovering: ['okta-system-logs', 'azure-activity', 'crowdstrike-edr', 'zeek-logs'] },
  { id: 'T1005', name: 'Data from Local System', tactic: 'Collection', sourcesCovering: ['crowdstrike-edr', 'microsoft-defender-endpoint', 'windows-sysmon', 'carbon-black'] },
  { id: 'T1530', name: 'Data from Cloud Storage', tactic: 'Collection', sourcesCovering: ['aws-cloudtrail', 'gcp-audit-logs', 'azure-activity', 'netskope'] },
  { id: 'T1048', name: 'Exfiltration Over Alternative Protocol', tactic: 'Exfiltration', sourcesCovering: ['zeek-logs', 'palo-alto-traffic', 'fortinet-fortigate', 'netskope', 'suricata-ids'] },
  { id: 'T1567', name: 'Exfiltration Over Web Service', tactic: 'Exfiltration', sourcesCovering: ['netskope', 'palo-alto-traffic', 'cloudflare', 'prisma-access-traffic'] },
  { id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command & Control', sourcesCovering: ['zeek-logs', 'suricata-ids', 'palo-alto-traffic', 'fortinet-fortigate', 'cloudflare'] },
  { id: 'T1573', name: 'Encrypted Channel', tactic: 'Command & Control', sourcesCovering: ['zeek-logs', 'suricata-ids', 'palo-alto-traffic', 'fortinet-fortigate'] },
  { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', sourcesCovering: ['crowdstrike-edr', 'microsoft-defender-endpoint', 'windows-sysmon', 'carbon-black'] },
  { id: 'T1489', name: 'Service Stop', tactic: 'Impact', sourcesCovering: ['windows-security', 'crowdstrike-edr', 'k8s-audit-logs', 'aws-cloudwatch'] },
];

const operationalScenarios: OperationalScenario[] = [
  { id: 'latency-monitoring', name: 'API Latency Monitoring', category: 'Performance', sourcesCovering: ['aws-cloudwatch', 'cloudflare', 'f5-bigip-ltm', 'nginx-access'] },
  { id: 'cert-expiry', name: 'Certificate Expiry Tracking', category: 'Compliance', sourcesCovering: ['zeek-logs', 'f5-bigip-ltm', 'cloudflare', 'prisma-access-gp'] },
  { id: 'dns-health', name: 'DNS Resolution Health', category: 'Performance', sourcesCovering: ['aws-vpc-flow', 'zeek-logs', 'palo-alto-traffic', 'cloudflare'] },
  { id: 'vpn-capacity', name: 'VPN Capacity Planning', category: 'Capacity', sourcesCovering: ['prisma-access-gp', 'fortinet-fortigate', 'cisco-meraki', 'cisco-ise'] },
  { id: 'patch-compliance', name: 'Patch Compliance SLA', category: 'Compliance', sourcesCovering: ['qualys-tenable', 'servicenow', 'microsoft-defender-endpoint', 'aws-cloudtrail'] },
  { id: 'user-onboarding', name: 'User Provisioning/Deprovisioning', category: 'Identity', sourcesCovering: ['okta-system-logs', 'active-directory', 'azure-activity', 'servicenow'] },
  { id: 'cost-attribution', name: 'Cloud Cost Attribution', category: 'FinOps', sourcesCovering: ['aws-cloudtrail', 'aws-cloudwatch', 'gcp-audit-logs', 'azure-activity'] },
  { id: 'container-health', name: 'Container Cluster Health', category: 'Performance', sourcesCovering: ['k8s-audit-logs', 'aws-cloudwatch', 'linux-syslog', 'qualys-tenable'] },
];

type ViewMode = 'mitre' | 'operational';

export default function CoverageHeatmapPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('mitre');
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(allSources.map((s: any) => s.id)));
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const toggleSource = (id: string) => {
    setSelectedSources(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => setSelectedSources(new Set(allSources.map((s: any) => s.id)));
  const clearAll = () => setSelectedSources(new Set());

  const stats = useMemo(() => {
    if (viewMode === 'mitre') {
      const covered = techniques.filter(t => t.sourcesCovering.some(s => selectedSources.has(s)));
      const partial = techniques.filter(t => {
        const count = t.sourcesCovering.filter(s => selectedSources.has(s)).length;
        return count > 0 && count < 2;
      });
      return { total: techniques.length, covered: covered.length, partial: partial.length, gaps: techniques.length - covered.length };
    } else {
      const covered = operationalScenarios.filter(s => s.sourcesCovering.some(src => selectedSources.has(src)));
      return { total: operationalScenarios.length, covered: covered.length, partial: 0, gaps: operationalScenarios.length - covered.length };
    }
  }, [viewMode, selectedSources]);

  const missingSourceRecommendations = useMemo(() => {
    const uncoveredTechniques = techniques.filter(t => !t.sourcesCovering.some(s => selectedSources.has(s)));
    const sourceGapCount: Record<string, number> = {};
    uncoveredTechniques.forEach(t => {
      t.sourcesCovering.forEach(s => {
        if (!selectedSources.has(s)) {
          sourceGapCount[s] = (sourceGapCount[s] || 0) + 1;
        }
      });
    });
    return Object.entries(sourceGapCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, count, name: allSources.find((s: any) => s.id === id)?.name || id }));
  }, [selectedSources]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>Coverage Heatmap</h2>
        <p style={{ fontSize: 'var(--cds-font-size-base)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.6 }}>
          Visualize your detection and operational coverage. Select the sources you collect today and see where you have coverage, gaps, and what one additional source would close.
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setViewMode('mitre')}
          style={{ padding: '8px 16px', border: viewMode === 'mitre' ? '2px solid var(--cds-brand-teal)' : '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)', background: viewMode === 'mitre' ? 'var(--cds-color-bg-subtle)' : 'var(--cds-color-bg)', cursor: 'pointer', fontSize: 'var(--cds-font-size-sm)', fontWeight: viewMode === 'mitre' ? 600 : 400, color: viewMode === 'mitre' ? 'var(--cds-brand-teal)' : 'var(--cds-color-fg-muted)' }}
        >
          MITRE ATT&CK Coverage
        </button>
        <button
          onClick={() => setViewMode('operational')}
          style={{ padding: '8px 16px', border: viewMode === 'operational' ? '2px solid var(--cds-brand-teal)' : '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)', background: viewMode === 'operational' ? 'var(--cds-color-bg-subtle)' : 'var(--cds-color-bg)', cursor: 'pointer', fontSize: 'var(--cds-font-size-sm)', fontWeight: viewMode === 'operational' ? 600 : 400, color: viewMode === 'operational' ? 'var(--cds-brand-teal)' : 'var(--cds-color-fg-muted)' }}
        >
          Operational Scenarios
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...card, textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-brand-teal)' }}>{selectedSources.size}</div>
          <div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>Sources Selected</div>
        </div>
        <div style={{ ...card, textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-success)' }}>{stats.covered}</div>
          <div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>Covered</div>
        </div>
        <div style={{ ...card, textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-danger)' }}>{stats.gaps}</div>
          <div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>Gaps</div>
        </div>
        <div style={{ ...card, textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)' }}>{Math.round((stats.covered / stats.total) * 100)}%</div>
          <div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>Coverage Score</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Source selector */}
        <div style={{ ...card, maxHeight: 600, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, margin: 0 }}>Your Sources</h4>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={selectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-accent)' }}>All</button>
              <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-accent)' }}>None</button>
            </div>
          </div>
          {dataSources.map((cat: any) => (
            <div key={cat.category} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', fontWeight: 600, marginBottom: 4 }}>{cat.icon} {cat.category}</div>
              {cat.sources.map((s: any) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', cursor: 'pointer', fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>
                  <input type="checkbox" checked={selectedSources.has(s.id)} onChange={() => toggleSource(s.id)} style={{ accentColor: 'var(--cds-brand-teal)' }} />
                  {s.name.length > 30 ? s.name.slice(0, 30) + '...' : s.name}
                </label>
              ))}
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div>
          {viewMode === 'mitre' ? (
            <div>
              {tactics.map((tactic) => {
                const tacticTechniques = techniques.filter(t => t.tactic === tactic);
                if (tacticTechniques.length === 0) return null;
                return (
                  <div key={tactic} style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>{tactic}</h4>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {tacticTechniques.map((tech) => {
                        const coveringCount = tech.sourcesCovering.filter(s => selectedSources.has(s)).length;
                        const totalPossible = tech.sourcesCovering.length;
                        const isHovered = hoveredCell === tech.id;
                        let bg = 'var(--cds-color-danger-subtle)';
                        let border = '1px solid var(--cds-color-danger)';
                        if (coveringCount >= 3) { bg = 'var(--cds-color-success-subtle)'; border = '1px solid var(--cds-color-success)'; }
                        else if (coveringCount >= 1) { bg = 'var(--cds-color-warning-subtle)'; border = '1px solid var(--cds-color-warning)'; }
                        return (
                          <div
                            key={tech.id}
                            style={{ background: bg, border, borderRadius: 'var(--cds-radius-md)', padding: '8px 12px', cursor: 'pointer', position: 'relative', minWidth: 140 }}
                            onMouseEnter={() => setHoveredCell(tech.id)}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <div style={{ fontSize: 'var(--cds-font-size-xs)', fontWeight: 600, color: 'var(--cds-color-fg)' }}>{tech.id}</div>
                            <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>{tech.name}</div>
                            <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginTop: 2 }}>{coveringCount}/{totalPossible} sources</div>
                            {isHovered && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)', padding: 12, boxShadow: 'var(--cds-shadow-lg)', minWidth: 200, marginTop: 4 }}>
                                <div style={{ fontSize: 'var(--cds-font-size-xs)', fontWeight: 600, marginBottom: 6 }}>Sources providing coverage:</div>
                                {tech.sourcesCovering.map(sid => {
                                  const src = allSources.find((s: any) => s.id === sid);
                                  const active = selectedSources.has(sid);
                                  return (
                                    <div key={sid} style={{ fontSize: 'var(--cds-font-size-xs)', color: active ? 'var(--cds-color-success)' : 'var(--cds-color-fg-subtle)', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
                                      <span>{active ? '✓' : '○'}</span>
                                      <span>{src?.name || sid}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {operationalScenarios.map((scenario) => {
                const coveringCount = scenario.sourcesCovering.filter(s => selectedSources.has(s)).length;
                const totalPossible = scenario.sourcesCovering.length;
                let bg = 'var(--cds-color-danger-subtle)';
                if (coveringCount >= 3) bg = 'var(--cds-color-success-subtle)';
                else if (coveringCount >= 1) bg = 'var(--cds-color-warning-subtle)';
                return (
                  <div key={scenario.id} style={{ background: bg, borderRadius: 'var(--cds-radius-md)', padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <h4 style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, margin: 0 }}>{scenario.name}</h4>
                      <span style={tag('var(--cds-color-bg)', 'var(--cds-color-fg-muted)')}>{scenario.category}</span>
                    </div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginBottom: 8 }}>{coveringCount}/{totalPossible} sources active</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {scenario.sourcesCovering.map(sid => {
                        const active = selectedSources.has(sid);
                        const src = allSources.find((s: any) => s.id === sid);
                        return (
                          <span key={sid} style={{ ...tag(active ? 'var(--cds-color-success-subtle)' : 'var(--cds-color-bg)', active ? 'var(--cds-color-success)' : 'var(--cds-color-fg-subtle)'), textDecoration: active ? 'none' : 'line-through' }}>
                            {src?.vendor || sid}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommendations */}
          {viewMode === 'mitre' && missingSourceRecommendations.length > 0 && (
            <div style={{ ...card, marginTop: 20, borderLeft: '4px solid var(--cds-brand-teal)' }}>
              <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, marginBottom: 12, color: 'var(--cds-brand-teal)' }}>Recommended Additions</h4>
              <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 12 }}>Adding these sources would close the most coverage gaps:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {missingSourceRecommendations.map((rec) => (
                  <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ ...tag('var(--cds-color-accent-subtle)', 'var(--cds-color-accent)'), minWidth: 100, textAlign: 'center' }}>+{rec.count} techniques</span>
                    <Link to={`/source/${rec.id}`} style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-accent)', textDecoration: 'none' }}>{rec.name}</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
