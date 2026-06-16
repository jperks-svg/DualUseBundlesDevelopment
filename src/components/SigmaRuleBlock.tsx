import { useState } from 'react';
import { sigmaRules } from '../data/sigmaRules';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  exact: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', label: 'SigmaHQ Exact Match' },
  adapted: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', label: 'Adapted from SigmaHQ' },
  inspired: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', label: 'Custom (Sigma Format)' },
};

export function SigmaRuleBlock({ detectionId }: { detectionId: string }) {
  const [expanded, setExpanded] = useState(false);
  const mapping = sigmaRules[detectionId];
  if (!mapping) return null;

  const status = statusColors[mapping.sigmaStatus];

  return (
    <div style={{ marginTop: 12, border: '1px solid var(--cds-color-border-subtle)', borderRadius: 'var(--cds-radius-md)', overflow: 'hidden' }}>
      <div
        style={{ padding: '8px 12px', background: 'var(--cds-color-bg-subtle)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, color: 'var(--cds-color-fg-default)' }}>
          Sigma Rule
        </span>
        <span style={{ padding: '1px 6px', borderRadius: 'var(--cds-radius-sm)', fontSize: 'var(--cds-font-size-xs)', background: status.bg, color: status.text, fontWeight: 500 }}>
          {status.label}
        </span>
        {mapping.sigmaTitle && (
          <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginLeft: 'auto' }}>
            {mapping.sigmaTitle}
          </span>
        )}
        <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)', marginLeft: mapping.sigmaTitle ? 8 : 'auto' }}>
          {expanded ? '▾' : '▸'}
        </span>
      </div>
      {expanded && (
        <div>
          <pre style={{ padding: '10px 12px', margin: 0, fontSize: '11px', lineHeight: 1.5, color: 'var(--cds-color-fg-muted)', whiteSpace: 'pre-wrap', fontFamily: 'var(--cds-font-mono)', background: 'var(--cds-color-bg-default)', maxHeight: 320, overflowY: 'auto' }}>
            {mapping.sigmaRule}
          </pre>
          {mapping.sigmaReferences.length > 0 && (
            <div style={{ padding: '6px 12px', borderTop: '1px solid var(--cds-color-border-subtle)', background: 'var(--cds-color-bg-subtle)', fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-subtle)' }}>
              SigmaHQ Rule ID{mapping.sigmaReferences.length > 1 ? 's' : ''}: {mapping.sigmaReferences.map((ref, i) => (
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
