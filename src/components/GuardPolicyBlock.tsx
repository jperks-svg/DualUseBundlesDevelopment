import { useState } from 'react';
import { guardPolicies } from '../data/guardPolicies';

const categoryColors: Record<string, { bg: string; text: string }> = {
  'PII': { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316' },
  'PCI': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
  'PHI': { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7' },
  'Secrets': { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308' },
  'Infrastructure': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
};

const actionColors: Record<string, { bg: string; text: string; label: string }> = {
  'mask': { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308', label: 'Mask' },
  'redact': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', label: 'Redact' },
  'encrypt': { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', label: 'Encrypt' },
  'reroute': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', label: 'Reroute' },
  'tag': { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', label: 'Tag for Review' },
};

const confidenceColors: Record<string, string> = {
  'high': '#10b981',
  'medium': '#f59e0b',
  'low': '#6b7280',
};

export function GuardPolicyBlock({ sourceId }: { sourceId: string }) {
  const [expanded, setExpanded] = useState(false);
  const policy = guardPolicies[sourceId];
  if (!policy) return null;

  const riskLevel = policy.estimatedSensitivePercent >= 60 ? 'High' : policy.estimatedSensitivePercent >= 30 ? 'Medium' : 'Low';
  const riskColor = riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#10b981';

  return (
    <div style={{ marginBottom: 20, border: '1px solid var(--cds-color-border-subtle)', borderRadius: 'var(--cds-radius-lg)', overflow: 'hidden' }}>
      <div
        style={{ padding: '12px 16px', background: 'var(--cds-color-bg-subtle)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontSize: 18 }}>🛡️</span>
        <span style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-fg-default)' }}>
          Cribl Guard — Data Protection Policy
        </span>
        <span style={{ padding: '2px 8px', borderRadius: 'var(--cds-radius-sm)', fontSize: 'var(--cds-font-size-xs)', fontWeight: 600, background: `${riskColor}15`, color: riskColor }}>
          {riskLevel} PII Risk — ~{policy.estimatedSensitivePercent}% sensitive
        </span>
        {policy.complianceFrameworks.length > 0 && (
          <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginLeft: 'auto' }}>
            {policy.complianceFrameworks.join(' · ')}
          </span>
        )}
        <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginLeft: policy.complianceFrameworks.length > 0 ? 8 : 'auto' }}>
          {expanded ? '▾' : '▸'}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 16, lineHeight: 1.6 }}>
            {policy.guardNotes}
          </p>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 'var(--cds-font-size-xs)', fontWeight: 600, color: 'var(--cds-color-fg-default)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Sensitive Data Types Detected
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {policy.sensitiveDataTypes.map((dt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', border: '1px solid var(--cds-color-border-subtle)' }}>
                  <span style={{ padding: '1px 6px', borderRadius: 'var(--cds-radius-sm)', fontSize: '10px', fontWeight: 600, background: categoryColors[dt.category].bg, color: categoryColors[dt.category].text }}>
                    {dt.category}
                  </span>
                  <span style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-default)', fontWeight: 500, flex: 1 }}>
                    {dt.type}
                  </span>
                  <span style={{ padding: '1px 6px', borderRadius: 'var(--cds-radius-sm)', fontSize: '10px', fontWeight: 500, background: actionColors[dt.recommendedAction].bg, color: actionColors[dt.recommendedAction].text }}>
                    {actionColors[dt.recommendedAction].label}
                  </span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: confidenceColors[dt.confidence] }} title={`${dt.confidence} confidence`} />
                  <code style={{ fontSize: '10px', color: 'var(--cds-color-fg-subtle)', fontFamily: 'var(--cds-font-mono)' }}>
                    {dt.fields.slice(0, 2).join(', ')}{dt.fields.length > 2 ? ` +${dt.fields.length - 2}` : ''}
                  </code>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, padding: 12, background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', border: '1px solid var(--cds-color-border-subtle)' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--cds-color-fg-subtle)', textTransform: 'uppercase', marginBottom: 6 }}>Recommended Placement</div>
              <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 500, color: 'var(--cds-color-fg-default)' }}>
                {policy.recommendedPlacement === 'post-processing' ? 'Post-Processing Pipeline' : 'Pre-Processing Pipeline'}
              </div>
              <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginTop: 4 }}>
                {policy.recommendedPlacement === 'post-processing'
                  ? 'Scan data in final form before reaching destinations — avoids double-billing on Guard credits.'
                  : 'Scan early to prevent sensitive data from reaching any downstream processing.'}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200, padding: 12, background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', border: '1px solid var(--cds-color-border-subtle)' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--cds-color-fg-subtle)', textTransform: 'uppercase', marginBottom: 6 }}>Detection Method</div>
              <div style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 500, color: 'var(--cds-color-fg-default)' }}>
                {policy.estimatedSensitivePercent >= 40 ? 'Pattern Matching + AI Model' : 'Pattern Matching (200+ rules)'}
              </div>
              <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginTop: 4 }}>
                {policy.estimatedSensitivePercent >= 40
                  ? 'High-PII source benefits from AI background detection (BERT-based cribl-privacy-1.5) to catch secrets in unstructured fields.'
                  : 'Standard rule-based detection with anchor terms covers known patterns in structured fields.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
