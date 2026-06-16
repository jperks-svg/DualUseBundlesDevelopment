import { useState } from 'react';
import { observabilityRules } from '../data/observabilityRules';

const sourceColors: Record<string, { bg: string; text: string; label: string }> = {
  'awesome-prometheus-alerts': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', label: 'awesome-prometheus-alerts' },
  'prometheus-community': { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316', label: 'Prometheus Community' },
  'kube-prometheus': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', label: 'kube-prometheus' },
  'custom': { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', label: 'Custom Pattern' },
};

const statusLabels: Record<string, string> = {
  equivalent: 'Direct Equivalent',
  adapted: 'Adapted',
  inspired: 'Inspired By',
};

export function ObservabilityRuleBlock({ detectionId }: { detectionId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [showKQL, setShowKQL] = useState(true);
  const mapping = observabilityRules[detectionId];
  if (!mapping) return null;

  const source = sourceColors[mapping.communitySource];

  return (
    <div style={{ marginTop: 12, border: '1px solid var(--cds-color-border-subtle)', borderRadius: 'var(--cds-radius-md)', overflow: 'hidden' }}>
      <div
        style={{ padding: '8px 12px', background: 'var(--cds-color-bg-subtle)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-fg-default)' }}>
          Community Rule
        </span>
        <span style={{ padding: '1px 6px', borderRadius: 'var(--cds-radius-sm)', fontSize: 'var(--cds-font-size-xs)', background: source.bg, color: source.text, fontWeight: 500 }}>
          {source.label}
        </span>
        <span style={{ padding: '1px 6px', borderRadius: 'var(--cds-radius-sm)', fontSize: 'var(--cds-font-size-xs)', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 500 }}>
          {statusLabels[mapping.ruleStatus]}
        </span>
        {mapping.ruleTitle && (
          <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginLeft: 'auto' }}>
            {mapping.ruleTitle}
          </span>
        )}
        <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginLeft: mapping.ruleTitle ? 8 : 'auto' }}>
          {expanded ? '▾' : '▸'}
        </span>
      </div>
      {expanded && (
        <div>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--cds-color-border-subtle)' }}>
            <button
              onClick={() => setShowKQL(true)}
              style={{ flex: 1, padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: 'var(--cds-font-size-xs)', fontWeight: 600, background: showKQL ? 'var(--cds-color-bg-default)' : 'var(--cds-color-bg-subtle)', color: showKQL ? 'var(--cds-brand-teal)' : 'var(--cds-color-fg-muted)', borderBottom: showKQL ? '2px solid var(--cds-brand-teal)' : '2px solid transparent' }}
            >
              Cribl Search KQL
            </button>
            <button
              onClick={() => setShowKQL(false)}
              style={{ flex: 1, padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: 'var(--cds-font-size-xs)', fontWeight: 600, background: !showKQL ? 'var(--cds-color-bg-default)' : 'var(--cds-color-bg-subtle)', color: !showKQL ? '#ef4444' : 'var(--cds-color-fg-muted)', borderBottom: !showKQL ? '2px solid #ef4444' : '2px solid transparent' }}
            >
              Prometheus / Community Rule
            </button>
          </div>
          <pre style={{ padding: '10px 12px', margin: 0, fontSize: '11px', lineHeight: 1.5, color: showKQL ? 'var(--cds-brand-teal)' : 'var(--cds-color-fg-muted)', whiteSpace: 'pre-wrap', fontFamily: 'var(--cds-font-mono)', background: 'var(--cds-color-bg-default)', maxHeight: 280, overflowY: 'auto' }}>
            {showKQL ? mapping.criblSearchKQL : mapping.communityRule}
          </pre>
          {mapping.communityReferences.length > 0 && (
            <div style={{ padding: '6px 12px', borderTop: '1px solid var(--cds-color-border-subtle)', background: 'var(--cds-color-bg-subtle)', fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)' }}>
              Source: {mapping.communityReferences.map((ref, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  <code style={{ fontFamily: 'var(--cds-font-mono)' }}>{ref}</code>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
