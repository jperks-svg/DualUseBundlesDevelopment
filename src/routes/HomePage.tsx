import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dataSources } from '../data/sources';

const styles = {
  pageHeader: {
    marginBottom: 24,
  } as React.CSSProperties,
  h2: {
    fontSize: 'var(--cds-font-size-xxl)',
    fontWeight: 'var(--cds-font-weight-semibold)',
    color: 'var(--cds-color-fg)',
    marginBottom: 8,
  } as React.CSSProperties,
  subtitle: {
    fontSize: 'var(--cds-font-size-base)',
    color: 'var(--cds-color-fg-muted)',
    lineHeight: 1.6,
  } as React.CSSProperties,
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 24,
  } as React.CSSProperties,
  statCard: {
    background: 'var(--cds-color-bg)',
    border: '1px solid var(--cds-color-border-subtle)',
    borderRadius: 'var(--cds-radius-lg)',
    padding: '16px 20px',
    textAlign: 'center' as const,
    boxShadow: 'var(--cds-shadow-sm)',
  } as React.CSSProperties,
  statValue: {
    fontSize: 'var(--cds-font-size-xxl)',
    fontWeight: 'var(--cds-font-weight-semibold)',
    color: 'var(--cds-brand-teal)',
  } as React.CSSProperties,
  statLabel: {
    fontSize: 'var(--cds-font-size-sm)',
    color: 'var(--cds-color-fg-muted)',
    marginTop: 4,
  } as React.CSSProperties,
  categorySection: {
    marginBottom: 32,
  } as React.CSSProperties,
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  } as React.CSSProperties,
  categoryIcon: {
    fontSize: 20,
  } as React.CSSProperties,
  categoryName: {
    fontSize: 'var(--cds-font-size-lg)',
    fontWeight: 'var(--cds-font-weight-semibold)',
    color: 'var(--cds-color-fg)',
  } as React.CSSProperties,
  sourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  } as React.CSSProperties,
  card: {
    background: 'var(--cds-color-bg)',
    border: '1px solid var(--cds-color-border-subtle)',
    borderRadius: 'var(--cds-radius-lg)',
    padding: 20,
    boxShadow: 'var(--cds-shadow-sm)',
    transition: 'var(--cds-transition-normal)',
    cursor: 'pointer',
  } as React.CSSProperties,
  cardDisabled: {
    opacity: 0.6,
    cursor: 'default',
  } as React.CSSProperties,
  tag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 'var(--cds-radius-sm)',
    fontSize: 'var(--cds-font-size-xs)',
    fontWeight: 'var(--cds-font-weight-medium)',
  } as React.CSSProperties,
};

export default function HomePage() {
  const navigate = useNavigate();

  const totalSources = dataSources.reduce((sum: number, cat: any) => sum + cat.sources.length, 0);
  const availableSources = dataSources.reduce(
    (sum: number, cat: any) => sum + cat.sources.filter((s: any) => s.status === 'available').length, 0
  );

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.h2}>Data Source Catalog</h2>
        <p style={styles.subtitle}>
          Choose your data source. Unlock security and observability value from the same telemetry.
          Collect once through Cribl, route intelligently, and power multi-team outcomes.
        </p>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{totalSources}</div>
          <div style={styles.statLabel}>Total Sources</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{availableSources}</div>
          <div style={styles.statLabel}>Bundles Available</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{dataSources.length}</div>
          <div style={styles.statLabel}>Categories</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>4</div>
          <div style={styles.statLabel}>Cribl Products</div>
        </div>
      </div>

      {dataSources.map((cat: any) => (
        <div key={cat.category} style={styles.categorySection}>
          <div style={styles.categoryHeader}>
            <span style={styles.categoryIcon}>{cat.icon}</span>
            <span style={styles.categoryName}>{cat.category}</span>
            <span style={{ ...styles.tag, background: 'var(--cds-color-bg-muted)', color: 'var(--cds-color-fg-muted)' }}>
              {cat.sources.length} source{cat.sources.length > 1 ? 's' : ''}
            </span>
          </div>
          <div style={styles.sourceGrid}>
            {cat.sources.map((source: any) => (
              <div
                key={source.id}
                style={{
                  ...styles.card,
                  ...(source.status !== 'available' ? styles.cardDisabled : {}),
                }}
                onClick={() => source.status === 'available' && navigate(`/source/${source.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 'var(--cds-font-weight-semibold)', color: 'var(--cds-color-fg)' }}>
                      {source.name}
                    </div>
                    <div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)' }}>
                      {source.vendor}
                    </div>
                  </div>
                  <span style={{
                    ...styles.tag,
                    background: source.status === 'available' ? 'var(--cds-color-success-subtle)' : 'var(--cds-color-bg-muted)',
                    color: source.status === 'available' ? 'var(--cds-color-success)' : 'var(--cds-color-fg-subtle)',
                  }}>
                    {source.status === 'available' ? 'Available' : 'Coming Soon'}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                  {source.description.slice(0, 120)}...
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {source.criblProducts.map((p: string) => (
                    <span key={p} style={{ ...styles.tag, background: 'var(--cds-color-accent-subtle)', color: 'var(--cds-color-accent)' }}>{p}</span>
                  ))}
                  <span style={{ ...styles.tag, background: 'var(--cds-color-bg-muted)', color: 'var(--cds-color-fg-muted)' }}>
                    {source.useCases.length} use cases
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
